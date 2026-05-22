/**
 * Premium toast notification service.
 * Provides show(message, type, duration) and confirm(message) → Promise<boolean>
 */

const CONTAINER_ID = 'toast-container';

const getContainer = () => {
    let el = document.getElementById(CONTAINER_ID);
    if (!el) {
        el = document.createElement('div');
        el.id = CONTAINER_ID;
        document.body.appendChild(el);
    }
    return el;
};

/**
 * Shows a toast notification.
 * @param {string} message
 * @param {'success'|'error'|'info'|'warning'} type
 * @param {number} duration ms
 */
export const toast = (message, type = 'info', duration = 3500) => {
    const container = getContainer();

    const el = document.createElement('div');
    el.className = `toast toast-${type}`;

    const icons = {
        success: 'fa-check-circle',
        error:   'fa-times-circle',
        warning: 'fa-exclamation-circle',
        info:    'fa-info-circle',
    };

    el.innerHTML = `
        <div class="toast-icon"><i class="fas ${icons[type] ?? icons.info}"></i></div>
        <div class="toast-message">${message}</div>
        <button class="toast-close" aria-label="Kapat"><i class="fas fa-times"></i></button>
        <div class="toast-progress"></div>
    `;

    // Manuel kapatma
    el.querySelector('.toast-close').addEventListener('click', () => removeToast(el));

    container.appendChild(el);

    // Giriş animasyonu için bir tick bekle
    requestAnimationFrame(() => el.classList.add('toast-visible'));

    // Progress bar animasyonu
    const progress = el.querySelector('.toast-progress');
    progress.style.transition = `width ${duration}ms linear`;
    requestAnimationFrame(() => {
        requestAnimationFrame(() => { progress.style.width = '0%'; });
    });

    const timer = setTimeout(() => removeToast(el), duration);
    el._toastTimer = timer;
};

const removeToast = (el) => {
    clearTimeout(el._toastTimer);
    el.classList.remove('toast-visible');
    el.classList.add('toast-hiding');
    el.addEventListener('transitionend', () => el.remove(), { once: true });
};

/**
 * Replaces native confirm() with a beautiful modal dialog.
 * @param {string} message
 * @param {string} confirmText
 * @returns {Promise<boolean>}
 */
export const confirmDialog = (message, confirmText = 'Evet, sil') => {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'confirm-overlay';

        overlay.innerHTML = `
            <div class="confirm-dialog">
                <div class="confirm-icon"><i class="fas fa-trash-alt"></i></div>
                <p class="confirm-message">${message}</p>
                <div class="confirm-actions">
                    <button class="confirm-btn-cancel">İptal</button>
                    <button class="confirm-btn-ok">${confirmText}</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('confirm-visible'));

        const close = (result) => {
            overlay.classList.remove('confirm-visible');
            overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
            resolve(result);
        };

        overlay.querySelector('.confirm-btn-cancel').addEventListener('click', () => close(false));
        overlay.querySelector('.confirm-btn-ok').addEventListener('click',     () => close(true));
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false); });
    });
};
