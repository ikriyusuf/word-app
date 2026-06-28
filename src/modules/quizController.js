/**
 * Quiz Controller
 *
 * Orchestrates quiz sessions using Spaced Repetition (SM-2).
 * Delegates rendering and interaction to individual game modules.
 *
 * Lazy Loading: Game mode modules (cloze, scramble, contextGuess, flashcard)
 * are dynamically imported on first use. Users who never visit the quiz page
 * will not download these modules.
 *
 * DIP: Game modules are loaded via dynamic import() — the controller depends
 * on the abstract contract (initX / destroyX) rather than concrete imports.
 */

import { store }      from '../store/state.js';
import * as ui        from './ui.js';
import * as dbService from '../services/db.js';
import { speak }      from '../services/tts.js';
import { getSRSSortedWords, calculateSM2 } from './quiz.js';
import { toast }      from '../utils/toast.js';
import { QUIZ_NEXT_DELAY_MS } from '../config/constants.js';

// ─── Lazy-loaded game module cache ────────────────────────────────────────────
/** @type {{ cloze?: Object, scramble?: Object, contextGuess?: Object, flashcard?: Object }} */
const gameModes = {};

/**
 * Loads a game mode module on first access, then caches it.
 *
 * @param {'cloze'|'scramble'|'contextGuess'|'flashcard'} mode
 * @returns {Promise<Object>} The loaded module.
 */
const loadGameMode = async (mode) => {
    if (!gameModes[mode]) {
        switch (mode) {
            case 'cloze':
                gameModes.cloze     = await import('./games/cloze.js');
                break;
            case 'scramble':
                gameModes.scramble  = await import('./games/scramble.js');
                break;
            case 'contextGuess':
                gameModes.contextGuess = await import('./games/contextGuess.js');
                break;
            case 'flashcard':
                gameModes.flashcard = await import('./flashcard.js');
                break;
            default:
                throw new Error(`Unknown game mode: ${mode}`);
        }
    }
    return gameModes[mode];
};

// ─── Lifecycle ────────────────────────────────────────────────────────────────

/**
 * Destroys all active game listeners to prevent memory leaks and event overlap.
 * Safely skips modules that haven't been loaded yet.
 */
export const cleanActiveQuizListeners = async () => {
    const destroyOps = Object.entries(gameModes).map(async ([, module]) => {
        if (typeof module?.destroyCloze   === 'function') module.destroyCloze();
        if (typeof module?.destroyScramble === 'function') module.destroyScramble();
        if (typeof module?.destroyContextGuess === 'function') module.destroyContextGuess();
        if (typeof module?.destroyFlashcard === 'function') module.destroyFlashcard();
    });
    await Promise.all(destroyOps);
};

// ─── Session Management ───────────────────────────────────────────────────────

/**
 * Starts a new quiz study session using spaced repetition scheduling.
 *
 * @param {string} activeFilter - 'all' | 'due' | 'wrong' | 'new'
 */
export const startQuizSession = async (activeFilter = 'all') => {
    const { words, quiz } = store.getState();

    if (!words || words.length === 0) {
        toast('Önce kelime eklemelisin!', 'warning');
        ui.showView('dashboard');
        return;
    }

    await cleanActiveQuizListeners();

    const filteredWords = applyFilter(words, activeFilter);

    if (filteredWords.length === 0) {
        const filterLabels = { due: 'Tekrar zamanı gelen', wrong: 'Yanlış cevaplanan', new: 'Yeni' };
        toast(`${filterLabels[activeFilter] || 'Bu filtrede'} kelime bulunamadı. Filtre kaldırılıyor.`, 'warning');
        return;
    }

    // Flashcard mode is handled separately by its own module
    if (quiz.mode === 'flashcard') {
        ui.setQuizMode('flashcard');
        const flashcard = await loadGameMode('flashcard');
        flashcard.initFlashcard(filteredWords);
        return;
    }

    const sessionWords = getSRSSortedWords(filteredWords);
    store.setState({ quiz: { ...quiz, sessionWords, index: 0, currentWord: null, cardRevealed: false } });

    ui.setQuizMode(quiz.mode);
    await nextQuestion();
};

