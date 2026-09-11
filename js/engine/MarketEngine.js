/**
 * WEALTH QUEST: SOVEREIGN ECONOMY
 * Financial Market Simulation Engine
 * 
 * Updates price history curves for Equities, Bonds, REITs, and Commodities
 * using Geometric Brownian Motion (GBM) modified by macroeconomic drivers.
 */

export class MarketEngine {
    constructor(assets = [], commodities = []) {
        this.assets = assets;
        this.commodities = commodities;
    }

    /**
     * Steps all securities and global commodity prices by one month turn
     * 
     * @param {Object} macroState - Global macro conditions
     */
    step(macroState) {
        // Step financial market assets
        this.assets.forEach(asset => {
            const newPrice = this.calculateNextPrice(asset, macroState);
            asset.price = newPrice;
            
            // Maintain sliding window history of last 24 turns
            if (!Array.isArray(asset.history)) asset.history = [];
            asset.history.push(newPrice);
            if (asset.history.length > 24) asset.history.shift();
        });

        // Step global trade commodities
        this.commodities.forEach(item => {
            const newPrice = this.calculateNextCommodityPrice(item, macroState);
            item.price = newPrice;

            if (!Array.isArray(item.history)) item.history = [];
            item.history.push(newPrice);
            if (item.history.length > 24) item.history.shift();
        });
    }

    /**
     * Calculates next price for financial assets via GBM + Macro sensitivity
     */
    calculateNextPrice(asset, macro) {
        let macroDriftModifier = 0;

        // Macro phase impacts by category
        if (asset.category === 'Equity ETF' || asset.category === 'Individual Stock') {
            if (macro.economicCycle === 'Expansion') macroDriftModifier += 0.012;
            if (macro.economicCycle === 'Peak') macroDriftModifier += 0.002;
            if (macro.economicCycle === 'Contraction') macroDriftModifier -= 0.018;
            if (macro.economicCycle === 'Trough') macroDriftModifier += 0.005;

            // Interest rate headwind on high growth stocks
            macroDriftModifier -= (macro.centralBankRate * 0.1);
        } else if (asset.category === 'Bonds') {
            // Bond prices move inversely to interest rate changes
            if (macro.economicCycle === 'Contraction') macroDriftModifier += 0.008; // Rate cuts boost bond prices
            if (macro.economicCycle === 'Expansion') macroDriftModifier -= 0.004;
        } else if (asset.category === 'REIT') {
            // REITs benefit from moderate inflation but suffer under high interest rates
            macroDriftModifier += (macro.cpiInflationRate * 0.2);
            macroDriftModifier -= (macro.centralBankRate * 0.15);
        }

        // Geometric Brownian Motion formula approximation: S_t = S_0 * exp((drift - 0.5 * vol^2) + vol * Z)
        const dt = 1 / 12; // Monthly step
        const drift = (asset.drift || 0.05) + macroDriftModifier;
        const volatility = asset.volatility || 0.04;
        
        // Box-Muller transformation for standard normal random variable Z ~ N(0,1)
        const u1 = Math.random() || 0.0001;
        const u2 = Math.random() || 0.0001;
        const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

        const returnRate = (drift - 0.5 * Math.pow(volatility, 2)) * dt + volatility * Math.sqrt(dt) * z;
        const nextPrice = asset.price * Math.exp(returnRate);

        return Math.max(1.00, parseFloat(nextPrice.toFixed(2)));
    }

    /**
     * Calculates next price for trade commodities
     */
    calculateNextCommodityPrice(item, macro) {
        let macroImpact = 0;

        if (macro.economicCycle === 'Expansion' || macro.economicCycle === 'Peak') {
            macroImpact += 0.008; // High industrial demand
        } else {
            macroImpact -= 0.010;
        }

        // Inflation adjustment
        macroImpact += (macro.cpiInflationRate * 0.1);

        const noise = (Math.random() - 0.5) * (item.volatility || 0.05);
        const nextPrice = item.price * (1 + macroImpact + noise);

        return Math.max(0.50, parseFloat(nextPrice.toFixed(2)));
    }
}