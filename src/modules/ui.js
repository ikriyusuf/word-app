/**
 * UI Module
 *
 * All DOM manipulation and view-switching logic.
 *
 * Security: User-provided data is always passed through escapeHtml()
 * before being inserted into innerHTML templates.
 *
 * OCP: showView() and setQuizMode() use lookup maps instead of
 * if/else chains — adding new views/modes doesn't require editing this function.
 */

import { elements } from '../utils/dom.js';
import { escapeHtml } from '../utils/sanitize.js';
import {
    WORDS_PER_PAGE,
    MASTERY_THRESHOLD_MASTERED,
    MASTERY_THRESHOLD_LEARNING,
} from '../config/constants.js';

export { elements };

// ─── View Map (OCP) ───────────────────────────────────────────────────────────
/** Maps view name → DOM section element. Open for extension, closed for modification. */
const VIEW_SECTION_MAP = {
    auth:      () => elements.authSection,
    dashboard: () => elements.dashboardSection,
    quiz:      () => elements.quizSection,
    profile:   () => elements.profileSection,
    matching:  () => elements.matchingSection,
    verbs:     () => elements.verbsSection,
};

// ─── View Transitions ─────────────────────────────────────────────────────────

/**
 * Switches the visible application section.
 * Manages sidebar and mobile topbar visibility accordingly.
 *
 * @param {string} viewName - One of the keys in VIEW_SECTION_MAP.
 */
export const showView = (viewName) => {
    // Hide all sections
    Object.values(VIEW_SECTION_MAP).forEach(getEl => {
        const el = getEl();
        if (el) el.classList.add('hidden');
    });

    if (viewName === 'auth') {
        elements.mainSidebar.classList.add('hidden');
        elements.expandSidebarBtn.classList.remove('visible');
        if (elements.mobileTopbar) elements.mobileTopbar.classList.add('hidden');
    } else {
        elements.mainSidebar.classList.remove('hidden');
        if (elements.mainSidebar.classList.contains('collapsed')) {
            elements.expandSidebarBtn.classList.add('visible');
        }
        if (elements.mobileTopbar) elements.mobileTopbar.classList.remove('hidden');
    }

    // Show the target section
    const targetEl = VIEW_SECTION_MAP[viewName]?.();
    if (targetEl) targetEl.classList.remove('hidden');

    // Update active nav items
    elements.navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.view === viewName);
    });

    closeMobileSidebar();
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export const toggleSidebar = () => {
    const sidebar    = elements.mainSidebar;
    const isCollapsed = sidebar.classList.toggle('collapsed');

    const icon = elements.toggleSidebarBtn.querySelector('i');
    if (icon) icon.className = isCollapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left';

    elements.expandSidebarBtn.classList.toggle('visible', isCollapsed);
};

export const openMobileSidebar = () => {
    elements.mainSidebar?.classList.add('mobile-open');
    elements.sidebarBackdrop?.classList.add('active');
    document.body.style.overflow = 'hidden';
};

export const closeMobileSidebar = () => {
    elements.mainSidebar?.classList.remove('mobile-open');
    elements.sidebarBackdrop?.classList.remove('active');
    document.body.style.overflow = '';
};

export const isMobile = () => window.innerWidth <= 768;

// ─── Auth Tabs ────────────────────────────────────────────────────────────────

export const switchAuthTab = (tab) => {
    const isLogin = tab === 'login';
    elements.loginContainer.classList.toggle('hidden',    !isLogin);
    elements.registerContainer.classList.toggle('hidden',  isLogin);
    elements.tabLogin.classList.toggle('active',           isLogin);
    elements.tabRegister.classList.toggle('active',       !isLogin);
};

// ─── Quiz Mode (OCP) ──────────────────────────────────────────────────────────

/** Maps quiz mode name → UI element. Open for extension, closed for modification. */
const QUIZ_MODE_UI_MAP = {
    cloze:      () => elements.clozeModeUI,
    scramble:   () => elements.scrambleModeUI,
    dictation:  () => elements.dictationModeUI,
    flashcard:  () => elements.flashcardModeUI,
};

/**
 * Shows the active quiz mode UI and hides all others.
 * Updates active state on mode selector buttons.
 *
 * @param {'cloze'|'scramble'|'dictation'|'flashcard'} mode
 */
export const setQuizMode = (mode) => {
    Object.values(QUIZ_MODE_UI_MAP).forEach(getEl => {
        const el = getEl();
        if (el) el.classList.add('hidden');
    });

    const targetEl = QUIZ_MODE_UI_MAP[mode]?.();
    if (targetEl) targetEl.classList.remove('hidden');

    elements.quizModeBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
};

