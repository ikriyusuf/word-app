/**
 * Firebase Authentication Service
 *
 * Wraps Firebase Auth SDK with:
 *   - Input validation before hitting the network
 *   - Friendly Turkish error messages
 *   - Clear separation from UI concerns (no toast/DOM calls here)
 *
 * All functions throw on failure — callers are responsible for catching.
 */

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence,
    sendPasswordResetEmail,
    updatePassword,
} from 'firebase/auth';
import { auth } from '../config/firebase.js';
import { isValidEmail, isValidPassword } from '../utils/string.js';
import { MIN_PASSWORD_LENGTH } from '../config/constants.js';

// ─── Auth Operations ──────────────────────────────────────────────────────────

/**
 * Registers a new user with email, password and display name.
 *
 * @param {string} email
 * @param {string} password
 * @param {string} displayName
 * @returns {Promise<UserCredential>}
 * @throws {Error} If inputs are invalid or Firebase rejects the request.
 */
export const register = async (email, password, displayName) => {
    if (!isValidEmail(email)) {
        throw Object.assign(new Error('Geçerli bir e-posta adresi girin.'), { code: 'auth/invalid-email' });
    }
    if (!isValidPassword(password)) {
        throw Object.assign(
            new Error(`Şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalıdır.`),
            { code: 'auth/weak-password' }
        );
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
        await updateProfile(userCredential.user, { displayName });
        await userCredential.user.reload();
    }
    return userCredential;
};

/**
 * Signs in a user with email and password.
 * Sets persistence based on the "Remember Me" preference.
 *
 * @param {string} email
 * @param {string} password
 * @param {boolean} rememberMe - true = local (survives browser close), false = session only.
 * @returns {Promise<UserCredential>}
 */
export const login = async (email, password, rememberMe = true) => {
    if (!isValidEmail(email)) {
        throw Object.assign(new Error('Geçerli bir e-posta adresi girin.'), { code: 'auth/invalid-email' });
    }

    const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistence);
    return await signInWithEmailAndPassword(auth, email, password);
};

/**
 * Signs out the current user.
 *
 * @returns {Promise<void>}
 */
export const logout = () => signOut(auth);

/**
 * Subscribes to auth state changes.
 *
 * @param {Function} callback - Receives the Firebase User object or null.
 * @returns {Function} Unsubscribe function.
 */
export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);

/**
 * Sends a password reset email to the given address.
 *
 * @param {string} email
 * @returns {Promise<void>}
 * @throws {Error} If the email format is invalid.
 */
export const resetPassword = (email) => {
    if (!isValidEmail(email)) {
        throw Object.assign(new Error('Geçerli bir e-posta adresi girin.'), { code: 'auth/invalid-email' });
    }
    return sendPasswordResetEmail(auth, email);
};

/**
 * Updates the current user's password.
 * Requires the user to have signed in recently (Firebase may prompt re-auth).
 *
 * @param {string} newPassword
 * @returns {Promise<void>}
 * @throws {Error} If not signed in or password is too weak.
 */
export const changePassword = (newPassword) => {
    if (!auth.currentUser) {
        throw new Error('Oturum açık değil.');
    }
    if (!isValidPassword(newPassword)) {
        throw Object.assign(
            new Error(`Şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalıdır.`),
            { code: 'auth/weak-password' }
        );
    }
    return updatePassword(auth.currentUser, newPassword);
};

/**
 * Updates the display name (and optionally other profile fields) for a user.
 *
 * @param {import('firebase/auth').User} user
 * @param {{ displayName?: string, photoURL?: string }} profileData
 * @returns {Promise<void>}
 */
export const updateUserProfile = async (user, profileData) => {
    await updateProfile(user, profileData);
    await user.reload();
};

// ─── Error Messages ───────────────────────────────────────────────────────────

/**
 * Maps Firebase Auth error codes to user-friendly Turkish messages.
 *
 * @param {import('firebase/auth').AuthError} error
 * @returns {string} Localized error message.
 */
export const getAuthErrorMessage = (error) => {
    const messages = {
        'auth/invalid-email':          'Geçerli bir e-posta adresi girin.',
        'auth/user-not-found':         'Bu e-posta adresiyle kayıtlı bir hesap bulunamadı.',
        'auth/wrong-password':         'Şifre hatalı. Lütfen tekrar deneyin.',
        'auth/invalid-credential':     'E-posta adresi veya şifre hatalı.',
        'auth/too-many-requests':      'Çok fazla başarısız deneme. Lütfen bir süre bekleyin.',
        'auth/user-disabled':          'Bu hesap devre dışı bırakılmış.',
        'auth/email-already-in-use':   'Bu e-posta adresi zaten kullanımda.',
        'auth/weak-password':          'Şifre çok zayıf. Daha güçlü bir şifre seçin.',
        'auth/network-request-failed': 'İnternet bağlantınızı kontrol edin.',
        'auth/popup-closed-by-user':   'Giriş penceresi kapatıldı.',
        'auth/requires-recent-login':  'Bu işlem için tekrar giriş yapmanız gerekiyor.',
        'auth/operation-not-allowed':  'Bu giriş yöntemi şu an aktif değil.',
    };
    return messages[error.code] ?? error.message ?? 'Bir hata oluştu. Lütfen tekrar deneyin.';
};
