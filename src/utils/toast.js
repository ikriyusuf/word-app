/**
 * Premium toast notification service.
 *
 * Security: All user-provided messages are set via textContent (not innerHTML)
 * to prevent XSS attacks.
 *
 * Provides:
 *   - toast(message, type, duration)  → shows a notification
 *   - confirmDialog(message, confirmText) → Promise<boolean>
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
 *
 * @param {string} message - The message to display (safely rendered via textContent).
 * @param {'success'|'error'|'info'|'warning'} type - Visual style of the notification.
 * @param {number} duration - Display duration in milliseconds.
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

    // Build structure safely — no innerHTML for user content
    const iconDiv = document.createElement('div');
    iconDiv.className = 'toast-icon';
    iconDiv.innerHTML = `<i class="fas ${icons[type] ?? icons.info}"></i>`;

    const messageDiv = document.createElement('div');
    messageDiv.className = 'toast-message';
    messageDiv.textContent = message; // Safe: textContent prevents XSS

    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.setAttribute('aria-label', 'Kapat');
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';

    const progress = document.createElement('div');
    progress.className = 'toast-progress';

    el.appendChild(iconDiv);
    el.appendChild(messageDiv);
    el.appendChild(closeBtn);
    el.appendChild(progress);

    closeBtn.addEventListener('click', () => removeToast(el));
    container.appendChild(el);

    // Entry animation
    requestAnimationFrame(() => el.classList.add('toast-visible'));

    // Progress bar animation
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
 * Replaces native confirm() with a modal dialog.
 * The message is set via textContent to prevent XSS.
 *
 * @param {string} message - The confirmation question (safe, not rendered as HTML).
 * @param {string} confirmText - Text for the confirm button.
 * @returns {Promise<boolean>} Resolves to true if confirmed, false if cancelled.
 */
export const confirmDialog = (message, confirmText = 'Evet, sil') => {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'confirm-overlay';

        // Build structure safely without innerHTML for user content
        const dialog = document.createElement('div');
        dialog.className = 'confirm-dialog';

        const iconDiv = document.createElement('div');
        iconDiv.className = 'confirm-icon';
        iconDiv.innerHTML = '<i class="fas fa-trash-alt"></i>';

        const messageEl = document.createElement('p');
        messageEl.className = 'confirm-message';
        messageEl.textContent = message; // Safe: textContent prevents XSS

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'confirm-actions';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'confirm-btn-cancel';
        cancelBtn.textContent = 'İptal';

        const okBtn = document.createElement('button');
        okBtn.className = 'confirm-btn-ok';
        okBtn.textContent = confirmText;

        actionsDiv.appendChild(cancelBtn);
        actionsDiv.appendChild(okBtn);
        dialog.appendChild(iconDiv);
        dialog.appendChild(messageEl);
        dialog.appendChild(actionsDiv);
        overlay.appendChild(dialog);

        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('confirm-visible'));

        const close = (result) => {
            overlay.classList.remove('confirm-visible');
            overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
            resolve(result);
        };

        cancelBtn.addEventListener('click', () => close(false));
        okBtn.addEventListener('click',     () => close(true));
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false); });
    });
};
