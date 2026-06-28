import * as ui from '../ui.js';
import { checkAnswer } from '../quiz.js';

let submitClickHandler = null;
let keypressHandler = null;

/**
 * Initializes the Context Guess / Typing game mode.
 * Shows the masked sentence, takes user text input, and checks correctness.
 * 
 * @param {Object} wordObj - The active word object.
 * @param {number} index - Active question index.
 * @param {number} total - Total questions in session.
 * @param {Function} onAnswerSubmitted - Callback invoked when answers are submitted.
 */
export const initContextGuess = (wordObj, index, total, onAnswerSubmitted) => {
    ui.updateContextGuessUI(wordObj, index, total);
    
    // Safety cleanup of existing events
    destroyContextGuess();
    
    const evaluateInput = async () => {
        const userInput = ui.elements.contextGuessAnswer.value;
        const isCorrect = checkAnswer(userInput, wordObj.word);
        
        ui.showQuizFeedback(isCorrect, wordObj.word, 'contextGuess');
        
        // Prevent editing during delay
        ui.elements.contextGuessAnswer.disabled = true;
        ui.elements.contextGuessSubmit.disabled = true;
        
        await onAnswerSubmitted(isCorrect);
    };
    
    // Submit button click triggers evaluation
    submitClickHandler = async () => {
        await evaluateInput();
    };
    ui.elements.contextGuessSubmit.addEventListener('click', submitClickHandler);
    
    // Enter key triggers evaluation
    keypressHandler = async (e) => {
        if (e.key === 'Enter') {
            await evaluateInput();
        }
    };
    ui.elements.contextGuessAnswer.addEventListener('keypress', keypressHandler);
};

/**
 * Unbinds all click and keypress handlers to prevent duplicate firing.
 */
export const destroyContextGuess = () => {
    if (ui.elements.contextGuessAnswer) {
        ui.elements.contextGuessAnswer.disabled = false;
    }
    if (ui.elements.contextGuessSubmit) {
        ui.elements.contextGuessSubmit.disabled = false;
    }
    if (submitClickHandler) {
        ui.elements.contextGuessSubmit.removeEventListener('click', submitClickHandler);
        submitClickHandler = null;
    }
    if (keypressHandler) {
        ui.elements.contextGuessAnswer.removeEventListener('keypress', keypressHandler);
        keypressHandler = null;
    }
};
