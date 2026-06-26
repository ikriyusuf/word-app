import { elements } from '../utils/dom.js';
export { elements };

// ─── View Geçişi ─────────────────────────────────────────────────────────────
export const showView = (viewName) => {
    [elements.authSection, elements.dashboardSection, elements.quizSection, elements.profileSection, elements.matchingSection, elements.verbsSection].forEach(el => {
        if (el) el.classList.add('hidden');
    });

    if (viewName === 'auth') {
        elements.mainSidebar.classList.add('hidden');
        elements.expandSidebarBtn.classList.remove('visible');
        // Auth sayfasında mobile topbar'ı gizle
        if (elements.mobileTopbar) elements.mobileTopbar.classList.add('hidden');
    } else {
        elements.mainSidebar.classList.remove('hidden');
        if (elements.mainSidebar.classList.contains('collapsed')) {
            elements.expandSidebarBtn.classList.add('visible');
        }
        // Auth dışında mobile topbar görünür
        if (elements.mobileTopbar) elements.mobileTopbar.classList.remove('hidden');
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

    // Mobilde sidebar açıksa navigasyon sonrası kapat
    closeMobileSidebar();
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

// ─── Mobile Sidebar Open/Close ────────────────────────────────────────────────
export const openMobileSidebar = () => {
    if (elements.mainSidebar) elements.mainSidebar.classList.add('mobile-open');
    if (elements.sidebarBackdrop) elements.sidebarBackdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
};

export const closeMobileSidebar = () => {
    if (elements.mainSidebar) elements.mainSidebar.classList.remove('mobile-open');
    if (elements.sidebarBackdrop) elements.sidebarBackdrop.classList.remove('active');
    document.body.style.overflow = '';
};

export const isMobile = () => window.innerWidth <= 768;

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
 * @param {'cloze'|'scramble'|'dictation'|'flashcard'} mode
 */
export const setQuizMode = (mode) => {
    elements.clozeModeUI.classList.add('hidden');
    elements.scrambleModeUI.classList.add('hidden');
    elements.dictationModeUI.classList.add('hidden');
    if (elements.flashcardModeUI) elements.flashcardModeUI.classList.add('hidden');

    if (mode === 'cloze') {
        elements.clozeModeUI.classList.remove('hidden');
    } else if (mode === 'scramble') {
        elements.scrambleModeUI.classList.remove('hidden');
    } else if (mode === 'dictation') {
        elements.dictationModeUI.classList.remove('hidden');
    } else if (mode === 'flashcard' && elements.flashcardModeUI) {
        elements.flashcardModeUI.classList.remove('hidden');
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

// ─── Kelime Listesi (Sayfalama ile) ─────────────────────────────────────────
const WORDS_PER_PAGE = 10;
let currentWordPage = 1;

const buildWordRowHTML = (w) => {
    const correct = w.correct || 0;
    const wrong   = w.wrong   || 0;
    const total   = correct + wrong;
    const mastery = total === 0 ? 0 : Math.round((correct / total) * 100);

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
};

export const renderWords = (words, searchTerm = '', page = null) => {
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
        currentWordPage = 1;
        return;
    }

    elements.totalWordsCount.textContent = words.length;
    elements.totalCorrectCount.textContent = words.reduce((acc, w) => acc + (w.correct || 0), 0);

    const filteredWords = words.filter(w =>
        w.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.meaning.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // word-count-badge
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

    // Arama yapılıyorsa pagination yok — tümünü göster
    if (searchTerm) {
        elements.wordList.innerHTML = sortedWords.map(buildWordRowHTML).join('');
        return;
    }

    // Pagination
    const totalPages = Math.ceil(sortedWords.length / WORDS_PER_PAGE);
    if (page !== null) currentWordPage = page;
    // Sayfayı geçerli sınırda tut
    if (currentWordPage < 1) currentWordPage = 1;
    if (currentWordPage > totalPages) currentWordPage = totalPages;

    const start = (currentWordPage - 1) * WORDS_PER_PAGE;
    const pageWords = sortedWords.slice(start, start + WORDS_PER_PAGE);

    const rowsHTML = pageWords.map(buildWordRowHTML).join('');

    // Pagination UI
    let paginationHTML = '';
    if (totalPages > 1) {
        const prevDisabled = currentWordPage === 1 ? 'disabled' : '';
        const nextDisabled = currentWordPage === totalPages ? 'disabled' : '';

        // Sayfa numaraları (en fazla 5 göster)
        let pageNumbers = '';
        const maxVisible = 5;
        let startPage = Math.max(1, currentWordPage - Math.floor(maxVisible / 2));
        let endPage   = Math.min(totalPages, startPage + maxVisible - 1);
        if (endPage - startPage < maxVisible - 1) startPage = Math.max(1, endPage - maxVisible + 1);

        if (startPage > 1) {
            pageNumbers += `<button class="page-btn" data-page="1">1</button>`;
            if (startPage > 2) pageNumbers += `<span class="page-ellipsis">…</span>`;
        }
        for (let i = startPage; i <= endPage; i++) {
            pageNumbers += `<button class="page-btn ${i === currentWordPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) pageNumbers += `<span class="page-ellipsis">…</span>`;
            pageNumbers += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
        }

        paginationHTML = `
        <div class="pagination">
            <button class="page-btn page-btn--nav" data-page="${currentWordPage - 1}" ${prevDisabled}>
                <i class="fas fa-chevron-left"></i>
            </button>
            ${pageNumbers}
            <button class="page-btn page-btn--nav" data-page="${currentWordPage + 1}" ${nextDisabled}>
                <i class="fas fa-chevron-right"></i>
            </button>
            <span class="page-info">${start + 1}–${Math.min(start + WORDS_PER_PAGE, sortedWords.length)} / ${sortedWords.length}</span>
        </div>`;
    }

    elements.wordList.innerHTML = rowsHTML + paginationHTML;

    // Pagination buton olayları (event delegation — wordList üzerinde zaten var)
    elements.wordList.querySelectorAll('.page-btn:not([disabled])').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const newPage = parseInt(btn.dataset.page);
            renderWords(words, '', newPage);
            // Listeye smooth scroll
            elements.wordList.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
};

export const renderWordsSkeleton = () => {
    const skeletonRow = `
        <div class="skeleton-row">
            <div class="skeleton-cell skeleton-cell--md"></div>
            <div class="skeleton-cell skeleton-cell--lg"></div>
            <div class="skeleton-cell skeleton-cell--sm"></div>
            <div class="skeleton-cell skeleton-cell--xs"></div>
            <div class="skeleton-cell skeleton-cell--xs"></div>
        </div>
    `;
    elements.wordList.innerHTML = skeletonRow.repeat(5);
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

export const renderProfileStatsSkeleton = () => {
    const pstatElements = [
        elements.pstatTotalWords, elements.pstatAccuracy, elements.pstatTotalAnswers,
        elements.pstatDueWords, elements.pstatLearnedWords, elements.pstatHardestWord,
        elements.pstatQuizSessions, elements.pstatQuizCorrect, elements.pstatQuizWrong,
        elements.pstatMatchingGames, elements.pstatMatchingBest, elements.pstatCurrentStreak
    ];
    
    pstatElements.forEach(el => {
        if (el) el.innerHTML = '<div class="skeleton-cell skeleton-cell--sm" style="display:inline-block; height: 16px; width: 50px;"></div>';
    });
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
