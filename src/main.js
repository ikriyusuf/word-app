import * as authService from './services/auth.js';
import * as dbService   from './services/db.js';
import * as ui          from './modules/ui.js';
import { getSRSSortedWords, checkAnswer } from './modules/quiz.js';
import { store } from './store/state.js';

// ─── Init ─────────────────────────────────────────────────────────────────────
const init = () => {
    setupEventListeners();
    observeAuthState();

    store.subscribe((state) => {
        if (state.user) ui.renderWords(state.words);
    });
};

// ─── Auth State ───────────────────────────────────────────────────────────────
const observeAuthState = () => {
    authService.onAuthChange((user) => {
        store.setState({ user });
        if (user) {
            ui.showView('dashboard');
            loadWords();
        } else {
            ui.showView('auth');
            ui.elements.registerForm.reset();
        }
    });
};

// ─── Kelime Yükleme ───────────────────────────────────────────────────────────
const loadWords = async () => {
    const { user } = store.getState();
    if (!user) return;
    try {
        const words = await dbService.fetchUserWords(user.uid);
        store.setState({ words });
    } catch (error) {
        console.error('Kelimeler yüklenirken hata:', error);
        ui.renderError(error.message);
    }
};

// ─── TTS ──────────────────────────────────────────────────────────────────────
const speak = (text, btnEl = null) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.85;
    if (btnEl) {
        btnEl.classList.add('playing');
        utterance.onend  = () => btnEl.classList.remove('playing');
        utterance.onerror = () => btnEl.classList.remove('playing');
    }
    window.speechSynthesis.speak(utterance);
};

// ─── Event Listeners ──────────────────────────────────────────────────────────
const setupEventListeners = () => {

    // Şifre Gizle/Göster Kontrolü
    document.querySelectorAll('.btn-toggle-password').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.previousElementSibling;
            if (input) {
                const isPassword = input.type === 'password';
                input.type = isPassword ? 'text' : 'password';
                const icon = btn.querySelector('i');
                if (icon) {
                    icon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
                }
            }
        });
    });

    // Auth Formları
    ui.elements.loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await authService.login(ui.elements.loginEmail.value, ui.elements.loginPass.value);
        } catch (error) {
            alert('Giriş hatası: ' + error.message);
        }
    });

    ui.elements.registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await authService.register(ui.elements.registerEmail.value, ui.elements.registerPass.value);
        } catch (error) {
            alert('Kayıt hatası: ' + error.message);
        }
    });

    // Auth Tab Geçişleri
    ui.elements.tabLogin.addEventListener('click',    () => ui.switchAuthTab('login'));
    ui.elements.tabRegister.addEventListener('click', () => ui.switchAuthTab('register'));
    ui.elements.toRegisterBtn.addEventListener('click', () => ui.switchAuthTab('register'));
    ui.elements.toLoginBtn.addEventListener('click',    () => ui.switchAuthTab('login'));

    // Sidebar
    ui.elements.logoutBtn.addEventListener('click',       () => authService.logout());
    ui.elements.toggleSidebarBtn.addEventListener('click', () => ui.toggleSidebar());
    ui.elements.expandSidebarBtn.addEventListener('click', () => ui.toggleSidebar());

    // Dashboard
    ui.elements.addWordForm.addEventListener('submit', handleAddWord);
    ui.elements.searchWords.addEventListener('input', (e) => {
        const { words } = store.getState();
        ui.renderWords(words, e.target.value);
    });

    // Kelime Listesi (event delegation)
    ui.elements.wordList.addEventListener('click', (e) => {
        const speakBtn  = e.target.closest('.btn-speak');
        const editBtn   = e.target.closest('.btn-edit');
        const deleteBtn = e.target.closest('.btn-delete');

        if (speakBtn)  speak(speakBtn.dataset.word, speakBtn);
        if (editBtn)   handleEditOpen(editBtn.dataset.id);
        if (deleteBtn) handleDeleteWord(deleteBtn.dataset.id);
    });

    // Edit Modal
    ui.elements.editForm.addEventListener('submit', handleEditWord);
    ui.elements.closeModalBtns.forEach(btn => btn.addEventListener('click', () => ui.closeModals()));

    // Navigasyon
    ui.elements.navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = item.dataset.view;
            ui.showView(view);
            if (view === 'quiz') startQuizSession();
        });
    });

    // ─── Quiz Mod Seçici ──────────────────────────────────────────────────
    ui.elements.quizModeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const newMode = btn.dataset.mode;
            const { quiz } = store.getState();
            if (quiz.mode === newMode) return; // Zaten aynı mod
            store.setState({ quiz: { ...quiz, mode: newMode } });
            ui.setQuizMode(newMode);
            // Modu değiştirince oturumu yeniden başlat
            startQuizSession();
        });
    });

    // ─── Yaz Modu ─────────────────────────────────────────────────────────
    ui.elements.submitAnswer.addEventListener('click', handleTypeAnswer);
    ui.elements.quizAnswer.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleTypeAnswer();
    });

    // ─── Flashcard Modu ───────────────────────────────────────────────────
    ui.elements.fcRevealBtn.addEventListener('click', () => {
        ui.revealFlashcard();
        // Kelimeyi sesli oku (anlam açılınca)
        const { quiz } = store.getState();
        if (quiz.currentWord) speak(quiz.currentWord.word);
    });

    ui.elements.fcKnowBtn.addEventListener('click',    () => handleFlashcardAnswer(true));
    ui.elements.fcDontKnowBtn.addEventListener('click', () => handleFlashcardAnswer(false));
};

