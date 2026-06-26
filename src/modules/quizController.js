import { store } from '../store/state.js';
import * as ui from './ui.js';
import * as dbService from '../services/db.js';
import { speak } from '../services/tts.js';
import { getSRSSortedWords, calculateSM2 } from './quiz.js';
import { toast } from '../utils/toast.js';

// Game controllers
import { initCloze, destroyCloze } from './games/cloze.js';
import { initScramble, destroyScramble } from './games/scramble.js';
import { initDictation, destroyDictation } from './games/dictation.js';
import { initFlashcard, destroyFlashcard } from './flashcard.js';

/**
 * Destroys all event listeners across all active game modes to prevent leaks and event overlaps.
 */
export const cleanActiveQuizListeners = () => {
    destroyCloze();
    destroyScramble();
    destroyDictation();
    destroyFlashcard();
};

/**
 * Starts a new quiz study session using spaced repetition scheduling.
 * @param {string} activeFilter - 'all' | 'due' | 'wrong' | 'new'
 */
export const startQuizSession = (activeFilter = 'all') => {
    const { words, quiz } = store.getState();
    if (words.length === 0) {
        toast('Önce kelime eklemelisin!', 'warning');
        ui.showView('dashboard');
        return;
    }

    // Safety cleanup of any lingering listeners
    cleanActiveQuizListeners();

    // Apply filter
    const now = new Date();
    const getFilterFn = (filter) => {
        switch (filter) {
            case 'due':
                return (w) => {
                    if (!w.nextReviewDate) return true;
                    const d = w.nextReviewDate.toDate ? w.nextReviewDate.toDate() : new Date(w.nextReviewDate);
                    return d <= now;
                };
            case 'wrong':
                return (w) => (w.wrong || 0) > 0;
            case 'new':
                return (w) => (w.correct || 0) === 0 && (w.wrong || 0) === 0;
            default:
                return () => true;
        }
    };

    const filterFn = getFilterFn(activeFilter);
    const filteredWords = words.filter(filterFn);

    if (filteredWords.length === 0) {
        const filterLabels = { due: 'Tekrar zamanı gelen', wrong: 'Yanlış cevaplanan', new: 'Yeni' };
        toast(`${filterLabels[activeFilter] || 'Bu filtrede'} kelime bulunamadı. Filtre kaldırılıyor.`, 'warning');
        return;
    }

    // Flashcard mode is handled separately
    if (quiz.mode === 'flashcard') {
        ui.setQuizMode('flashcard');
        initFlashcard(filteredWords);
        return;
    }

    // Sort words: most urgent review cards appear first
    const sessionWords = getSRSSortedWords(filteredWords);

    store.setState({
        quiz: { ...quiz, sessionWords, index: 0, currentWord: null, cardRevealed: false }
    });

    // Configure UI display and advance to first question
    ui.setQuizMode(quiz.mode);
    nextQuestion();
};

/**
 * Advances the session to the next card/question.
 */
export const nextQuestion = () => {
    const { quiz, words } = store.getState();
    
    // Safety cleanup before binding new question elements
    cleanActiveQuizListeners();

    if (quiz.index >= quiz.sessionWords.length) {
        toast('🎉 Harika! Tüm kelimeleri tamamladın.', 'success', 4000);
        ui.showView('dashboard');
        return;
    }

    const currentWord = quiz.sessionWords[quiz.index];
    store.setState({ quiz: { ...quiz, currentWord, cardRevealed: false } });

    // Handle callbacks when active subgame checks and submits answer
    const handleAnswer = async (isCorrect) => {
        await submitQuizResponse(isCorrect);
    };

    // Initialize the active game view polymorphically
    if (quiz.mode === 'cloze') {
        initCloze(currentWord, quiz.index, quiz.sessionWords.length, words, handleAnswer, speak);
    } else if (quiz.mode === 'scramble') {
        initScramble(currentWord, quiz.index, quiz.sessionWords.length, handleAnswer, speak);
    } else if (quiz.mode === 'dictation') {
        initDictation(currentWord, quiz.index, quiz.sessionWords.length, handleAnswer, speak);
    }
};

/**
 * Persists results through SM-2 computations, stores new states, and saves records to Firestore.
 * 
 * @param {boolean} isCorrect - If the spelling or choice was correct.
 */
const submitQuizResponse = async (isCorrect) => {
    const { quiz, words, user } = store.getState();
    if (!quiz.currentWord) return;

    const sm2Data = calculateSM2(quiz.currentWord, isCorrect);

    try {
        // 1. Save SM-2 data to word document
        await dbService.updateWordStats(quiz.currentWord.id, isCorrect, sm2Data);

        // 2. Increment active daily review streak counters
        const updatedStats = await dbService.updateUserStats(user.uid, isCorrect);
        
        // 3. Update local in-memory words array
        const updatedWords = updateLocalWordStats(words, quiz.currentWord.id, isCorrect, sm2Data);

        store.setState({
            words: updatedWords,
            stats: updatedStats,
            quiz: { ...quiz, index: quiz.index + 1 }
        });

        // 4. Wait 1.5 seconds so user can see correct/incorrect feedback before advancing
        setTimeout(() => {
            if (!ui.elements.quizSection.classList.contains('hidden')) {
                nextQuestion();
            }
        }, 1500);
    } catch (error) {
        console.error('Veri tabanı kaydı hatası:', error);
    }
};

/**
 * Updates local cache of words with new reviews stats immediately for optimistic UI response.
 */
const updateLocalWordStats = (words, wordId, isCorrect, sm2Data) => {
    return words.map(w =>
        w.id === wordId
            ? { 
                ...w, 
                [isCorrect ? 'correct' : 'wrong']: (w[isCorrect ? 'correct' : 'wrong'] || 0) + 1,
                ...sm2Data
              }
            : w
    );
};
