import * as authService from './services/auth.js';
import * as dbService   from './services/db.js';
import * as ui          from './modules/ui.js';
import { auth }         from './config/firebase.js';
import { store }        from './store/state.js';
import { capitalizeFirstLetter, capitalizeEachWord } from './utils/string.js';
import { toast, confirmDialog } from './utils/toast.js';
import { getAuthErrorMessage } from './services/auth.js';
import { renderProfileStats, renderGameStats } from './modules/ui.js';

// ─── Modül Önbelleği (Lazy Loading için) ─────────────────────────────────────
const loadedModules = {};

// ─── Init ─────────────────────────────────────────────────────────────────────
const init = () => {
    setupAuthEvents();
    setupNavigationEvents();
    setupDashboardEvents();
    setupQuizEvents();
    setupProfileEvents();
    setupGameEvents();
    observeAuthState();
    initTheme();

    store.subscribe((state) => {
        if (state.user) {
            ui.renderWords(state.words);
            
            if (state.words) {
                // Profil istatistik özetini kelime listesi her güncellendiginde yenile
                renderProfileStats(state.words);
                
                // Aktivite takvimini (calendar) render et
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
                ui.renderStats(state.stats, state.user.displayName || "");
                // Quiz & oyun istatistiklerini profil sayfasında güncelle
                renderGameStats(state.stats);
            }
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
        ui.renderProfileStatsSkeleton();
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
        ui.renderWordsSkeleton();
        const words = await dbService.fetchUserWords(user.uid);
        store.setState({ words });
    } catch (error) {
        console.error('Kelimeler yüklenirken hata:', error);
        ui.renderError(error.message);
    }
};

// ─── Event Listeners ──────────────────────────────────────────────────────────
const setupAuthEvents = () => {

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

    // Mobile hamburger & backdrop
    if (ui.elements.hamburgerBtn) {
        ui.elements.hamburgerBtn.addEventListener('click', () => ui.openMobileSidebar());
    }
    if (ui.elements.sidebarBackdrop) {
        ui.elements.sidebarBackdrop.addEventListener('click', () => ui.closeMobileSidebar());
    }

};

const setupDashboardEvents = () => {
    // Dashboard
    ui.elements.addWordForm.addEventListener('submit', handleAddWord);
    ui.elements.searchWords.addEventListener('input', (e) => {
        const { words } = store.getState();
        ui.renderWords(words, e.target.value);
    });

    // PDF Dışa Aktarma
    if (ui.elements.btnExportPDF) {
        ui.elements.btnExportPDF.addEventListener('click', () => {
            const { words } = store.getState();
            if (!words || words.length === 0) {
                toast('Dışa aktarılacak kelime bulunamadı.', 'info');
                return;
            }
            
            // html2pdf kullanarak UTF-8 destekli tablo oluştur
            const container = document.createElement('div');
            container.style.padding = '30px';
            container.style.fontFamily = "'Inter', sans-serif";
            container.style.color = '#1f2937';
            container.style.backgroundColor = '#ffffff';

            const today = new Date().toLocaleDateString('tr-TR');
            
            let html = `
                <div style="margin-bottom: 24px; border-bottom: 2px solid #e5e7eb; padding-bottom: 12px;">
                    <h2 style="margin: 0 0 8px 0; font-size: 24px; color: #111827;">Kelime Listem</h2>
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">Tarih: ${today} &nbsp;|&nbsp; Toplam Kelime: ${words.length}</p>
                </div>
                <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left;">
                    <thead>
                        <tr>
                            <th style="padding: 12px; background-color: #f3f4f6; border-bottom: 2px solid #d1d5db; color: #374151; width: 25%;">Kelime</th>
                            <th style="padding: 12px; background-color: #f3f4f6; border-bottom: 2px solid #d1d5db; color: #374151; width: 35%;">Anlamı</th>
                            <th style="padding: 12px; background-color: #f3f4f6; border-bottom: 2px solid #d1d5db; color: #374151; width: 40%;">Örnek Cümle</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            words.forEach((w, i) => {
                const bg = i % 2 === 0 ? '#ffffff' : '#f9fafb';
                html += `
                    <tr style="background-color: ${bg}; border-bottom: 1px solid #e5e7eb;">
                        <td style="padding: 12px; font-weight: 600; color: #111827;">${w.word || ''}</td>
                        <td style="padding: 12px; color: #4b5563;">${w.meaning || ''}</td>
                        <td style="padding: 12px; color: #6b7280; font-style: italic;">${w.exampleSentence || '-'}</td>
                    </tr>
                `;
            });
            
            html += `
                    </tbody>
                </table>
            `;
            
            container.innerHTML = html;
            
            const opt = {
                margin:       [15, 15, 15, 15],
                filename:     `Kelimelerim_${today.replace(/\./g, '-')}.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            
            html2pdf().set(opt).from(container).save().then(() => {
                toast('Kelimeler PDF olarak indirildi.', 'success');
            });
        });
    }

    // Kelime Listesi (event delegation)
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

};

const setupNavigationEvents = () => {
    // Navigasyon
    ui.elements.navItems.forEach(item => {
        item.addEventListener('click', async (e) => {
            e.preventDefault();
            const view = item.dataset.view;
            
            // Oyun zamanlayıcılarını sıfırla
            if (loadedModules.matching) {
                loadedModules.matching.resetGameIntervals();
            }

            // Aktif quiz dinleyicilerini sıfırla
            if (loadedModules.quizController) {
                loadedModules.quizController.cleanActiveQuizListeners();
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

const setupQuizEvents = () => {
    // ─── Quiz Mod Seçici ──────────────────────────────────────────────────
    ui.elements.quizModeBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            const newMode = btn.dataset.mode;
            const { quiz } = store.getState();
            if (quiz.mode === newMode) return; // Zaten aynı mod
            store.setState({ quiz: { ...quiz, mode: newMode } });
            ui.setQuizMode(newMode);
            
            // Modu değiştirince oturumu yeniden başlat
            if (!loadedModules.quizController) {
                loadedModules.quizController = await import('./modules/quizController.js');
            }
            const activeFilterBtn = document.querySelector('.filter-chip.active');
            const activeFilter = activeFilterBtn ? activeFilterBtn.dataset.filter : 'all';
            loadedModules.quizController.startQuizSession(activeFilter);
        });
    });

    // ─── Quiz Filtre Seçici ──────────────────────────────────────────────────
    ui.elements.quizFilterBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            ui.elements.quizFilterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const newFilter = btn.dataset.filter;
            
            if (!loadedModules.quizController) {
                loadedModules.quizController = await import('./modules/quizController.js');
            }
            loadedModules.quizController.startQuizSession(newFilter);
        });
    });

};

