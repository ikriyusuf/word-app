import { 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    where, 
    updateDoc, 
    deleteDoc,
    doc, 
    orderBy,
    serverTimestamp,
    increment,
    getDoc,
    setDoc
} from "firebase/firestore";
import { db } from "../config/firebase.js";

const WORDS_COLLECTION = "words";
const STATS_COLLECTION = "user_stats";

export const addWord = async (wordData) => {
    return await addDoc(collection(db, WORDS_COLLECTION), {
        ...wordData,
        createdAt: serverTimestamp(),
        correct: 0,
        wrong: 0,
        easinessFactor: 2.5,
        interval: 0,
        repetitions: 0,
        nextReviewDate: new Date() // Hemen tekrar edilebilir
    });
};

export const fetchUserWords = async (userId) => {
    const q = query(
        collection(db, WORDS_COLLECTION), 
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateWordStats = async (wordId, isCorrect, sm2Data) => {
    const wordRef = doc(db, WORDS_COLLECTION, wordId);
    
    const updatePayload = {
        [isCorrect ? "correct" : "wrong"]: increment(1)
    };

    if (sm2Data) {
        updatePayload.easinessFactor = sm2Data.easinessFactor;
        updatePayload.interval = sm2Data.interval;
        updatePayload.repetitions = sm2Data.repetitions;
        updatePayload.nextReviewDate = sm2Data.nextReviewDate;
    }

    await updateDoc(wordRef, updatePayload);
};

export const updateWord = async (wordId, updateData) => {
    const wordRef = doc(db, WORDS_COLLECTION, wordId);
    await updateDoc(wordRef, updateData);
};

export const deleteWord = async (wordId) => {
    const wordRef = doc(db, WORDS_COLLECTION, wordId);
    await deleteDoc(wordRef);
};

/**
 * Kullanıcı çalışma istatistiklerini getirir (Streak & Hedef)
 * @param {string} userId 
 * @returns {Promise<Object>}
 */
export const fetchUserStats = async (userId) => {
    const docRef = doc(db, STATS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    
    const defaultStats = {
        streak: 0,
        lastActiveDate: "",
        reviewsToday: 0,
        lastReviewDate: "",
        dailyGoal: 10
    };

    if (docSnap.exists()) {
        const data = docSnap.data();
        return { ...defaultStats, ...data };
    } else {
        await setDoc(docRef, defaultStats);
        return defaultStats;
    }
};

/**
 * Yerel tarih string'i döndürür (YYYY-MM-DD formatında).
 * toISOString() UTC kullandığı için Türkiye (GMT+3) gibi timezone'larda
 * gece yarısından sonra yanlış gün dönebilir — bunu düzeltiriz.
 * @returns {string} "YYYY-MM-DD"
 */
const getLocalDateStr = () => {
    const now = new Date();
    const year  = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day   = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Kullanıcı streak ve günlük tekrar hedeflerini günceller
 * @param {string} userId 
 * @param {boolean} isCorrect 
 * @returns {Promise<Object>}
 */
export const updateUserStats = async (userId, isCorrect) => {
    const docRef = doc(db, STATS_COLLECTION, userId);
    const stats = await fetchUserStats(userId);

    const todayStr     = getLocalDateStr();
    const yesterday    = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yy = yesterday.getFullYear();
    const ym = String(yesterday.getMonth() + 1).padStart(2, '0');
    const yd = String(yesterday.getDate()).padStart(2, '0');
    const yesterdayStr = `${yy}-${ym}-${yd}`;

    let newStreak = stats.streak || 0;
    let newReviewsToday = stats.reviewsToday || 0;

    // 1. Streak Hesaplama
    if (stats.lastActiveDate === yesterdayStr) {
        newStreak += 1;
    } else if (stats.lastActiveDate === todayStr) {
        // Bugün zaten aktif olmuş, streak aynı kalır
    } else {
        // Dünü kaçırmış, streak 1'den başlar
        newStreak = 1;
    }

    // 2. Günlük İlerleme (Reviews Today) Hesaplama
    if (stats.lastReviewDate === todayStr) {
        newReviewsToday += 1;
    } else {
        // Bugünün ilk çalışması, sayacı 1 yap
        newReviewsToday = 1;
    }

    // 3. Quiz İstatistikleri
    const totalQuizCorrect = (stats.totalQuizCorrect || 0) + (isCorrect ? 1 : 0);
    const totalQuizWrong   = (stats.totalQuizWrong   || 0) + (isCorrect ? 0 : 1);
    // Yeni oturum sayımı: günün ilk cevabında oturum sayısını artır
    const quizSessionsPlayed = (stats.quizSessionsPlayed || 0) +
        (stats.lastReviewDate !== todayStr ? 1 : 0);

    // 4. Takvim için günlük aktivite sayacı (Eski uyumluluk)
    const dailyActivity = stats.dailyActivity || {};
    dailyActivity[todayStr] = (dailyActivity[todayStr] || 0) + 1;

    // 5. Takvim detay paneli için Daily Log
    const dailyLog = stats.dailyLog || {};
    const todayLog = dailyLog[todayStr] || { quizCount: 0, quizCorrect: 0, matchingGames: 0, matchingScore: 0 };
    todayLog.quizCount += 1;
    if (isCorrect) todayLog.quizCorrect += 1;
    dailyLog[todayStr] = todayLog;

    const updatedStats = {
        streak: newStreak,
        lastActiveDate: todayStr,
        reviewsToday: newReviewsToday,
        lastReviewDate: todayStr,
        dailyGoal: stats.dailyGoal || 10,
        totalQuizCorrect,
        totalQuizWrong,
        quizSessionsPlayed,
        dailyActivity,
        dailyLog
    };

    await updateDoc(docRef, updatedStats);
    return updatedStats;
};

/**
 * Kullanıcının günlük kelime tekrar hedefini veritabanında günceller.
 * @param {string} userId 
 * @param {number} newGoal 
 * @returns {Promise<void>}
 */
export const updateDailyGoal = async (userId, newGoal) => {
    const docRef = doc(db, STATS_COLLECTION, userId);
    await updateDoc(docRef, { dailyGoal: newGoal });
};

/**
 * Kullanıcı Eşleştirme Oyunu skorunu günceller.
 * Yüksek skor kontrolü yapar ve kaydedip güncellenmiş istatistikleri döner.
 * @param {string} userId 
 * @param {number} newScore 
 * @returns {Promise<Object>}
 */
export const updateMatchingScore = async (userId, newScore) => {
    const docRef = doc(db, STATS_COLLECTION, userId);
    const stats = await fetchUserStats(userId);

    const oldHighScore = stats.matchingHighScore || 0;
    const isNewHighScore = newScore > oldHighScore;
    const newHighScore = isNewHighScore ? newScore : oldHighScore;
    const newGamesPlayed = (stats.matchingGamesPlayed || 0) + 1;

    // Daily Log update
    const todayStr = getLocalDateStr();
    const dailyLog = stats.dailyLog || {};
    const todayLog = dailyLog[todayStr] || { quizCount: 0, quizCorrect: 0, matchingGames: 0, matchingScore: 0 };
    todayLog.matchingGames += 1;
    todayLog.matchingScore += newScore; // Accumulate points
    dailyLog[todayStr] = todayLog;

    // Eski heatmap counter'ı da tetikleyelim ki oyun oynayınca kutucuk yeşil olsun
    const dailyActivity = stats.dailyActivity || {};
    dailyActivity[todayStr] = (dailyActivity[todayStr] || 0) + 1;

    const updatedStats = {
        ...stats,
        matchingHighScore: newHighScore,
        matchingGamesPlayed: newGamesPlayed,
        dailyLog,
        dailyActivity
    };

    await updateDoc(docRef, {
        matchingHighScore: newHighScore,
        matchingGamesPlayed: newGamesPlayed,
        dailyLog,
        dailyActivity
    });

    return updatedStats;
};
