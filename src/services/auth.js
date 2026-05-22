import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    updateProfile,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence
} from "firebase/auth";
import { auth } from "../config/firebase.js";

/**
 * Registers a new user with email, password, and display name.
 */
export const register = async (email, password, displayName) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
        await updateProfile(userCredential.user, { displayName });
        await userCredential.user.reload();
    }
    return userCredential;
};

/**
 * Logs in the user with email and password, setting persistence style dynamically.
 * 
 * @param {string} email 
 * @param {string} password 
 * @param {boolean} rememberMe - If true, persists across browser sessions (local). If false, clears on tab close (session).
 */
export const login = async (email, password, rememberMe = true) => {
    const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistence);
    return await signInWithEmailAndPassword(auth, email, password);
};

export const logout = () => signOut(auth);
export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);
export const updateUserProfile = async (user, profileData) => {
    await updateProfile(user, profileData);
    await user.reload();
};
