export const elements = {
    authSection:       document.getElementById('auth-section'),
    dashboardSection:  document.getElementById('dashboard-section'),
    quizSection:       document.getElementById('quiz-section'),
    mainSidebar:       document.getElementById('main-sidebar'),
    toggleSidebarBtn:  document.getElementById('toggle-sidebar'),
    expandSidebarBtn:  document.getElementById('expand-sidebar'),
    hamburgerBtn:      document.getElementById('btn-hamburger'),
    sidebarBackdrop:   document.getElementById('sidebar-backdrop'),
    mobileTopbar:      document.getElementById('mobile-topbar'),
    navItems:          document.querySelectorAll('.nav-item'),
    btnExportPDF:      document.getElementById('btn-export-pdf'),
    quizFilterBtns:    document.querySelectorAll('.filter-chip'),

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

    // Quiz – Flashcard
    flashcardModeUI:    document.getElementById('flashcard-mode-ui'),

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
