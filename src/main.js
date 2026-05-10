import * as authService from './services/auth.js';
import * as dbService from './services/db.js';
import * as ui from './modules/ui.js';
import { getWeightedRandomWord, checkAnswer } from './modules/quiz.js';

// Uygulama Durumu (State Management)
const state = {
    currentUser: null,
    words: [],
    currentQuizWord: null,
    quizIndex: 0,
    quizSessionWords: []
};

/**
 * Başlangıç Yapılandırması
 */
const init = () => {
    setupEventListeners();
    observeAuthState();
};

/**
 * Auth Durumu Takibi
 */
const observeAuthState = () => {
    authService.onAuthChange((user) => {
        state.currentUser = user;
        if (user) {
            ui.showView('dashboard');
            loadAndRenderWords();
        } else {
            ui.showView('auth');
            ui.elements.registerForm.reset();
        }
    });
};

/**
 * Kelimeleri Yükle ve Render Et
 */
const loadAndRenderWords = async (searchTerm = "") => {
    if (!state.currentUser) return;
    
    try {
        state.words = await dbService.fetchUserWords(state.currentUser.uid);
        ui.renderWords(state.words, searchTerm);
    } catch (error) {
        console.error("Kelimeler yüklenirken hata:", error);
        ui.renderError(error.message);
    }
};

/**
 * Event Listener'ları Tanımla
 */
const setupEventListeners = () => {
    // Login Formu
    ui.elements.loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await authService.login(ui.elements.loginEmail.value, ui.elements.loginPass.value);
        } catch (error) {
            alert("Giriş hatası: " + error.message);
        }
    });

    // Register Formu
    ui.elements.registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await authService.register(ui.elements.registerEmail.value, ui.elements.registerPass.value);
        } catch (error) {
            alert("Kayıt hatası: " + error.message);
        }
    });
    
    // Çıkış Yap
    ui.elements.logoutBtn.addEventListener('click', () => authService.logout());

    // Sidebar Toggle
    ui.elements.toggleSidebarBtn.addEventListener('click', () => ui.toggleSidebar());

    // Kelime Ekleme
    ui.elements.addWordForm.addEventListener('submit', handleAddWord);

    // Arama
    ui.elements.searchWords.addEventListener('input', (e) => {
        ui.renderWords(state.words, e.target.value);
    });

    // Kelime Listesi İşlemleri (Edit/Delete) - Event Delegation
    ui.elements.wordList.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.btn-edit');
        const deleteBtn = e.target.closest('.btn-delete');

        if (editBtn) {
            const wordId = editBtn.dataset.id;
            const word = state.words.find(w => w.id === wordId);
            if (word) ui.openEditModal(word);
        }

        if (deleteBtn) {
            const wordId = deleteBtn.dataset.id;
            handleDeleteWord(wordId);
        }
    });

    // Edit Formu
    ui.elements.editForm.addEventListener('submit', handleEditWord);

    // Modalları Kapatma
    ui.elements.closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => ui.closeModals());
    });

    // Sidebar Navigasyon
    ui.elements.navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = item.dataset.view;
            ui.showView(view);
            
            if (view === 'quiz') {
                startQuizSession();
            }
        });
    });

    // Çıkış Yap
    ui.elements.logoutBtn.addEventListener('click', () => authService.logout());
    // Quiz Cevap Gönder
    ui.elements.submitAnswer.addEventListener('click', handleQuizAnswer);
    ui.elements.quizAnswer.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleQuizAnswer();
    });
};

/** --- Handler Fonksiyonları --- **/

const handleAddWord = async (e) => {
    e.preventDefault();
    const wordInput = document.getElementById('word');
    const meaningInput = document.getElementById('meaning');
    const exampleInput = document.getElementById('example');

    const wordData = {
        userId: state.currentUser.uid,
        word: wordInput.value.trim(),
        meaning: meaningInput.value.toLowerCase().trim(),
        exampleSentence: exampleInput.value.trim()
    };

    try {
        await dbService.addWord(wordData);
        ui.elements.addWordForm.reset();
        await loadAndRenderWords();
    } catch (error) {
        alert("Kelime eklenirken hata: " + error.message);
    }
};

const handleDeleteWord = async (wordId) => {
    if (!confirm("Bu kelimeyi silmek istediğine emin misin?")) return;

    try {
        await dbService.deleteWord(wordId);
        await loadAndRenderWords();
    } catch (error) {
        alert("Silme hatası: " + error.message);
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
        await loadAndRenderWords();
    } catch (error) {
        alert("Güncelleme hatası: " + error.message);
    }
};

const startQuizSession = () => {
    if (state.words.length === 0) {
        alert("Önce kelime eklemelisin!");
        ui.showView('dashboard');
        return;
    }

    // Tüm kelimeleri karıştır
    state.quizSessionWords = [...state.words].sort(() => 0.5 - Math.random());
    
    state.quizIndex = 0;
    nextQuizQuestion();
};

const nextQuizQuestion = () => {
    if (state.quizIndex >= state.quizSessionWords.length) {
        alert("Harika! Tüm kelimeleri tamamladın.");
        ui.showView('dashboard');
        return;
    }

    state.currentQuizWord = state.quizSessionWords[state.quizIndex];
    // İlerlemeyi hesapla
    const progress = ((state.quizIndex + 1) / state.quizSessionWords.length) * 100;
    ui.updateQuizUI(state.currentQuizWord, progress);
};

const handleQuizAnswer = async () => {
    const userInput = ui.elements.quizAnswer.value;
    const isCorrect = checkAnswer(userInput, state.currentQuizWord.meaning);

    ui.showQuizFeedback(isCorrect, state.currentQuizWord.meaning);
    state.quizIndex++;

    try {
        await dbService.updateWordStats(state.currentQuizWord.id, isCorrect);
        
        // State'i yerel olarak güncelle
        const wordIdx = state.words.findIndex(w => w.id === state.currentQuizWord.id);
        if (isCorrect) state.words[wordIdx].correct++; else state.words[wordIdx].wrong++;
        
        ui.renderWords(state.words, ui.elements.searchWords.value);
        
        setTimeout(() => {
            if (!ui.elements.quizSection.classList.contains('hidden')) {
                nextQuizQuestion();
            }
        }, 1500);
    } catch (error) {
        console.error("Stats güncellenemedi:", error);
    }
};

// Uygulamayı Başlat
init();
