/**
 * WEALTH QUEST: SOVEREIGN ECONOMY
 * Dialogue UI Module
 * 
 * Handles interactive modal dialogs, narrative choice branches,
 * event popups, notification toasts, and economic shock alerts.
 */

export class DialogueUI {
    constructor() {
        this.activeModal = null;
        this.toastContainer = null;
        this.initToastContainer();
    }

    /**
     * Initializes a floating container element for toast notifications
     */
    initToastContainer() {
        if (document.getElementById('wq-toast-container')) {
            this.toastContainer = document.getElementById('wq-toast-container');
            return;
        }

        const container = document.createElement('div');
        container.id = 'wq-toast-container';
        container.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            z-index: 10000;
            pointer-events: none;
        `;
        document.body.appendChild(container);
        this.toastContainer = container;
    }

    /**
     * Displays a transient notification toast message
     * 
     * @param {string} message - Message body text
     * @param {string} type - Toast type ('success' | 'error' | 'warning' | 'info')
     * @param {number} duration - Display duration in milliseconds
     */
    showToast(message, type = 'info', duration = 3500) {
        if (!this.toastContainer) this.initToastContainer();

        const toast = document.createElement('div');
        toast.className = `wq-toast wq-toast-${type}`;

        let accentColor = '#2196F3';
        if (type === 'success') accentColor = '#4CAF50';
        if (type === 'error') accentColor = '#FF5252';
        if (type === 'warning') accentColor = '#FFC107';

        toast.style.cssText = `
            background: #1C1C1E;
            color: #FFFFFF;
            border-left: 4px solid ${accentColor};
            padding: 12px 18px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 0.9rem;
            min-width: 240px;
            max-width: 360px;
            pointer-events: auto;
            opacity: 0;
            transform: translateY(10px);
            transition: opacity 0.25s ease, transform 0.25s ease;
        `;

        toast.innerText = message;
        this.toastContainer.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        });

        // Automatically remove toast after specified duration
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 250);
        }, duration);
    }

    /**
     * Renders a full interactive dialogue modal window for macroeconomic events or narrative choices
     * 
     * @param {Object} eventData - Narrative payload { title, category, description, choices }
     * @param {Object} state - Reference to global game state
     * @param {Function} onSelectCallback - Resolution callback invoked when choice is selected
     */
    showEventModal(eventData, state, onSelectCallback) {
        if (!eventData) return;

        // Dismiss any active existing modal
        this.dismissModal();

        const backdrop = document.createElement('div');
        backdrop.id = 'wq-modal-backdrop';
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.82);
            backdrop-filter: blur(4px);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.2s ease;
        `;

        const choicesHtml = (eventData.choices || []).map((choice, idx) => `
            <button class="wq-choice-btn" data-index="${idx}" style="
                width: 100%;
                background: #2A2A2D;
                border: 1px solid #3A3A3C;
                color: #FFFFFF;
                padding: 12px 16px;
                margin-top: 10px;
                border-radius: 8px;
                cursor: pointer;
                text-align: left;
                transition: background 0.2s ease, border-color 0.2s ease;
            ">
                <div style="font-weight: 600; font-size: 0.95rem; color: #4E9F3D;">${choice.title}</div>
                <div style="font-size: 0.85rem; color: #AAA; margin-top: 4px;">${choice.description}</div>
            </button>
        `).join('');

        backdrop.innerHTML = `
            <div class="wq-modal-card" style="
                background: #141416;
                border: 1px solid #2C2C2E;
                padding: 24px;
                border-radius: 12px;
                max-width: 520px;
                width: 90%;
                box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6);
            ">
                <span style="
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.8px;
                    color: #00ADB5;
                ">${eventData.category || 'Economic Event'}</span>
                
                <h2 style="
                    margin: 8px 0 12px 0;
                    font-size: 1.35rem;
                    color: #EEEEEE;
                ">${eventData.title}</h2>
                
                <p style="
                    color: #CCCCCC;
                    font-size: 0.92rem;
                    line-height: 1.5;
                    margin-bottom: 16px;
                ">${eventData.description}</p>
                
                <div style="display: flex; flex-direction: column;">
                    ${choicesHtml}
                </div>
            </div>
        `;

        document.body.appendChild(backdrop);
        this.activeModal = backdrop;

        // Fade in modal card
        requestAnimationFrame(() => {
            backdrop.style.opacity = '1';
        });

        // Add event listeners and mouse hover interactions to choice options
        const choiceBtns = backdrop.querySelectorAll('.wq-choice-btn');
        choiceBtns.forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                btn.style.background = '#3A3A3D';
                btn.style.borderColor = '#00ADB5';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.background = '#2A2A2D';
                btn.style.borderColor = '#3A3A3C';
            });

            btn.addEventListener('click', (e) => {
                const choiceIdx = parseInt(e.currentTarget.dataset.index, 10);
                const choice = eventData.choices[choiceIdx];

                if (choice && typeof choice.impact === 'function') {
                    choice.impact(state);
                }

                this.dismissModal();

                if (typeof onSelectCallback === 'function') {
                    onSelectCallback(choice);
                }
            });
        });
    }

    /**
     * Prompts a standard confirmation dialog
     * 
     * @param {string} title - Dialog title
     * @param {string} message - Description message
     * @param {Function} onConfirm - Callback if player confirms action
     */
    showConfirm(title, message, onConfirm) {
        this.dismissModal();

        const backdrop = document.createElement('div');
        backdrop.id = 'wq-modal-backdrop';
        backdrop.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0, 0, 0, 0.8); display: flex; justify-content: center;
            align-items: center; z-index: 9999;
        `;

        backdrop.innerHTML = `
            <div style="background: #18181B; border: 1px solid #333; padding: 20px; border-radius: 10px; max-width: 400px; width: 90%;">
                <h3 style="margin-top: 0; color: #FFF;">${title}</h3>
                <p style="color: #AAA; font-size: 0.9rem;">${message}</p>
                <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                    <button id="wq-confirm-cancel" style="padding: 8px 16px; background: #333; color: #FFF; border: none; border-radius: 6px; cursor: pointer;">Cancel</button>
                    <button id="wq-confirm-ok" style="padding: 8px 16px; background: #E53935; color: #FFF; border: none; border-radius: 6px; cursor: pointer;">Confirm</button>
                </div>
            </div>
        `;

        document.body.appendChild(backdrop);
        this.activeModal = backdrop;

        document.getElementById('wq-confirm-cancel')?.addEventListener('click', () => this.dismissModal());
        document.getElementById('wq-confirm-ok')?.addEventListener('click', () => {
            this.dismissModal();
            if (typeof onConfirm === 'function') onConfirm();
        });
    }

    /**
     * Removes active modal backdrop from DOM
     */
    dismissModal() {
        if (this.activeModal && this.activeModal.parentNode) {
            this.activeModal.parentNode.removeChild(this.activeModal);
            this.activeModal = null;
        }
    }
}