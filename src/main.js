import * as authService from './services/auth.js';
import * as dbService   from './services/db.js';
import * as ui          from './modules/ui.js';
import { auth }         from './config/firebase.js';
import { store }        from './store/state.js';
import { startMatchingGame, resetGameIntervals } from './modules/matching.js';
import { initVerbsFeature } from './modules/verbs.js';
import { speak }        from './services/tts.js';
import { capitalizeFirstLetter, capitalizeEachWord } from './utils/string.js';
import { startQuizSession, cleanActiveQuizListeners } from './modules/quizController.js';
import { toast, confirmDialog } from './utils/toast.js';
import { getAuthErrorMessage } from './services/auth.js';
import { renderProfileStats, renderGameStats } from './modules/ui.js';

// ─── Init ─────────────────────────────────────────────────────────────────────
const init = () => {
    setupEventListeners();
    observeAuthState();
    initVerbsFeature();
    initTheme();

    store.subscribe((state) => {
        if (state.user) {
            ui.renderWords(state.words);
            if (state.stats) {
                ui.renderStats(state.stats, state.user.displayName || "");
                // Quiz & oyun istatistiklerini profil sayfasında güncelle
                renderGameStats(state.stats);
            }
            // Profil istatistik özetini kelime listesi her güncellendiginde yenile
            if (state.words) renderProfileStats(state.words);
        }
    });
};