const setupProfileEvents = () => {
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

};

const setupGameEvents = () => {
    // Eşleştirme Oyunu Butonları
    if (ui.elements.btnStartMatching) {
        ui.elements.btnStartMatching.addEventListener('click', async () => {
            if (!loadedModules.matching) {
                loadedModules.matching = await import('./modules/matching.js');
            }
            loadedModules.matching.startMatchingGame(store.getState().words);
        });
    }
    if (ui.elements.btnRestartMatching) {
        ui.elements.btnRestartMatching.addEventListener('click', async () => {
            if (!loadedModules.matching) {
                loadedModules.matching = await import('./modules/matching.js');
            }
            loadedModules.matching.startMatchingGame(store.getState().words);
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
const resetMatchingViewToStart = async () => {
    const { words } = store.getState();
    
    if (!loadedModules.matching) {
        loadedModules.matching = await import('./modules/matching.js');
    }

    if (words.length < 5) {
        loadedModules.matching.startMatchingGame(words);
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
    
    document.getElementById('btn-start-matching').addEventListener('click', async () => {
        if (!loadedModules.matching) {
            loadedModules.matching = await import('./modules/matching.js');
        }
        loadedModules.matching.startMatchingGame(store.getState().words);
    });
};

// ─── Başlat ───────────────────────────────────────────────────────────────────
init();
