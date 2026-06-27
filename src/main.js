/**
 * Application Entry Point — main.js
 *
 * Responsibilities:
 *   1. Bootstrap the application (init)
 *   2. Observe Firebase auth state
 *   3. Bind event listeners to DOM elements
 *   4. Delegate business logic to dedicated handler modules
 *
 * SRP: This file only wires events and coordinates top-level app flow.
 * All handler logic lives in src/handlers/*.js.
 * All UI rendering lives in src/modules/ui.js.
 * All data access lives in src/services/*.js.
 *
 * Lazy Loading: Heavy modules (quiz, matching, calendar, verbs, tts)
 * are loaded on demand via dynamic import() and cached in `loadedModules`.
 */

import * as authService from './services/auth.js';
import * as dbService   from './services/db.js';
import * as ui          from './modules/ui.js';
import { store }        from './store/state.js';
import { speak }        from './services/tts.js';
import { pickWordOfDay, renderWordOfDay } from './modules/wordOfDay.js';
import { renderProfileStats, renderGameStats } from './modules/ui.js';

// ─── Handler Imports (SRP — each domain has its own handler file) ─────────────
import {
    handleLogin,
    handleRegister,
    handleForgotPassword,
    handleUpdateDisplayName,
    handleUpdatePassword,
    handleUpdateDailyGoal,
} from './handlers/authHandlers.js';

import {
    handleAddWord,
    handleEditOpen,
    handleEditWord,
    handleDeleteWord,
    handleExportPDF,
} from './handlers/wordHandlers.js';

import { THEME_STORAGE_KEY, DEFAULT_THEME, MIN_WORDS_FOR_GAME } from './config/constants.js';

// ─── Lazy Module Cache ────────────────────────────────────────────────────────
/**
 * Caches dynamically imported modules to avoid re-importing.
 * @type {{ quizController?: Object, matching?: Object, calendar?: Object, verbs?: Object, tts?: Object }}
 */
const loadedModules = {};

// ─── Data Loading ─────────────────────────────────────────────────────────────

/**
 * Fetches the user's words from Firestore and updates the store.
 * Shows a skeleton loader while loading.
 */
const loadWords = async () => {
    const { user } = store.getState();
    if (!user) return;

    try {
        ui.renderWordsSkeleton();
        const { words } = await dbService.fetchUserWords(user.uid);
        store.setState({ words });
    } catch (error) {
        console.error('Kelimeler yüklenirken hata:', error);
        ui.renderError(error.message);
    }
};

/**
 * Fetches the user's stats from Firestore and updates the store.
 * Shows a skeleton loader while loading.
 */
const loadUserStats = async () => {
    const { user } = store.getState();
    if (!user) return;

    try {
        ui.renderProfileStatsSkeleton();
        const stats = await dbService.fetchUserStats(user.uid);
        store.setState({ stats });
    } catch (error) {
        console.error('Kullanıcı istatistikleri yüklenirken hata:', error);
    }
};

// ─── Auth State Observer ──────────────────────────────────────────────────────

/**
 * Listens for Firebase auth state changes and updates the app accordingly.
 * Shows the dashboard on login, auth screen on logout.
 */
const observeAuthState = () => {
    authService.onAuthChange((user) => {
        store.setState({ user });

        if (user) {
            ui.showView('dashboard');
            loadWords();
            loadUserStats();
            ui.renderProfileEmail(user.email);
        } else {
            ui.showView('auth');
            ui.elements.registerForm.reset();
            store.setState({ stats: null });
        }
    });
};

// ─── Store Subscription ───────────────────────────────────────────────────────

/**
 * Reacts to state changes and updates UI accordingly.
 * Triggered after every store.setState() call.
 */
const setupStoreSubscription = () => {
    store.subscribe((state) => {
        if (!state.user) return;

        ui.renderWords(state.words);

        if (state.words) {
            renderProfileStats(state.words);

            // Word of the Day widget
            const wotdWord = pickWordOfDay(state.words);
            renderWordOfDay(
                wotdWord,
                ui.elements.wotdWidget,
                speak,
                () => {
                    const { quiz } = store.getState();
                    store.setState({ quiz: { ...quiz, mode: 'cloze' } });
                    ui.showView('quiz');
                    import('./modules/quizController.js').then(qc => qc.startQuizSession('all'));
                }
            );

            // Activity calendar (lazy loaded once)
            if (!loadedModules.calendar) {
                import('./modules/calendar.js').then(module => {
                    loadedModules.calendar = module;
                    module.renderCalendar(state.words, state.stats);
                });
            } else {
                loadedModules.calendar.renderCalendar(state.words, state.stats);
            }
        }

        if (state.stats) {
            ui.renderStats(state.stats, state.user.displayName || '');
            renderGameStats(state.stats);
        }
    });
};