// ─── Quiz UI Helpers ──────────────────────────────────────────────────────────

/**
 * Masks the target word in a sentence (replaces with underscores).
 * Input is treated as plain text — no HTML injection here.
 *
 * @param {string} sentence
 * @param {string} targetWord
 * @returns {string} Sentence with word replaced by '_____'.
 */
export const maskWordInSentence = (sentence, targetWord) => {
    const censorStr    = '_____';
    const escapedWord  = targetWord.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const wbRegex      = new RegExp(`\\b${escapedWord}\\b`, 'gi');
    let   censored     = sentence.replace(wbRegex, censorStr);

    if (censored === sentence) {
        const fallbackRegex = new RegExp(escapedWord, 'gi');
        censored = sentence.replace(fallbackRegex, censorStr);
    }
    return censored;
};

export const updateClozeUI = (wordObj, index, total, options) => {
    elements.clozeProgress.textContent = `${index + 1} / ${total}`;
    elements.clozeMeaning.textContent  = wordObj.meaning.toUpperCase();
    elements.clozeSentence.textContent = maskWordInSentence(wordObj.exampleSentence, wordObj.word);

    elements.clozeFeedback.innerHTML   = '';
    elements.clozeFeedback.className   = 'quiz-feedback-panel';

    // Options are user-vocabulary data — escape before inserting as HTML attributes/content
    elements.clozeOptionsContainer.innerHTML = options
        .map(opt => `<button class="option-btn" data-option="${escapeHtml(opt)}">${escapeHtml(opt)}</button>`)
        .join('');
};

export const updateScrambleUI = (wordObj, index, total, scrambledLetters) => {
    elements.scrambleProgress.textContent     = `${index + 1} / ${total}`;
    elements.scrambleMeaning.textContent      = wordObj.meaning.toUpperCase();
    elements.scrambleSentenceHint.textContent = maskWordInSentence(wordObj.exampleSentence, wordObj.word);

    elements.scrambleSpelledContainer.innerHTML = '';
    elements.scrambleFeedback.innerHTML         = '';
    elements.scrambleFeedback.className         = 'quiz-feedback-panel';

    elements.scrambleOptionsContainer.innerHTML = scrambledLetters
        .map(item => `<button class="letter-btn" data-id="${escapeHtml(item.id)}" data-char="${escapeHtml(item.char)}">${escapeHtml(item.char.toUpperCase())}</button>`)
        .join('');
};

export const updateDictationUI = (wordObj, index, total) => {
    elements.dictationProgress.textContent = `${index + 1} / ${total}`;
    elements.dictationSentence.textContent = maskWordInSentence(wordObj.exampleSentence, wordObj.word);

    elements.dictationAnswer.value         = '';
    elements.dictationFeedback.innerHTML   = '';
    elements.dictationFeedback.className   = 'quiz-feedback-panel';
    elements.dictationAnswer.placeholder   = 'Duyduğun kelimeyi yaz...';
    elements.dictationAnswer.focus();
};

export const showQuizFeedback = (isCorrect, correctVal, mode = 'cloze') => {
    const feedbackPanel = mode === 'cloze'    ? elements.clozeFeedback
                        : mode === 'scramble' ? elements.scrambleFeedback
                        :                       elements.dictationFeedback;

    // correctVal is user data — escape it
    feedbackPanel.innerHTML = isCorrect
        ? `<i class="fas fa-check-circle"></i> Tebrikler! Doğru cevap.`
        : `<i class="fas fa-times-circle"></i> Yanlış! Doğru cevap: <strong>${escapeHtml(correctVal)}</strong>`;
    feedbackPanel.className = `quiz-feedback-panel ${isCorrect ? 'feedback-correct' : 'feedback-wrong'}`;
};

// ─── Word List with Pagination ────────────────────────────────────────────────

let currentWordPage = 1;

/**
 * Computes the mastery level label and CSS class for a word.
 * @param {number} mastery - 0–100
 * @returns {{ cls: string, text: string }}
 */
const getMasteryDisplay = (mastery) => {
    if (mastery >= MASTERY_THRESHOLD_MASTERED) return { cls: 'mastered', text: 'Öğrenildi' };
    if (mastery >= MASTERY_THRESHOLD_LEARNING) return { cls: 'learning', text: 'Öğreniyor' };
    return { cls: 'new', text: 'Yeni' };
};

/**
 * Builds a single word row HTML string.
 * All user data is escaped through escapeHtml() to prevent XSS.
 *
 * @param {Object} w - Word object.
 * @returns {string} HTML string.
 */
