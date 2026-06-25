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
    loginRememberMe:   document.getElementById('login-remember-me'),
    registerEmail:     document.getElementById('register-email'),
    registerPass:      document.getElementById('register-password'),
    registerFirstName:   document.getElementById('register-first-name'),
    registerLastName:    document.getElementById('register-last-name'),
    loginContainer:    document.getElementById('login-container'),
    registerContainer: document.getElementById('register-container'),
    toRegisterBtn:     document.getElementById('to-register'),
    toLoginBtn:        document.getElementById('to-login'),
    tabLogin:          document.getElementById('tab-login'),
    tabRegister:       document.getElementById('tab-register'),
    forgotPasswordLink: document.getElementById('forgot-password-link'),

    // Dashboard
    logoutBtn:         document.getElementById('logout-btn'),
    addWordForm:       document.getElementById('add-word-form'),
    wordList:          document.getElementById('word-list'),
    searchWords:       document.getElementById('search-words'),
    totalWordsCount:   document.getElementById('total-words-count'),
    totalCorrectCount: document.getElementById('total-correct-count'),
    userStreak:        document.getElementById('user-streak'),
    userDailyGoal:     document.getElementById('user-daily-goal'),
    wordCountBadge:    document.getElementById('word-count-badge'),
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

    // Profile
    profileSection:             document.getElementById('profile-section'),
    profileEmail:               document.getElementById('profile-email'),
    profileStreak:              document.getElementById('profile-streak'),
    profileReviewsToday:        document.getElementById('profile-reviews-today'),
    profileGoalForm:            document.getElementById('profile-goal-form'),
    profileGoalInput:           document.getElementById('profile-goal'),
    dashboardWelcome:           document.getElementById('dashboard-welcome'),
    profileNameDisplay:         document.getElementById('profile-name-display'),
    profileNameForm:            document.getElementById('profile-name-form'),
    profileDisplayNameInput:    document.getElementById('profile-display-name'),
    profilePasswordForm:        document.getElementById('profile-password-form'),
    profileNewPasswordInput:    document.getElementById('profile-new-password'),

    // Profile Identity Card – Quick Stats
    pqsTotalWords:  document.getElementById('pqs-total-words'),
    pqsLearned:     document.getElementById('pqs-learned'),
    pqsStreak:      document.getElementById('pqs-streak'),

    // Profile Stats Grid — Kelime İstatistikleri
    pstatTotalWords:    document.getElementById('pstat-total-words'),
    pstatAccuracy:      document.getElementById('pstat-accuracy'),
    pstatTotalAnswers:  document.getElementById('pstat-total-answers'),
    pstatDueWords:      document.getElementById('pstat-due-words'),
    pstatLearnedWords:  document.getElementById('pstat-learned-words'),
    pstatHardestWord:   document.getElementById('pstat-hardest-word'),

    // Profile Stats Grid — Quiz & Oyun İstatistikleri
    pstatQuizSessions:   document.getElementById('pstat-quiz-sessions'),
    pstatQuizCorrect:    document.getElementById('pstat-quiz-correct'),
    pstatQuizWrong:      document.getElementById('pstat-quiz-wrong'),
    pstatMatchingGames:  document.getElementById('pstat-matching-games'),
    pstatMatchingBest:   document.getElementById('pstat-matching-best'),
    pstatCurrentStreak:  document.getElementById('pstat-current-streak'),

    // Ayarlar (Profil) Tema Butonları
    themeLightBtn: document.getElementById('theme-light-btn'),
    themeDarkBtn:  document.getElementById('theme-dark-btn'),
    themeIcon:      document.getElementById('theme-icon'),
    themeLabel:     document.getElementById('theme-label'),

    // Matching Game
    matchingSection:      document.getElementById('matching-section'),
    matchingStartScreen:  document.getElementById('matching-start-screen'),
    matchingGamePlay:     document.getElementById('matching-game-play'),
    matchingResultScreen: document.getElementById('matching-result-screen'),
    gameGrid:             document.getElementById('game-grid'),
    gameTimer:            document.getElementById('game-timer'),
    gameScore:            document.getElementById('game-score'),
    btnStartMatching:     document.getElementById('btn-start-matching'),
    btnRestartMatching:   document.getElementById('btn-restart-matching'),
    resultIcon:           document.getElementById('result-icon'),
    resultTitle:          document.getElementById('result-title'),
    resultMessage:        document.getElementById('result-message'),
    resultScore:          document.getElementById('result-score'),
    resultTime:           document.getElementById('result-time'),

    // Irregular Verbs
    verbsSection:        document.getElementById('verbs-section'),
    searchVerbsInput:    document.getElementById('search-verbs-input'),
    verbsTableBody:      document.getElementById('verbs-table-body'),
};

