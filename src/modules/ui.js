// DOM Element Seçicileri
export const elements = {
    authSection: document.getElementById('auth-section'),
    dashboardSection: document.getElementById('dashboard-section'),
    quizSection: document.getElementById('quiz-section'),
    mainSidebar: document.getElementById('main-sidebar'),
    toggleSidebarBtn: document.getElementById('toggle-sidebar'),
    navItems: document.querySelectorAll('.nav-item'),
    
    // Auth
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),
    loginEmail: document.getElementById('login-email'),
    loginPass: document.getElementById('login-password'),
    registerEmail: document.getElementById('register-email'),
    registerPass: document.getElementById('register-password'),

    // Dashboard
    logoutBtn: document.getElementById('logout-btn'),
    addWordForm: document.getElementById('add-word-form'),
    wordList: document.getElementById('word-list'),
    searchWords: document.getElementById('search-words'),
    totalWordsCount: document.getElementById('total-words-count'),
    totalCorrectCount: document.getElementById('total-correct-count'),

    // Quiz
    qWord: document.getElementById('q-word'),
    qSentence: document.getElementById('q-sentence'),
    quizAnswer: document.getElementById('quiz-answer'),
    submitAnswer: document.getElementById('submit-answer'),
    quizFeedback: document.getElementById('quiz-feedback'),

    // Edit Modal
    editModal: document.getElementById('edit-modal'),
    editForm: document.getElementById('edit-word-form'),
    editId: document.getElementById('edit-id'),
    editWord: document.getElementById('edit-word'),
    editMeaning: document.getElementById('edit-meaning'),
    editExample: document.getElementById('edit-example'),
    closeModalBtns: document.querySelectorAll('.close-modal')
};

/**
 * Görünümler arası geçiş yapar.
 */
export const showView = (viewName) => {
    // Tüm görünümleri gizle
    [elements.authSection, elements.dashboardSection, elements.quizSection].forEach(el => {
        el.classList.add('hidden');
    });

    // Sidebar kontrolü
    if (viewName === 'auth') {
        elements.mainSidebar.classList.add('hidden');
        document.body.style.backgroundColor = 'var(--bg-system)';
    } else {
        elements.mainSidebar.classList.remove('hidden');
    }

    // Görünümü göster
    if (viewName === 'auth') elements.authSection.classList.remove('hidden');
    if (viewName === 'dashboard') elements.dashboardSection.classList.remove('hidden');
    if (viewName === 'quiz') elements.quizSection.classList.remove('hidden');

    // Sidebar active state güncelle
    elements.navItems.forEach(item => {
        if (item.dataset.view === viewName) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
};

/**
 * Kelime listesini render eder.
 */
export const renderWords = (words, searchTerm = "") => {
    if (!words || words.length === 0) {
        elements.wordList.innerHTML = '<div class="empty-state" style="padding: 3rem; text-align: center; color: var(--text-secondary);"><i class="fas fa-ghost" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i><p>Henüz kelime eklememişsin.</p></div>';
        return;
    }

    const filteredWords = words.filter(w => 
        w.word.toLowerCase().includes(searchTerm.toLowerCase()) || 
        w.meaning.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // İstatistikleri güncelle
    elements.totalWordsCount.textContent = words.length;
    elements.totalCorrectCount.textContent = words.reduce((acc, w) => acc + (w.correct || 0), 0);

    if (filteredWords.length === 0) {
        elements.wordList.innerHTML = '<p class="empty-state" style="padding: 3rem; text-align: center; color: var(--text-secondary);">Arama kriterine uygun kelime bulunamadı.</p>';
        return;
    }

    // Alfabetik sırala
    const sortedWords = [...filteredWords].sort((a, b) => a.word.localeCompare(b.word));

    elements.wordList.innerHTML = `
        <div class="word-list-container">
            ${sortedWords.map(w => `
                <div class="word-row" data-id="${w.id}">
                    <div class="word-en">${w.word}</div>
                    <div class="word-tr">${w.meaning}</div>
                    <div class="word-example">${w.exampleSentence}</div>
                    <div class="action-btns">
                        <button class="btn-action btn-edit" data-id="${w.id}" title="Düzenle">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action btn-delete" data-id="${w.id}" title="Sil">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

};

/**
 * Quiz ekranını günceller.
 */
export const updateQuizUI = (wordObj, progress = 0) => {
    elements.qWord.textContent = wordObj.word;
    elements.qSentence.textContent = wordObj.exampleSentence;
    elements.quizAnswer.value = "";
    elements.quizFeedback.innerHTML = "";
    elements.quizFeedback.className = "quiz-feedback-panel";
    elements.quizAnswer.focus();
};

/**
 * Quiz geri bildirimini gösterir.
 */
export const showQuizFeedback = (isCorrect, correctMeaning) => {
    elements.quizFeedback.innerHTML = isCorrect 
        ? `<i class="fas fa-check-circle" style="margin-right: 10px;"></i> Harika! Doğru cevap.` 
        : `<i class="fas fa-times-circle" style="margin-right: 10px;"></i> Yanlış! Doğru cevap: <strong>${correctMeaning}</strong>`;
    
    elements.quizFeedback.className = `quiz-feedback-panel ${isCorrect ? 'feedback-correct' : 'feedback-wrong'}`;
};

/**
 * Hata mesajını gösterir.
 */
export const renderError = (message) => {
    elements.wordList.innerHTML = `
        <div class="error-state" style="padding: 2rem; color: var(--danger); text-align: center;">
            <p>⚠️ Bir hata oluştu:</p>
            <p class="error-msg">${message}</p>
        </div>
    `;
};

/**
 * Düzenleme modalını açar.
 */
export const openEditModal = (word) => {
    elements.editId.value = word.id;
    elements.editWord.value = word.word;
    elements.editMeaning.value = word.meaning;
    elements.editExample.value = word.exampleSentence;
    elements.editModal.classList.remove('hidden');
};

/**
 * Modalları kapatır.
 */
export const closeModals = () => {
    elements.editModal.classList.add('hidden');
};

/**
 * Sidebar'ı açıp kapatır.
 */
export const toggleSidebar = () => {
    elements.mainSidebar.classList.toggle('collapsed');
};
