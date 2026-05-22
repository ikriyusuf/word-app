import * as ui from '../ui.js';

let scrambleState = {
    targetWord: '',
    scrambledLetters: [], // Array of { char, originalIndex, id, used }
    spelledWord: '',
    spelledIds: [], // Order of letter ids spelled
};

let optionsClickHandler = null;
let spelledClickHandler = null;
let backspaceHandler = null;
let clearHandler = null;
let speakHandler = null;
let keydownHandler = null;

/**
 * Initializes the Scramble spelling game mode.
 * Shuffles letters, renders layout, and sets up click and keyboard event listeners.
 * 
 * @param {Object} wordObj - The active word object.
 * @param {number} index - Active question index.
 * @param {number} total - Total questions in session.
 * @param {Function} onAnswerSubmitted - Callback invoked when spelling is complete and checked.
 * @param {Function} speak - Pronunciation service callback.
 */
export const initScramble = (wordObj, index, total, onAnswerSubmitted, speak) => {
    const word = wordObj.word.trim();
    scrambleState.targetWord = word;
    scrambleState.spelledWord = '';
    scrambleState.spelledIds = [];
    
    // Map word characters to a detailed array
    const letters = word.toLowerCase().split('').map((char, charIdx) => ({
        char,
        originalIndex: charIdx,
        id: `scramble-char-${charIdx}-${Math.random().toString(36).substr(2, 4)}`,
        used: false
    }));
    
    // Shuffle the characters
    const scrambled = [...letters].sort(() => Math.random() - 0.5);
    scrambleState.scrambledLetters = scrambled;
    
    // Update Scramble Mode UI Elements
    ui.updateScrambleUI(wordObj, index, total, scrambled);
    
    // Cleanup any lingering listeners
    destroyScramble();
    
    // 1. letter selection click event listener
    optionsClickHandler = async (e) => {
        const letterBtn = e.target.closest('.letter-btn');
        if (!letterBtn || letterBtn.disabled) return;
        
        const charId = letterBtn.dataset.id;
        const char = letterBtn.dataset.char;
        
        const letterObj = scrambleState.scrambledLetters.find(l => l.id === charId);
        if (letterObj) {
            letterObj.used = true;
            letterBtn.disabled = true;
            
            scrambleState.spelledWord += char;
            scrambleState.spelledIds.push(charId);
            
            // Render spelled letter block in target container
            const spelledLetterEl = document.createElement('div');
            spelledLetterEl.className = 'scramble-letter';
            spelledLetterEl.dataset.id = charId;
            spelledLetterEl.textContent = char.toUpperCase();
            ui.elements.scrambleSpelledContainer.appendChild(spelledLetterEl);
            
            // Evaluate answer once word is fully built
            if (scrambleState.spelledWord.length === scrambleState.targetWord.length) {
                await checkScrambleAnswer(onAnswerSubmitted);
            }
        }
    };
    ui.elements.scrambleOptionsContainer.addEventListener('click', optionsClickHandler);
    
    // 2. Click spelled letter block to remove it
    spelledClickHandler = (e) => {
        const spelledLetterEl = e.target.closest('.scramble-letter');
        if (!spelledLetterEl) return;
        
        const charId = spelledLetterEl.dataset.id;
        removeLetterFromSpelled(charId, spelledLetterEl);
    };
    ui.elements.scrambleSpelledContainer.addEventListener('click', spelledClickHandler);
    
    // 3. Backspace button handler
    backspaceHandler = () => {
        if (scrambleState.spelledIds.length === 0) return;
        const lastId = scrambleState.spelledIds[scrambleState.spelledIds.length - 1];
        removeLetterFromSpelled(lastId);
    };
    ui.elements.scrambleBtnBackspace.addEventListener('click', backspaceHandler);
    
    // 4. Clear/Reset spelled words helper
    clearHandler = () => {
        if (scrambleState.spelledIds.length === 0) return;
        const ids = [...scrambleState.spelledIds];
        ids.forEach(id => removeLetterFromSpelled(id));
    };
    ui.elements.scrambleBtnClear.addEventListener('click', clearHandler);
    
    // 5. Speak pronounciation sound
    speakHandler = () => {
        speak(wordObj.word, ui.elements.scrambleBtnSpeak);
    };
    ui.elements.scrambleBtnSpeak.addEventListener('click', speakHandler);
    
    // 6. Global keyboard listeners for ultra-fast gameplay
    keydownHandler = async (e) => {
        // Prevent keyboard events when not on active scramble quiz page or inside text fields
        if (ui.elements.quizSection.classList.contains('hidden')) return;
        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
        
        const key = e.key.toLowerCase();
        
        if (key === 'backspace') {
            e.preventDefault();
            ui.elements.scrambleBtnBackspace.click();
        } else if (key === 'delete') {
            e.preventDefault();
            ui.elements.scrambleBtnClear.click();
        } else if (key === ' ' || key === 'spacebar') {
            e.preventDefault();
            ui.elements.scrambleBtnSpeak.click();
        } else if (key.length === 1 && key.match(/[a-z0-9]/)) {
            // Find first matching unused letter button and trigger click
            const unusedBtns = Array.from(ui.elements.scrambleOptionsContainer.querySelectorAll('.letter-btn:not(:disabled)'));
            const matchBtn = unusedBtns.find(btn => btn.dataset.char.toLowerCase() === key);
            if (matchBtn) {
                e.preventDefault();
                matchBtn.click();
            }
        }
    };
    window.addEventListener('keydown', keydownHandler);
};

