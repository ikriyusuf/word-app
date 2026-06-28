import { elements } from './ui.js';
import { store } from '../store/state.js';
import * as dbService from '../services/db.js';
import {
    GAME_DURATION_SEC,
    MIN_WORDS_FOR_GAME,
    MATCH_CORRECT_SCORE,
    MATCH_WRONG_SCORE,
    MATCH_CORRECT_DELAY_MS,
    MATCH_WRONG_DELAY_MS,
} from '../config/constants.js';

// Oyunun Yerel Durumu (State)
let gameState = {
    score: 0,
    timeLeft: GAME_DURATION_SEC,
    timerInterval: null,
    selectedCard: null, // { el, id, type, wordId }
    remainingPairs: 0,
    isProcessing: false, // Eşleşme kontrolü sırasında tıklamaları engellemek için
    round: 1,
    combo: 0,
    wordsPool: []
};

/**
 * Kombo çarpanını hesaplar.
 */
const getComboMultiplier = (combo) => {
    if (combo >= 8) return 2.5;
    if (combo >= 5) return 2.0;
    if (combo >= 3) return 1.5;
    return 1.0;
};

/**
 * Kelime eşleştirme oyununu başlatır.
 * @param {Array} words - Kullanıcının kelime listesi
 */
export const startMatchingGame = (words) => {
    // Önceki zamanlayıcıları temizle
    resetGameIntervals();

    // 1. Kelime Sayısı Kontrolü (< 5 ise uyarı ver)
    if (!words || words.length < MIN_WORDS_FOR_GAME) {
        renderMinWordsWarning();
        return;
    }

    // 2. Durumu (State) Sıfırla
    gameState.score = 0;
    gameState.timeLeft = GAME_DURATION_SEC;
    gameState.selectedCard = null;
    gameState.isProcessing = false;
    gameState.round = 1;
    gameState.combo = 0;
    gameState.wordsPool = words;

    // 3. Arayüzü Aktif Oyun Moduna Geçir
    elements.matchingStartScreen.classList.add('hidden');
    elements.matchingResultScreen.classList.add('hidden');
    elements.matchingGamePlay.classList.remove('hidden');

    // 4. İlk Turu Başlat
    startRound();

    // 5. Skor ve Zamanlayıcı Göstergesini Güncelle
    updateScoreUI();
    elements.gameTimer.textContent = `${gameState.timeLeft}s`;
    elements.gameTimer.className = 'score-value text-warning';

    // 6. Zamanlayıcıyı Başlat
    startTimer();
};

/**
 * Yeni tur kartlarını hazırlar ve çizer.
 */
const startRound = () => {
    gameState.remainingPairs = 5;
    gameState.selectedCard = null;
    gameState.isProcessing = false;

    // 1. Rastgele 5 Kelime Seç
    const shuffledWords = [...gameState.wordsPool].sort(() => Math.random() - 0.5);
    const selectedWords = shuffledWords.slice(0, 5);

    // 2. Kart Verilerini Oluştur (5 EN, 5 TR)
    let cards = [];
    selectedWords.forEach(word => {
        const trDisplay = word.meaning.split(',')[0].trim();
        
        cards.push({
            id: `en-${word.id}`,
            wordId: word.id,
            type: 'en',
            value: word.word
        });
        
        cards.push({
            id: `tr-${word.id}`,
            wordId: word.id,
            type: 'tr',
            value: trDisplay
        });
    });

    // 3. Kartları Karıştır (Fisher-Yates)
    cards = shuffleArray(cards);

    // 4. Kartları Grid İçine Çiz
    renderCards(cards);

    // 5. Tur ve Kombo Arayüzünü Güncelle
    if (elements.gameRound) {
        elements.gameRound.textContent = gameState.round;
    }
    updateComboUI();
};

/**
 * Kombo sayacı arayüzünü günceller.
 */
const updateComboUI = () => {
    if (elements.gameCombo) {
        if (gameState.combo > 0) {
            elements.gameCombo.textContent = `x${gameState.combo}`;
            elements.gameCombo.classList.add('pulse-active');
            setTimeout(() => elements.gameCombo?.classList.remove('pulse-active'), 300);
        } else {
            elements.gameCombo.textContent = 'x1';
        }
    }
};

/**
 * Zamanlayıcıyı başlatır.
 */
