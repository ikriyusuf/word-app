/**
 * SRS (Spaced Repetition System) öncelik skoru hesaplar.
 * Score ne kadar yüksekse, kelime o kadar önce gösterilir.
 *
 * Kural:
 *  - Hiç görülmemiş kelime → 1000 (en yüksek)
 *  - Düşük accuracy → yüksek skor
 *  - Çok yanlış → ekstra bonus
 *
 * @param {Object} word
 * @returns {number}
 */
const getSRSScore = (word) => {
    const correct = word.correct || 0;
    const wrong   = word.wrong   || 0;
    const total   = correct + wrong;

    // Hiç görülmemiş → en önce göster
    if (total === 0) return 1000;

    const accuracy   = correct / total;       // 0..1 (yüksek = iyi biliyor)
    const wrongBonus = wrong * 0.1;           // Çok yanlış → yukarı taşı

    return (1 - accuracy) + wrongBonus;
};

/**
 * Kelimeleri SRS skoruna göre sıralar (en acil önce).
 * @param {Array} words
 * @returns {Array}
 */
export const getSRSSortedWords = (words) => {
    if (!words || words.length === 0) return [];
    return [...words].sort((a, b) => getSRSScore(b) - getSRSScore(a));
};

/**
 * Her kelimenin öğrenilme yüzdesini döner (0–100).
 * Dashboard'da veya kelime listesinde göstermek için.
 * @param {Object} word
 * @returns {number} 0–100
 */
export const getMasteryPercent = (word) => {
    const correct = word.correct || 0;
    const wrong   = word.wrong   || 0;
    const total   = correct + wrong;
    if (total === 0) return 0;
    return Math.round((correct / total) * 100);
};

/**
 * Kullanıcının yazılı cevabını kontrol eder.
 * @param {string} userInput
 * @param {string} correctMeaning
 * @returns {boolean}
 */
export const checkAnswer = (userInput, correctMeaning) => {
    return userInput.toLowerCase().trim() === correctMeaning.toLowerCase().trim();
};