// ─── Event Setup ──────────────────────────────────────────────────────────────

/**
 * Binds authentication-related event listeners.
 * Handler logic is delegated to authHandlers.js.
 */
const setupAuthEvents = () => {
    // Password toggle buttons
    document.querySelectorAll('.btn-toggle-password').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.previousElementSibling;
            if (!input) return;
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            const icon = btn.querySelector('i');
            if (icon) icon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
        });
    });

    // Auth forms
    ui.elements.loginForm.addEventListener('submit', handleLogin);
    ui.elements.registerForm.addEventListener('submit', handleRegister);

    if (ui.elements.forgotPasswordLink) {
        ui.elements.forgotPasswordLink.addEventListener('click', handleForgotPassword);
    }

    // Auth tab switching
    ui.elements.tabLogin.addEventListener('click',      () => ui.switchAuthTab('login'));
    ui.elements.tabRegister.addEventListener('click',   () => ui.switchAuthTab('register'));
    ui.elements.toRegisterBtn.addEventListener('click', () => ui.switchAuthTab('register'));
    ui.elements.toLoginBtn.addEventListener('click',    () => ui.switchAuthTab('login'));

    // Sidebar
    ui.elements.logoutBtn.addEventListener('click',        () => authService.logout());
    ui.elements.toggleSidebarBtn.addEventListener('click', () => ui.toggleSidebar());
    ui.elements.expandSidebarBtn.addEventListener('click', () => ui.toggleSidebar());

    // Mobile hamburger & backdrop
    ui.elements.hamburgerBtn?.addEventListener('click',    () => ui.openMobileSidebar());
    ui.elements.sidebarBackdrop?.addEventListener('click', () => ui.closeMobileSidebar());

    // Password strength indicator (register form)
    setupPasswordStrengthIndicator();
};

/**
 * Binds dashboard-related event listeners.
 * Handler logic for word CRUD is delegated to wordHandlers.js.
 */
const setupDashboardEvents = () => {
    ui.elements.addWordForm.addEventListener('submit', (e) => handleAddWord(e, loadWords));

    ui.elements.searchWords.addEventListener('input', (e) => {
        const { words } = store.getState();
        ui.renderWords(words, e.target.value);
    });

    if (ui.elements.btnExportPDF) {
        ui.elements.btnExportPDF.addEventListener('click', handleExportPDF);
    }

    // Word list actions (event delegation)
    ui.elements.wordList.addEventListener('click', async (e) => {
        const speakBtn  = e.target.closest('.btn-speak');
        const editBtn   = e.target.closest('.btn-edit');
        const deleteBtn = e.target.closest('.btn-delete');

        if (speakBtn) {
            if (!loadedModules.tts) {
                loadedModules.tts = await import('./services/tts.js');
            }
            loadedModules.tts.speak(speakBtn.dataset.word, speakBtn);
        }
        if (editBtn)   handleEditOpen(editBtn.dataset.id);
        if (deleteBtn) handleDeleteWord(deleteBtn.dataset.id, loadWords);
    });

    // Edit modal
    ui.elements.editForm.addEventListener('submit', (e) => handleEditWord(e, loadWords));
    ui.elements.closeModalBtns.forEach(btn => btn.addEventListener('click', () => ui.closeModals()));

    // Auto-capitalize inputs
    setupAutoCapitalize();
};

/**
 * Binds navigation event listeners.
 * Lazy loads module on first visit to a section.
 */
const setupNavigationEvents = () => {
    ui.elements.navItems.forEach(item => {
        item.addEventListener('click', async (e) => {
            e.preventDefault();
            const view = item.dataset.view;

            // Reset active game timers before switching
            loadedModules.matching?.resetGameIntervals?.();

            // Clean up quiz listeners
            if (loadedModules.quizController) {
                await loadedModules.quizController.cleanActiveQuizListeners?.();
            }

            ui.showView(view);

            if (view === 'quiz') {
                if (!loadedModules.quizController) {
                    loadedModules.quizController = await import('./modules/quizController.js');
                }
                loadedModules.quizController.startQuizSession();
            }

            if (view === 'matching') {
                resetMatchingViewToStart();
            }

            if (view === 'verbs') {
                if (!loadedModules.verbs) {
                    loadedModules.verbs = await import('./modules/verbs.js');
                    loadedModules.verbs.initVerbsFeature();
                }
                if (ui.elements.searchVerbsInput) {
                    ui.elements.searchVerbsInput.value = '';
                    ui.elements.searchVerbsInput.dispatchEvent(new Event('input'));
                }
            }
        });
    });
};