const buildWordRowHTML = (w) => {
    const correct = w.correct || 0;
    const wrong   = w.wrong   || 0;
    const total   = correct + wrong;
    const mastery = total === 0 ? 0 : Math.round((correct / total) * 100);
    const { cls, text } = getMasteryDisplay(mastery);

    // All user-provided fields are sanitized with escapeHtml
    const safeWord    = escapeHtml(w.word);
    const safeMeaning = escapeHtml(w.meaning);
    const safeExample = escapeHtml(w.exampleSentence);
    const safeId      = escapeHtml(w.id);

    return `
    <div class="word-row" data-id="${safeId}">
        <div class="word-en">${safeWord}</div>
        <div class="word-tr">${safeMeaning}</div>
        <div class="word-example">${safeExample}</div>
        <div class="word-mastery" title="Ustalık: ${mastery}%">
            <span class="mastery-badge ${cls}">${escapeHtml(text)} (${mastery}%)</span>
        </div>
        <div class="action-btns">
            <button class="btn-action btn-speak" data-word="${safeWord}" title="Telaffuzu dinle">
                <i class="fas fa-volume-up"></i>
            </button>
            <button class="btn-action btn-edit" data-id="${safeId}" title="Düzenle">
                <i class="fas fa-pen"></i>
            </button>
            <button class="btn-action btn-delete" data-id="${safeId}" title="Sil">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    </div>`;
};

/**
 * Renders the word list with optional search filtering and pagination.
 * Resets to page 1 when a search term is present.
 *
 * @param {Array}  words      - Full word array from state.
 * @param {string} searchTerm - Optional search query.
 * @param {number|null} page  - Page number to render (null = keep current).
 */
