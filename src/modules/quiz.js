/**
 * Kelimeler arasından ağırlıklı rastgele seçim yapar.
 * Yanlış sayısı fazla olan kelimelerin seçilme olasılığı daha yüksektir.
 * @param {Array} words - Kelime listesi
 * @returns {Object} Seçilen kelime
 */
export const getWeightedRandomWord = (words) => {
    if (!words || words.length === 0) return null;

    const weightedList = [];
    words.forEach(word => {
        // Ağırlık hesabı: 1 (taban) + yanlış sayısı
        const weight = 1 + (word.wrong || 0);
        for (let i = 0; i < weight; i++) {
            weightedList.push(word);
        }
    });

    const randomIndex = Math.floor(Math.random() * weightedList.length);
    return weightedList[randomIndex];
};

/**
 * Kullanıcının cevabını kontrol eder.
 * @param {string} userInput - Kullanıcı girdisi
 * @param {string} correctMeaning - Doğru anlam
 * @returns {boolean}
 */
export const checkAnswer = (userInput, correctMeaning) => {
    return userInput.toLowerCase().trim() === correctMeaning.toLowerCase().trim();
};