/**
 * Binds quiz mode selector and filter chip events.
 */
const setupQuizEvents = () => {
    ui.elements.quizModeBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            const newMode  = btn.dataset.mode;
            const { quiz } = store.getState();
            if (quiz.mode === newMode) return;

            store.setState({ quiz: { ...quiz, mode: newMode } });
            ui.setQuizMode(newMode);

            if (!loadedModules.quizController) {
                loadedModules.quizController = await import('./modules/quizController.js');
            }
            const activeFilterBtn = document.querySelector('.filter-chip.active');
            const activeFilter    = activeFilterBtn?.dataset.filter ?? 'all';
            loadedModules.quizController.startQuizSession(activeFilter);
        });
    });

    ui.elements.quizFilterBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            ui.elements.quizFilterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            if (!loadedModules.quizController) {
                loadedModules.quizController = await import('./modules/quizController.js');
            }
            loadedModules.quizController.startQuizSession(btn.dataset.filter);
        });
    });
};

/**
 * Binds profile page form events.
 * Handler logic is delegated to authHandlers.js.
 */
const setupProfileEvents = () => {
    ui.elements.profileNameForm?.addEventListener('submit',     handleUpdateDisplayName);
    ui.elements.profilePasswordForm?.addEventListener('submit', handleUpdatePassword);
    ui.elements.profileGoalForm?.addEventListener('submit',     (e) => handleUpdateDailyGoal(e, loadUserStats));
};

/**
 * Binds matching game start/restart button events.
 */
const setupGameEvents = () => {
    const startMatching = async () => {
        if (!loadedModules.matching) {
            loadedModules.matching = await import('./modules/matching.js');
        }
        loadedModules.matching.startMatchingGame(store.getState().words);
    };

    ui.elements.btnStartMatching?.addEventListener('click',   startMatching);
    ui.elements.btnRestartMatching?.addEventListener('click', startMatching);
};

// ─── Theme System ─────────────────────────────────────────────────────────────

/** Applies the saved or default theme on startup. */
const initTheme = () => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME;
    applyTheme(saved);

    ui.elements.themeLightBtn?.addEventListener('click', () => applyTheme('light'));
    ui.elements.themeDarkBtn?.addEventListener('click',  () => applyTheme('dark'));
};

/**
 * Applies a theme by setting the data-theme attribute and saving to localStorage.
 *
 * @param {'light'|'dark'} theme
 */
const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    ui.elements.themeLightBtn?.classList.toggle('active', theme === 'light');
    ui.elements.themeDarkBtn?.classList.toggle('active',  theme === 'dark');
};

// ─── Matching View Reset ──────────────────────────────────────────────────────

/**
 * Resets the matching game to its start screen.
 * If fewer than MIN_WORDS_FOR_GAME words exist, shows the warning screen.
 */
const resetMatchingViewToStart = async () => {
    const { words } = store.getState();

    if (!loadedModules.matching) {
        loadedModules.matching = await import('./modules/matching.js');
    }

    if (words.length < MIN_WORDS_FOR_GAME) {
        loadedModules.matching.startMatchingGame(words);
        return;
    }

    ui.elements.matchingGamePlay.classList.add('hidden');
    ui.elements.matchingResultScreen.classList.add('hidden');
    ui.elements.matchingStartScreen.classList.remove('hidden');

    // Re-render the start screen content
    ui.elements.matchingStartScreen.innerHTML = `
        <div class="game-intro-icon">
            <i class="fas fa-gamepad"></i>
        </div>
        <h2>Hızlı Eşleştirme Mücadelesi</h2>
        <p class="game-description">
            Kelime haznendeki kelimeleri ve anlamlarını en kısa sürede doğru eşleştir.
            Süreye karşı yarışarak görsel çağrışım yeteneğini güçlendir!
        </p>
        <div class="game-rules">
            <div class="rule-item">
                <i class="fas fa-clock text-info"></i>
                <span><strong>30 Saniye</strong> süren var.</span>
            </div>
            <div class="rule-item">
                <i class="fas fa-plus-circle text-success"></i>
                <span>Her doğru eşleşme <strong>+10 Puan</strong> kazandırır.</span>
            </div>
            <div class="rule-item">
                <i class="fas fa-minus-circle text-danger"></i>
                <span>Her yanlış eşleşme <strong>-5 Puan</strong> götürür.</span>
            </div>
        </div>
        <button id="btn-start-matching" class="btn-primary btn-start-game">
            Mücadeleyi Başlat <i class="fas fa-play icon-right"></i>
        </button>`;

    document.getElementById('btn-start-matching').addEventListener('click', async () => {
        if (!loadedModules.matching) {
            loadedModules.matching = await import('./modules/matching.js');
        }
        loadedModules.matching.startMatchingGame(store.getState().words);
    });
};