export const renderWords = (words, searchTerm = '', page = null) => {
    if (!words || words.length === 0) {
        elements.wordList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-seedling"></i>
                <p><strong>Kelime haznen boş!</strong></p>
                <p class="empty-state-hint">Sol taraftaki formu kullanarak ilk kelimeni ekle.</p>
            </div>`;
        elements.totalWordsCount.textContent  = '0';
        elements.totalCorrectCount.textContent = '0';
        if (elements.wordCountBadge) elements.wordCountBadge.textContent = '0 kelime';
        currentWordPage = 1;
        return;
    }

    elements.totalWordsCount.textContent  = words.length;
    elements.totalCorrectCount.textContent = words.reduce((acc, w) => acc + (w.correct || 0), 0);

    const lowerSearch    = searchTerm.toLowerCase();
    const filteredWords  = words.filter(w =>
        w.word.toLowerCase().includes(lowerSearch) ||
        w.meaning.toLowerCase().includes(lowerSearch)
    );

    if (elements.wordCountBadge) {
        elements.wordCountBadge.textContent = (searchTerm && filteredWords.length !== words.length)
            ? `${filteredWords.length} / ${words.length} kelime`
            : `${words.length} kelime`;
    }

    if (filteredWords.length === 0) {
        // searchTerm is user input — use textContent approach via DOM API
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'empty-state';

        const icon = document.createElement('i');
        icon.className = 'fas fa-search';

        const msg = document.createElement('p');
        const strong = document.createElement('strong');
        strong.textContent = searchTerm; // Safe textContent
        msg.appendChild(document.createTextNode('"'));
        msg.appendChild(strong);
        msg.appendChild(document.createTextNode('" için sonuç bulunamadı.'));

        const hint = document.createElement('p');
        hint.className = 'empty-state-hint';
        hint.textContent = 'Farklı bir kelime veya anlam dene.';

        emptyDiv.appendChild(icon);
        emptyDiv.appendChild(msg);
        emptyDiv.appendChild(hint);

        elements.wordList.innerHTML = '';
        elements.wordList.appendChild(emptyDiv);
        return;
    }

    const sortedWords = [...filteredWords].sort((a, b) => a.word.localeCompare(b.word));

    // No pagination when searching
    if (searchTerm) {
        elements.wordList.innerHTML = sortedWords.map(buildWordRowHTML).join('');
        return;
    }

    // Pagination
    const totalPages = Math.ceil(sortedWords.length / WORDS_PER_PAGE);
    if (page !== null) currentWordPage = page;
    currentWordPage = Math.max(1, Math.min(currentWordPage, totalPages));

    const start     = (currentWordPage - 1) * WORDS_PER_PAGE;
    const pageWords = sortedWords.slice(start, start + WORDS_PER_PAGE);
    const rowsHTML  = pageWords.map(buildWordRowHTML).join('');

    let paginationHTML = '';
    if (totalPages > 1) {
        const prevDisabled = currentWordPage === 1          ? 'disabled' : '';
        const nextDisabled = currentWordPage === totalPages ? 'disabled' : '';

        const maxVisible = 5;
        let startPage = Math.max(1, currentWordPage - Math.floor(maxVisible / 2));
        let endPage   = Math.min(totalPages, startPage + maxVisible - 1);
        if (endPage - startPage < maxVisible - 1) startPage = Math.max(1, endPage - maxVisible + 1);

        let pageNumbers = '';
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

    elements.wordList.querySelectorAll('.page-btn:not([disabled])').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            renderWords(words, '', parseInt(btn.dataset.page, 10));
            elements.wordList.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
};

// ─── Skeleton Loaders ─────────────────────────────────────────────────────────

export const renderWordsSkeleton = () => {
    const skeletonRow = `
        <div class="skeleton-row">
            <div class="skeleton-cell skeleton-cell--md"></div>
            <div class="skeleton-cell skeleton-cell--lg"></div>
            <div class="skeleton-cell skeleton-cell--sm"></div>
            <div class="skeleton-cell skeleton-cell--xs"></div>
            <div class="skeleton-cell skeleton-cell--xs"></div>
        </div>`;
    elements.wordList.innerHTML = skeletonRow.repeat(5);
};

// ─── Error State ──────────────────────────────────────────────────────────────

/**
 * Renders an error message in the word list area.
 * Message is set via textContent to prevent XSS.
 *
 * @param {string} message
 */
export const renderError = (message) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'empty-state';
    wrapper.style.color = 'var(--danger)';

    const icon = document.createElement('i');
    icon.className = 'fas fa-exclamation-triangle';

    const p = document.createElement('p');
    p.textContent = message; // Safe

    wrapper.appendChild(icon);
    wrapper.appendChild(p);

    elements.wordList.innerHTML = '';
    elements.wordList.appendChild(wrapper);
};

// ─── Edit Modal ───────────────────────────────────────────────────────────────

export const openEditModal = (word) => {
    elements.editId.value      = word.id;
    elements.editWord.value    = word.word;
    elements.editMeaning.value = word.meaning;
    elements.editExample.value = word.exampleSentence;
    elements.editModal.classList.remove('hidden');
};

export const closeModals = () => {
    elements.editModal.classList.add('hidden');
};

// ─── Stats Rendering ──────────────────────────────────────────────────────────

/**
 * Updates all streak, goal and welcome text elements.
 *
 * @param {Object} stats
 * @param {string} displayName
 */
export const renderStats = (stats, displayName = '') => {
    if (!stats) return;

    const streak       = stats.streak       || 0;
    const reviewsToday = stats.reviewsToday || 0;
    const dailyGoal    = stats.dailyGoal    || 10;

    if (elements.dashboardWelcome) {
        elements.dashboardWelcome.textContent = displayName
            ? `Hoş Geldin, ${displayName}! 👋`
            : 'Hoş Geldin! 👋';
    }

    if (elements.userStreak) elements.userStreak.textContent = streak;

    if (elements.userDailyGoal) {
        if (reviewsToday >= dailyGoal) {
            elements.userDailyGoal.innerHTML = `<i class="fas fa-check-circle"></i> ${dailyGoal}/${dailyGoal}`;
            elements.userDailyGoal.className = 'stat-value text-success';
        } else {
            elements.userDailyGoal.textContent = `${reviewsToday}/${dailyGoal}`;
            elements.userDailyGoal.className   = 'stat-value text-info';
        }
    }

    if (elements.sidebarStreak) elements.sidebarStreak.textContent = `${streak} Gün`;

    if (elements.sidebarGoal) {
        if (reviewsToday >= dailyGoal) {
            elements.sidebarGoal.innerHTML = `<i class="fas fa-check-circle" style="color:var(--success);margin-right:4px;"></i>${dailyGoal}/${dailyGoal}`;
        } else {
            elements.sidebarGoal.textContent = `${reviewsToday}/${dailyGoal}`;
        }
    }

    if (elements.profileStreak)      elements.profileStreak.innerHTML      = `<i class="fas fa-fire"></i> ${streak} Gün`;
    if (elements.profileReviewsToday) elements.profileReviewsToday.textContent = `${reviewsToday} Kelime`;
    if (elements.pqsStreak)          elements.pqsStreak.innerHTML          = `<i class="fas fa-fire"></i> ${streak}`;
    if (elements.profileGoalInput)   elements.profileGoalInput.value       = dailyGoal;

    if (elements.profileNameDisplay) {
        elements.profileNameDisplay.textContent  = displayName || '';
        elements.profileNameDisplay.style.display = displayName ? 'flex' : 'none';
    }
    if (elements.profileDisplayNameInput) {
        elements.profileDisplayNameInput.value = displayName;
    }
};

/**
 * Renders the profile word statistics section.
 *
 * @param {Array} words
 */
export const renderProfileStats = (words) => {
    if (!words) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalCorrect = 0, totalWrong = 0, dueCount = 0, learnedCount = 0;
    let hardestWord = null, hardestScore = Infinity;

    words.forEach(w => {
        totalCorrect += w.correct || 0;
        totalWrong   += w.wrong   || 0;

        const nextReview = w.nextReviewDate
            ? (w.nextReviewDate.toDate ? w.nextReviewDate.toDate() : new Date(w.nextReviewDate))
            : new Date();
        if (nextReview <= today) dueCount++;

        if ((w.repetitions || 0) >= 3 && (w.easinessFactor || 2.5) >= 2.3) learnedCount++;

        const score = (w.easinessFactor || 2.5) - (w.wrong || 0) * 0.1;
        if ((w.wrong || 0) > 0 && score < hardestScore) {
            hardestScore = score;
            hardestWord  = w.word;
        }
    });

    const totalAnswers = totalCorrect + totalWrong;
    const accuracy     = totalAnswers > 0 ? Math.round((totalCorrect / totalAnswers) * 100) : null;

    if (elements.pstatTotalWords)   elements.pstatTotalWords.textContent   = words.length;
    if (elements.pstatAccuracy)     elements.pstatAccuracy.textContent     = accuracy !== null ? `%${accuracy}` : '—';
    if (elements.pstatTotalAnswers) elements.pstatTotalAnswers.textContent = totalAnswers > 0 ? totalAnswers : '—';
    if (elements.pstatDueWords)     elements.pstatDueWords.textContent     = dueCount;
    if (elements.pstatLearnedWords) elements.pstatLearnedWords.textContent = learnedCount;
    if (elements.pstatHardestWord)  elements.pstatHardestWord.textContent  = hardestWord || '—';

    if (elements.pqsTotalWords) elements.pqsTotalWords.textContent = words.length;
    if (elements.pqsLearned)    elements.pqsLearned.textContent    = learnedCount;
};

export const renderProfileStatsSkeleton = () => {
    const skeletonCell = '<div class="skeleton-cell skeleton-cell--sm" style="display:inline-block;height:16px;width:50px;"></div>';
    const statEls = [
        elements.pstatTotalWords, elements.pstatAccuracy,  elements.pstatTotalAnswers,
        elements.pstatDueWords,   elements.pstatLearnedWords, elements.pstatHardestWord,
        elements.pstatQuizSessions, elements.pstatQuizCorrect, elements.pstatQuizWrong,
        elements.pstatMatchingGames, elements.pstatMatchingBest, elements.pstatCurrentStreak,
    ];
    statEls.forEach(el => { if (el) el.innerHTML = skeletonCell; });
};

/**
 * Renders the user's email on the profile page.
 *
 * @param {string} email
 */
export const renderProfileEmail = (email) => {
    if (elements.profileEmail) elements.profileEmail.textContent = email;
};

/**
 * Renders the irregular verbs table.
 * Verb data (v1, v2, v3, meaning) is escaped before rendering.
 *
 * @param {Array} verbsList
 */
export const renderVerbsTable = (verbsList) => {
    if (!elements.verbsTableBody) return;

    if (!verbsList || verbsList.length === 0) {
        elements.verbsTableBody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align:center;color:var(--text-tertiary);padding:30px;">
                    <i class="fas fa-search" style="margin-right:6px;"></i> Eşleşen fiil bulunamadı.
                </td>
            </tr>`;
        return;
    }

    elements.verbsTableBody.innerHTML = verbsList
        .map(verb => `
        <tr>
            <td>${escapeHtml(verb.v1)}</td>
            <td>${escapeHtml(verb.v2)}</td>
            <td>${escapeHtml(verb.v3)}</td>
            <td>${escapeHtml(verb.meaning)}</td>
        </tr>`)
        .join('');
};

/**
 * Renders game and quiz statistics on the profile page.
 *
 * @param {Object} stats
 */
export const renderGameStats = (stats) => {
    if (!stats) return;

    const quizSessions  = stats.quizSessionsPlayed  || 0;
    const quizCorrect   = stats.totalQuizCorrect    || 0;
    const quizWrong     = stats.totalQuizWrong      || 0;
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
