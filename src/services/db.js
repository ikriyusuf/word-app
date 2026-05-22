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
        return { ...defaultStats, ...docSnap.data() };
    } else {
        await setDoc(docRef, defaultStats);
        return defaultStats;
    }
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

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0]; // "YYYY-MM-DD"
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

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

    const updatedStats = {
        streak: newStreak,
        lastActiveDate: todayStr,
        reviewsToday: newReviewsToday,
        lastReviewDate: todayStr,
        dailyGoal: stats.dailyGoal || 10
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
