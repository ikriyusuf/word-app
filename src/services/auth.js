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

/**
 * Converts Firebase Auth error codes into friendly Turkish messages.
 * @param {import('firebase/auth').AuthError} error
 * @returns {string}
 */
export const getAuthErrorMessage = (error) => {
    const messages = {
        'auth/invalid-email':            'Geçerli bir e-posta adresi girin.',
        'auth/user-not-found':           'Bu e-posta adresiyle kayıtlı bir hesap bulunamadı.',
        'auth/wrong-password':           'Şifre hatalı. Lütfen tekrar deneyin.',
        'auth/invalid-credential':       'E-posta adresi veya şifre hatalı.',
        'auth/too-many-requests':        'Çok fazla başarısız deneme. Lütfen bir süre bekleyin.',
        'auth/user-disabled':            'Bu hesap devre dışı bırakılmış.',
        'auth/email-already-in-use':     'Bu e-posta adresi zaten kullanımda.',
        'auth/weak-password':            'Şifre çok zayıf. Daha güçlü bir şifre seçin.',
        'auth/network-request-failed':   'İnternet bağlantınızı kontrol edin.',
        'auth/popup-closed-by-user':     'Giriş penceresi kapatıldı.',
        'auth/requires-recent-login':    'Bu işlem için tekrar giriş yapmanız gerekiyor.',
        'auth/operation-not-allowed':    'Bu giriş yöntemi şu an aktif değil.',
    };
    return messages[error.code] ?? 'Bir hata oluştu. Lütfen tekrar deneyin.';
};