// ─── Auth State ───────────────────────────────────────────────────────────────
let isRegistering = false;
const observeAuthState = () => {
    authService.onAuthChange((user) => {
        if (isRegistering) return;
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

// ─── Kullanıcı İstatistikleri Yükleme ──────────────────────────────────────────
const loadUserStats = async () => {
    const { user } = store.getState();
    if (!user) return;
    try {
        const stats = await dbService.fetchUserStats(user.uid);
        store.setState({ stats });
    } catch (error) {
        console.error('Kullanıcı istatistikleri yüklenirken hata:', error);
    }
};

// ─── Kelime Yükleme ───────────────────────────────────────────────────────────
const loadWords = async () => {
    const { user } = store.getState();
    if (!user) return;
    try {
        const words = await dbService.fetchUserWords(user.uid);
        store.setState({ words });
    } catch (error) {
        console.error('Kelimeler yüklenirken hata:', error);
        ui.renderError(error.message);
    }
};

// ─── Event Listeners ──────────────────────────────────────────────────────────
const setupEventListeners = () => {

    // Şifre Gizle/Göster Kontrolü
    document.querySelectorAll('.btn-toggle-password').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.previousElementSibling;
            if (input) {
                const isPassword = input.type === 'password';
                input.type = isPassword ? 'text' : 'password';
                const icon = btn.querySelector('i');
                if (icon) {
                    icon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
                }
            }
        });
    });

    // Auth Formları
    ui.elements.loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = ui.elements.loginEmail.value;
        const password = ui.elements.loginPass.value;
        const rememberMe = ui.elements.loginRememberMe.checked;
        try {
            await authService.login(email, password, rememberMe);
        } catch (error) {
            toast(getAuthErrorMessage(error), 'error');
        }
    });

    ui.elements.registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const firstName = capitalizeEachWord(ui.elements.registerFirstName.value);
        const lastName = capitalizeEachWord(ui.elements.registerLastName.value);
        const displayName = `${firstName} ${lastName}`;
        try {
            await authService.register(
                ui.elements.registerEmail.value, 
                ui.elements.registerPass.value,
                displayName
            );
            // Firebase kayıt sonrası otomatik giriş yapar.
            // onAuthChange observer devreye girerek dashboard'a yönlendirir.
            toast('Hoş geldin! 🎉 Hesabın başarıyla oluşturuldu.', 'success', 4000);
        } catch (error) {
            toast(getAuthErrorMessage(error), 'error');
        }
    });

    if (ui.elements.forgotPasswordLink) {
        ui.elements.forgotPasswordLink.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = prompt("Şifrenizi sıfırlamak için kayıtlı e-posta adresinizi girin:");
            if (email) {
                try {
                    await authService.resetPassword(email.trim());
                    toast('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen spam kutunuzu da kontrol edin.', 'success', 6000);
                } catch (error) {
                    toast(getAuthErrorMessage(error), 'error');
                }
            }
        });
    }

    // Auth Tab Geçişleri
    ui.elements.tabLogin.addEventListener('click',    () => ui.switchAuthTab('login'));
    ui.elements.tabRegister.addEventListener('click', () => ui.switchAuthTab('register'));
    ui.elements.toRegisterBtn.addEventListener('click', () => ui.switchAuthTab('register'));
    ui.elements.toLoginBtn.addEventListener('click',    () => ui.switchAuthTab('login'));

    // Sidebar
    ui.elements.logoutBtn.addEventListener('click',       () => authService.logout());
    ui.elements.toggleSidebarBtn.addEventListener('click', () => ui.toggleSidebar());
    ui.elements.expandSidebarBtn.addEventListener('click', () => ui.toggleSidebar());

    // Dashboard
    ui.elements.addWordForm.addEventListener('submit', handleAddWord);
    ui.elements.searchWords.addEventListener('input', (e) => {
        const { words } = store.getState();
        ui.renderWords(words, e.target.value);
    });

    // Kelime Listesi (event delegation)
    ui.elements.wordList.addEventListener('click', (e) => {
        const speakBtn  = e.target.closest('.btn-speak');
        const editBtn   = e.target.closest('.btn-edit');
        const deleteBtn = e.target.closest('.btn-delete');

        if (speakBtn)  speak(speakBtn.dataset.word, speakBtn);
        if (editBtn)   handleEditOpen(editBtn.dataset.id);
        if (deleteBtn) handleDeleteWord(deleteBtn.dataset.id);
    });

    // Edit Modal
    ui.elements.editForm.addEventListener('submit', handleEditWord);
    ui.elements.closeModalBtns.forEach(btn => btn.addEventListener('click', () => ui.closeModals()));

    // Girdiler için Gerçek Zamanlı İlk Harfi Büyük Yapma Entegrasyonu
    const autoCapitalizeInput = (e) => {
        const val = e.target.value;
        if (val.length > 0 && val[0] !== val[0].toUpperCase()) {
            const start = e.target.selectionStart;
            const end = e.target.selectionEnd;
            e.target.value = val.charAt(0).toUpperCase() + val.slice(1);
            e.target.setSelectionRange(start, end);
        }
    };

    const addWordInput = document.getElementById('word');
    const addMeaningInput = document.getElementById('meaning');
    const addExampleInput = document.getElementById('example');

    if (addWordInput) addWordInput.addEventListener('input', autoCapitalizeInput);
    if (addMeaningInput) addMeaningInput.addEventListener('input', autoCapitalizeInput);
    if (addExampleInput) addExampleInput.addEventListener('input', autoCapitalizeInput);

    if (ui.elements.editWord) ui.elements.editWord.addEventListener('input', autoCapitalizeInput);
    if (ui.elements.editMeaning) ui.elements.editMeaning.addEventListener('input', autoCapitalizeInput);
    if (ui.elements.editExample) ui.elements.editExample.addEventListener('input', autoCapitalizeInput);
    if (ui.elements.profileDisplayNameInput) ui.elements.profileDisplayNameInput.addEventListener('input', autoCapitalizeInput);
    if (ui.elements.registerFirstName) ui.elements.registerFirstName.addEventListener('input', autoCapitalizeInput);
    if (ui.elements.registerLastName) ui.elements.registerLastName.addEventListener('input', autoCapitalizeInput);

    // ─── Şifre Güç & Kural Göstergesi ───────────────────────────────────────
    const registerPassInput = ui.elements.registerPass;
    if (registerPassInput) {
        const ruleMinlength = document.getElementById('rule-minlength');
        const ruleUppercase = document.getElementById('rule-uppercase');
        const ruleLowercase = document.getElementById('rule-lowercase');
        const ruleNumber    = document.getElementById('rule-number');
        const ruleSpecial   = document.getElementById('rule-special');
        const barFill       = document.getElementById('pw-bar-fill');

        const RULES = [
            { el: ruleMinlength, icon: 'fa-circle', metIcon: 'fa-check-circle', test: (v) => v.length >= 6 },
            { el: ruleUppercase, icon: 'fa-circle', metIcon: 'fa-check-circle', test: (v) => /[A-Z]/.test(v) },
            { el: ruleLowercase, icon: 'fa-circle', metIcon: 'fa-check-circle', test: (v) => /[a-z]/.test(v) },
            { el: ruleNumber,    icon: 'fa-circle', metIcon: 'fa-check-circle', test: (v) => /[0-9]/.test(v) },
            { el: ruleSpecial,   icon: 'fa-circle', metIcon: 'fa-check-circle', test: (v) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(v) },
        ];

        registerPassInput.addEventListener('input', () => {
            const val = registerPassInput.value;
            const hasInput = val.length > 0;
            let metCount = 0;

            RULES.forEach(rule => {
                const passed = rule.test(val);
                if (passed) metCount++;

                rule.el.classList.toggle('met',   passed);
                rule.el.classList.toggle('unmet', hasInput && !passed);

                const iconEl = rule.el.querySelector('.pw-rule-icon i');
                if (iconEl) {
                    iconEl.className = passed ? `fas ${rule.metIcon}` : `fas ${rule.icon}`;
                }
            });

            // Güç çubuğu: 5 kural üzerinden 4 seviyeye dönüştür
            barFill.className = 'pw-bar-fill';
            if (hasInput && metCount > 0) {
                const level = metCount <= 1 ? 1 : metCount <= 2 ? 2 : metCount <= 4 ? 3 : 4;
                barFill.classList.add(`strength-${level}`);
            }
        });
    }

    // Navigasyon
    ui.elements.navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = item.dataset.view;
            
            // Oyun zamanlayıcılarını sıfırla
            resetGameIntervals();

            // Aktif quiz dinleyicilerini sıfırla
            cleanActiveQuizListeners();

            ui.showView(view);
            if (view === 'quiz') startQuizSession();
            if (view === 'matching') resetMatchingViewToStart();
            if (view === 'verbs') {
                if (ui.elements.searchVerbsInput) {
                    ui.elements.searchVerbsInput.value = '';
                    ui.elements.searchVerbsInput.dispatchEvent(new Event('input'));
                }
            }
        });
    });

    // ─── Quiz Mod Seçici ──────────────────────────────────────────────────
    ui.elements.quizModeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const newMode = btn.dataset.mode;
            const { quiz } = store.getState();
            if (quiz.mode === newMode) return; // Zaten aynı mod
            store.setState({ quiz: { ...quiz, mode: newMode } });
            ui.setQuizMode(newMode);
            // Modu değiştirince oturumu yeniden başlat
            startQuizSession();
        });
    });

    // Profile Name Form
    if (ui.elements.profileNameForm) {
        ui.elements.profileNameForm.addEventListener('submit', handleUpdateDisplayName);
    }

    // Profile Password Form
    if (ui.elements.profilePasswordForm) {
        ui.elements.profilePasswordForm.addEventListener('submit', handleUpdatePassword);
    }

    // Profile Goal Form
    if (ui.elements.profileGoalForm) {
        ui.elements.profileGoalForm.addEventListener('submit', handleUpdateDailyGoal);
    }

    // Eşleştirme Oyunu Butonları
    if (ui.elements.btnStartMatching) {
        ui.elements.btnStartMatching.addEventListener('click', () => {
            startMatchingGame(store.getState().words);
        });
    }
    if (ui.elements.btnRestartMatching) {
        ui.elements.btnRestartMatching.addEventListener('click', () => {
            startMatchingGame(store.getState().words);
        });
    }
};

