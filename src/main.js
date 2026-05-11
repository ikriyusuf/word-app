import * as authService from './services/auth.js';
import * as dbService from './services/db.js';
import * as ui from './modules/ui.js';
import { getWeightedRandomWord, checkAnswer } from './modules/quiz.js';
import { store } from './store/state.js';

/**
 * Başlangıç Yapılandırması
 */
const init = () => {
    setupEventListeners();
    observeAuthState();
    
    // Store değişikliklerini dinle
    store.subscribe((state) => {
        if (state.user) {
            ui.renderWords(state.words);
        }
    });
};

/**
 * Auth Durumu Takibi
 */
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

/**
 * Kelimeleri Yükle
 */
const loadWords = async () => {
    const { user } = store.getState();
    if (!user) return;
    
    try {
        const words = await dbService.fetchUserWords(user.uid);
        store.setState({ words });
    } catch (error) {
        console.error("Kelimeler yüklenirken hata:", error);
        ui.renderError(error.message);
    }
};

/**
 * Sesli Okuma (TTS)
 */
const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
};

/**
 * Event Listener'ları Tanımla
 */
const setupEventListeners = () => {
    // Auth Formları
    ui.elements.loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await authService.login(ui.elements.loginEmail.value, ui.elements.loginPass.value);
        } catch (error) {
            alert("Giriş hatası: " + error.message);
        }
    });

    ui.elements.registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await authService.register(ui.elements.registerEmail.value, ui.elements.registerPass.value);
        } catch (error) {
            alert("Kayıt hatası: " + error.message);
        }
    });
    
    ui.elements.logoutBtn.addEventListener('click', () => authService.logout());
    ui.elements.toggleSidebarBtn.addEventListener('click', () => ui.toggleSidebar());
    ui.elements.addWordForm.addEventListener('submit', handleAddWord);

    // Auth Form Toggle
    ui.elements.toRegisterBtn.addEventListener('click', () => {
        ui.elements.loginContainer.classList.add('hidden');
        ui.elements.registerContainer.classList.remove('hidden');
    });

    ui.elements.toLoginBtn.addEventListener('click', () => {
        ui.elements.registerContainer.classList.add('hidden');
        ui.elements.loginContainer.classList.remove('hidden');
    });

    // Arama
    ui.elements.searchWords.addEventListener('input', (e) => {
        const { words } = store.getState();
        ui.renderWords(words, e.target.value);
    });

    // Event Delegation (List İşlemleri)
    ui.elements.wordList.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.btn-edit');
        const deleteBtn = e.target.closest('.btn-delete');
        const wordEl = e.target.closest('.word-en');

        if (editBtn) {
            const wordId = editBtn.dataset.id;
            const word = store.getState().words.find(w => w.id === wordId);
            if (word) ui.openEditModal(word);
        }

        if (deleteBtn) {
            handleDeleteWord(deleteBtn.dataset.id);
        }

        // Kelimeye tıklayınca sesli oku
        if (wordEl) {
            speak(wordEl.textContent);
        }
    });

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

    // Quiz
    ui.elements.submitAnswer.addEventListener('click', handleQuizAnswer);
    ui.elements.quizAnswer.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleQuizAnswer();
    });
};

/** --- Handlers --- **/

const handleAddWord = async (e) => {
    e.preventDefault();
    const { user } = store.getState();
    const wordInput = document.getElementById('word');
    const meaningInput = document.getElementById('meaning');
    const exampleInput = document.getElementById('example');

    const wordData = {
        userId: user.uid,
        word: wordInput.value.trim(),
        meaning: meaningInput.value.toLowerCase().trim(),
        exampleSentence: exampleInput.value.trim()
    };

    try {
        await dbService.addWord(wordData);
        ui.elements.addWordForm.reset();
        await loadWords();
    } catch (error) {
        alert("Hata: " + error.message);
    }
};

const handleDeleteWord = async (wordId) => {
    if (!confirm("Emin misin?")) return;
    try {
        await dbService.deleteWord(wordId);
        await loadWords();
    } catch (error) {
        alert("Hata: " + error.message);
    }
};

const handleEditWord = async (e) => {
    e.preventDefault();
    const wordId = ui.elements.editId.value;
    const updateData = {
        word: ui.elements.editWord.value.trim(),
        meaning: ui.elements.editMeaning.value.toLowerCase().trim(),
        exampleSentence: ui.elements.editExample.value.trim()
    };

    try {
        await dbService.updateWord(wordId, updateData);
        ui.closeModals();
        await loadWords();
    } catch (error) {
        alert("Hata: " + error.message);
    }
};

const startQuizSession = () => {
    const { words } = store.getState();
    if (words.length === 0) {
        alert("Önce kelime eklemelisin!");
        ui.showView('dashboard');
        return;
    }

    const quizSessionWords = [...words].sort(() => 0.5 - Math.random());
    store.setState({ 
        quiz: { ...store.getState().quiz, sessionWords: quizSessionWords, index: 0 } 
    });
    nextQuizQuestion();
};

const nextQuizQuestion = () => {
    const { quiz } = store.getState();
    if (quiz.index >= quiz.sessionWords.length) {
        alert("Harika! Tüm kelimeleri tamamladın.");
        ui.showView('dashboard');
        return;
    }

    const currentWord = quiz.sessionWords[quiz.index];
    const progress = ((quiz.index + 1) / quiz.sessionWords.length) * 100;
    
    store.setState({ quiz: { ...quiz, currentWord } });
    ui.updateQuizUI(currentWord, progress);
    
    // Kelimeyi sesli oku (Quiz başladığında)
    setTimeout(() => speak(currentWord.word), 500);
};

const handleQuizAnswer = async () => {
    const { quiz, words } = store.getState();
    const userInput = ui.elements.quizAnswer.value;
    const isCorrect = checkAnswer(userInput, quiz.currentWord.meaning);

    ui.showQuizFeedback(isCorrect, quiz.currentWord.meaning);
    
    try {
        await dbService.updateWordStats(quiz.currentWord.id, isCorrect);
        
        // Yerel state güncelleme (Hız için)
        const updatedWords = words.map(w => 
            w.id === quiz.currentWord.id 
            ? { ...w, [isCorrect ? 'correct' : 'wrong']: (w[isCorrect ? 'correct' : 'wrong'] || 0) + 1 }
            : w
        );
        
        store.setState({ 
            words: updatedWords,
            quiz: { ...quiz, index: quiz.index + 1 } 
        });

        setTimeout(() => {
            if (!ui.elements.quizSection.classList.contains('hidden')) {
                nextQuizQuestion();
            }
        }, 1500);
    } catch (error) {
        console.error("Hata:", error);
    }
};

init();

