// ─── DOM Element Seçicileri ───────────────────────────────────────────────────
export const elements = {
    authSection:       document.getElementById('auth-section'),
    dashboardSection:  document.getElementById('dashboard-section'),
    quizSection:       document.getElementById('quiz-section'),
    mainSidebar:       document.getElementById('main-sidebar'),
    toggleSidebarBtn:  document.getElementById('toggle-sidebar'),
    expandSidebarBtn:  document.getElementById('expand-sidebar'),
    navItems:          document.querySelectorAll('.nav-item'),

    // Auth
    loginForm:         document.getElementById('login-form'),
    registerForm:      document.getElementById('register-form'),
    loginEmail:        document.getElementById('login-email'),
    loginPass:         document.getElementById('login-password'),
    registerEmail:     document.getElementById('register-email'),
    registerPass:      document.getElementById('register-password'),
    loginContainer:    document.getElementById('login-container'),
    registerContainer: document.getElementById('register-container'),
    toRegisterBtn:     document.getElementById('to-register'),
    toLoginBtn:        document.getElementById('to-login'),
    tabLogin:          document.getElementById('tab-login'),
    tabRegister:       document.getElementById('tab-register'),

    // Dashboard
    logoutBtn:         document.getElementById('logout-btn'),
    addWordForm:       document.getElementById('add-word-form'),
    wordList:          document.getElementById('word-list'),
    searchWords:       document.getElementById('search-words'),
    totalWordsCount:   document.getElementById('total-words-count'),
    totalCorrectCount: document.getElementById('total-correct-count'),

    // Quiz – Yaz Modu
    typeModeUI:    document.getElementById('type-mode-ui'),
    qWord:         document.getElementById('q-word'),
    qSentence:     document.getElementById('q-sentence'),
    quizAnswer:    document.getElementById('quiz-answer'),
    submitAnswer:  document.getElementById('submit-answer'),
    quizFeedback:  document.getElementById('quiz-feedback'),

    // Quiz – Mod Seçici
    quizModeBtns: document.querySelectorAll('.mode-btn'),

    // Quiz – Flashcard Modu
    flashcardModeUI:  document.getElementById('flashcard-mode-ui'),
    fcWord:           document.getElementById('fc-word'),
    fcSentence:       document.getElementById('fc-sentence'),
    fcMeaning:        document.getElementById('fc-meaning'),
    fcAnswerSection:  document.getElementById('fc-answer-section'),
    fcRevealBtn:      document.getElementById('fc-reveal-btn'),
    fcActionBtns:     document.getElementById('fc-action-btns'),
    fcKnowBtn:        document.getElementById('fc-know'),
    fcDontKnowBtn:    document.getElementById('fc-dont-know'),
    fcProgress:       document.getElementById('fc-progress'),

    // Edit Modal
    editModal:      document.getElementById('edit-modal'),
    editForm:       document.getElementById('edit-word-form'),
    editId:         document.getElementById('edit-id'),
    editWord:       document.getElementById('edit-word'),
    editMeaning:    document.getElementById('edit-meaning'),
    editExample:    document.getElementById('edit-example'),
    closeModalBtns: document.querySelectorAll('.close-modal'),
};

// ─── View Geçişi ─────────────────────────────────────────────────────────────
export const showView = (viewName) => {
    [elements.authSection, elements.dashboardSection, elements.quizSection].forEach(el => {
        el.classList.add('hidden');
    });

    if (viewName === 'auth') {
        elements.mainSidebar.classList.add('hidden');
        elements.expandSidebarBtn.classList.remove('visible');
    } else {
        elements.mainSidebar.classList.remove('hidden');
        if (elements.mainSidebar.classList.contains('collapsed')) {
            elements.expandSidebarBtn.classList.add('visible');
        }
    }

    if (viewName === 'auth')      elements.authSection.classList.remove('hidden');
    if (viewName === 'dashboard') elements.dashboardSection.classList.remove('hidden');
    if (viewName === 'quiz')      elements.quizSection.classList.remove('hidden');

    elements.navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.view === viewName);
    });
};

// ─── Sidebar Toggle ───────────────────────────────────────────────────────────
export const toggleSidebar = () => {
    const sidebar = elements.mainSidebar;
    const isCollapsed = sidebar.classList.toggle('collapsed');

    const icon = elements.toggleSidebarBtn.querySelector('i');
    if (icon) icon.className = isCollapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left';

    if (isCollapsed) {
        elements.expandSidebarBtn.classList.add('visible');
    } else {
        elements.expandSidebarBtn.classList.remove('visible');
    }
};

// ─── Auth Tabs ────────────────────────────────────────────────────────────────
export const switchAuthTab = (tab) => {
    if (tab === 'login') {
        elements.loginContainer.classList.remove('hidden');
        elements.registerContainer.classList.add('hidden');
        elements.tabLogin.classList.add('active');
        elements.tabRegister.classList.remove('active');
    } else {
        elements.registerContainer.classList.remove('hidden');
        elements.loginContainer.classList.add('hidden');
        elements.tabRegister.classList.add('active');
        elements.tabLogin.classList.remove('active');
    }
};

// ─── Quiz Mod Seçimi ──────────────────────────────────────────────────────────
/**
 * Aktif quiz modunu gösterir, diğerini gizler.
 * @param {'type'|'flashcard'} mode
 */
