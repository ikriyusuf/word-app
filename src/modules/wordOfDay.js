/**
 * Word of the Day Module
 * 
 * Selects and displays the most review-critical word as a daily featured card.
 * Selection priority:
 *   1. Past-due words with the most wrong answers (hardest)
 *   2. New words never studied (correct === 0 && wrong === 0)
 *   3. Oldest nextReviewDate as fallback
 * 
 * The same word is cached in localStorage for the full calendar day,
 * so refreshing the page won't change it until tomorrow.
 */

const STORAGE_KEY = 'wotd_cache';

/**
 * Returns today's date string in YYYY-MM-DD format for cache keying.
 */
const todayKey = () => new Date().toISOString().slice(0, 10);

/**
 * Picks the Word of the Day from the user's word list.
 * Uses localStorage to cache the selection for the current day.
 * 
 * @param {Array} words - User's full word list
 * @returns {Object|null} The selected word object, or null if words is empty
 */
export const pickWordOfDay = (words) => {
    if (!words || words.length === 0) return null;

    const today = todayKey();

    // Check if we already picked a word today
    try {
        const cached = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (cached && cached.date === today) {
            // Find the word object by ID (data may have been updated)
            const found = words.find(w => w.id === cached.wordId);
            if (found) return found;
        }
    } catch (_) { /* ignore parse errors */ }

    const now = new Date();

    const getReviewDate = (w) => {
        if (!w.nextReviewDate) return new Date(0);
        if (w.nextReviewDate.toDate) return w.nextReviewDate.toDate();
        return new Date(w.nextReviewDate);
    };

    // 1. Past-due words, ranked by most wrong answers first
    const dueWords = words
        .filter(w => getReviewDate(w) <= now)
        .sort((a, b) => (b.wrong || 0) - (a.wrong || 0));

    // 2. Brand-new words (never studied)
    const newWords = words.filter(
        w => (w.correct || 0) === 0 && (w.wrong || 0) === 0
    );

    // 3. Fallback: oldest review date
    const fallbackWords = [...words].sort(
        (a, b) => getReviewDate(a) - getReviewDate(b)
    );

    const selected = dueWords[0] || newWords[0] || fallbackWords[0];

    // Cache today's selection
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            date: today,
            wordId: selected.id,
        }));
    } catch (_) { /* ignore storage errors */ }

    return selected;
};

/**
 * Renders the Word of the Day widget into the given container element.
 * Inserts the highlight span inline in the example sentence.
 * 
 * @param {Object} word       - The selected word object
 * @param {HTMLElement} container - The #wotd-widget DOM element
 * @param {Function} speakFn  - TTS speak(text) callback
 * @param {Function} onStudy  - Called when user clicks "Bu kelimeyi çalış"
 */
export const renderWordOfDay = (word, container, speakFn, onStudy) => {
    if (!container) return;

    if (!word) {
        container.innerHTML = '';
        container.style.display = 'none';
        return;
    }

    container.style.display = '';

    const today = new Date();
    const dateStr = today.toLocaleDateString('tr-TR', {
        weekday: 'long', day: 'numeric', month: 'long'
    });

    // Highlight the target word in the example sentence
    const sentence = word.exampleSentence || '';
    const escapedWord = word.word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const highlighted = sentence.replace(
        new RegExp(`\\b${escapedWord}\\b`, 'gi'),
        `<mark class="wotd-highlight">$&</mark>`
    );

    // Mastery stats
    const correct = word.correct || 0;
    const wrong = word.wrong || 0;
    const total = correct + wrong;
    const mastery = total === 0 ? 0 : Math.round((correct / total) * 100);

    // Status badge
    let statusLabel = 'Yeni';
    let statusClass = 'wotd-status--new';
    if (wrong > 0 && mastery < 50) {
        statusLabel = 'Zorlanıyorsun';
        statusClass = 'wotd-status--hard';
    } else if (mastery >= 80) {
        statusLabel = 'Öğrenildi';
        statusClass = 'wotd-status--mastered';
    } else if (total > 0) {
        statusLabel = 'Öğreniyor';
        statusClass = 'wotd-status--learning';
    }

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
                    <span class="wotd-word" id="wotd-word-text">${word.word}</span>
                    <button class="wotd-speak-btn" id="wotd-speak-btn" title="Telaffuzu dinle" aria-label="Telaffuzu dinle">
                        <i class="fas fa-volume-up"></i>
                    </button>
                    <span class="wotd-status-badge ${statusClass}">${statusLabel}</span>
                </div>

                <p class="wotd-meaning">${word.meaning}</p>

                ${sentence ? `
                <div class="wotd-sentence-box">
                    <i class="fas fa-quote-left wotd-quote-icon"></i>
                    <p class="wotd-sentence">${highlighted}</p>
                </div>` : ''}
            </div>

            <div class="wotd-footer">
                ${total > 0 ? `
                <div class="wotd-mastery-bar-wrap" title="Ustalık: ${mastery}%">
                    <span class="wotd-mastery-label">Ustalık</span>
                    <div class="wotd-mastery-bar">
                        <div class="wotd-mastery-fill" style="width: ${mastery}%"></div>
                    </div>
                    <span class="wotd-mastery-pct">${mastery}%</span>
                </div>` : ''}
                <button class="wotd-study-btn" id="wotd-study-btn">
                    <i class="fas fa-bolt"></i>
                    Bu kelimeyi çalış
                </button>
            </div>
        </div>
    `;

    // Event: Speak
    const speakBtn = container.querySelector('#wotd-speak-btn');
    if (speakBtn && speakFn) {
        speakBtn.addEventListener('click', () => {
            speakFn(`${word.word}. ${word.exampleSentence || ''}`);
        });
    }

    // Event: Study
    const studyBtn = container.querySelector('#wotd-study-btn');
    if (studyBtn && onStudy) {
        studyBtn.addEventListener('click', () => onStudy(word));
    }
};
