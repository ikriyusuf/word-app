/**
 * Word of the Day Module
 *
 * Selects and displays the most review-critical word as a daily featured card.
 *
 * Selection priority:
 *   1. Past-due words with the most wrong answers (hardest)
 *   2. New words never studied (correct === 0 && wrong === 0)
 *   3. Oldest nextReviewDate as fallback
 *
 * The selected word is cached in localStorage for the full calendar day —
 * refreshing the page won't change it until tomorrow.
 *
 * Security: All user data is inserted via textContent or escapeHtml()
 * to prevent XSS when building the innerHTML template.
 */

import { escapeHtml, highlightWordInSentence } from '../utils/sanitize.js';
import { WOTD_STORAGE_KEY } from '../config/constants.js';

// ─── Date Helper ──────────────────────────────────────────────────────────────

/** Returns today's YYYY-MM-DD string (UTC, for cache keying). */
const todayKey = () => new Date().toISOString().slice(0, 10);

// ─── Word Selection ───────────────────────────────────────────────────────────

/**
 * Returns the Firestore timestamp or Date for a word's next review date.
 *
 * @param {Object} w - Word object.
 * @returns {Date}
 */
const getReviewDate = (w) => {
    if (!w.nextReviewDate) return new Date(0);
    if (w.nextReviewDate.toDate) return w.nextReviewDate.toDate();
    return new Date(w.nextReviewDate);
};

/**
 * Picks the Word of the Day from the user's word list.
 * Uses localStorage to cache the selection for the current day.
 *
 * @param {Array} words - User's full word list.
 * @returns {Object|null} The selected word object, or null if words is empty.
 */
export const pickWordOfDay = (words) => {
    if (!words || words.length === 0) return null;

    const today = todayKey();

    // Return cached word if already picked today
    try {
        const cached = JSON.parse(localStorage.getItem(WOTD_STORAGE_KEY));
        if (cached?.date === today) {
            const found = words.find(w => w.id === cached.wordId);
            if (found) return found;
        }
    } catch (_) { /* ignore parse errors */ }

    const now = new Date();

    // 1. Past-due words: ranked by most wrong answers
    const dueWords = words
        .filter(w => getReviewDate(w) <= now)
        .sort((a, b) => (b.wrong || 0) - (a.wrong || 0));

    // 2. Brand-new words never studied
    const newWords = words.filter(w => (w.correct || 0) === 0 && (w.wrong || 0) === 0);

    // 3. Fallback: oldest review date
    const fallbackWords = [...words].sort((a, b) => getReviewDate(a) - getReviewDate(b));

    const selected = dueWords[0] || newWords[0] || fallbackWords[0];

    // Cache today's selection
    try {
        localStorage.setItem(WOTD_STORAGE_KEY, JSON.stringify({ date: today, wordId: selected.id }));
    } catch (_) { /* ignore storage errors */ }

    return selected;
};

// ─── Widget Rendering ─────────────────────────────────────────────────────────

/**
 * Determines the status label and CSS class for the word.
 *
 * @param {number} mastery - 0–100
 * @param {number} wrong
 * @param {number} total
 * @returns {{ label: string, cls: string }}
 */
const getStatusBadge = (mastery, wrong, total) => {
    if (wrong > 0 && mastery < 50) return { label: 'Zorlanıyorsun', cls: 'wotd-status--hard' };
    if (mastery >= 80)             return { label: 'Öğrenildi',     cls: 'wotd-status--mastered' };
    if (total > 0)                 return { label: 'Öğreniyor',     cls: 'wotd-status--learning' };
    return                                { label: 'Yeni',           cls: 'wotd-status--new' };
};

/**
 * Renders the Word of the Day widget into the given container element.
 *
 * Security: All user data (word, meaning, exampleSentence) is either:
 *   - Inserted via textContent (no HTML parsing), or
 *   - Passed through escapeHtml() / highlightWordInSentence() before innerHTML.
 *
 * @param {Object}      word      - The selected word object.
 * @param {HTMLElement} container - The #wotd-widget DOM element.
 * @param {Function}    speakFn   - TTS speak(text) callback.
 * @param {Function}    onStudy   - Called when user clicks "Bu kelimeyi çalış".
 */
export const renderWordOfDay = (word, container, speakFn, onStudy) => {
    if (!container) return;

    if (!word) {
        container.innerHTML = '';
        container.style.display = 'none';
        return;
    }

    container.style.display = '';

    const today   = new Date();
    const dateStr = today.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });

    const correct = word.correct || 0;
    const wrong   = word.wrong   || 0;
    const total   = correct + wrong;
    const mastery = total === 0 ? 0 : Math.round((correct / total) * 100);

    const { label: statusLabel, cls: statusClass } = getStatusBadge(mastery, wrong, total);

    // highlightWordInSentence escapes the sentence and target word before returning HTML
    const sentence    = word.exampleSentence || '';
    const highlighted = sentence ? highlightWordInSentence(sentence, word.word) : '';

    const masteryBarHTML = total > 0 ? `
        <div class="wotd-mastery-bar-wrap" title="Ustalık: ${mastery}%">
            <span class="wotd-mastery-label">Ustalık</span>
            <div class="wotd-mastery-bar">
                <div class="wotd-mastery-fill" style="width:${mastery}%"></div>
            </div>
            <span class="wotd-mastery-pct">${mastery}%</span>
        </div>` : '';

    const sentenceHTML = highlighted ? `
        <div class="wotd-sentence-box">
            <i class="fas fa-quote-left wotd-quote-icon"></i>
            <p class="wotd-sentence">${highlighted}</p>
        </div>` : '';

    // All dynamic values below are safe:
    // - dateStr: locale-formatted date (no user data)
    // - escapeHtml(word.word): escaped user data
    // - escapeHtml(statusLabel): static string (no user data, but consistent)
    // - escapeHtml(word.meaning): escaped user data
    // - highlighted: returned from highlightWordInSentence() which escapes internally
    // - mastery, total: numeric (safe)
    container.innerHTML = `
        <div class="wotd-inner">
            <div class="wotd-header">
                <div class="wotd-badge">
                    <i class="fas fa-sun"></i>
                    <span>Günün Kelimesi</span>
                </div>
                <span class="wotd-date">${dateStr}</span>
            </div>

            <div class="wotd-body">
                <div class="wotd-word-row">
                    <span class="wotd-word" id="wotd-word-text">${escapeHtml(word.word)}</span>
                    <button class="wotd-speak-btn" id="wotd-speak-btn" title="Telaffuzu dinle" aria-label="Telaffuzu dinle">
                        <i class="fas fa-volume-up"></i>
                    </button>
                    <span class="wotd-status-badge ${statusClass}">${escapeHtml(statusLabel)}</span>
                </div>

                <p class="wotd-meaning">${escapeHtml(word.meaning)}</p>

                ${sentenceHTML}
            </div>

            <div class="wotd-footer">
                ${masteryBarHTML}
                <button class="wotd-study-btn" id="wotd-study-btn">
                    <i class="fas fa-bolt"></i>
                    Bu kelimeyi çalış
                </button>
            </div>
        </div>`;

    // Bind events after rendering
    const speakBtn = container.querySelector('#wotd-speak-btn');
    if (speakBtn && speakFn) {
        speakBtn.addEventListener('click', () => speakFn(`${word.word}. ${word.exampleSentence || ''}`));
    }

    const studyBtn = container.querySelector('#wotd-study-btn');
    if (studyBtn && onStudy) {
        studyBtn.addEventListener('click', () => onStudy(word));
    }
};