export const setQuizMode = (mode) => {
    if (mode === 'flashcard') {
        elements.typeModeUI.classList.add('hidden');
        elements.flashcardModeUI.classList.remove('hidden');
    } else {
        elements.flashcardModeUI.classList.add('hidden');
        elements.typeModeUI.classList.remove('hidden');
    }

    // Mod buton aktif durumu
    elements.quizModeBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
};

// ─── Yaz Modu UI ─────────────────────────────────────────────────────────────
export const updateQuizUI = (wordObj) => {
    elements.qWord.textContent = wordObj.word;
    elements.qSentence.textContent = wordObj.exampleSentence;
    elements.quizAnswer.value = '';
    elements.quizFeedback.innerHTML = '';
    elements.quizFeedback.className = 'quiz-feedback-panel';
    elements.quizAnswer.focus();
};

export const showQuizFeedback = (isCorrect, correctMeaning) => {
    elements.quizFeedback.innerHTML = isCorrect
        ? `<i class="fas fa-check-circle"></i> Harika! Doğru cevap.`
        : `<i class="fas fa-times-circle"></i> Yanlış! Doğru cevap: <strong>${correctMeaning}</strong>`;
    elements.quizFeedback.className = `quiz-feedback-panel ${isCorrect ? 'feedback-correct' : 'feedback-wrong'}`;
};

// ─── Flashcard Modu UI ────────────────────────────────────────────────────────
/**
 * Flashcard kartının ön yüzünü hazırlar (kelime + cümle görünür, anlam gizli).
 * @param {Object} wordObj
 * @param {number} index - 0-based
 * @param {number} total
 */
export const updateFlashcardUI = (wordObj, index, total) => {
    elements.fcWord.textContent = wordObj.word;
    elements.fcSentence.textContent = wordObj.exampleSentence;
    elements.fcMeaning.textContent = wordObj.meaning;
    elements.fcProgress.textContent = `${index + 1} / ${total}`;

    // Anlamı gizle, Göster butonunu göster
    elements.fcAnswerSection.classList.add('hidden');
    elements.fcActionBtns.classList.add('hidden');
    elements.fcRevealBtn.classList.remove('hidden');
};

/**
 * Flashcard arka yüzünü açar — anlamı gösterir, Biliyordum/Bilmiyordum butonları çıkar.
 */
export const revealFlashcard = () => {
    elements.fcAnswerSection.classList.remove('hidden');
    elements.fcRevealBtn.classList.add('hidden');
    elements.fcActionBtns.classList.remove('hidden');
};

// ─── Kelime Listesi ───────────────────────────────────────────────────────────
export const renderWords = (words, searchTerm = '') => {
    if (!words || words.length === 0) {
        elements.wordList.innerHTML = `
            <div class="empty-state">
                <i class="far fa-folder-open"></i>
                <p>Henüz kelime eklemedin.</p>
            </div>`;
        elements.totalWordsCount.textContent = 0;
        elements.totalCorrectCount.textContent = 0;
        return;
    }

    elements.totalWordsCount.textContent = words.length;
    elements.totalCorrectCount.textContent = words.reduce((acc, w) => acc + (w.correct || 0), 0);

    const filteredWords = words.filter(w =>
        w.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.meaning.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filteredWords.length === 0) {
        elements.wordList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <p>Arama kriterine uygun kelime bulunamadı.</p>
            </div>`;
        return;
    }

    const sortedWords = [...filteredWords].sort((a, b) => a.word.localeCompare(b.word));

    elements.wordList.innerHTML = sortedWords.map(w => {
        const correct = w.correct || 0;
        const wrong   = w.wrong   || 0;
        const total   = correct + wrong;
        const mastery = total === 0 ? 0 : Math.round((correct / total) * 100);

        // Ustalık sınıfı ve metni: 'mastered' (80+), 'learning' (50-79), 'new' (0-49)
        const masteryClass = mastery >= 80 ? 'mastered'
                           : mastery >= 50 ? 'learning'
                           :                 'new';
        
        const masteryText  = mastery >= 80 ? 'Öğrenildi'
                           : mastery >= 50 ? 'Öğreniliyor'
                           :                 'Yeni';

        return `
        <div class="word-row" data-id="${w.id}">
            <div class="word-en">${w.word}</div>
            <div class="word-tr">${w.meaning}</div>
            <div class="word-example">${w.exampleSentence}</div>
            <div class="word-mastery" title="Ustalık: ${mastery}%">
                <span class="mastery-badge ${masteryClass}">${masteryText} (${mastery}%)</span>
            </div>
            <div class="action-btns">
                <button class="btn-action btn-speak" data-word="${w.word}" title="Telaffuzu dinle">
                    <i class="fas fa-volume-up"></i>
                </button>
                <button class="btn-action btn-edit" data-id="${w.id}" title="Düzenle">
                    <i class="fas fa-pen"></i>
                </button>
                <button class="btn-action btn-delete" data-id="${w.id}" title="Sil">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>`;
    }).join('');
};

// ─── Hata Durumu ──────────────────────────────────────────────────────────────
export const renderError = (message) => {
    elements.wordList.innerHTML = `
        <div class="empty-state" style="color: var(--danger);">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
        </div>`;
};

// ─── Edit Modal ───────────────────────────────────────────────────────────────
export const openEditModal = (word) => {
    elements.editId.value = word.id;
    elements.editWord.value = word.word;
    elements.editMeaning.value = word.meaning;
    elements.editExample.value = word.exampleSentence;
    elements.editModal.classList.remove('hidden');
};

export const closeModals = () => {
    elements.editModal.classList.add('hidden');
};