// ─── Quiz Session ─────────────────────────────────────────────────────────────
const startQuizSession = () => {
    const { words, quiz } = store.getState();
    if (words.length === 0) {
        alert('Önce kelime eklemelisin!');
        ui.showView('dashboard');
        return;
    }

    // SRS sıralaması: en acil öğrenilmesi gerekenler başa
    const sessionWords = getSRSSortedWords(words);

    store.setState({
        quiz: { ...quiz, sessionWords, index: 0, currentWord: null, cardRevealed: false }
    });

    // Aktif mod için UI'yi ayarla
    ui.setQuizMode(quiz.mode);
    nextQuestion();
};

const nextQuestion = () => {
    const { quiz } = store.getState();
    if (quiz.index >= quiz.sessionWords.length) {
        alert('🎉 Harika! Tüm kelimeleri tamamladın.');
        ui.showView('dashboard');
        return;
    }

    const currentWord = quiz.sessionWords[quiz.index];
    store.setState({ quiz: { ...quiz, currentWord, cardRevealed: false } });

    if (quiz.mode === 'flashcard') {
        ui.updateFlashcardUI(currentWord, quiz.index, quiz.sessionWords.length);
    } else {
        ui.updateQuizUI(currentWord);
        // Yaz modunda kelimeyi sesli oku
        setTimeout(() => speak(currentWord.word), 400);
    }
};

// ─── Handlers ─────────────────────────────────────────────────────────────────

/** Yaz modu cevap kontrolü */
const handleTypeAnswer = async () => {
    const { quiz, words } = store.getState();
    if (!quiz.currentWord) return;

    const userInput  = ui.elements.quizAnswer.value;
    const isCorrect  = checkAnswer(userInput, quiz.currentWord.meaning);

    ui.showQuizFeedback(isCorrect, quiz.currentWord.meaning);

    try {
        await dbService.updateWordStats(quiz.currentWord.id, isCorrect);
        const updatedWords = updateLocalWordStats(words, quiz.currentWord.id, isCorrect);
        store.setState({
            words: updatedWords,
            quiz: { ...quiz, index: quiz.index + 1 }
        });

        setTimeout(() => {
            if (!ui.elements.quizSection.classList.contains('hidden')) {
                nextQuestion();
            }
        }, 1500);
    } catch (error) {
        console.error('Hata:', error);
    }
};

/** Flashcard modu: Biliyordum / Bilmiyordum */
const handleFlashcardAnswer = async (isCorrect) => {
    const { quiz, words } = store.getState();
    if (!quiz.currentWord) return;

    // Butonları geçici olarak devre dışı bırak
    ui.elements.fcKnowBtn.disabled    = true;
    ui.elements.fcDontKnowBtn.disabled = true;

    try {
        await dbService.updateWordStats(quiz.currentWord.id, isCorrect);
        const updatedWords = updateLocalWordStats(words, quiz.currentWord.id, isCorrect);
        store.setState({
            words: updatedWords,
            quiz:  { ...quiz, index: quiz.index + 1 }
        });
    } catch (error) {
        console.error('Hata:', error);
    } finally {
        ui.elements.fcKnowBtn.disabled    = false;
        ui.elements.fcDontKnowBtn.disabled = false;
        nextQuestion();
    }
};

const handleEditOpen = (wordId) => {
    const word = store.getState().words.find(w => w.id === wordId);
    if (word) ui.openEditModal(word);
};

const handleAddWord = async (e) => {
    e.preventDefault();
    const { user } = store.getState();
    const wordInput    = document.getElementById('word');
    const meaningInput = document.getElementById('meaning');
    const exampleInput = document.getElementById('example');

    const wordData = {
        userId:          user.uid,
        word:            wordInput.value.trim(),
        meaning:         meaningInput.value.toLowerCase().trim(),
        exampleSentence: exampleInput.value.trim(),
    };

    try {
        await dbService.addWord(wordData);
        ui.elements.addWordForm.reset();
        await loadWords();
    } catch (error) {
        alert('Hata: ' + error.message);
    }
};

const handleDeleteWord = async (wordId) => {
    if (!confirm('Emin misin?')) return;
    try {
        await dbService.deleteWord(wordId);
        await loadWords();
    } catch (error) {
        alert('Hata: ' + error.message);
    }
};

const handleEditWord = async (e) => {
    e.preventDefault();
    const wordId = ui.elements.editId.value;
    const updateData = {
        word:            ui.elements.editWord.value.trim(),
        meaning:         ui.elements.editMeaning.value.toLowerCase().trim(),
        exampleSentence: ui.elements.editExample.value.trim(),
    };
    try {
        await dbService.updateWord(wordId, updateData);
        ui.closeModals();
        await loadWords();
    } catch (error) {
        alert('Hata: ' + error.message);
    }
};

// ─── Yardımcı ─────────────────────────────────────────────────────────────────
/** Firestore isteği bitmeden önce local state'i günceller (anında yansıma). */
const updateLocalWordStats = (words, wordId, isCorrect) => {
    return words.map(w =>
        w.id === wordId
            ? { ...w, [isCorrect ? 'correct' : 'wrong']: (w[isCorrect ? 'correct' : 'wrong'] || 0) + 1 }
            : w
    );
};

// ─── Başlat ───────────────────────────────────────────────────────────────────
init();
