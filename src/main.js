import * as authService from './services/auth.js';
import * as dbService   from './services/db.js';
import * as ui          from './modules/ui.js';
import { getSRSSortedWords, checkAnswer, calculateSM2, generateClozeOptions } from './modules/quiz.js';
import { store } from './store/state.js';
import { startMatchingGame, resetGameIntervals } from './modules/matching.js';
import { initVerbsFeature } from './modules/verbs.js';

// Scramble Mode Local State
let scrambleState = {
    targetWord: '',
    scrambledLetters: [], // Array of { char, originalIndex, id, used }
    spelledWord: '',
    spelledIds: [], // Order of letter ids spelled
};

// ─── Init ─────────────────────────────────────────────────────────────────────
const init = () => {
    setupEventListeners();
    observeAuthState();
    initVerbsFeature();

    store.subscribe((state) => {
        if (state.user) {
            ui.renderWords(state.words);
            if (state.stats) ui.renderStats(state.stats);
        }
    });
};

// ─── Auth State ───────────────────────────────────────────────────────────────
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

// ─── Kullanıcı İstatistikleri Yükleme ──────────────────────────────────────────
const loadUserStats = async () => {
    const { user } = store.getState();
    if (!user) return;
    try {
        const stats = await dbService.fetchUserStats(user.uid, user.displayName || "");
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

// ─── TTS ──────────────────────────────────────────────────────────────────────
const speak = (text, btnEl = null) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.85;
    if (btnEl) {
        btnEl.classList.add('playing');
        utterance.onend  = () => btnEl.classList.remove('playing');
        utterance.onerror = () => btnEl.classList.remove('playing');
    }
    window.speechSynthesis.speak(utterance);
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
        try {
            await authService.login(ui.elements.loginEmail.value, ui.elements.loginPass.value);
        } catch (error) {
            alert('Giriş hatası: ' + error.message);
        }
    });

    ui.elements.registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const displayName = capitalizeEachWord(ui.elements.registerDisplayName.value);
        try {
            await authService.register(
                ui.elements.registerEmail.value, 
                ui.elements.registerPass.value,
                displayName
            );
        } catch (error) {
            alert('Kayıt hatası: ' + error.message);
        }
    });

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
    if (ui.elements.registerDisplayName) ui.elements.registerDisplayName.addEventListener('input', autoCapitalizeInput);

    // Navigasyon
    ui.elements.navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = item.dataset.view;
            
            // Oyun zamanlayıcılarını ve durumunu sıfırla
            resetGameIntervals();

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

    // ─── Aşama 1: Bağlam Seçimi Olayları ──────────────────────────────────
    ui.elements.clozeOptionsContainer.addEventListener('click', (e) => {
        const optionBtn = e.target.closest('.option-btn');
        if (!optionBtn) return;
        
        // Zaten cevap verilmişse engelle
        const clickedBefore = ui.elements.clozeOptionsContainer.querySelector('.correct') || ui.elements.clozeOptionsContainer.querySelector('.wrong');
        if (clickedBefore) return;

        handleClozeAnswer(optionBtn.dataset.option, optionBtn);
    });

    // ─── Aşama 2: Harf İnşası Olayları ────────────────────────────────────
    ui.elements.scrambleOptionsContainer.addEventListener('click', (e) => {
        const letterBtn = e.target.closest('.letter-btn');
        if (!letterBtn || letterBtn.disabled) return;
        
        const charId = letterBtn.dataset.id;
        const char = letterBtn.dataset.char;
        
        const letterObj = scrambleState.scrambledLetters.find(l => l.id === charId);
        if (letterObj) {
            letterObj.used = true;
            letterBtn.disabled = true;
            
            scrambleState.spelledWord += char;
            scrambleState.spelledIds.push(charId);
            
            // DOM eklemesi
            const spelledLetterEl = document.createElement('div');
            spelledLetterEl.className = 'scramble-letter';
            spelledLetterEl.dataset.id = charId;
            spelledLetterEl.textContent = char.toUpperCase();
            ui.elements.scrambleSpelledContainer.appendChild(spelledLetterEl);
            
            // Tüm harfler dizildiyse kontrol et
            if (scrambleState.spelledWord.length === scrambleState.targetWord.length) {
                checkScrambleAnswer();
            }
        }
    });

    // Spelled harfe tıklayınca geri al
    ui.elements.scrambleSpelledContainer.addEventListener('click', (e) => {
        const spelledLetterEl = e.target.closest('.scramble-letter');
        if (!spelledLetterEl) return;
        
        const charId = spelledLetterEl.dataset.id;
        removeLetterFromSpelled(charId, spelledLetterEl);
    });

    // Backspace, Clear, Speak butonları
    ui.elements.scrambleBtnBackspace.addEventListener('click', () => {
        if (scrambleState.spelledIds.length === 0) return;
        const lastId = scrambleState.spelledIds[scrambleState.spelledIds.length - 1];
        removeLetterFromSpelled(lastId);
    });

    ui.elements.scrambleBtnClear.addEventListener('click', () => {
        if (scrambleState.spelledIds.length === 0) return;
        const ids = [...scrambleState.spelledIds];
        ids.forEach(id => removeLetterFromSpelled(id));
    });

    ui.elements.scrambleBtnSpeak.addEventListener('click', () => {
        const { quiz } = store.getState();
        if (quiz.currentWord) speak(quiz.currentWord.word, ui.elements.scrambleBtnSpeak);
    });

    // ─── Aşama 3: Aktif Dikte Olayları ────────────────────────────────────
    ui.elements.dictationAudioBtn.addEventListener('click', () => {
        const { quiz } = store.getState();
        if (quiz.currentWord) {
            speak(quiz.currentWord.word, ui.elements.dictationAudioBtn);
            // 1 saniye sonra örnek cümleyi telaffuz et
            setTimeout(() => {
                speak(quiz.currentWord.exampleSentence);
            }, 1000);
        }
    });

    ui.elements.dictationSubmit.addEventListener('click', handleDictationAnswer);
    ui.elements.dictationAnswer.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleDictationAnswer();
    });

    // ─── Klavye Kısayolları (Harf İnşası için Hızlı Yazım) ──────────────────
    window.addEventListener('keydown', (e) => {
        // Sadece Quiz ekranı aktifse ve input'larda değilsek çalışsın
        if (ui.elements.quizSection.classList.contains('hidden')) return;
        
        const { quiz } = store.getState();
        if (quiz.mode === 'scramble') {
            if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
            
            const key = e.key.toLowerCase();
            
            if (key === 'backspace') {
                e.preventDefault();
                ui.elements.scrambleBtnBackspace.click();
            } else if (key === 'delete') {
                e.preventDefault();
                ui.elements.scrambleBtnClear.click();
            } else if (key === ' ' || key === 'spacebar') {
                e.preventDefault();
                ui.elements.scrambleBtnSpeak.click();
            } else if (key.length === 1 && key.match(/[a-z0-9]/)) {
                // Eşleşen ve kullanılmamış ilk harf butonunu bulup tetikle
                const unusedBtns = Array.from(ui.elements.scrambleOptionsContainer.querySelectorAll('.letter-btn:not(:disabled)'));
                const matchBtn = unusedBtns.find(btn => btn.dataset.char.toLowerCase() === key);
                if (matchBtn) {
                    e.preventDefault();
                    matchBtn.click();
                }
            }
        }
    });

    // Profile Name Form
    if (ui.elements.profileNameForm) {
        ui.elements.profileNameForm.addEventListener('submit', handleUpdateDisplayName);
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

// ─── Quiz Session ─────────────────────────────────────────────────────────────
const startQuizSession = () => {
    const { words, quiz } = store.getState();
    if (words.length === 0) {
        alert('Önce kelime eklemelisin!');
        ui.showView('dashboard');
        return;
    }

    // SRS sıralaması: en acil öğrenilmesi gerekenler başa
    const sessionWords = getSRSSortedWords(words);

    store.setState({
        quiz: { ...quiz, sessionWords, index: 0, currentWord: null, cardRevealed: false }
    });

    // Aktif mod için UI'yi ayarla
    ui.setQuizMode(quiz.mode);
    nextQuestion();
};

const nextQuestion = () => {
    const { quiz, words } = store.getState();
    if (quiz.index >= quiz.sessionWords.length) {
        alert('🎉 Harika! Tüm kelimeleri tamamladın.');
        ui.showView('dashboard');
        return;
    }

    const currentWord = quiz.sessionWords[quiz.index];
    store.setState({ quiz: { ...quiz, currentWord, cardRevealed: false } });

    if (quiz.mode === 'cloze') {
        const options = generateClozeOptions(currentWord, words);
        ui.updateClozeUI(currentWord, quiz.index, quiz.sessionWords.length, options);
        // Yaz veya Dinle modunda kelimeyi sesli oku
        setTimeout(() => speak(currentWord.word), 400);
    } else if (quiz.mode === 'scramble') {
        startScrambleGame(currentWord);
    } else if (quiz.mode === 'dictation') {
        ui.updateDictationUI(currentWord, quiz.index, quiz.sessionWords.length);
        setTimeout(() => speak(currentWord.word), 400);
    }
};

// ─── Scramble Helper Metotları ───────────────────────────────────────────────
const startScrambleGame = (wordObj) => {
    const word = wordObj.word.trim();
    scrambleState.targetWord = word;
    scrambleState.spelledWord = '';
    scrambleState.spelledIds = [];
    
    // Kelimeyi karakter dizisine çevir
    const letters = word.toLowerCase().split('').map((char, index) => ({
        char,
        originalIndex: index,
        id: `scramble-char-${index}-${Math.random().toString(36).substr(2, 4)}`,
        used: false
    }));
    
    // Harfleri karıştır
    const scrambled = [...letters].sort(() => Math.random() - 0.5);
    scrambleState.scrambledLetters = scrambled;
    
    const { quiz } = store.getState();
    ui.updateScrambleUI(wordObj, quiz.index, quiz.sessionWords.length, scrambled);
};

const removeLetterFromSpelled = (charId, spelledLetterEl) => {
    const index = scrambleState.spelledIds.indexOf(charId);
    if (index > -1) {
        scrambleState.spelledIds.splice(index, 1);
        
        scrambleState.spelledWord = scrambleState.spelledIds.map(id => {
            const lObj = scrambleState.scrambledLetters.find(l => l.id === id);
            return lObj ? lObj.char : '';
        }).join('');
        
        if (spelledLetterEl) {
            spelledLetterEl.remove();
        } else {
            const el = ui.elements.scrambleSpelledContainer.querySelector(`[data-id="${charId}"]`);
            if (el) el.remove();
        }
        
        const optionBtn = ui.elements.scrambleOptionsContainer.querySelector(`[data-id="${charId}"]`);
        if (optionBtn) optionBtn.disabled = false;
        
        const letterObj = scrambleState.scrambledLetters.find(l => l.id === charId);
        if (letterObj) letterObj.used = false;
    }
};

// ─── Handlers ─────────────────────────────────────────────────────────────────

/** Bağlam Seçimi cevap kontrolü */
const handleClozeAnswer = async (selectedOption, optionBtn) => {
    const { quiz } = store.getState();
    if (!quiz.currentWord) return;
    
    const correctAnswer = quiz.currentWord.word;
    const isCorrect = selectedOption.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
    
    // Şıkların durumlarını renklendir
    const allOptionBtns = ui.elements.clozeOptionsContainer.querySelectorAll('.option-btn');
    allOptionBtns.forEach(btn => {
        btn.style.pointerEvents = 'none'; // Çift tıklamayı engelle
        if (btn.dataset.option.toLowerCase().trim() === correctAnswer.toLowerCase().trim()) {
            btn.classList.add('correct');
        } else if (btn === optionBtn && !isCorrect) {
            btn.classList.add('wrong');
        }
    });
    
    ui.showQuizFeedback(isCorrect, correctAnswer, 'cloze');
    
    await submitQuizResponse(isCorrect);
};

/** Harf İnşası cevap kontrolü */
const checkScrambleAnswer = async () => {
    const { quiz } = store.getState();
    if (!quiz.currentWord) return;
    
    const isCorrect = scrambleState.spelledWord.toLowerCase().trim() === scrambleState.targetWord.toLowerCase().trim();
    
    // Elemanları kilitle ve renklendir
    const letterBtns = ui.elements.scrambleOptionsContainer.querySelectorAll('.letter-btn');
    letterBtns.forEach(btn => btn.style.pointerEvents = 'none');
    
    const spelledLetterEls = ui.elements.scrambleSpelledContainer.querySelectorAll('.scramble-letter');
    spelledLetterEls.forEach(el => {
        el.style.pointerEvents = 'none';
        if (isCorrect) {
            el.style.background = 'var(--success)';
        } else {
            el.style.background = 'var(--danger)';
        }
    });
    
    ui.showQuizFeedback(isCorrect, scrambleState.targetWord, 'scramble');
    
    await submitQuizResponse(isCorrect);
};

/** Aktif Dikte cevap kontrolü */
const handleDictationAnswer = async () => {
    const { quiz } = store.getState();
    if (!quiz.currentWord) return;
    
    const userInput = ui.elements.dictationAnswer.value;
    const isCorrect = checkAnswer(userInput, quiz.currentWord.word, quiz.currentWord.meaning);
    
    ui.showQuizFeedback(isCorrect, quiz.currentWord.word, 'dictation');
    
    await submitQuizResponse(isCorrect);
};

/** Veri Tabanı & İlerleme Kayıt Tetikleyicisi */
const submitQuizResponse = async (isCorrect) => {
    const { quiz, words, user } = store.getState();
    if (!quiz.currentWord) return;
    
    const sm2Data = calculateSM2(quiz.currentWord, isCorrect);
    
    try {
        // SM-2 veritabanı kaydı
        await dbService.updateWordStats(quiz.currentWord.id, isCorrect, sm2Data);
        
        // Streak ve Hedef güncellemesi
        const updatedStats = await dbService.updateUserStats(user.uid, isCorrect);
        const updatedWords = updateLocalWordStats(words, quiz.currentWord.id, isCorrect, sm2Data);
        
        store.setState({
            words: updatedWords,
            stats: updatedStats,
            quiz: { ...quiz, index: quiz.index + 1 }
        });
        
        setTimeout(() => {
            if (!ui.elements.quizSection.classList.contains('hidden')) {
                nextQuestion();
            }
        }, 1500);
    } catch (error) {
        console.error('Veri tabanı kaydı hatası:', error);
    }
};

const handleEditOpen = (wordId) => {
    const word = store.getState().words.find(w => w.id === wordId);
    if (word) ui.openEditModal(word);
};

const capitalizeFirstLetter = (str) => {
    if (!str) return '';
    const trimmed = str.trim();
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
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
    } catch (error) {
        alert('Hata: ' + error.message);
    }
};

