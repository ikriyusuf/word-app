/**
 * Firestore Database Service
 *
 * Encapsulates all Firestore read/write operations.
 * Business logic (streak calculation, stat aggregation) lives here at the DB
 * boundary — a deliberate trade-off to avoid extra round-trips for atomic updates.
 *
 * Lazy Loading: This file is statically imported because it is always needed
 * after login. Heavy game-specific modules are dynamically imported elsewhere.
 *
 * Pagination: fetchUserWords() now uses a limit to avoid fetching all documents
 * in a single request. Use fetchMoreWords() to load subsequent pages.
 */

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
    setDoc,
    limit,
    startAfter,
} from 'firebase/firestore';
import { db } from '../config/firebase.js';
import {
    COLLECTION_WORDS,
    COLLECTION_STATS,
    FIRESTORE_WORDS_LIMIT,
} from '../config/constants.js';

// ─── Date Helpers (DRY — used by multiple stat functions) ─────────────────────

/**
 * Returns today's date string in YYYY-MM-DD (local time, not UTC).
 * toISOString() uses UTC which can be off by one day in GMT+3 timezones.
 *
 * @returns {string} "YYYY-MM-DD"
 */
export const getLocalDateStr = () => {
    const now = new Date();
    const year  = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day   = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Returns yesterday's date string in YYYY-MM-DD (local time).
 *
 * @returns {string} "YYYY-MM-DD"
 */
const getYesterdayDateStr = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const y = yesterday.getFullYear();
    const m = String(yesterday.getMonth() + 1).padStart(2, '0');
    const d = String(yesterday.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

// ─── Word CRUD ────────────────────────────────────────────────────────────────

/**
 * Adds a new word to the user's collection.
 *
 * @param {Object} wordData - { userId, word, meaning, exampleSentence }
 * @returns {Promise<DocumentReference>}
 */
export const addWord = async (wordData) => {
    return await addDoc(collection(db, COLLECTION_WORDS), {
        ...wordData,
        createdAt:      serverTimestamp(),
        correct:        0,
        wrong:          0,
        easinessFactor: 2.5,
        interval:       0,
        repetitions:    0,
        nextReviewDate: new Date(), // Immediately available for review
    });
};

/**
 * Fetches the user's words with pagination.
 * Returns up to FIRESTORE_WORDS_LIMIT documents per call.
 *
 * @param {string} userId
 * @param {DocumentSnapshot|null} lastVisible - Cursor for the next page (null for first page).
 * @returns {Promise<{ words: Array, lastVisible: DocumentSnapshot|null, hasMore: boolean }>}
 */
export const fetchUserWords = async (userId, lastVisible = null) => {
    const baseQuery = [
        collection(db, COLLECTION_WORDS),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(FIRESTORE_WORDS_LIMIT),
    ];

    const q = lastVisible
        ? query(...baseQuery, startAfter(lastVisible))
        : query(...baseQuery);

    const querySnapshot = await getDocs(q);
    const docs = querySnapshot.docs;
    const words = docs.map(d => ({ id: d.id, ...d.data() }));

    return {
        words,
        lastVisible:  docs.length > 0 ? docs[docs.length - 1] : null,
        hasMore:      docs.length === FIRESTORE_WORDS_LIMIT,
    };
};

/**
 * Updates SM-2 spaced repetition data and correct/wrong counters for a word.
 *
 * @param {string} wordId
 * @param {boolean} isCorrect
 * @param {Object|null} sm2Data - { easinessFactor, interval, repetitions, nextReviewDate }
 * @returns {Promise<void>}
 */
export const updateWordStats = async (wordId, isCorrect, sm2Data) => {
    const wordRef = doc(db, COLLECTION_WORDS, wordId);

    const updatePayload = {
        [isCorrect ? 'correct' : 'wrong']: increment(1),
    };

    if (sm2Data) {
        updatePayload.easinessFactor = sm2Data.easinessFactor;
        updatePayload.interval       = sm2Data.interval;
        updatePayload.repetitions    = sm2Data.repetitions;
        updatePayload.nextReviewDate = sm2Data.nextReviewDate;
    }

    await updateDoc(wordRef, updatePayload);
};

/**
 * Updates the editable fields of an existing word.
 *
 * @param {string} wordId
 * @param {{ word: string, meaning: string, exampleSentence: string }} updateData
 * @returns {Promise<void>}
 */
export const updateWord = async (wordId, updateData) => {
    const wordRef = doc(db, COLLECTION_WORDS, wordId);
    await updateDoc(wordRef, updateData);
};

/**
 * Deletes a word document by its ID.
 *
 * @param {string} wordId
 * @returns {Promise<void>}
 */
export const deleteWord = async (wordId) => {
    const wordRef = doc(db, COLLECTION_WORDS, wordId);
    await deleteDoc(wordRef);
};

// ─── User Stats ───────────────────────────────────────────────────────────────

/**
 * Fetches (or initializes) a user's stats document from Firestore.
 *
 * @param {string} userId
 * @returns {Promise<Object>} The stats object with defaults applied.
 */
export const fetchUserStats = async (userId) => {
    const docRef  = doc(db, COLLECTION_STATS, userId);
    const docSnap = await getDoc(docRef);

    const defaultStats = {
        streak:         0,
        lastActiveDate: '',
        reviewsToday:   0,
        lastReviewDate: '',
        dailyGoal:      10,
    };

    if (docSnap.exists()) {
        return { ...defaultStats, ...docSnap.data() };
    }

    // Initialize the document for new users
    await setDoc(docRef, defaultStats);
    return defaultStats;
};

/**
 * Updates streak and daily review stats after a quiz answer.
 *
 * @param {string} userId
 * @param {boolean} isCorrect
 * @returns {Promise<Object>} The updated stats object.
 */
export const updateUserStats = async (userId, isCorrect) => {
    const docRef  = doc(db, COLLECTION_STATS, userId);
    const stats   = await fetchUserStats(userId);

    const todayStr     = getLocalDateStr();
    const yesterdayStr = getYesterdayDateStr();

    // ── Streak Calculation ─────────────────────────────────────────────────
    let newStreak = stats.streak || 0;
    if (stats.lastActiveDate === yesterdayStr) {
        newStreak += 1;                 // Consecutive day — extend streak
    } else if (stats.lastActiveDate !== todayStr) {
        newStreak = 1;                  // Missed a day — reset to 1
    }
    // If lastActiveDate === todayStr, streak stays unchanged

    // ── Daily Review Count ─────────────────────────────────────────────────
    let newReviewsToday = stats.reviewsToday || 0;
    if (stats.lastReviewDate === todayStr) {
        newReviewsToday += 1;
    } else {
        newReviewsToday = 1; // First review of the day
    }

    // ── Quiz Stats ─────────────────────────────────────────────────────────
    const totalQuizCorrect = (stats.totalQuizCorrect || 0) + (isCorrect ? 1 : 0);
    const totalQuizWrong   = (stats.totalQuizWrong   || 0) + (isCorrect ? 0 : 1);
    const quizSessionsPlayed = (stats.quizSessionsPlayed || 0) +
        (stats.lastReviewDate !== todayStr ? 1 : 0);

    // ── Calendar Activity (heatmap) ────────────────────────────────────────
    const dailyActivity = stats.dailyActivity || {};
    dailyActivity[todayStr] = (dailyActivity[todayStr] || 0) + 1;

    // ── Daily Log (detail panel) ───────────────────────────────────────────
    const dailyLog  = stats.dailyLog || {};
    const todayLog  = dailyLog[todayStr] || {
        quizCount: 0, quizCorrect: 0, matchingGames: 0, matchingScore: 0,
    };
    todayLog.quizCount  += 1;
    if (isCorrect) todayLog.quizCorrect += 1;
    dailyLog[todayStr]   = todayLog;

    const updatedStats = {
        streak:           newStreak,
        lastActiveDate:   todayStr,
        reviewsToday:     newReviewsToday,
        lastReviewDate:   todayStr,
        dailyGoal:        stats.dailyGoal || 10,
        totalQuizCorrect,
        totalQuizWrong,
        quizSessionsPlayed,
        dailyActivity,
        dailyLog,
    };

    await updateDoc(docRef, updatedStats);
    return updatedStats;
};

/**
 * Updates the user's daily word review goal.
 *
 * @param {string} userId
 * @param {number} newGoal
 * @returns {Promise<void>}
 */
export const updateDailyGoal = async (userId, newGoal) => {
    const docRef = doc(db, COLLECTION_STATS, userId);
    await updateDoc(docRef, { dailyGoal: newGoal });
};

/**
 * Updates the matching game high score and daily log.
 * Performs a high-score comparison before writing.
 *
 * @param {string} userId
 * @param {number} newScore
 * @returns {Promise<Object>} Updated stats object.
 */
export const updateMatchingScore = async (userId, newScore) => {
    const docRef  = doc(db, COLLECTION_STATS, userId);
    const stats   = await fetchUserStats(userId);

    const todayStr     = getLocalDateStr();
    const oldHighScore = stats.matchingHighScore || 0;
    const isNewHigh    = newScore > oldHighScore;

    const newGamesPlayed = (stats.matchingGamesPlayed || 0) + 1;

    // ── Daily Log ──────────────────────────────────────────────────────────
    const dailyLog  = stats.dailyLog || {};
    const todayLog  = dailyLog[todayStr] || {
        quizCount: 0, quizCorrect: 0, matchingGames: 0, matchingScore: 0,
    };
    todayLog.matchingGames  += 1;
    todayLog.matchingScore  += newScore; // Accumulate today's points
    dailyLog[todayStr]       = todayLog;

    // ── Heatmap counter ────────────────────────────────────────────────────
    const dailyActivity = stats.dailyActivity || {};
    dailyActivity[todayStr] = (dailyActivity[todayStr] || 0) + 1;

    const updatedStats = {
        ...stats,
        matchingHighScore:  isNewHigh ? newScore : oldHighScore,
        matchingGamesPlayed: newGamesPlayed,
        dailyLog,
        dailyActivity,
    };

    await updateDoc(docRef, {
        matchingHighScore:   updatedStats.matchingHighScore,
        matchingGamesPlayed: newGamesPlayed,
        dailyLog,
        dailyActivity,
    });

    return updatedStats;
};
