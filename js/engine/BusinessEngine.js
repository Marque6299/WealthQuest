/**
 * WEALTH QUEST: SOVEREIGN ECONOMY
 * Enterprise & Business Engine
 * 
 * Processes monthly enterprise revenues, operating expenses, inflation adjustments,
 * economic sensitivity shocks, and enterprise valuations.
 */

export class BusinessEngine {
    constructor(businesses = []) {
        this.businesses = businesses;
    }

    /**
     * Simulates monthly operating cash flow across all owned businesses
     * 
     * @param {Array} businesses - List of operational player businesses
     * @param {Object} macroState - Current macro state parameters
     * @returns {number} Net cash profit generated across all businesses
     */
    step(businesses = [], macroState = {}) {
        let totalNetProfit = 0;

        businesses.forEach(biz => {
            // Apply macro environment multiplier
            let cycleDemandMultiplier = 1.0;
            if (macroState.economicCycle === 'Expansion') cycleDemandMultiplier = 1.15;
            if (macroState.economicCycle === 'Peak') cycleDemandMultiplier = 1.08;
            if (macroState.economicCycle === 'Contraction') cycleDemandMultiplier = 0.82;
            if (macroState.economicCycle === 'Trough') cycleDemandMultiplier = 0.90;

            // OpEx increases with inflation rate
            const inflationCostFactor = 1 + (macroState.cpiInflationRate || 0.02) / 12;
            biz.baseMonthlyOpEx = Math.round(biz.baseMonthlyOpEx * inflationCostFactor);

            // Revenue calculation with volatility noise
            const volatility = biz.volatility || 0.10;
            const noise = 1 + (Math.random() - 0.5) * volatility;
            
            const monthlyRevenue = Math.round(biz.baseMonthlyRevenue * cycleDemandMultiplier * noise);
            const monthlyOpEx = biz.baseMonthlyOpEx;
            const netProfit = monthlyRevenue - monthlyOpEx;

            biz.lastMonthlyProfit = netProfit;
            totalNetProfit += netProfit;

            // Recalculate business enterprise valuation (8x annual net profit multiple)
            const annualProfit = Math.max(1000, netProfit * 12);
            biz.valuation = Math.round(annualProfit * 8);
        });

        return totalNetProfit;
    }

    /**
     * Instantiates a new startup enterprise entity
     * 
     * @param {Object} template - Business configuration template from Config
     * @param {string} customName - Optional custom business name
     * @returns {Object} Operational business instance object
     */
    static createBusiness(template, customName = '') {
        return {
            id: `BIZ_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            type: template.type,
            name: customName || template.name,
            baseMonthlyRevenue: template.baseMonthlyRevenue,
            baseMonthlyOpEx: template.baseMonthlyOpEx,
            volatility: template.volatility,
            lastMonthlyProfit: template.baseMonthlyRevenue - template.baseMonthlyOpEx,
            valuation: (template.baseMonthlyRevenue - template.baseMonthlyOpEx) * 12 * 8
        };
    }
}