// ─── Auto-Capitalize Helper ───────────────────────────────────────────────────

/**
 * Capitalizes the first character of an input field in real time.
 *
 * @param {InputEvent} e
 */
const autoCapitalizeInput = (e) => {
    const val = e.target.value;
    if (val.length > 0 && val[0] !== val[0].toUpperCase()) {
        const { selectionStart, selectionEnd } = e.target;
        e.target.value = val.charAt(0).toUpperCase() + val.slice(1);
        e.target.setSelectionRange(selectionStart, selectionEnd);
    }
};

/**
 * Attaches autoCapitalize to all relevant input fields.
 */
const setupAutoCapitalize = () => {
    const inputIds = ['word', 'meaning', 'example'];
    inputIds.forEach(id => {
        document.getElementById(id)?.addEventListener('input', autoCapitalizeInput);
    });

    [
        ui.elements.editWord,
        ui.elements.editMeaning,
        ui.elements.editExample,
        ui.elements.profileDisplayNameInput,
        ui.elements.registerFirstName,
        ui.elements.registerLastName,
    ].forEach(el => el?.addEventListener('input', autoCapitalizeInput));
};

// ─── Password Strength Indicator ─────────────────────────────────────────────

/**
 * Sets up the password strength bar and rule indicators on the register form.
 */
const setupPasswordStrengthIndicator = () => {
    const registerPassInput = ui.elements.registerPass;
    if (!registerPassInput) return;

    const ruleEls = {
        minlength: document.getElementById('rule-minlength'),
        uppercase: document.getElementById('rule-uppercase'),
        lowercase: document.getElementById('rule-lowercase'),
        number:    document.getElementById('rule-number'),
        special:   document.getElementById('rule-special'),
    };
    const barFill = document.getElementById('pw-bar-fill');

    const RULES = [
        { el: ruleEls.minlength, test: (v) => v.length >= 6 },
        { el: ruleEls.uppercase, test: (v) => /[A-Z]/.test(v) },
        { el: ruleEls.lowercase, test: (v) => /[a-z]/.test(v) },
        { el: ruleEls.number,    test: (v) => /[0-9]/.test(v) },
        { el: ruleEls.special,   test: (v) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(v) },
    ];

    registerPassInput.addEventListener('input', () => {
        const val      = registerPassInput.value;
        const hasInput = val.length > 0;
        let metCount   = 0;

        RULES.forEach(rule => {
            const passed = rule.test(val);
            if (passed) metCount++;

            rule.el?.classList.toggle('met',   passed);
            rule.el?.classList.toggle('unmet', hasInput && !passed);

            const iconEl = rule.el?.querySelector('.pw-rule-icon i');
            if (iconEl) {
                iconEl.className = passed ? 'fas fa-check-circle' : 'fas fa-circle';
            }
        });

        if (barFill) {
            barFill.className = 'pw-bar-fill';
            if (hasInput && metCount > 0) {
                const level = metCount <= 1 ? 1 : metCount <= 2 ? 2 : metCount <= 4 ? 3 : 4;
                barFill.classList.add(`strength-${level}`);
            }
        }
    });
};

// ─── Application Bootstrap ────────────────────────────────────────────────────

/**
 * Initialises the application by setting up all event listeners and observers.
 */
const init = () => {
    setupAuthEvents();
    setupNavigationEvents();
    setupDashboardEvents();
    setupQuizEvents();
    setupProfileEvents();
    setupGameEvents();
    observeAuthState();
    initTheme();
    setupStoreSubscription();
};

init();
