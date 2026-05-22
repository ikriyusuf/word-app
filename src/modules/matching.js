import { elements } from './ui.js';
import { store } from '../store/state.js';
import * as dbService from '../services/db.js';

// Oyunun Yerel Durumu (State)
let gameState = {
    score: 0,
    timeLeft: 30,
    timerInterval: null,
    selectedCard: null, // { el, id, type, wordId }
    remainingPairs: 0,
    isProcessing: false, // Eşleşme kontrolü sırasında tıklamaları engellemek için
};

/**
 * Kelime eşleştirme oyununu başlatır.
 * @param {Array} words - Kullanıcının kelime listesi
 */
export const startMatchingGame = (words) => {
    // Önceki zamanlayıcıları temizle
    resetGameIntervals();

    // 1. Kelime Sayısı Kontrolü (< 5 ise uyarı ver)
    if (!words || words.length < 5) {
        renderMinWordsWarning();
        return;
    }

    // 2. Durumu (State) Sıfırla
    gameState.score = 0;
    gameState.timeLeft = 30;
    gameState.selectedCard = null;
    gameState.remainingPairs = 5;
    gameState.isProcessing = false;

    // 3. Rastgele 5 Kelime Seç
    const shuffledWords = [...words].sort(() => Math.random() - 0.5);
    const selectedWords = shuffledWords.slice(0, 5);

    // 4. Kart Verilerini Oluştur (5 EN, 5 TR)
    let cards = [];
    selectedWords.forEach(word => {
        // Türkçe karşılığın çoklu kelime olabilme durumuna karşılık ilk kelimeyi alıp temizliyoruz (daha kompakt durması için)
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

    // 5. Kartları Karıştır (Fisher-Yates)
    cards = shuffleArray(cards);

    // 6. Kartları Grid İçine Çiz
    renderCards(cards);

    // 7. Arayüzü Aktif Oyun Moduna Geçir
    elements.matchingStartScreen.classList.add('hidden');
    elements.matchingResultScreen.classList.add('hidden');
    elements.matchingGamePlay.classList.remove('hidden');

    // 8. Skor ve Zamanlayıcı Göstergesini Güncelle
    updateScoreUI();
    elements.gameTimer.textContent = `${gameState.timeLeft}s`;
    elements.gameTimer.className = 'score-value text-warning';

    // 9. Zamanlayıcıyı Başlat
    startTimer();
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
        }

        if (gameState.timeLeft <= 0) {
            endGame(false);
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
    gameState.score += 10;
    gameState.remainingPairs--;
    updateScoreUI();

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

        // Zafer Koşulu: Tüm kelimeler eşleşti mi?
        if (gameState.remainingPairs === 0) {
            endGame(true);
        }
    }, 600);
};

/**
 * Yanlış eşleşme durumunda yapılacak işlemler.
 */
const handleIncorrectMatch = (el1, el2) => {
    // Puan düşür
    gameState.score = gameState.score - 5;
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
    }, 800);
};

/**
 * Canlı skor göstergesini günceller.
 */
const updateScoreUI = () => {
    elements.gameScore.textContent = gameState.score;
};

/**
 * Oyunu sonlandırır.
 * @param {boolean} isVictory - Oyunu kazanıp kazanmadığı durumu
 */
const endGame = (isVictory) => {
    resetGameIntervals();

    // Oyun arayüzünü gizle, sonuç ekranını aç
    elements.matchingGamePlay.classList.add('hidden');
    elements.matchingResultScreen.classList.remove('hidden');

    // Sonuç değerlerini yaz
    elements.resultScore.textContent = gameState.score;
    elements.resultTime.textContent = `${gameState.timeLeft}s`;

    if (isVictory) {
        elements.resultIcon.className = 'fas fa-trophy text-warning';
        elements.resultTitle.textContent = 'Mükemmel Başarı! 🏆';
        elements.resultMessage.textContent = 'Harika! Tüm kelimeleri süre dolmadan kusursuz bir şekilde eşleştirdin. Kelime hafızan parlıyor!';
    } else {
        elements.resultIcon.className = 'fas fa-hourglass-end text-danger';
        elements.resultTitle.textContent = 'Süre Bitti! ⌛';
        elements.resultMessage.textContent = '30 saniyelik süre doldu! Kelimelerin tamamını eşleştiremedin. Hızlanmak için tekrar dene!';
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
