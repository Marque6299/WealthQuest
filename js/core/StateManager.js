/**
 * WEALTH QUEST: SOVEREIGN ECONOMY
 * State Manager System
 * 
 * Handles LocalStorage persistence, deep cloning/merging of default state,
 * state validation, dynamic Net Worth calculations, and state resets.
 */

import { Config } from '../config.js';

export class StateManager {
    constructor() {
        this.STORAGE_KEY = 'WQ_SOVEREIGN_ECONOMY_SAVE_V1';
    }

    /**
     * Load game state from LocalStorage or return default initial state
     * @returns {Object} Deeply populated state object
     */
    loadState() {
        try {
            const rawSave = localStorage.getItem(this.STORAGE_KEY);
            if (!rawSave) {
                return this.cloneDeep(Config.INITIAL_STATE);
            }

            const parsedSave = JSON.parse(rawSave);
            
            // Merge save with initial state to guarantee schema compliance across updates
            return this.mergeDeep(this.cloneDeep(Config.INITIAL_STATE), parsedSave);
        } catch (error) {
            console.error('Failed to parse saved game state from LocalStorage:', error);
            return this.cloneDeep(Config.INITIAL_STATE);
        }
    }

    /**
     * Persist current state to LocalStorage
     * @param {Object} state - Current active game state
     * @returns {boolean} Success state of save operation
     */
    saveState(state) {
        try {
            if (!state) return false;
            const serialized = JSON.stringify(state);
            localStorage.setItem(this.STORAGE_KEY, serialized);
            return true;
        } catch (error) {
            console.error('Error saving state to LocalStorage:', error);
            return false;
        }
    }

    /**
     * Purge LocalStorage save file
     */
    clearSave() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
        } catch (error) {
            console.error('Error purging saved game state:', error);
        }
    }

    /**
     * Dynamically compute Total Net Worth across liquid cash, high-yield savings,
     * invested asset portfolios, business valuations, and debt liabilities.
     * 
     * @param {Object} state 
     * @param {Array} currentAssetPrices - Array of current market asset objects with prices
     * @returns {number} Net worth value rounded down to integer
     */
    calculateNetWorth(state, currentAssetPrices = []) {
        if (!state) return 0;

        // 1. Liquid Cash & HYSA Savings
        let netWorth = (state.personal.cash || 0) + (state.personal.hysaBalance || 0);

        // 2. Investment Portfolio Market Valuation
        if (state.personal.portfolio) {
            Object.entries(state.personal.portfolio).forEach(([symbol, quantity]) => {
                const asset = currentAssetPrices.find(a => a.symbol === symbol) || 
                              Config.MARKET_ASSETS.find(a => a.symbol === symbol);
                if (asset && quantity > 0) {
                    netWorth += asset.price * quantity;
                }
            });
        }

        // 3. Active Businesses Valuation (Capitalization based on startup cost and current performance)
        if (Array.isArray(state.businesses)) {
            state.businesses.forEach(biz => {
                const valuation = (biz.startupCost || 0) + ((biz.monthlyRevenue || 0) * 12 * 0.5);
                netWorth += valuation;
            });
        }

        // 4. Subtract Outstanding Debt Obligations
        if (Array.isArray(state.personal.debts)) {
            state.personal.debts.forEach(debt => {
                netWorth -= (debt.principal || 0);
            });
        }

        return Math.floor(netWorth);
    }

    /**
     * Deep clone helper to prevent direct reference mutations
     */
    cloneDeep(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    /**
     * Deep merge helper to combine target schema with incoming save properties
     */
    mergeDeep(target, source) {
        if (!this.isObject(target) || !this.isObject(source)) {
            return source;
        }

        Object.keys(source).forEach(key => {
            const targetValue = target[key];
            const sourceValue = source[key];

            if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
                target[key] = sourceValue;
            } else if (this.isObject(targetValue) && this.isObject(sourceValue)) {
                target[key] = this.mergeDeep(this.cloneDeep(targetValue), sourceValue);
            } else {
                target[key] = sourceValue;
            }
        });

        return target;
    }

    isObject(item) {
        return (item && typeof item === 'object' && !Array.isArray(item));
    }
}