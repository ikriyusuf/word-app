/**
 * Text-to-Speech (TTS) Service wrapper using the browser Web Speech API.
 */

/**
 * Pronounces the given text using SpeechSynthesis.
 * Adds visual feedback to the triggering button if provided.
 * 
 * @param {string} text - The text to read.
 * @param {HTMLElement|null} btnEl - Optional DOM button element to toggle class 'playing'.
 */
export const speak = (text, btnEl = null) => {
    if (!window.speechSynthesis) {
        console.warn('Speech synthesis is not supported in this browser.');
        return;
    }
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.85;
    
    if (btnEl) {
        btnEl.classList.add('playing');
        utterance.onend  = () => btnEl.classList.remove('playing');
        utterance.onerror = () => btnEl.classList.remove('playing');
    }
    
    window.speechSynthesis.speak(utterance);
};
