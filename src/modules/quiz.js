/**
 * Calculates SM-2 Spaced Repetition parameters for a word review.
 * @param {Object} word - The current word object.
 * @param {boolean} isCorrect - Whether the user answered correctly.
 * @returns {Object} Updated word parameters { easinessFactor, interval, repetitions, nextReviewDate }
 */
export const calculateSM2 = (word, isCorrect) => {
    // Fallbacks
    let ef = word.easinessFactor !== undefined ? word.easinessFactor : 2.5;
    let interval = word.interval !== undefined ? word.interval : 0;
    let repetitions = word.repetitions !== undefined ? word.repetitions : 0;

    // Map binary isCorrect to SM-2 quality q (0-5)
    // 5: perfect response, 1: incorrect response
    const q = isCorrect ? 5 : 1;

    if (isCorrect) {
        if (repetitions === 0) {
            interval = 1;
        } else if (repetitions === 1) {
            interval = 6;
        } else {
            interval = Math.round(interval * ef);
        }
        repetitions += 1;
    } else {
        repetitions = 0;
        interval = 1;
    }

    // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    ef = ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    if (ef < 1.3) ef = 1.3;

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    return {
        easinessFactor: ef,
        interval: interval,
        repetitions: repetitions,
        nextReviewDate: nextReviewDate
    };
};

/**
 * Kelimeleri SM-2 vadesine (nextReviewDate) göre sıralar.
 * Vadesi gelenler veya geçmiş olanlar en önce gelir.
 * @param {Array} words
 * @returns {Array}
 */
export const getSRSSortedWords = (words) => {
    if (!words || words.length === 0) return [];
    
    const now = new Date();
    
    return [...words].sort((a, b) => {
        const getReviewDate = (w) => {
            if (!w.nextReviewDate) return new Date(0); // Vadesi geçmiş sayılır
            if (w.nextReviewDate.toDate) return w.nextReviewDate.toDate(); // Firestore Timestamp dönüşümü
            return new Date(w.nextReviewDate);
        };

        const dateA = getReviewDate(a);
        const dateB = getReviewDate(b);

        const isDueA = dateA <= now;
        const isDueB = dateB <= now;

        // Vadesi gelen kart önceliklidir
        if (isDueA && !isDueB) return -1;
        if (!isDueA && isDueB) return 1;

        // İkisi de vadeliyse veya vadeli değilse, review tarihi en eski olan (en acil olan) öne gelir
        return dateA - dateB;
    });
};

/**
 * Her kelimenin öğrenilme yüzdesini döner (0–100).
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
 * Kullanıcının cevabını kontrol eder.
 * @param {string} userInput
 * @param {string} correctVal
 * @returns {boolean}
 */
export const checkAnswer = (userInput, correctVal) => {
    return userInput.toLowerCase().trim() === correctVal.toLowerCase().trim();
};