// ─── View Geçişi ─────────────────────────────────────────────────────────────
export const showView = (viewName) => {
    [elements.authSection, elements.dashboardSection, elements.quizSection, elements.profileSection, elements.matchingSection, elements.verbsSection].forEach(el => {
        if (el) el.classList.add('hidden');
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

    if (viewName === 'auth' && elements.authSection)           elements.authSection.classList.remove('hidden');
    if (viewName === 'dashboard' && elements.dashboardSection) elements.dashboardSection.classList.remove('hidden');
    if (viewName === 'quiz' && elements.quizSection)           elements.quizSection.classList.remove('hidden');
    if (viewName === 'profile' && elements.profileSection)     elements.profileSection.classList.remove('hidden');
    if (viewName === 'matching' && elements.matchingSection)   elements.matchingSection.classList.remove('hidden');
    if (viewName === 'verbs' && elements.verbsSection)         elements.verbsSection.classList.remove('hidden');

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
                <i class="fas fa-seedling"></i>
                <p><strong>Kelime haznen boş!</strong></p>
                <p class="empty-state-hint">Sol taraftaki formu kullanarak ilk kelimeni ekle.</p>
            </div>`;
        elements.totalWordsCount.textContent = 0;
        elements.totalCorrectCount.textContent = 0;
        if (elements.wordCountBadge) elements.wordCountBadge.textContent = '0 kelime';
        return;
    }

    elements.totalWordsCount.textContent = words.length;
    elements.totalCorrectCount.textContent = words.reduce((acc, w) => acc + (w.correct || 0), 0);

    const filteredWords = words.filter(w =>
        w.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.meaning.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // word-count-badge: filtered count vs total
    if (elements.wordCountBadge) {
        if (searchTerm && filteredWords.length !== words.length) {
            elements.wordCountBadge.textContent = `${filteredWords.length} / ${words.length} kelime`;
        } else {
            elements.wordCountBadge.textContent = `${words.length} kelime`;
        }
    }

    if (filteredWords.length === 0) {
        elements.wordList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <p>"<strong>${searchTerm}</strong>" için sonuç bulunamadı.</p>
                <p class="empty-state-hint">Farklı bir kelime veya anlam dene.</p>
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
                           : mastery >= 50 ? 'Öğreniyor'
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

// ─── Kullanıcı Stats (Streak & Hedef) UI ──────────────────────────────────────
/**
 * Kullanıcı streak ve günlük ilerleme istatistiklerini arayüzde günceller.
 * @param {Object} stats - { streak, dailyGoal, reviewsToday }
 */
export const renderStats = (stats, displayName = "") => {
    if (!stats) return;
    
    const streak = stats.streak || 0;
    const reviewsToday = stats.reviewsToday || 0;
    const dailyGoal = stats.dailyGoal || 10;
    
    // Dashboard Greeting & Header
    if (elements.dashboardWelcome) {
        elements.dashboardWelcome.textContent = displayName ? `Hoş Geldin, ${displayName}! 👋` : "Hoş Geldin! 👋";
    }
    
    // Dashboard Stats Card
    if (elements.userStreak) {
        elements.userStreak.textContent = streak;
    }
    if (elements.userDailyGoal) {
        if (reviewsToday >= dailyGoal) {
            elements.userDailyGoal.innerHTML = `<i class="fas fa-check-circle"></i> ${dailyGoal}/${dailyGoal}`;
            elements.userDailyGoal.className = "stat-value text-success";
        } else {
            elements.userDailyGoal.textContent = `${reviewsToday}/${dailyGoal}`;
            elements.userDailyGoal.className = "stat-value text-info";
        }
    }
    
    // Sidebar Navigation Stats
    if (elements.sidebarStreak) {
        elements.sidebarStreak.textContent = `${streak} Gün`;
    }
    if (elements.sidebarGoal) {
        if (reviewsToday >= dailyGoal) {
            elements.sidebarGoal.innerHTML = `<i class="fas fa-check-circle" style="color: var(--success); margin-right: 4px;"></i>${dailyGoal}/${dailyGoal}`;
        } else {
            elements.sidebarGoal.textContent = `${reviewsToday}/${dailyGoal}`;
        }
    }

    // Profile Page Stats & Name Card
    if (elements.profileStreak) {
        elements.profileStreak.innerHTML = `<i class="fas fa-fire"></i> ${streak} Gün`;
    }
    if (elements.profileReviewsToday) {
        elements.profileReviewsToday.textContent = `${reviewsToday} Kelime`;
    }

    // Profile Identity Card – Quick Stats
    if (elements.pqsStreak) {
        elements.pqsStreak.innerHTML = `<i class="fas fa-fire"></i> ${streak}`;
    }
    if (elements.profileGoalInput) {
        elements.profileGoalInput.value = dailyGoal;
    }
    
    if (elements.profileNameDisplay) {
        if (displayName) {
            elements.profileNameDisplay.textContent = displayName;
            elements.profileNameDisplay.style.display = 'flex';
        } else {
            elements.profileNameDisplay.textContent = '';
            elements.profileNameDisplay.style.display = 'none';
        }
    }
    if (elements.profileDisplayNameInput) {
        elements.profileDisplayNameInput.value = displayName;
    }
};

/**
 * Profil sayfasındaki İstatistik Özeti kısmını kelime listesiyle günceller.
 * @param {Array} words - Tüm kelime listesi
 */
export const renderProfileStats = (words) => {
    if (!words) return;

    const totalWords = words.length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalCorrect = 0;
    let totalWrong = 0;
    let dueCount = 0;
    let learnedCount = 0;

    // En zor kelime: en düşük easinessFactor + en çok wrong
    let hardestWord = null;
    let hardestScore = Infinity;

    words.forEach(w => {
        totalCorrect += w.correct || 0;
        totalWrong   += w.wrong   || 0;

        // Tekrar bekleyen: nextReviewDate bugün veya geçmiş
        const nextReview = w.nextReviewDate
            ? (w.nextReviewDate.toDate ? w.nextReviewDate.toDate() : new Date(w.nextReviewDate))
            : new Date();
        if (nextReview <= today) dueCount++;

        // Öğrenilmiş: 3+ tekrar ve kolay
        if ((w.repetitions || 0) >= 3 && (w.easinessFactor || 2.5) >= 2.3) learnedCount++;

        // En zor: ef düşük ve wrong çok
        const score = (w.easinessFactor || 2.5) - (w.wrong || 0) * 0.1;
        if ((w.wrong || 0) > 0 && score < hardestScore) {
            hardestScore = score;
            hardestWord = w.word;
        }
    });

    const totalAnswers = totalCorrect + totalWrong;
    const accuracy = totalAnswers > 0
        ? Math.round((totalCorrect / totalAnswers) * 100)
        : null;

    if (elements.pstatTotalWords)   elements.pstatTotalWords.textContent   = totalWords;
    if (elements.pstatAccuracy)     elements.pstatAccuracy.textContent     = accuracy !== null ? `%${accuracy}` : '—';
    if (elements.pstatTotalAnswers) elements.pstatTotalAnswers.textContent = totalAnswers > 0 ? totalAnswers : '—';
    if (elements.pstatDueWords)     elements.pstatDueWords.textContent     = dueCount;
    if (elements.pstatLearnedWords) elements.pstatLearnedWords.textContent = learnedCount;
    if (elements.pstatHardestWord)  elements.pstatHardestWord.textContent  = hardestWord || '—';

    // Profile Identity Card – Quick Stats (word counts)
    if (elements.pqsTotalWords) elements.pqsTotalWords.textContent = totalWords;
    if (elements.pqsLearned)    elements.pqsLearned.textContent    = learnedCount;
};

/**
 * Profil sayfasındaki e-posta adresini günceller.
 */
export const renderProfileEmail = (email) => {
    if (elements.profileEmail) {
        elements.profileEmail.textContent = email;
    }
};

/**
 * Düzensiz fiiller tablosunu verilen listeye göre çizer.
 * @param {Array} verbsList 
 */
export const renderVerbsTable = (verbsList) => {
    if (!elements.verbsTableBody) return;
    
    if (!verbsList || verbsList.length === 0) {
        elements.verbsTableBody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; color: var(--text-tertiary); padding: 30px;">
                    <i class="fas fa-search" style="margin-right: 6px;"></i> Eşleşen fiil bulunamadı.
                </td>
            </tr>
        `;
        return;
    }
    
    elements.verbsTableBody.innerHTML = verbsList.map(verb => `
        <tr>
            <td>${verb.v1}</td>
            <td>${verb.v2}</td>
            <td>${verb.v3}</td>
            <td>${verb.meaning}</td>
        </tr>
    `).join('');
};

/**
 * Profil sayfasındaki Quiz & Oyun İstatistikleri bölümünü günceller.
 * @param {Object} stats - Firestore'dan gelen kullanıcı istatistikleri
 */
export const renderGameStats = (stats) => {
    if (!stats) return;

    const quizSessions  = stats.quizSessionsPlayed || 0;
    const quizCorrect   = stats.totalQuizCorrect   || 0;
    const quizWrong     = stats.totalQuizWrong     || 0;
    const matchingGames = stats.matchingGamesPlayed || 0;
    const matchingBest  = stats.matchingHighScore   || 0;
    const streak        = stats.streak              || 0;

    if (elements.pstatQuizSessions)  elements.pstatQuizSessions.textContent  = quizSessions;
    if (elements.pstatQuizCorrect)   elements.pstatQuizCorrect.textContent   = quizCorrect;
    if (elements.pstatQuizWrong)     elements.pstatQuizWrong.textContent     = quizWrong;
    if (elements.pstatMatchingGames) elements.pstatMatchingGames.textContent = matchingGames;
    if (elements.pstatMatchingBest)  elements.pstatMatchingBest.textContent  = matchingBest > 0 ? `${matchingBest} Puan` : '—';
    if (elements.pstatCurrentStreak) elements.pstatCurrentStreak.textContent = `${streak} Gün`;
};
