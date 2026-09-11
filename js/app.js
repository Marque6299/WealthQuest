/**
 * WEALTH QUEST: SOVEREIGN ECONOMY
 * Application Entry Bridge
 * 
 * Imports and bootstraps the main GameApp orchestrator once the DOM is ready.
 */

import { GameApp } from './main.js';

// Initialize the core application when the DOM content is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Attach instance to window for debugging and dev console access
    window.gameApp = new GameApp();
});