/**
 * Applies the active filter function to the word list.
 *
 * @param {Array}  words
 * @param {string} filter
 * @returns {Array} Filtered word list.
 */
const applyFilter = (words, filter) => {
    const now = new Date();
    const filterFns = {
        due:  (w) => {
            if (!w.nextReviewDate) return true;
            const d = w.nextReviewDate.toDate ? w.nextReviewDate.toDate() : new Date(w.nextReviewDate);
            return d <= now;
        },
        wrong: (w) => (w.wrong || 0) > 0,
        new:   (w) => (w.correct || 0) === 0 && (w.wrong || 0) === 0,
    };
    return words.filter(filterFns[filter] ?? (() => true));
};

// ─── Question Advancement ─────────────────────────────────────────────────────

/**
 * Advances the session to the next card/question.
 */
export const nextQuestion = async () => {
    const { quiz, words } = store.getState();

    await cleanActiveQuizListeners();

    if (quiz.index >= quiz.sessionWords.length) {
        toast('🎉 Harika! Tüm kelimeleri tamamladın.', 'success', 4000);
        ui.showView('dashboard');
        return;
    }

    const currentWord = quiz.sessionWords[quiz.index];
    store.setState({ quiz: { ...quiz, currentWord, cardRevealed: false } });

    const handleAnswer = async (isCorrect) => {
        await submitQuizResponse(isCorrect);
    };

    // Load the active game mode module on demand
    const mode   = quiz.mode;
    const module = await loadGameMode(mode);

    if (mode === 'cloze') {
        module.initCloze(currentWord, quiz.index, quiz.sessionWords.length, words, handleAnswer, speak);
    } else if (mode === 'scramble') {
        module.initScramble(currentWord, quiz.index, quiz.sessionWords.length, handleAnswer, speak);
    } else if (mode === 'contextGuess') {
        module.initContextGuess(currentWord, quiz.index, quiz.sessionWords.length, handleAnswer);
    }
};

// ─── Answer Submission ────────────────────────────────────────────────────────

/**
 * Persists quiz response via SM-2 algorithm, updates local state optimistically,
 * and advances to the next question after a short feedback delay.
 *
 * @param {boolean} isCorrect
 */
const submitQuizResponse = async (isCorrect) => {
    const { quiz, words, user } = store.getState();
    if (!quiz.currentWord) return;

    const sm2Data = calculateSM2(quiz.currentWord, isCorrect);

    try {
        await dbService.updateWordStats(quiz.currentWord.id, isCorrect, sm2Data);
        const updatedStats = await dbService.updateUserStats(user.uid, isCorrect);
        const updatedWords = updateLocalWordStats(words, quiz.currentWord.id, isCorrect, sm2Data);

        store.setState({
            words:  updatedWords,
            stats:  updatedStats,
            quiz:   { ...quiz, index: quiz.index + 1 },
        });

        setTimeout(() => {
            if (!ui.elements.quizSection.classList.contains('hidden')) {
                nextQuestion();
            }
        }, QUIZ_NEXT_DELAY_MS);
    } catch (error) {
        console.error('Veri tabanı kaydı hatası:', error);
    }
};

/**
 * Optimistically updates the local words cache after a quiz answer,
 * avoiding a round-trip to Firestore just to refresh the list.
 *
 * @param {Array}   words
 * @param {string}  wordId
 * @param {boolean} isCorrect
 * @param {Object}  sm2Data
 * @returns {Array} Updated words array.
 */
const updateLocalWordStats = (words, wordId, isCorrect, sm2Data) => {
    return words.map(w =>
        w.id === wordId
            ? {
                ...w,
                [isCorrect ? 'correct' : 'wrong']: (w[isCorrect ? 'correct' : 'wrong'] || 0) + 1,
                ...sm2Data,
              }
            : w
    );
};