const startTimer = () => {
    gameState.timerInterval = setInterval(() => {
        gameState.timeLeft--;
        elements.gameTimer.textContent = `${gameState.timeLeft}s`;

        // Son 10 saniye kalınca timer'ı kırmızı ve belirgin yap
        if (gameState.timeLeft <= 10) {
            elements.gameTimer.className = 'score-value text-danger';
        } else {
            elements.gameTimer.className = 'score-value text-warning';
        }

        if (gameState.timeLeft <= 0) {
            endGame();
        }
    }, 1000);
};

/**
 * Kartları karıştırmak için Fisher-Yates algoritması.
 */
const shuffleArray = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

/**
 * Kartları DOM'a çizer.
 */
const renderCards = (cards) => {
    elements.gameGrid.innerHTML = '';
    
    cards.forEach(card => {
        const cardEl = document.createElement('div');
        cardEl.className = 'matching-card';
        cardEl.dataset.id = card.id;
        cardEl.dataset.wordId = card.wordId;
        cardEl.dataset.type = card.type;
        cardEl.textContent = card.value;

        // Tıklama Olayı Dinleyicisi
        cardEl.addEventListener('click', () => handleCardSelection(cardEl, card));
        
        elements.gameGrid.appendChild(cardEl);
    });
};

/**
 * Kart seçim mantığı (State Machine).
 */
const handleCardSelection = (cardEl, cardData) => {
    // Animasyonlar oynatılırken veya zaten eşleşmiş kartlara tıklanırsa engelle
    if (gameState.isProcessing || cardEl.classList.contains('correct') || cardEl.classList.contains('matched-hidden')) return;

    // 1. Zaten seçilmiş bir karta tıklandıysa seçimi kaldır
    if (cardEl.classList.contains('selected')) {
        cardEl.classList.remove('selected');
        gameState.selectedCard = null;
        return;
    }

    // 2. Seçim yoksa ilk kartı seç
    if (!gameState.selectedCard) {
        cardEl.classList.add('selected');
        gameState.selectedCard = {
            el: cardEl,
            ...cardData
        };
        return;
    }

    // 3. İkinci kart seçildiyse eşleşmeyi değerlendir
    const firstCard = gameState.selectedCard;

    // Aynı türden iki kart seçildiyse (örn: iki İngilizce veya iki Türkçe) son seçileni aktif yap
    if (firstCard.type === cardData.type) {
        firstCard.el.classList.remove('selected');
        cardEl.classList.add('selected');
        gameState.selectedCard = {
            el: cardEl,
            ...cardData
        };
        return;
    }

    // Farklı türler seçildi! Seçimi görselleştir
    cardEl.classList.add('selected');
    gameState.isProcessing = true;

    // Eşleşme Kontrolü
    if (firstCard.wordId === cardData.wordId) {
        // DOĞRU EŞLEŞME
        handleCorrectMatch(firstCard.el, cardEl);
    } else {
        // YANLIŞ EŞLEŞME
        handleIncorrectMatch(firstCard.el, cardEl);
    }
};

/**
 * Doğru eşleşme durumunda yapılacak işlemler.
 */
const handleCorrectMatch = (el1, el2) => {
    gameState.combo++;
    const multiplier = getComboMultiplier(gameState.combo);
    const pointsEarned = Math.round(MATCH_CORRECT_SCORE * multiplier);
    gameState.score += pointsEarned;
    gameState.remainingPairs--;

    // Süre bonusu (+1 saniye, maksimum 30 saniye sınırını aşmaz)
    gameState.timeLeft = Math.min(GAME_DURATION_SEC, gameState.timeLeft + 1);
    elements.gameTimer.textContent = `${gameState.timeLeft}s`;

    updateScoreUI();
    updateComboUI();

    // Kartları doğru olarak işaretle (yeşil parıltı)
    el1.classList.remove('selected');
    el2.classList.remove('selected');
    el1.classList.add('correct');
    el2.classList.add('correct');

    // 600ms sonra pürüzsüzce küçült ve gizle
    setTimeout(() => {
        el1.classList.add('matched-hidden');
        el2.classList.add('matched-hidden');
        gameState.isProcessing = false;
        gameState.selectedCard = null;

        // Tur Koşulu: Turdaki tüm çiftler eşleşti mi?
        if (gameState.remainingPairs === 0) {
            gameState.round++;
            gameState.isProcessing = true; // Transition süresince tıklamaları kilitle

            // Grid'i karartıp yeni tura geçiş yap
            elements.gameGrid.style.opacity = '0.3';
            setTimeout(() => {
                elements.gameGrid.style.opacity = '1';
                startRound();
            }, 400);
        }
    }, MATCH_CORRECT_DELAY_MS);
};

