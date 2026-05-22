import * as ui from '../ui.js';
import { checkAnswer } from '../quiz.js';

let audioClickHandler = null;
let submitClickHandler = null;
let keypressHandler = null;

/**
 * Initializes the Dictation listening comprehension game mode.
 * Speaks the prompt, sets up input listeners, handles submission on click/Enter key.
 * 
 * @param {Object} wordObj - The active word object.
 * @param {number} index - Active question index.
 * @param {number} total - Total questions in session.
 * @param {Function} onAnswerSubmitted - Callback invoked when answers are submitted.
 * @param {Function} speak - Pronunciation service callback.
 */
export const initDictation = (wordObj, index, total, onAnswerSubmitted, speak) => {
    ui.updateDictationUI(wordObj, index, total);
    
    // Automatically pronounce the word to review on load
    setTimeout(() => speak(wordObj.word), 400);
    
    // Safety cleanup of existing events
    destroyDictation();
    
    // Pronounce word followed by example sentence helper
    audioClickHandler = () => {
        speak(wordObj.word, ui.elements.dictationAudioBtn);
        setTimeout(() => {
            speak(wordObj.exampleSentence);
        }, 1000);
    };
    ui.elements.dictationAudioBtn.addEventListener('click', audioClickHandler);
    
    const evaluateInput = async () => {
        const userInput = ui.elements.dictationAnswer.value;
        const isCorrect = checkAnswer(userInput, wordObj.word, wordObj.meaning);
        
        ui.showQuizFeedback(isCorrect, wordObj.word, 'dictation');
        await onAnswerSubmitted(isCorrect);
    };
    
    // Submit button click triggers evaluation
    submitClickHandler = async () => {
        await evaluateInput();
    };
    ui.elements.dictationSubmit.addEventListener('click', submitClickHandler);
    
    // Enter key triggers evaluation
    keypressHandler = async (e) => {
        if (e.key === 'Enter') {
            await evaluateInput();
        }
    };
    ui.elements.dictationAnswer.addEventListener('keypress', keypressHandler);
};

/**
 * Unbinds all click and keypress handlers to prevent duplicate firing.
 */
export const destroyDictation = () => {
    if (audioClickHandler) {
        ui.elements.dictationAudioBtn.removeEventListener('click', audioClickHandler);
        audioClickHandler = null;
    }
    if (submitClickHandler) {
        ui.elements.dictationSubmit.removeEventListener('click', submitClickHandler);
        submitClickHandler = null;
    }
    if (keypressHandler) {
        ui.elements.dictationAnswer.removeEventListener('keypress', keypressHandler);
        keypressHandler = null;
    }
};
