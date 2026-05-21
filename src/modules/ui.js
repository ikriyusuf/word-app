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
    userStreak:        document.getElementById('user-streak'),
    userDailyGoal:     document.getElementById('user-daily-goal'),
    sidebarStreak:     document.getElementById('sidebar-streak'),
    sidebarGoal:       document.getElementById('sidebar-goal'),

    // Quiz – Mod Seçici
    quizModeBtns: document.querySelectorAll('.mode-btn'),

    // Quiz – Bağlam Seçimi
    clozeModeUI:         document.getElementById('cloze-mode-ui'),
    clozeMeaning:        document.getElementById('cloze-meaning'),
    clozeSentence:       document.getElementById('cloze-sentence'),
    clozeOptionsContainer: document.getElementById('cloze-options-container'),
    clozeFeedback:       document.getElementById('cloze-feedback'),
    clozeProgress:       document.getElementById('cloze-progress'),

    // Quiz – Harf İnşası
    scrambleModeUI:         document.getElementById('scramble-mode-ui'),
    scrambleMeaning:        document.getElementById('scramble-meaning'),
    scrambleSentenceHint:   document.getElementById('scramble-sentence-hint'),
    scrambleSpelledContainer: document.getElementById('scramble-spelled-container'),
    scrambleOptionsContainer: document.getElementById('scramble-options-container'),
    scrambleFeedback:       document.getElementById('scramble-feedback'),
    scrambleBtnBackspace:   document.getElementById('scramble-btn-backspace'),
    scrambleBtnClear:       document.getElementById('scramble-btn-clear'),
    scrambleBtnSpeak:       document.getElementById('scramble-btn-speak'),
    scrambleProgress:       document.getElementById('scramble-progress'),

    // Quiz – Aktif Dikte
    dictationModeUI:    document.getElementById('dictation-mode-ui'),
    dictationSentence:  document.getElementById('dictation-sentence'),
    dictationAnswer:    document.getElementById('dictation-answer'),
    dictationSubmit:    document.getElementById('dictation-submit'),
    dictationFeedback:  document.getElementById('dictation-feedback'),
    dictationAudioBtn:  document.getElementById('dictation-audio-btn'),
    dictationProgress:  document.getElementById('dictation-progress'),

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
 * @param {'cloze'|'scramble'|'dictation'} mode
 */
export const setQuizMode = (mode) => {
    elements.clozeModeUI.classList.add('hidden');
    elements.scrambleModeUI.classList.add('hidden');
    elements.dictationModeUI.classList.add('hidden');

    if (mode === 'cloze') {
        elements.clozeModeUI.classList.remove('hidden');
    } else if (mode === 'scramble') {
        elements.scrambleModeUI.classList.remove('hidden');
    } else if (mode === 'dictation') {
        elements.dictationModeUI.classList.remove('hidden');
    }

    // Mod buton aktif durumu
    elements.quizModeBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
};

/**
 * Cümledeki hedef kelimeyi sansürler (boşluk bırakır).
 */
export const maskWordInSentence = (sentence, targetWord) => {
    const censorStr = '_____';
    const escapedWord = targetWord.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedWord}\\b`, 'gi');
    let censored = sentence.replace(regex, censorStr);
    
    if (censored === sentence) {
        const regexFallback = new RegExp(escapedWord, 'gi');
        censored = sentence.replace(regexFallback, censorStr);
    }
    return censored;
};

// ─── Arayüz Güncelleme Metotları (Yeni 3 Aşamalı Nöro-Öğrenme) ────────────────

/**
 * Bağlam Seçimi UI'sini günceller.
 */
export const updateClozeUI = (wordObj, index, total, options) => {
    elements.clozeProgress.textContent = `${index + 1} / ${total}`;
    elements.clozeMeaning.textContent = wordObj.meaning.toUpperCase();
    elements.clozeSentence.textContent = maskWordInSentence(wordObj.exampleSentence, wordObj.word);
    
    elements.clozeFeedback.innerHTML = '';
    elements.clozeFeedback.className = 'quiz-feedback-panel';
    
    elements.clozeOptionsContainer.innerHTML = options.map(opt => `
        <button class="option-btn" data-option="${opt}">${opt}</button>
    `).join('');
};

/**
 * Harf İnşası UI'sini günceller.
 */
export const updateScrambleUI = (wordObj, index, total, scrambledLetters) => {
    elements.scrambleProgress.textContent = `${index + 1} / ${total}`;
    elements.scrambleMeaning.textContent = wordObj.meaning.toUpperCase();
    elements.scrambleSentenceHint.textContent = maskWordInSentence(wordObj.exampleSentence, wordObj.word);
    
    elements.scrambleSpelledContainer.innerHTML = '';
    elements.scrambleFeedback.innerHTML = '';
    elements.scrambleFeedback.className = 'quiz-feedback-panel';
    
    elements.scrambleOptionsContainer.innerHTML = scrambledLetters.map(item => `
        <button class="letter-btn" data-id="${item.id}" data-char="${item.char}">${item.char.toUpperCase()}</button>
    `).join('');
};

/**
 * Aktif Dikte UI'sini günceller.
 */
export const updateDictationUI = (wordObj, index, total) => {
    elements.dictationProgress.textContent = `${index + 1} / ${total}`;
    elements.dictationSentence.textContent = maskWordInSentence(wordObj.exampleSentence, wordObj.word);
    
    elements.dictationAnswer.value = '';
    elements.dictationFeedback.innerHTML = '';
    elements.dictationFeedback.className = 'quiz-feedback-panel';
    elements.dictationAnswer.placeholder = 'Duyduğun kelimeyi yaz...';
    elements.dictationAnswer.focus();
};

export const showQuizFeedback = (isCorrect, correctVal, mode = 'cloze') => {
    const feedbackPanel = mode === 'cloze' ? elements.clozeFeedback
                        : mode === 'scramble' ? elements.scrambleFeedback
                        : elements.dictationFeedback;
                        
    feedbackPanel.innerHTML = isCorrect
        ? `<i class="fas fa-check-circle"></i> Tebrikler! Doğru cevap.`
        : `<i class="fas fa-times-circle"></i> Yanlış! Doğru cevap: <strong>${correctVal}</strong>`;
    feedbackPanel.className = `quiz-feedback-panel ${isCorrect ? 'feedback-correct' : 'feedback-wrong'}`;
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
