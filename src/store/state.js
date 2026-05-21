/**
 * Simple State Management Store
 */
class Store {
    constructor() {
        this.state = {
            user: null,
            words: [],
            quiz: {
                mode:         'cloze',   // 'cloze' | 'scramble' | 'dictation'
                sessionWords: [],
                index:        0,
                currentWord:  null,
                cardRevealed: false,    // flashcard: anlamı gösterip göstermeme
            },
            ui: {
                currentView:      'auth',
                sidebarCollapsed: false,
            },
        };
        this.listeners = [];
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.notify();
    }

    subscribe(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    notify() {
        this.listeners.forEach(callback => callback(this.state));
    }

    getState() {
        return this.state;
    }
}

export const store = new Store();
