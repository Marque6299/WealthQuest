/**
 * WEALTH QUEST: SOVEREIGN ECONOMY
 * Master Economy Engine
 * 
 * Orchestrates macro-level economic simulation loops, coordinates 
 * sub-engines (Time, Personal Finance, Business, Market, Trade, Events),
 * manages central bank interest rates, CPI inflation, GDP output, 
 * and controls business cycle phase transitions.
 */

import { TimeEngine } from './TimeEngine.js';
import { EventEngine } from './EventEngine.js';
import { PersonalFinance } from '../modules/PersonalFinance.js';
import { BusinessEngine } from '../modules/BusinessEngine.js';
import { MarketEngine } from '../modules/MarketEngine.js';
import { GlobalTrade } from '../modules/GlobalTrade.js';
import { Config } from '../config.js';

export class EconomyEngine {
    /**
     * @param {Object} state - Reference to global game state
     */
    constructor(state) {
        this.state = state;

        // Initialize sub-engines
        this.timeEngine = new TimeEngine(this.state);
        this.eventEngine = new EventEngine(this.state);
        this.personalFinance = new PersonalFinance(this.state, this);
        this.businessEngine = new BusinessEngine(this.state, this);
        this.marketEngine = new MarketEngine(this.state, this);
        this.globalTrade = new GlobalTrade(this.state, this);
    }

    /**
     * Executes the main End-of-Turn Economic Loop (1 Turn = 1 Month)
     * Process order:
     * 1. Advance Calendar (TimeEngine)
     * 2. Recalculate Macro Dynamics (Cycles, Inflation, Interest Rates, GDP)
     * 3. Tick Market & Asset Volatility (MarketEngine)
     * 4. Tick Global Trade & FX Rates (GlobalTrade)
     * 5. Process Personal Micro-Cashflow (PersonalFinance)
     * 6. Process Business Operating Cashflows (BusinessEngine)
     * 7. Evaluate and Trigger Macro/Micro Events (EventEngine)
     * 
     * @returns {Object} Turn summary bundle { time, netWorth, triggeredEvent, personalNetFlow, businessNetProfit }
     */
    processTurn() {
        // 1. Advance Time Engine
        const timeState = this.timeEngine.tickMonth();

        // 2. Update Macroeconomic Cycle & Structural Indicators
        this.updateMacroDynamics();

        // 3. Tick Capital Markets
        this.marketEngine.tick();

        // 4. Tick Global Trade & FX Commodity Markets
        this.globalTrade.tick();

        // 5. Process Personal Micro-Finance Cashflows
        const personalNetFlow = this.personalFinance.processMonthlyCashFlow();

        // 6. Process Business Enterprise Operating Cashflows
        const businessNetProfit = this.businessEngine.tick();

        // 7. Evaluate Macroeconomic / Narrative Event Triggers
        const triggeredEvent = this.eventEngine.evaluateTrigger();

        return {
            time: timeState,
            personalNetFlow,
            businessNetProfit,
            triggeredEvent,
            macroState: { ...this.state.macro }
        };
    }

    /**
     * Simulates macro-level business cycles, adjusting GDP, inflation,
     * central bank target interest rates, and unemployment rates.
     */
    updateMacroDynamics() {
        const macro = this.state.macro;
        if (!macro) return;

        // 1. Evaluate Business Cycle Phase Progression
        macro.cycleProgress += 1;
        
        // Cycle phase transition every 12 turns (1 Year)
        if (macro.cycleProgress >= 12) {
            macro.cycleProgress = 0;
            const cyclePhases = Config.MACRO_CYCLES || ['Expansion', 'Peak', 'Contraction', 'Trough'];
            const currentIndex = cyclePhases.indexOf(macro.economicCycle);
            const nextIndex = (currentIndex + 1) % cyclePhases.length;
            macro.economicCycle = cyclePhases[nextIndex];
        }

        // 2. Macro Dynamics relative to Cycle Phase
        let baseInflationDelta = 0.0;
        let gdpGrowthDelta = 0.0;
        let unemploymentTarget = 0.045;

        switch (macro.economicCycle) {
            case 'Expansion':
                baseInflationDelta = 0.001;
                gdpGrowthDelta = 0.003;
                unemploymentTarget = 0.038;
                break;
            case 'Peak':
                baseInflationDelta = 0.003; // Overheating economy
                gdpGrowthDelta = 0.001;
                unemploymentTarget = 0.032;
                break;
            case 'Contraction':
                baseInflationDelta = -0.002;
                gdpGrowthDelta = -0.004;
                unemploymentTarget = 0.065;
                break;
            case 'Trough':
                baseInflationDelta = -0.001;
                gdpGrowthDelta = 0.000;
                unemploymentTarget = 0.075;
                break;
            default:
                break;
        }

        // 3. CPI Inflation Rate Update (Clamped between 0.5% and 15%)
        const randomNoise = (Math.random() - 0.48) * 0.002;
        macro.cpiInflationRate = Math.min(0.150, Math.max(0.005, macro.cpiInflationRate + baseInflationDelta + randomNoise));

        // 4. Central Bank Monetary Policy Reaction (Taylor Rule Proxy)
        // If inflation > 3.0%, Central Bank hikes interest rates. If lower, cuts rates to stimulate growth.
        const targetInflation = 0.025;
        if (macro.cpiInflationRate > targetInflation + 0.005) {
            macro.centralBankRate = Math.min(0.120, macro.centralBankRate + 0.0025); // Hawkish Hike
        } else if (macro.cpiInflationRate < targetInflation - 0.005) {
            macro.centralBankRate = Math.max(0.010, macro.centralBankRate - 0.0025); // Dovish Cut
        }

        // 5. Update Real GDP Valuation & Unemployment Rate
        macro.gdpValuation = Math.round(macro.gdpValuation * (1 + gdpGrowthDelta));
        
        // Dynamic convergence toward natural unemployment rate target
        const currentUnemp = macro.unemploymentRate || 0.045;
        macro.unemploymentRate = currentUnemp + (unemploymentTarget - currentUnemp) * 0.15;
    }

    /**
     * Helper getter to retrieve sub-engine instances
     */
    getPersonalFinance() { return this.personalFinance; }
    getBusinessEngine() { return this.businessEngine; }
    getMarketEngine() { return this.marketEngine; }
    getGlobalTrade() { return this.globalTrade; }
    getTimeEngine() { return this.timeEngine; }
    getEventEngine() { return this.eventEngine; }
}