// ─── Tema Sistemi ─────────────────────────────────────────────────────────────
const initTheme = () => {
    const saved = localStorage.getItem('wordapp-theme') || 'light';
    applyTheme(saved);

    // Profil sayfası tema butonları
    if (ui.elements.themeLightBtn) {
        ui.elements.themeLightBtn.addEventListener('click', () => applyTheme('light'));
    }
    if (ui.elements.themeDarkBtn) {
        ui.elements.themeDarkBtn.addEventListener('click', () => applyTheme('dark'));
    }
};

const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('wordapp-theme', theme);
    updateThemeToggleUI(theme);
};

const updateThemeToggleUI = (theme) => {
    if (ui.elements.themeLightBtn && ui.elements.themeDarkBtn) {
        ui.elements.themeLightBtn.classList.toggle('active', theme === 'light');
        ui.elements.themeDarkBtn.classList.toggle('active', theme === 'dark');
    }
};

// ─── Handlers ─────────────────────────────────────────────────────────────────

const handleEditOpen = (wordId) => {
    const word = store.getState().words.find(w => w.id === wordId);
    if (word) ui.openEditModal(word);
};

const handleAddWord = async (e) => {
    e.preventDefault();
    const { user } = store.getState();
    const wordInput    = document.getElementById('word');
    const meaningInput = document.getElementById('meaning');
    const exampleInput = document.getElementById('example');

    const wordData = {
        userId:          user.uid,
        word:            capitalizeFirstLetter(wordInput.value),
        meaning:         capitalizeFirstLetter(meaningInput.value.toLowerCase()),
        exampleSentence: capitalizeFirstLetter(exampleInput.value),
    };

    try {
        await dbService.addWord(wordData);
        ui.elements.addWordForm.reset();
        await loadWords();
        toast('Kelime başarıyla eklendi!', 'success');
    } catch (error) {
        toast('Hata: ' + error.message, 'error');
    }
};