/**
 * Recalls a spelled letter, returning it back to the options drawer.
 */
const removeLetterFromSpelled = (charId, spelledLetterEl) => {
    const index = scrambleState.spelledIds.indexOf(charId);
    if (index > -1) {
        scrambleState.spelledIds.splice(index, 1);
        
        scrambleState.spelledWord = scrambleState.spelledIds.map(id => {
            const lObj = scrambleState.scrambledLetters.find(l => l.id === id);
            return lObj ? lObj.char : '';
        }).join('');
        
        if (spelledLetterEl) {
            spelledLetterEl.remove();
        } else {
            const el = ui.elements.scrambleSpelledContainer.querySelector(`[data-id="${charId}"]`);
            if (el) el.remove();
        }
        
        const optionBtn = ui.elements.scrambleOptionsContainer.querySelector(`[data-id="${charId}"]`);
        if (optionBtn) optionBtn.disabled = false;
        
        const letterObj = scrambleState.scrambledLetters.find(l => l.id === charId);
        if (letterObj) letterObj.used = false;
    }
};

/**
 * Validates spelling and triggers answer submission.
 */
const checkScrambleAnswer = async (onAnswerSubmitted) => {
    const isCorrect = scrambleState.spelledWord.toLowerCase().trim() === scrambleState.targetWord.toLowerCase().trim();
    
    // Freeze options and visual block elements
    const letterBtns = ui.elements.scrambleOptionsContainer.querySelectorAll('.letter-btn');
    letterBtns.forEach(btn => btn.style.pointerEvents = 'none');
    
    const spelledLetterEls = ui.elements.scrambleSpelledContainer.querySelectorAll('.scramble-letter');
    spelledLetterEls.forEach(el => {
        el.style.pointerEvents = 'none';
        if (isCorrect) {
            el.style.background = 'var(--success)';
        } else {
            el.style.background = 'var(--danger)';
        }
    });
    
    ui.showQuizFeedback(isCorrect, scrambleState.targetWord, 'scramble');
    await onAnswerSubmitted(isCorrect);
};

/**
 * Properly unbinds all click and keydown listeners to prevent memory leaks.
 */
export const destroyScramble = () => {
    if (optionsClickHandler) {
        ui.elements.scrambleOptionsContainer.removeEventListener('click', optionsClickHandler);
        optionsClickHandler = null;
    }
    if (spelledClickHandler) {
        ui.elements.scrambleSpelledContainer.removeEventListener('click', spelledClickHandler);
        spelledClickHandler = null;
    }
    if (backspaceHandler) {
        ui.elements.scrambleBtnBackspace.removeEventListener('click', backspaceHandler);
        backspaceHandler = null;
    }
    if (clearHandler) {
        ui.elements.scrambleBtnClear.removeEventListener('click', clearHandler);
        clearHandler = null;
    }
    if (speakHandler) {
        ui.elements.scrambleBtnSpeak.removeEventListener('click', speakHandler);
        speakHandler = null;
    }
    if (keydownHandler) {
        window.removeEventListener('keydown', keydownHandler);
        keydownHandler = null;
    }
};
