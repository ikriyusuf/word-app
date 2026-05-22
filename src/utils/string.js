/**
 * String capitalization utility helper functions.
 */

/**
 * Capitalizes only the first letter of the string.
 * Trims leading/trailing whitespaces.
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
 * Trims leading/trailing whitespaces.
 * 
 * @param {string} str - Input string.
 * @returns {string} Capitalized string.
 */
export const capitalizeEachWord = (str) => {
    if (!str) return '';
    return str.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};