const handleUpdateDailyGoal = async (e) => {
    e.preventDefault();
    const { user } = store.getState();
    if (!user) return;
    
    const newGoal = parseInt(ui.elements.profileGoalInput.value);
    if (isNaN(newGoal) || newGoal < 1) {
        toast('Lütfen geçerli bir hedef belirleyin (en az 1).', 'warning');
        return;
    }
    
    try {
        await dbService.updateDailyGoal(user.uid, newGoal);
        toast('Günlük hedefiniz başarıyla güncellendi! 🎉', 'success');
        await loadUserStats();
    } catch (error) {
        console.error('Hedef güncellenirken hata:', error);
        toast('Hedef güncellenirken bir hata oluştu: ' + error.message, 'error');
    }
};

const handleUpdateDisplayName = async (e) => {
    e.preventDefault();
    const { user } = store.getState();
    if (!user) return;
    
    const rawName = ui.elements.profileDisplayNameInput.value;
    const cleanName = capitalizeEachWord(rawName);
    
    try {
        // Firebase Auth profilini güncelleyelim
        await authService.updateUserProfile(user, { displayName: cleanName });
        
        // Yerel durumu (user) güncelleyelim
        store.setState({ user: auth.currentUser });
        
        toast('Profil bilgileriniz başarıyla güncellendi! 🎉', 'success');
    } catch (error) {
        console.error('Profil güncellenirken hata:', error);
        toast('Profil güncellenirken bir hata oluştu: ' + error.message, 'error');
    }
};

const handleUpdatePassword = async (e) => {
    e.preventDefault();
    const newPassword = ui.elements.profileNewPasswordInput.value;
    
    try {
        await authService.changePassword(newPassword);
        ui.elements.profilePasswordForm.reset();
        toast('Şifreniz başarıyla değiştirildi! 🔐', 'success');
    } catch (error) {
        console.error('Şifre güncellenirken hata:', error);
        toast(getAuthErrorMessage(error), 'error');
    }
};

const handleDeleteWord = async (wordId) => {
    const ok = await confirmDialog('Bu kelimeyi silmek istediğine emin misin?', 'Evet, sil');
    if (!ok) return;
    try {
        await dbService.deleteWord(wordId);
        await loadWords();
        toast('Kelime silindi.', 'info');
    } catch (error) {
        toast('Hata: ' + error.message, 'error');
    }
};

const handleEditWord = async (e) => {
    e.preventDefault();
    const wordId = ui.elements.editId.value;
    const updateData = {
        word:            capitalizeFirstLetter(ui.elements.editWord.value),
        meaning:         capitalizeFirstLetter(ui.elements.editMeaning.value.toLowerCase()),
        exampleSentence: capitalizeFirstLetter(ui.elements.editExample.value),
    };
    try {
        await dbService.updateWord(wordId, updateData);
        ui.closeModals();
        await loadWords();
        toast('Kelime güncellendi!', 'success');
    } catch (error) {
        toast('Hata: ' + error.message, 'error');
    }
};

/**
 * Eşleştirme oyunu başlangıç ekranını sıfırlar ve buton bağlantısını atar.
 */
const resetMatchingViewToStart = () => {
    const { words } = store.getState();
    
    if (words.length < 5) {
        startMatchingGame(words);
        return;
    }
    
    ui.elements.matchingGamePlay.classList.add('hidden');
    ui.elements.matchingResultScreen.classList.add('hidden');
    ui.elements.matchingStartScreen.classList.remove('hidden');
    
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
        </button>
    `;
    
    document.getElementById('btn-start-matching').addEventListener('click', () => {
        startMatchingGame(store.getState().words);
    });
};

// ─── Başlat ───────────────────────────────────────────────────────────────────
init();
