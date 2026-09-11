/**
 * WEALTH QUEST: SOVEREIGN ECONOMY
 * Global Trade Module
 * 
 * Simulates international commodity trading (Crude Oil, Gold, Wheat, Semiconductors),
 * foreign exchange rate (FX) fluctuations, import tariffs, and logistics costs.
 */

import { Config } from '../config.js';

export class GlobalTrade {
    /**
     * @param {Object} state - Reference to global game state
     * @param {Object} economyEngine - Reference to EconomyEngine instance
     */
    constructor(state, economyEngine) {
        this.state = state;
        this.economyEngine = economyEngine;

        // Initialize FX exchange rates and commodity market prices from Config
        this.exchangeRates = { ...Config.GLOBAL_TRADE.BASE_FX_RATES };
        this.commodities = Config.GLOBAL_TRADE.COMMODITIES.map(c => ({ ...c }));
    }

    /**
     * Ticks global trade markets forward by 1 turn:
     * - Fluctuates Foreign Exchange (FX) rates based on Central Bank policy spreads
     * - Adjusts global commodity prices with macroeconomic shocks
     */
    tick() {
        const centralBankRate = this.state.macro.centralBankRate || 0.05;
        const inflation = this.state.macro.cpiInflationRate || 0.025;

        // 1. Simulate Currency Volatility (Higher domestic interest rates strengthen domestic currency)
        Object.keys(this.exchangeRates).forEach(currency => {
            const fxDelta = (Math.random() - 0.49) * 0.015 + (centralBankRate * 0.01);
            const updatedRate = this.exchangeRates[currency] * (1 + fxDelta);
            this.exchangeRates[currency] = parseFloat(Math.max(0.20, updatedRate).toFixed(3));
        });

        // 2. Simulate Commodity Price Volatility
        this.commodities.forEach(commodity => {
            const macroShock = (Math.random() - 0.48) * commodity.volatility;
            const inflationDrift = inflation * 0.5;
            const updatedPrice = commodity.price * (1 + macroShock + inflationDrift);
            
            commodity.price = parseFloat(Math.max(10, updatedPrice).toFixed(2));
            
            // Maintain history for trading price trend tracking
            if (!commodity.history) commodity.history = [];
            commodity.history.push(commodity.price);
            if (commodity.history.length > 24) {
                commodity.history.shift();
            }
        });
    }

    /**
     * Import commodity units into player inventory
     * 
     * @param {string} symbol - Commodity symbol (e.g. 'CRUDE_OIL', 'GOLD', 'WHEAT', 'CHIPS')
     * @param {number} quantity - Units to import
     * @returns {boolean} Success state of trade
     */
    importCommodity(symbol, quantity = 1) {
        const qty = Math.max(1, Math.floor(quantity));
        const commodity = this.commodities.find(c => c.symbol === symbol);
        if (!commodity) return false;

        const tariff = Config.GLOBAL_TRADE.IMPORT_TARIFF_RATE || 0.05;
        const shippingFee = Config.GLOBAL_TRADE.FREIGHT_COST_PER_UNIT || 2;

        // Total cost calculation: (Base Price * (1 + Tariff) + Shipping) * Quantity
        const unitCost = (commodity.price * (1 + tariff)) + shippingFee;
        const totalImportCost = unitCost * qty;

        if (this.state.personal.cash >= totalImportCost) {
            this.state.personal.cash -= totalImportCost;

            if (!this.state.trade) {
                this.state.trade = { commodityInventory: {} };
            }
            if (!this.state.trade.commodityInventory) {
                this.state.trade.commodityInventory = {};
            }

            const currentHolding = this.state.trade.commodityInventory[symbol] || 0;
            this.state.trade.commodityInventory[symbol] = currentHolding + qty;

            return true;
        }

        return false;
    }

    /**
     * Export commodity units from player inventory back to global market
     * 
     * @param {string} symbol - Commodity symbol
     * @param {number} quantity - Units to export
     * @returns {boolean} Success state of trade
     */
    exportCommodity(symbol, quantity = 1) {
        const qty = Math.max(1, Math.floor(quantity));
        const commodity = this.commodities.find(c => c.symbol === symbol);
        if (!commodity) return false;

        const ownedQty = (this.state.trade && this.state.trade.commodityInventory) ? 
                           (this.state.trade.commodityInventory[symbol] || 0) : 0;

        if (ownedQty >= qty) {
            const exportTariff = Config.GLOBAL_TRADE.EXPORT_TARIFF_RATE || 0.02;
            const netPricePerUnit = commodity.price * (1 - exportTariff);
            const totalExportRevenue = netPricePerUnit * qty;

            this.state.trade.commodityInventory[symbol] -= qty;
            this.state.personal.cash += totalExportRevenue;

            return true;
        }

        return false;
    }

    /**
     * Get array of all commodity contracts
     * @returns {Array}
     */
    getCommodities() {
        return this.commodities;
    }

    /**
     * Get active FX exchange rates
     * @returns {Object}
     */
    getExchangeRates() {
        return this.exchangeRates;
    }
}