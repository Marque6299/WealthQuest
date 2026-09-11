/**
 * WEALTH QUEST: SOVEREIGN ECONOMY
 * Main Application Orchestrator
 * 
 * Initializes global state, attaches core simulation engines, wires up UI handlers,
 * handles turn progression loops, and renders real-time data updates.
 */

import { Config } from './config.js';
import { MacroEngine } from './engine/MacroEngine.js';
import { MarketEngine } from './engine/MarketEngine.js';
import { BusinessEngine } from './engine/BusinessEngine.js';
import { UIRenderer } from './ui/UIRenderer.js';
import { DialogueUI } from './ui/DialogueUI.js';
import { IconGenerator } from './ui/IconGenerator.js';

export class GameApp {
    constructor() {
        // Deep clone initial state from Config
        this.state = JSON.parse(JSON.stringify(Config.INITIAL_STATE));
        
        // Asset Registry Initialization
        this.marketAssets = JSON.parse(JSON.stringify(Config.MARKET_ASSETS));
        this.commodities = JSON.parse(JSON.stringify(Config.GLOBAL_TRADE.COMMODITIES));
        
        // Dynamic Net Worth Tracker History
        this.netWorthHistory = [this.calculateNetWorth()];

        // Instantiate Engines & UI Controllers
        this.macroEngine = new MacroEngine(this.state.macro);
        this.marketEngine = new MarketEngine(this.marketAssets, this.commodities);
        this.businessEngine = new BusinessEngine(this.state.businesses);
        
        this.renderer = new UIRenderer();
        this.dialogue = new DialogueUI();

        this.init();
    }

    /**
     * Initializes app, binds buttons, and conducts first UI render pass
     */
    init() {
        // Generate browser Favicon dynamically
        IconGenerator.generateFavicon();

        // Bind global turn tick button
        const nextTurnBtn = document.getElementById('btn-next-turn');
        if (nextTurnBtn) {
            nextTurnBtn.addEventListener('click', () => this.advanceTurn());
        }

        // Bind HYSA deposit & withdrawal buttons
        this.bindSavingsActions();

        // Bind market asset action delegation
        this.bindMarketActions();

        // Execute initial HUD & screen render pass
        this.updateAndRender();

        this.dialogue.showToast('Welcome to Sovereign Economy. Manage capital, assets, and macro risks.', 'info', 5000);
    }

    /**
     * Calculates combined total Net Worth across liquid cash, HYSA, equities, and business equity
     * 
     * @returns {number} Total Net Worth
     */
    calculateNetWorth() {
        const cash = this.state.personal.cash;
        const hysa = this.state.personal.hysaBalance;

        // Investment portfolio valuation
        let portfolioVal = 0;
        Object.entries(this.state.personal.portfolio).forEach(([symbol, qty]) => {
            const asset = this.marketAssets.find(a => a.symbol === symbol);
            if (asset) portfolioVal += qty * asset.price;
        });

        // Enterprise valuations
        let businessVal = 0;
        this.state.businesses.forEach(b => {
            businessVal += (b.valuation || 0);
        });

        // Outstanding liabilities
        let totalDebt = 0;
        this.state.personal.debts.forEach(d => {
            totalDebt += d.principal;
        });

        return (cash + hysa + portfolioVal + businessVal) - totalDebt;
    }

    /**
     * Advances the game state by one month turn tick
     */
    advanceTurn() {
        // 1. Advance Calendar
        this.state.time.totalTurns++;
        this.state.time.month++;
        if (this.state.time.month > 12) {
            this.state.time.month = 1;
            this.state.time.year++;
        }

        // 2. Simulate Macroeconomic Cycle & Rates Shift
        this.macroEngine.step(this.state.macro);

        // 3. Step Market Prices with Macro Impact
        this.marketEngine.step(this.state.macro);

        // 4. Process Monthly Personal Finances (Salary + Yields - Expenses - Debt)
        const netSalary = this.state.personal.salary - this.state.personal.baseLivingExpenses;
        this.state.personal.cash += netSalary;

        // HYSA Monthly Interest
        const hysaInterest = this.state.personal.hysaBalance * (this.state.personal.hysaInterestRate / 12);
        this.state.personal.hysaBalance += hysaInterest;

        // Asset Dividend Distributions
        Object.entries(this.state.personal.portfolio).forEach(([symbol, qty]) => {
            const asset = this.marketAssets.find(a => a.symbol === symbol);
            if (asset && asset.dividendYield > 0) {
                const monthlyDiv = (qty * asset.price * (asset.dividendYield / 12));
                this.state.personal.cash += monthlyDiv;
            }
        });

        // 5. Process Business Earnings
        const businessProfit = this.businessEngine.step(this.state.businesses, this.state.macro);
        this.state.personal.cash += businessProfit;

        // 6. Record Historical Net Worth & Re-render
        const currentNetWorth = this.calculateNetWorth();
        this.netWorthHistory.push(currentNetWorth);

        this.updateAndRender();

        this.dialogue.showToast(`Turn ${this.state.time.totalTurns}: Advanced to Month ${this.state.time.month}, Year ${this.state.time.year}`, 'success', 2500);
    }