const handleUpdateDailyGoal = async (e) => {
    e.preventDefault();
    const { user } = store.getState();
    if (!user) return;
    
    const newGoal = parseInt(ui.elements.profileGoalInput.value);
    if (isNaN(newGoal) || newGoal < 1) {
        alert('Lütfen geçerli bir hedef belirleyin (en az 1).');
        return;
    }
    
    try {
        await dbService.updateDailyGoal(user.uid, newGoal);
        alert('Günlük hedefiniz başarıyla güncellendi! 🎉');
        await loadUserStats();
    } catch (error) {
        console.error('Hedef güncellenirken hata:', error);
        alert('Hedef güncellenirken bir hata oluştu: ' + error.message);
    }
};

const handleUpdateDisplayName = async (e) => {
    e.preventDefault();
    const { user } = store.getState();
    if (!user) return;
    
    const rawName = ui.elements.profileDisplayNameInput.value;
    const cleanName = capitalizeEachWord(rawName);
    
    try {
        await dbService.updateDisplayName(user.uid, cleanName);
        alert('Profil bilgileriniz başarıyla güncellendi! 🎉');
        await loadUserStats();
    } catch (error) {
        console.error('Profil güncellenirken hata:', error);
        alert('Profil güncellenirken bir hata oluştu: ' + error.message);
    }
};

