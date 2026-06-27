import * as ui from '../ui.js';
import { generateClozeOptions } from '../quiz.js';
import { QUIZ_SPEAK_DELAY_MS } from '../../config/constants.js';

let clickHandler = null;

/**
 * Initializes the Cloze (Context Selection) quiz mode.
 * Generates options, updates the UI, sets up pronunciation, and attaches event listeners.
 * 
 * @param {Object} wordObj - The active word object.
 * @param {number} index - Active question index.
 * @param {number} total - Total questions in session.
 * @param {Array} allWords - All user words for distractor generation.
 * @param {Function} onAnswerSubmitted - Callback invoked when answer is evaluated.
 * @param {Function} speak - Pronunciation service callback.
 */
export const initCloze = (wordObj, index, total, allWords, onAnswerSubmitted, speak) => {
    // Generate multiple choice options
    const options = generateClozeOptions(wordObj, allWords);
    ui.updateClozeUI(wordObj, index, total, options);
    
    // Automatic voice synthesis hint
    setTimeout(() => speak(wordObj.word), QUIZ_SPEAK_DELAY_MS);
    
    // Safe cleanup of any pre-existing listeners
    destroyCloze();
    
    const container = ui.elements.clozeOptionsContainer;
    
    clickHandler = async (e) => {
        const optionBtn = e.target.closest('.option-btn');
        if (!optionBtn) return;
        
        // Prevent double clicking/multiple selections
        const clickedBefore = container.querySelector('.correct') || container.querySelector('.wrong');
        if (clickedBefore) return;
        
        const selectedOption = optionBtn.dataset.option;
        const correctAnswer = wordObj.word;
        const isCorrect = selectedOption.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
        
        // Colorize option states (Success green or error red)
        const allOptionBtns = container.querySelectorAll('.option-btn');
        allOptionBtns.forEach(btn => {
            btn.style.pointerEvents = 'none'; // Lock all other buttons
            if (btn.dataset.option.toLowerCase().trim() === correctAnswer.toLowerCase().trim()) {
                btn.classList.add('correct');
            } else if (btn === optionBtn && !isCorrect) {
                btn.classList.add('wrong');
            }
        });
        
        ui.showQuizFeedback(isCorrect, correctAnswer, 'cloze');
        await onAnswerSubmitted(isCorrect);
    };
    
    container.addEventListener('click', clickHandler);
};

/**
 * Unbinds event listeners and cleans up module states to prevent leaks.
 */
export const destroyCloze = () => {
    if (clickHandler) {
        ui.elements.clozeOptionsContainer.removeEventListener('click', clickHandler);
        clickHandler = null;
    }
};