    /**
     * Executes UI sync across HUD and active screens
     */
    updateAndRender() {
        const netWorth = this.calculateNetWorth();
        this.renderer.renderAll(
            this.state,
            this.marketAssets,
            this.commodities,
            netWorth,
            this.netWorthHistory
        );
    }

    /**
     * Binds deposit and withdrawal logic for HYSA
     */
    bindSavingsActions() {
        const depositBtn = document.getElementById('btn-hysa-deposit');
        const withdrawBtn = document.getElementById('btn-hysa-withdraw');

        if (depositBtn) {
            depositBtn.addEventListener('click', () => {
                const amount = 500;
                if (this.state.personal.cash >= amount) {
                    this.state.personal.cash -= amount;
                    this.state.personal.hysaBalance += amount;
                    this.updateAndRender();
                    this.dialogue.showToast(`Deposited $${amount} into HYSA.`, 'info');
                } else {
                    this.dialogue.showToast('Insufficient cash available.', 'error');
                }
            });
        }

        if (withdrawBtn) {
            withdrawBtn.addEventListener('click', () => {
                const amount = 500;
                if (this.state.personal.hysaBalance >= amount) {
                    this.state.personal.hysaBalance -= amount;
                    this.state.personal.cash += amount;
                    this.updateAndRender();
                    this.dialogue.showToast(`Withdrew $${amount} from HYSA.`, 'info');
                } else {
                    this.dialogue.showToast('Insufficient HYSA balance.', 'error');
                }
            });
        }
    }

    /**
     * Binds purchase and sale delegation for financial markets
     */
    bindMarketActions() {
        const marketList = document.getElementById('market-asset-list');
        if (!marketList) return;

        marketList.addEventListener('click', (e) => {
            const buyBtn = e.target.closest('.wq-btn-buy');
            const sellBtn = e.target.closest('.wq-btn-sell');

            if (buyBtn) {
                const symbol = buyBtn.dataset.symbol;
                this.buyAsset(symbol, 1);
            } else if (sellBtn) {
                const symbol = sellBtn.dataset.symbol;
                this.sellAsset(symbol, 1);
            }
        });
    }

    /**
     * Executes security purchase
     */
    buyAsset(symbol, quantity = 1) {
        const asset = this.marketAssets.find(a => a.symbol === symbol);
        if (!asset) return;

        const totalCost = asset.price * quantity;
        if (this.state.personal.cash >= totalCost) {
            this.state.personal.cash -= totalCost;
            this.state.personal.portfolio[symbol] = (this.state.personal.portfolio[symbol] || 0) + quantity;
            this.updateAndRender();
            this.dialogue.showToast(`Purchased ${quantity} share(s) of ${symbol} for $${totalCost.toFixed(2)}`, 'success');
        } else {
            this.dialogue.showToast(`Insufficient cash to purchase ${symbol}.`, 'error');
        }
    }

    /**
     * Executes security sale
     */
    sellAsset(symbol, quantity = 1) {
        const owned = this.state.personal.portfolio[symbol] || 0;
        if (owned < quantity) {
            this.dialogue.showToast(`You do not own enough shares of ${symbol}.`, 'error');
            return;
        }

        const asset = this.marketAssets.find(a => a.symbol === symbol);
        if (!asset) return;

        const proceeds = asset.price * quantity;
        this.state.personal.portfolio[symbol] -= quantity;
        this.state.personal.cash += proceeds;

        this.updateAndRender();
        this.dialogue.showToast(`Sold ${quantity} share(s) of ${symbol} for $${proceeds.toFixed(2)}`, 'info');
    }
}

// Instantiate game on DOM loaded
document.addEventListener('DOMContentLoaded', () => {
    window.gameApp = new GameApp();
});