const capitalizeEachWord = (str) => {
    if (!str) return '';
    return str.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

const handleDeleteWord = async (wordId) => {
    if (!confirm('Emin misin?')) return;
    try {
        await dbService.deleteWord(wordId);
        await loadWords();
    } catch (error) {
        alert('Hata: ' + error.message);
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
    } catch (error) {
        alert('Hata: ' + error.message);
    }
};

// ─── Yardımcı ─────────────────────────────────────────────────────────────────
/** Firestore isteği bitmeden önce local state'i günceller (anında yansıma). */
const updateLocalWordStats = (words, wordId, isCorrect, sm2Data) => {
    return words.map(w =>
        w.id === wordId
            ? { 
                ...w, 
                [isCorrect ? 'correct' : 'wrong']: (w[isCorrect ? 'correct' : 'wrong'] || 0) + 1,
                ...sm2Data
              }
            : w
    );
};

/**
 * Eşleştirme oyunu başlangıç ekranını sıfırlar ve buton bağlantısını atar.
 */
const resetMatchingViewToStart = () => {
    const { words } = store.getState();
    
    // Kelime sayısı < 5 ise o uyarının render edilmesini sağlamak için startMatchingGame çağırıyoruz
    if (words.length < 5) {
        startMatchingGame(words);
        return;
    }
    
    ui.elements.matchingGamePlay.classList.add('hidden');
    ui.elements.matchingResultScreen.classList.add('hidden');
    ui.elements.matchingStartScreen.classList.remove('hidden');
    
    // Başlangıç ekranı içeriğini sıfırla (kelime ekleme uyarısının üstüne düzgün arayüzü çiz)
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
    
    // Buton dinleyicisini yeniden bağla
    document.getElementById('btn-start-matching').addEventListener('click', () => {
        startMatchingGame(store.getState().words);
    });
};

// ─── Başlat ───────────────────────────────────────────────────────────────────
init();
