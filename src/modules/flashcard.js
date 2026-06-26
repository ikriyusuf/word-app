/**
 * Flashcard Mode — Klasik kart çevirme ile kelime tekrarı.
 * Kart ön yüzünde İngilizce kelime, arka yüzünde Türkçe anlam + örnek cümle.
 * Kullanıcı kart açıkken "Biliyorum / Bilmiyorum" butonlarıyla ilerleme kaydeder.
 */

import { store } from '../store/state.js';
import * as ui from './ui.js';
import * as dbService from '../services/db.js';
import { speak } from '../services/tts.js';
import { getSRSSortedWords, calculateSM2 } from './quiz.js';
import { toast } from '../utils/toast.js';

let flashcardWords = [];
let flashcardIndex = 0;
let isFlipped = false;
let isAnimating = false;

// DOM references (lazily resolved)
const el = () => ({
    card:       document.getElementById('flashcard-card'),
    word:       document.getElementById('flashcard-word'),
    meaning:    document.getElementById('flashcard-meaning'),
    example:    document.getElementById('flashcard-example'),
    actions:    document.getElementById('flashcard-actions'),
    progress:   document.getElementById('flashcard-progress'),
    stats:      document.getElementById('flashcard-stats'),
    speakBtn:   document.getElementById('flashcard-speak-btn'),
    btnWrong:   document.getElementById('flashcard-btn-wrong'),
    btnCorrect: document.getElementById('flashcard-btn-correct'),
    feedback:   document.getElementById('flashcard-feedback'),
    modeUI:     document.getElementById('flashcard-mode-ui'),
});

let _listeners = [];
const addListener = (el, evt, fn) => {
    el.addEventListener(evt, fn);
    _listeners.push({ el, evt, fn });
};

export const destroyFlashcard = () => {
    _listeners.forEach(({ el, evt, fn }) => el.removeEventListener(evt, fn));
    _listeners = [];
    isFlipped = false;
    isAnimating = false;
};

/**
 * Başlatır. filterFn ile hangi kelimelerin gösterileceği kontrol edilir.
 */
export const initFlashcard = (words, filterFn = null) => {
    destroyFlashcard();

    const baseWords = getSRSSortedWords(words);
    flashcardWords = filterFn ? baseWords.filter(filterFn) : baseWords;
    flashcardIndex = 0;

    if (flashcardWords.length === 0) {
        toast('Bu filtrede gösterilecek kelime yok!', 'warning');
        return;
    }

    renderCard();
    bindListeners();
};

const renderCard = () => {
    if (flashcardIndex >= flashcardWords.length) {
        // Oturum bitti
        const elems = el();
        if (elems.modeUI) {
            elems.modeUI.innerHTML = `
            <div class="empty-state" style="padding:4rem 1.5rem;">
                <i class="fas fa-check-circle" style="color:var(--success);font-size:3rem;display:block;margin-bottom:1rem;"></i>
                <p><strong>Tebrikler! 🎉</strong></p>
                <p class="empty-state-hint">Tüm kartları tamamladın.</p>
            </div>`;
        }
        toast('🎉 Tüm flashcard\'ları tamamladın!', 'success', 3000);
        return;
    }

    const word = flashcardWords[flashcardIndex];
    const elems = el();

    // Reset flip state
    isFlipped = false;
    if (elems.card) elems.card.classList.remove('flipped');
    if (elems.actions) elems.actions.style.display = 'none';
    if (elems.feedback) { elems.feedback.innerHTML = ''; elems.feedback.className = 'quiz-feedback-panel'; }

    // Update content
    if (elems.word) elems.word.textContent = word.word;
    if (elems.meaning) elems.meaning.textContent = word.meaning;
    if (elems.example) elems.example.textContent = word.exampleSentence || '';

    // Progress
    if (elems.progress) elems.progress.textContent = `${flashcardIndex + 1} / ${flashcardWords.length}`;

    // Stats
    const correct = word.correct || 0;
    const wrong   = word.wrong   || 0;
    const total   = correct + wrong;
    const mastery = total === 0 ? 0 : Math.round((correct / total) * 100);
    if (elems.stats) {
        elems.stats.textContent = total > 0
            ? `✅ ${correct}  ❌ ${wrong}  — Ustalık: %${mastery}`
            : 'Henüz çalışılmamış';
    }
};

const flipCard = () => {
    if (isAnimating) return;
    isAnimating = true;

    const elems = el();
    isFlipped = !isFlipped;
    if (elems.card) elems.card.classList.toggle('flipped', isFlipped);

    // Show action buttons only when revealed
    if (isFlipped && elems.actions) {
        elems.actions.style.display = 'flex';
    } else if (!isFlipped && elems.actions) {
        elems.actions.style.display = 'none';
    }

    setTimeout(() => { isAnimating = false; }, 560);
};

const handleAnswer = async (isCorrect) => {
    const { user, words } = store.getState();
    if (!user || flashcardIndex >= flashcardWords.length) return;

    const currentWord = flashcardWords[flashcardIndex];

    // Visual feedback
    const elems = el();
    if (elems.feedback) {
        elems.feedback.textContent = isCorrect ? '✅ Harika!' : '❌ Tekrar çalış!';
        elems.feedback.className = `quiz-feedback-panel ${isCorrect ? 'feedback-correct' : 'feedback-wrong'}`;
    }

    // Persist to Firestore
    try {
        const sm2Data = calculateSM2(currentWord, isCorrect);
        await dbService.updateWordStats(currentWord.id, isCorrect, sm2Data);
        await dbService.updateUserStats(user.uid, isCorrect);

        // Update local store
        const updatedWords = words.map(w =>
            w.id === currentWord.id
                ? { ...w, [isCorrect ? 'correct' : 'wrong']: (w[isCorrect ? 'correct' : 'wrong'] || 0) + 1, ...sm2Data }
                : w
        );
        store.setState({ words: updatedWords });
    } catch (err) {
        console.error('Flashcard kayıt hatası:', err);
    }

    flashcardIndex++;
    setTimeout(() => renderCard(), 900);
};

const bindListeners = () => {
    const elems = el();

    // Flip on card click
    if (elems.card) addListener(elems.card, 'click', (e) => {
        // Don't flip if clicking speak button
        if (e.target.closest('.flashcard-speak-btn')) return;
        flipCard();
    });

    // Speak button
    if (elems.speakBtn) addListener(elems.speakBtn, 'click', (e) => {
        e.stopPropagation();
        const word = flashcardWords[flashcardIndex];
        if (word) speak(`${word.word}. ${word.exampleSentence || ''}`, elems.speakBtn);
    });

    // Answer buttons
    if (elems.btnWrong)   addListener(elems.btnWrong,   'click', () => handleAnswer(false));
    if (elems.btnCorrect) addListener(elems.btnCorrect, 'click', () => handleAnswer(true));
};
