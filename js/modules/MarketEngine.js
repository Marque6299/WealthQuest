/**
 * WEALTH QUEST: SOVEREIGN ECONOMY
 * Market Engine Module
 * 
 * Simulates capital markets (Equities, Growth Stocks, Bonds, REITs),
 * price volatility algorithms, portfolio asset management, asset trading,
 * dividend distributions, and chart state data.
 */

import { Config } from '../config.js';

export class MarketEngine {
    /**
     * @param {Object} state - Reference to global game state
     * @param {Object} economyEngine - Reference to EconomyEngine instance
     */
    constructor(state, economyEngine) {
        this.state = state;
        this.economyEngine = economyEngine;
        
        // Load initial market assets or bind from Config
        this.assets = Config.MARKET_ASSETS.map(asset => ({ ...asset }));
        this.selectedSymbol = 'SPX'; // Default active asset ticker
    }

    /**
     * Ticks the market forward by 1 turn (1 Month):
     * - Simulates asset price movements using stochastic random walk
     * - Adjusts asset growth drift based on macroeconomic interest rates
     * - Distributes quarterly dividend yields into player's cash reserves
     */
    tick() {
        const centralBankRate = this.state.macro.centralBankRate || 0.05;
        const cycle = this.state.macro.economicCycle || 'Expansion';

        // Economic cycle impact on equity asset growth
        let macroDriftModifier = 0.0;
        if (cycle === 'Expansion') macroDriftModifier = 0.004;
        if (cycle === 'Peak') macroDriftModifier = 0.008;
        if (cycle === 'Contraction') macroDriftModifier = -0.012;
        if (cycle === 'Trough') macroDriftModifier = -0.005;

        this.assets.forEach(asset => {
            // High Central Bank Interest Rates weigh down Tech/Equity valuations but aid Bond yields
            let rateSensitivity = 0.0;
            if (asset.category === 'Individual Stock' || asset.category === 'Equity ETF') {
                rateSensitivity = -(centralBankRate * 0.1);
            } else if (asset.category === 'Bonds') {
                rateSensitivity = (centralBankRate * 0.05); // Fixed income stability
            }

            // Calculate Random Walk Delta using asset volatility
            const randomShock = (Math.random() - 0.48) * asset.volatility;
            const totalGrowthRate = asset.drift + macroDriftModifier + rateSensitivity + randomShock;

            // Compute New Asset Price (Floor price set at $1.00)
            const newPrice = Math.max(1.00, asset.price * (1 + totalGrowthRate));
            asset.price = parseFloat(newPrice.toFixed(2));

            // Record price history for line/candlestick charting (Limit history to last 24 turns)
            asset.history.push(asset.price);
            if (asset.history.length > 24) {
                asset.history.shift();
            }

            // Distribute Monthly Share Dividends directly to personal liquid reserves
            this.processDividends(asset);
        });
    }

    /**
     * Distribute monthly share dividends to player cash reserves
     * @param {Object} asset 
     */
    processDividends(asset) {
        if (!asset.dividendYield || asset.dividendYield <= 0) return;

        const quantityOwned = this.state.personal.portfolio[asset.symbol] || 0;
        if (quantityOwned > 0) {
            // Monthly dividend payout = (Price * Annual Yield) / 12 * Owned Shares
            const monthlyDividend = (asset.price * asset.dividendYield / 12) * quantityOwned;
            this.state.personal.cash += monthlyDividend;
        }
    }

    /**
     * Purchase shares of an asset
     * 
     * @param {number} quantity - Number of shares to buy
     * @returns {boolean} Success state of trade
     */
    buySelectedAsset(quantity = 1) {
        const qty = Math.max(1, Math.floor(quantity));
        const asset = this.getSelectedAsset();
        if (!asset) return false;

        const totalCost = asset.price * qty;

        if (this.state.personal.cash >= totalCost) {
            this.state.personal.cash -= totalCost;
            
            if (!this.state.personal.portfolio) {
                this.state.personal.portfolio = {};
            }

            this.state.personal.portfolio[asset.symbol] = (this.state.personal.portfolio[asset.symbol] || 0) + qty;
            return true;
        }

        return false;
    }

    /**
     * Sell shares of an asset
     * 
     * @param {number} quantity - Number of shares to sell
     * @returns {boolean} Success state of trade
     */
    sellSelectedAsset(quantity = 1) {
        const qty = Math.max(1, Math.floor(quantity));
        const asset = this.getSelectedAsset();
        if (!asset) return false;

        const ownedQty = this.state.personal.portfolio[asset.symbol] || 0;

        if (ownedQty >= qty) {
            const totalRevenue = asset.price * qty;
            this.state.personal.portfolio[asset.symbol] -= qty;
            
            if (this.state.personal.portfolio[asset.symbol] === 0) {
                delete this.state.personal.portfolio[asset.symbol];
            }

            this.state.personal.cash += totalRevenue;
            return true;
        }

        return false;
    }

    /**
     * Sets currently selected market ticker
     * @param {string} symbol 
     */
    setSelectedAsset(symbol) {
        const found = this.assets.find(a => a.symbol === symbol);
        if (found) {
            this.selectedSymbol = symbol;
        }
    }

    /**
     * Gets currently selected asset object
     * @returns {Object}
     */
    getSelectedAsset() {
        return this.assets.find(a => a.symbol === this.selectedSymbol) || this.assets[0];
    }

    /**
     * Returns array of all active market tickers
     * @returns {Array}
     */
    getAssets() {
        return this.assets;
    }
}