/**
 * Yanlış eşleşme durumunda yapılacak işlemler.
 */
const handleIncorrectMatch = (el1, el2) => {
    // Kombo sıfırlanır
    gameState.combo = 0;
    updateComboUI();

    // Puan düşür
    gameState.score = Math.max(0, gameState.score - MATCH_WRONG_SCORE);
    updateScoreUI();

    // Hatalı kartları işaretle (kırmızı parıltı ve sallanma)
    el1.classList.remove('selected');
    el2.classList.remove('selected');
    el1.classList.add('wrong');
    el2.classList.add('wrong');

    // 800ms sonra kırmızı parıltıyı kaldır ve seçimi sıfırla
    setTimeout(() => {
        el1.classList.remove('wrong');
        el2.classList.remove('wrong');
        gameState.isProcessing = false;
        gameState.selectedCard = null;
    }, MATCH_WRONG_DELAY_MS);
};

/**
 * Canlı skor göstergesini günceller.
 */
const updateScoreUI = () => {
    elements.gameScore.textContent = gameState.score;
};

/**
 * Oyunu sonlandırır.
 */
const endGame = () => {
    resetGameIntervals();

    // Oyun arayüzünü gizle, sonuç ekranını aç
    elements.matchingGamePlay.classList.add('hidden');
    elements.matchingResultScreen.classList.remove('hidden');

    // Sonuç değerlerini yaz
    elements.resultScore.textContent = gameState.score;
    elements.resultTime.textContent = `Tur ${gameState.round}`;

    if (gameState.score > 0) {
        elements.resultIcon.className = 'fas fa-trophy text-warning';
        elements.resultTitle.textContent = 'Mücadele Tamamlandı! 🏆';
        elements.resultMessage.textContent = `Harika! Süre dolana kadar toplam ${gameState.score} puan topladın ve ${gameState.round}. tura ulaştın! Kelime hafızan parlıyor!`;
    } else {
        elements.resultIcon.className = 'fas fa-hourglass-end text-danger';
        elements.resultTitle.textContent = 'Süre Bitti! ⌛';
        elements.resultMessage.textContent = '30 saniyelik süre doldu! Daha hızlı hareket ederek kelimeleri eşleştirmeyi dene.';
    }

    // Veritabanı ve Yerel State Güncellemesi
    const { user } = store.getState();
    if (user) {
        dbService.updateMatchingScore(user.uid, gameState.score)
            .then(updatedStats => {
                store.setState({ stats: updatedStats });
            })
            .catch(error => {
                console.error('Eşleştirme skoru güncellenirken hata oluştu:', error);
            });
    }
};

/**
 * Zamanlayıcıları sıfırlar.
 */
export const resetGameIntervals = () => {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
};

/**
 * Kelime sayısı yetersiz olduğunda çıkacak uyarı ekranı (Empty State).
 */
const renderMinWordsWarning = () => {
    elements.matchingGamePlay.classList.add('hidden');
    elements.matchingResultScreen.classList.add('hidden');
    elements.matchingStartScreen.classList.remove('hidden');

    elements.matchingStartScreen.innerHTML = `
        <div class="game-intro-icon" style="color: var(--danger); background: var(--danger-bg); border-color: rgba(239, 68, 68, 0.15);">
            <i class="fas fa-exclamation-triangle"></i>
        </div>
        <h2>Yetersiz Kelime Haznesi</h2>
        <p class="game-description" style="max-width: 360px;">
            Eşleştirme oyunu oynayabilmek için kütüphanende en az <strong>5 kelime</strong> bulunmalıdır. 
            Şu anda yeterince kelimen yok.
        </p>
        <button onclick="document.querySelector('[data-view=dashboard]').click()" class="btn-primary" style="max-width: 220px;">
            <i class="fas fa-plus" style="margin-right: 6px;"></i> Kelime Ekle
        </button>
    `;
};
