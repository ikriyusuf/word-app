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
    increment
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from "../config/firebase.js";

const WORDS_COLLECTION = "words";

export const addWord = async (wordData) => {
    return await addDoc(collection(db, WORDS_COLLECTION), {
        ...wordData,
        createdAt: serverTimestamp(),
        correct: 0,
        wrong: 0
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

export const updateWordStats = async (wordId, isCorrect) => {
    const wordRef = doc(db, WORDS_COLLECTION, wordId);
    await updateDoc(wordRef, {
        [isCorrect ? "correct" : "wrong"]: increment(1)
    });
};

export const updateWord = async (wordId, updateData) => {
    const wordRef = doc(db, WORDS_COLLECTION, wordId);
    await updateDoc(wordRef, updateData);
};

export const deleteWord = async (wordId) => {
    const wordRef = doc(db, WORDS_COLLECTION, wordId);
    await deleteDoc(wordRef);
};
