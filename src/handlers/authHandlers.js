/**
 * Auth Event Handlers
 *
 * Handles all authentication-related user interactions:
 * login, register, logout, password reset, and profile updates.
 *
 * SRP: This module only concerns itself with auth UI→service flow.
 * It delegates to authService for network calls and toast for notifications.
 */

import * as authService from '../services/auth.js';
import * as ui           from '../modules/ui.js';
import { auth }          from '../config/firebase.js';
import { store }         from '../store/state.js';
import { toast }         from '../utils/toast.js';
import {
    capitalizeEachWord,
    validateDisplayName,
    isValidEmail,
} from '../utils/string.js';
import { MAX_DAILY_GOAL, MIN_DAILY_GOAL } from '../config/constants.js';
import * as dbService from '../services/db.js';

// ─── Login ────────────────────────────────────────────────────────────────────

/**
 * Handles the login form submission.
 *
 * @param {SubmitEvent} e
 */
export const handleLogin = async (e) => {
    e.preventDefault();
    const email      = ui.elements.loginEmail.value.trim();
    const password   = ui.elements.loginPass.value;
    const rememberMe = ui.elements.loginRememberMe.checked;

    try {
        await authService.login(email, password, rememberMe);
    } catch (error) {
        toast(authService.getAuthErrorMessage(error), 'error');
    }
};

// ─── Register ─────────────────────────────────────────────────────────────────

/**
 * Handles the registration form submission.
 *
 * @param {SubmitEvent} e
 */
export const handleRegister = async (e) => {
    e.preventDefault();

    const firstName   = capitalizeEachWord(ui.elements.registerFirstName.value);
    const lastName    = capitalizeEachWord(ui.elements.registerLastName.value);
    const displayName = `${firstName} ${lastName}`.trim();
    const email       = ui.elements.registerEmail.value.trim();
    const password    = ui.elements.registerPass.value;

    const nameValidation = validateDisplayName(displayName);
    if (!nameValidation.valid) {
        toast(nameValidation.error, 'warning');
        return;
    }

    try {
        await authService.register(email, password, displayName);
        toast('Hoş geldin! 🎉 Hesabın başarıyla oluşturuldu.', 'success', 4000);
    } catch (error) {
        toast(authService.getAuthErrorMessage(error), 'error');
    }
};

// ─── Forgot Password ──────────────────────────────────────────────────────────

/**
 * Handles the "Forgot Password" link click.
 * Shows an inline prompt for the user's email.
 *
 * @param {MouseEvent} e
 */
export const handleForgotPassword = async (e) => {
    e.preventDefault();
    const email = prompt('Şifrenizi sıfırlamak için kayıtlı e-posta adresinizi girin:');
    if (!email) return;

    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
        toast('Lütfen geçerli bir e-posta adresi girin.', 'warning');
        return;
    }

    try {
        await authService.resetPassword(trimmedEmail);
        toast(
            'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen spam kutunuzu da kontrol edin.',
            'success',
            6000
        );
    } catch (error) {
        toast(authService.getAuthErrorMessage(error), 'error');
    }
};

// ─── Update Display Name ──────────────────────────────────────────────────────

/**
 * Handles the profile name update form submission.
 *
 * @param {SubmitEvent} e
 */
export const handleUpdateDisplayName = async (e) => {
    e.preventDefault();
    const { user } = store.getState();
    if (!user) return;

    const rawName   = ui.elements.profileDisplayNameInput.value;
    const cleanName = capitalizeEachWord(rawName);

    const validation = validateDisplayName(cleanName);
    if (!validation.valid) {
        toast(validation.error, 'warning');
        return;
    }

    try {
        await authService.updateUserProfile(user, { displayName: cleanName });
        store.setState({ user: auth.currentUser });
        toast('Profil bilgileriniz başarıyla güncellendi! 🎉', 'success');
    } catch (error) {
        console.error('Profil güncellenirken hata:', error);
        toast(authService.getAuthErrorMessage(error), 'error');
    }
};

// ─── Update Password ──────────────────────────────────────────────────────────

/**
 * Handles the profile password update form submission.
 *
 * @param {SubmitEvent} e
 */
export const handleUpdatePassword = async (e) => {
    e.preventDefault();
    const newPassword = ui.elements.profileNewPasswordInput.value;

    try {
        await authService.changePassword(newPassword);
        ui.elements.profilePasswordForm.reset();
        toast('Şifreniz başarıyla değiştirildi! 🔐', 'success');
    } catch (error) {
        console.error('Şifre güncellenirken hata:', error);
        toast(authService.getAuthErrorMessage(error), 'error');
    }
};

// ─── Update Daily Goal ────────────────────────────────────────────────────────

/**
 * Handles the daily goal update form submission.
 *
 * @param {SubmitEvent} e
 * @param {Function} loadUserStats - Callback to reload stats after update.
 */
export const handleUpdateDailyGoal = async (e, loadUserStats) => {
    e.preventDefault();
    const { user } = store.getState();
    if (!user) return;

    const newGoal = parseInt(ui.elements.profileGoalInput.value, 10);

    if (isNaN(newGoal) || newGoal < MIN_DAILY_GOAL) {
        toast(`Lütfen en az ${MIN_DAILY_GOAL} olan geçerli bir hedef belirleyin.`, 'warning');
        return;
    }
    if (newGoal > MAX_DAILY_GOAL) {
        toast(`Günlük hedef en fazla ${MAX_DAILY_GOAL} olabilir.`, 'warning');
        return;
    }

    try {
        await dbService.updateDailyGoal(user.uid, newGoal);
        toast('Günlük hedefiniz başarıyla güncellendi! 🎉', 'success');
        await loadUserStats();
    } catch (error) {
        console.error('Hedef güncellenirken hata:', error);
        toast('Hedef güncellenirken bir hata oluştu: ' + error.message, 'error');
    }
};
