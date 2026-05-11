/**
 * Simple State Management Store
 */
class Store {
    constructor() {
        this.state = {
            user: null,
            words: [],
            quiz: {
                currentWord: null,
                score: 0,
                progress: 0
            },
            ui: {
                currentView: 'auth',
                sidebarCollapsed: false
            }
        };
        this.listeners = [];
    }

    // State'i güncelle ve listener'ları tetikle
    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.notify();
    }

    // Listener ekle
    subscribe(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    // Değişiklikleri bildir
    notify() {
        this.listeners.forEach(callback => callback(this.state));
    }

    // Getters
    getState() {
        return this.state;
    }
}

export const store = new Store();
