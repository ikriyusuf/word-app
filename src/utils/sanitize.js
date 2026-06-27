/**
 * Security Sanitization Utility
 *
 * Provides functions to prevent XSS (Cross-Site Scripting) attacks.
 * Always use `escapeHtml()` before inserting user-provided data into innerHTML.
 *
 * Principle: Never trust user input. Sanitize at the point of output.
 */

/**
 * Escapes HTML special characters in a string to prevent XSS.
 * Use this whenever inserting user data into innerHTML templates.
 *
 * @param {string} str - Raw user input string.
 * @returns {string} HTML-safe escaped string.
 *
 * @example
 * // UNSAFE:
 * el.innerHTML = `<span>${userInput}</span>`;
 * // SAFE:
 * el.innerHTML = `<span>${escapeHtml(userInput)}</span>`;
 */
export const escapeHtml = (str) => {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g,  '&amp;')
        .replace(/</g,  '&lt;')
        .replace(/>/g,  '&gt;')
        .replace(/"/g,  '&quot;')
        .replace(/'/g,  '&#39;');
};

/**
 * Safely sets text content of a DOM element.
 * Prefer this over `element.textContent = value` for clarity.
 *
 * @param {HTMLElement} el - Target DOM element.
 * @param {string} text - Text to set.
 */
export const setTextContent = (el, text) => {
    if (el) el.textContent = text ?? '';
};

/**
 * Highlights a target word inside a sentence string for safe HTML rendering.
 * Escapes the sentence before inserting the highlight mark.
 *
 * @param {string} sentence - The full example sentence (user data).
 * @param {string} targetWord - The word to highlight (user data).
 * @returns {string} HTML string with the target word wrapped in <mark>.
 */
export const highlightWordInSentence = (sentence, targetWord) => {
    const escapedSentence = escapeHtml(sentence);
    const escapedWord = escapeHtml(targetWord);

    // Escape for regex use (separate from HTML escaping)
    const regexEscapedWord = targetWord.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');

    // Try word-boundary match first, fall back to substring match
    const wordBoundaryRegex = new RegExp(`\\b${regexEscapedWord}\\b`, 'gi');
    const substringRegex    = new RegExp(regexEscapedWord, 'gi');

    const hasMatch = wordBoundaryRegex.test(escapedSentence);
    const regex    = hasMatch ? wordBoundaryRegex : substringRegex;

    // Reset lastIndex after .test()
    wordBoundaryRegex.lastIndex = 0;
    substringRegex.lastIndex    = 0;

    return escapedSentence.replace(
        hasMatch ? wordBoundaryRegex : substringRegex,
        (match) => `<mark class="wotd-highlight">${escapeHtml(match)}</mark>`
    );
};
