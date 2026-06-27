/**
 * String utility and input validation helpers.
 *
 * Capitalization helpers transform display strings.
 * Validation helpers enforce business rules before data reaches the database.
 */

import {
    MAX_WORD_LENGTH,
    MAX_SENTENCE_LENGTH,
    MAX_DISPLAY_NAME_LENGTH,
    MIN_PASSWORD_LENGTH,
} from '../config/constants.js';

// ─── Capitalization ────────────────────────────────────────────────────────────

/**
 * Capitalizes only the first letter of the string.
 * Trims leading/trailing whitespace.
 *
 * @param {string} str - Input string.
 * @returns {string} Capitalized string.
 */
export const capitalizeFirstLetter = (str) => {
    if (!str) return '';
    const trimmed = str.trim();
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

/**
 * Capitalizes the first letter of each word in the string.
 * Trims leading/trailing whitespace.
 *
 * @param {string} str - Input string.
 * @returns {string} Title-cased string.
 */
export const capitalizeEachWord = (str) => {
    if (!str) return '';
    return str.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

// ─── Sanitization ─────────────────────────────────────────────────────────────

/**
 * Trims and enforces a maximum length on a string.
 * Returns an empty string if the input is falsy.
 *
 * @param {string} str - Raw input.
 * @param {number} maxLength - Maximum allowed character count.
 * @returns {string} Trimmed and truncated string.
 */
export const sanitizeInput = (str, maxLength) => {
    if (!str) return '';
    return String(str).trim().slice(0, maxLength);
};

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Validates an email address format.
 *
 * @param {string} email - Raw email string.
 * @returns {boolean} True if the format is valid.
 */
export const isValidEmail = (email) => {
    if (!email) return false;
    // RFC 5322 simplified pattern
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

/**
 * Validates a password meets minimum security requirements.
 *
 * @param {string} password - Raw password string.
 * @returns {boolean} True if the password is valid.
 */
export const isValidPassword = (password) => {
    if (!password) return false;
    return password.length >= MIN_PASSWORD_LENGTH;
};

/**
 * Validates a word field (non-empty, within length limit).
 *
 * @param {string} word - The word value.
 * @returns {{ valid: boolean, error: string }} Validation result.
 */
export const validateWordField = (word) => {
    const trimmed = word?.trim() ?? '';
    if (!trimmed) return { valid: false, error: 'Kelime alanı boş olamaz.' };
    if (trimmed.length > MAX_WORD_LENGTH) {
        return { valid: false, error: `Kelime en fazla ${MAX_WORD_LENGTH} karakter olabilir.` };
    }
    return { valid: true, error: '' };
};

/**
 * Validates a meaning field (non-empty, within length limit).
 *
 * @param {string} meaning - The meaning value.
 * @returns {{ valid: boolean, error: string }} Validation result.
 */
export const validateMeaningField = (meaning) => {
    const trimmed = meaning?.trim() ?? '';
    if (!trimmed) return { valid: false, error: 'Anlam alanı boş olamaz.' };
    if (trimmed.length > MAX_WORD_LENGTH) {
        return { valid: false, error: `Anlam en fazla ${MAX_WORD_LENGTH} karakter olabilir.` };
    }
    return { valid: true, error: '' };
};

/**
 * Validates an example sentence field (optional, length limit applies if provided).
 *
 * @param {string} sentence - The example sentence value.
 * @returns {{ valid: boolean, error: string }} Validation result.
 */
export const validateSentenceField = (sentence) => {
    const trimmed = sentence?.trim() ?? '';
    if (trimmed && trimmed.length > MAX_SENTENCE_LENGTH) {
        return { valid: false, error: `Örnek cümle en fazla ${MAX_SENTENCE_LENGTH} karakter olabilir.` };
    }
    return { valid: true, error: '' };
};

/**
 * Validates a display name (non-empty, within length limit).
 *
 * @param {string} name - The display name value.
 * @returns {{ valid: boolean, error: string }} Validation result.
 */
export const validateDisplayName = (name) => {
    const trimmed = name?.trim() ?? '';
    if (!trimmed) return { valid: false, error: 'Ad Soyad alanı boş olamaz.' };
    if (trimmed.length > MAX_DISPLAY_NAME_LENGTH) {
        return { valid: false, error: `Ad Soyad en fazla ${MAX_DISPLAY_NAME_LENGTH} karakter olabilir.` };
    }
    return { valid: true, error: '' };
};
