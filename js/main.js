/**
 * WEALTH QUEST: SOVEREIGN ECONOMY
 * Main Application Orchestrator & State Loop
 */

import { Config } from './config.js';
import { StateManager } from './core/StateManager.js';
import { TimeEngine } from './core/TimeEngine.js';
import { EventEngine } from './core/EventEngine.js';

import { PersonalFinance } from './modules/PersonalFinance.js';
import { BusinessEngine } from './modules/BusinessEngine.js';
import { MarketEngine } from './modules/MarketEngine.js';
import { GlobalTrade } from './modules/GlobalTrade.js';
import { EconomyEngine } from './modules/EconomyEngine.js';

import { RenderEngine } from './ui/RenderEngine.js';
import { ChartRenderer } from './ui/ChartRenderer.js';
import { DialogueUI } from './ui/DialogueUI.js';

class GameApp {
    constructor() {
        // Initialize State Manager
        this.stateManager = new StateManager();
        this.state = this.stateManager.loadState() || Config.INITIAL_STATE;

        // Initialize Core Engines
        this.timeEngine = new TimeEngine(this.state);
        this.eventEngine = new EventEngine(this.state);
        this.economyEngine = new EconomyEngine(this.state);

        // Initialize Financial & Business Subsystems
        this.personalFinance = new PersonalFinance(this.state, this.economyEngine);
        this.businessEngine = new BusinessEngine(this.state, this.economyEngine);
        this.marketEngine = new MarketEngine(this.state, this.economyEngine);
        this.globalTrade = new GlobalTrade(this.state, this.economyEngine);

        // Initialize UI Layer
        this.chartRenderer = new ChartRenderer('marketChart');
        this.dialogueUI = new DialogueUI();
        this.renderer = new RenderEngine(this);

        this.init();
    }

    /**
     * Boot Sequence: Wire Listeners & Perform Initial Render
     */
    init() {
        this.setupNavigation();
        this.setupActionListeners();

        // Initial UI Render Cycle
        this.renderer.updateHUD();
        this.renderer.renderAllTabs();
        this.chartRenderer.renderAssetChart(this.marketEngine.getSelectedAsset());

        this.logLedger("Game Start", "Initial liquidity and capital reserves deployed.", 0);
    }

    /**
     * Tab Navigation Listener Setup
     */
    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const targetTab = e.target.dataset.tab;
                
                navButtons.forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));

                e.target.classList.add('active');
                const activePanel = document.getElementById(`tab-${targetTab}`);
                if (activePanel) {
                    activePanel.classList.add('active');
                }

                // Refresh chart if switching back to markets tab
                if (targetTab === 'markets') {
                    this.chartRenderer.renderAssetChart(this.marketEngine.getSelectedAsset());
                }
            });
        });
    }

    /**
     * UI Action Events (End Turn, HYSA, Asset Trading, Loans)
     */
    setupActionListeners() {
        // Advance Turn Button
        document.getElementById('btn-next-turn').addEventListener('click', () => {
            this.advanceTurn();
        });

        // HYSA Deposit / Withdraw
        document.getElementById('btn-deposit-hysa').addEventListener('click', () => {
            this.personalFinance.depositHYSA(500);
            this.renderer.updateHUD();
            this.renderer.renderPersonalTab();
        });

        document.getElementById('btn-withdraw-hysa').addEventListener('click', () => {
            this.personalFinance.withdrawHYSA(500);
            this.renderer.updateHUD();
            this.renderer.renderPersonalTab();
        });

        // Take Commercial/Personal Loan
        document.getElementById('btn-take-loan').addEventListener('click', () => {
            this.dialogueUI.showLoanModal((amount, term) => {
                this.personalFinance.takeLoan(amount, term);
                this.renderer.updateHUD();
                this.renderer.renderPersonalTab();
            });
        });

        // Market Trading Controls
        document.getElementById('btn-buy-asset').addEventListener('click', () => {
            const qty = parseInt(document.getElementById('trade-quantity').value, 10) || 1;
            this.marketEngine.buySelectedAsset(qty);
            this.renderer.updateHUD();
            this.renderer.renderMarketTab();
            this.chartRenderer.renderAssetChart(this.marketEngine.getSelectedAsset());
        });

        document.getElementById('btn-sell-asset').addEventListener('click', () => {
            const qty = parseInt(document.getElementById('trade-quantity').value, 10) || 1;
            this.marketEngine.sellSelectedAsset(qty);
            this.renderer.updateHUD();
            this.renderer.renderMarketTab();
            this.chartRenderer.renderAssetChart(this.marketEngine.getSelectedAsset());
        });
    }

    /**
     * Main Monthly Turn Loop
     */
    advanceTurn() {
        // 1. Advance Calendar
        this.timeEngine.tickMonth();

        // 2. Update Macroeconomy (Inflation & Interest Rates)
        this.economyEngine.tick();

        // 3. Process Personal Financial Cash Flows
        const netCashflow = this.personalFinance.processMonthlyCashFlow();

        // 4. Tick Capital Markets & FX Rates
        this.marketEngine.tick();
        this.globalTrade.tick();

        // 5. Process Active Business Net Revenues
        const businessProfit = this.businessEngine.tick();

        // 6. Record Historical Ledger Log
        this.logLedger(
            `Month ${this.state.time.month}, Year ${this.state.time.year}`,
            `Net Cashflow: $${netCashflow.toLocaleString()} | Biz Revenue: $${businessProfit.toLocaleString()}`,
            netCashflow + businessProfit
        );

        // 7. Random Macroeconomic Events
        const randomEvent = this.eventEngine.evaluateTrigger();
        if (randomEvent) {
            this.dialogueUI.showEventModal(randomEvent, (choiceImpact) => {
                if (choiceImpact) choiceImpact(this.state);
                this.renderer.updateHUD();
                this.renderer.renderAllTabs();
            });
        }

        // 8. Save State & Re-render UI
        this.stateManager.saveState(this.state);
        this.renderer.updateHUD();
        this.renderer.renderAllTabs();
        this.chartRenderer.renderAssetChart(this.marketEngine.getSelectedAsset());
    }

    /**
     * Record Historical Ledger Activity
     */
    logLedger(category, description, impact) {
        if (!this.state.ledger) this.state.ledger = [];
        this.state.ledger.unshift({
            date: `M${this.state.time.month} Y${this.state.time.year}`,
            category,
            description,
            impact,
            endingCash: this.state.personal.cash
        });

        if (this.state.ledger.length > 50) this.state.ledger.pop();
        this.renderer.renderLedgerTab();
    }
}

// Global App Initialization on DOM Ready
window.addEventListener('DOMContentLoaded', () => {
    window.gameApp = new GameApp();
});