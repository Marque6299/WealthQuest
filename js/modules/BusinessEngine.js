/**
 * WEALTH QUEST: SOVEREIGN ECONOMY
 * Business Engine Module
 * 
 * Manages enterprise incubation, monthly revenue drivers,
 * OpEx adjustments, marketing expansion, and venture performance.
 */

import { Config } from '../config.js';

export class BusinessEngine {
    /**
     * @param {Object} state - Reference to global game state
     * @param {Object} economyEngine - Reference to EconomyEngine instance
     */
    constructor(state, economyEngine) {
        this.state = state;
        this.economyEngine = economyEngine;
    }

    /**
     * Ticks all active owned enterprises for the current turn.
     * Computes gross revenue based on macro demand, deducts inflation-adjusted OpEx,
     * and deposits net profit into personal liquid reserves.
     * 
     * @returns {number} Total monthly net business profit across all ventures
     */
    tick() {
        if (!Array.isArray(this.state.businesses) || this.state.businesses.length === 0) {
            return 0;
        }

        let totalMonthlyNetProfit = 0;
        const inflation = this.state.macro.cpiInflationRate || 0.025;
        const cycle = this.state.macro.economicCycle || 'Expansion';

        // Macro demand modifier based on economic cycle
        let cycleDemandMultiplier = 1.0;
        if (cycle === 'Expansion') cycleDemandMultiplier = 1.15;
        if (cycle === 'Peak') cycleDemandMultiplier = 1.25;
        if (cycle === 'Contraction') cycleDemandMultiplier = 0.85;
        if (cycle === 'Trough') cycleDemandMultiplier = 0.70;

        this.state.businesses.forEach(biz => {
            // 1. Calculate Monthly Volatility & Fluctuation
            const randomFluc = (Math.random() - 0.48) * (biz.volatility || 0.10);
            
            // 2. Gross Revenue Calculation
            const grossRevenue = biz.baseMonthlyRevenue * cycleDemandMultiplier * (1 + randomFluc);

            // 3. OpEx Calculation (Adjusted for Inflation)
            const currentOpEx = biz.baseMonthlyOpEx * (1 + inflation);

            // 4. Net Business Cash Flow
            const netProfit = grossRevenue - currentOpEx;
            biz.lastMonthlyRevenue = Math.round(grossRevenue);
            biz.lastMonthlyOpEx = Math.round(currentOpEx);
            biz.lastMonthlyNetProfit = Math.round(netProfit);

            totalMonthlyNetProfit += netProfit;
        });

        // Deposit net business cash flows into liquid reserves
        this.state.personal.cash = Math.max(0, this.state.personal.cash + totalMonthlyNetProfit);

        return Math.round(totalMonthlyNetProfit);
    }

    /**
     * Incubates and launches a new enterprise from a startup template
     * 
     * @param {string} templateType - Type string (e.g., 'ECOM', 'CAFE', 'SaaS')
     * @returns {boolean} Success state of purchase
     */
    launchStartup(templateType) {
        const template = Config.STARTUP_TEMPLATES.find(t => t.type === templateType);
        if (!template) return false;

        // Check if player has required liquid capital
        if (this.state.personal.cash < template.startupCost) {
            return false;
        }

        // Deduct startup capital
        this.state.personal.cash -= template.startupCost;

        // Create active enterprise instance
        const newBusiness = {
            id: 'BIZ_' + Date.now(),
            type: template.type,
            name: template.name,
            startupCost: template.startupCost,
            baseMonthlyRevenue: template.baseMonthlyRevenue,
            baseMonthlyOpEx: template.baseMonthlyOpEx,
            volatility: template.volatility,
            level: 1,
            lastMonthlyRevenue: template.baseMonthlyRevenue,
            lastMonthlyOpEx: template.baseMonthlyOpEx,
            lastMonthlyNetProfit: template.baseMonthlyRevenue - template.baseMonthlyOpEx
        };

        if (!Array.isArray(this.state.businesses)) {
            this.state.businesses = [];
        }

        this.state.businesses.push(newBusiness);
        return true;
    }

    /**
     * Expand and scale an existing enterprise (CapEx reinvestment)
     * Increases base monthly revenue capacity by 45% for a CapEx fee.
     * 
     * @param {string} businessId 
     * @returns {boolean}
     */
    upgradeBusiness(businessId) {
        const biz = this.state.businesses.find(b => b.id === businessId);
        if (!biz) return false;

        const capexCost = Math.round(biz.startupCost * 0.75 * biz.level);

        if (this.state.personal.cash >= capexCost) {
            this.state.personal.cash -= capexCost;
            biz.level += 1;
            biz.baseMonthlyRevenue = Math.round(biz.baseMonthlyRevenue * 1.45);
            biz.baseMonthlyOpEx = Math.round(biz.baseMonthlyOpEx * 1.25);
            return true;
        }

        return false;
    }
}