/**
 * WEALTH QUEST: SOVEREIGN ECONOMY
 * Global Configuration & Asset Specification
 * 
 * Defines initial state parameters, business templates, trade commodities,
 * macro cycle settings, and tradable financial asset specifications.
 */

export const Config = {
    // -------------------------------------------------------------------------
    // INITIAL GAME STATE SCHEMA
    // -------------------------------------------------------------------------
    INITIAL_STATE: {
        time: {
            month: 1,
            year: 1,
            totalTurns: 1
        },
        macro: {
            economicCycle: 'Expansion', // 'Expansion' | 'Peak' | 'Contraction' | 'Trough'
            cycleProgress: 0,
            cpiInflationRate: 0.025,   // 2.5% Annualized CPI
            centralBankRate: 0.050,    // 5.0% Policy Rate
            unemploymentRate: 0.042,   // 4.2% Unemployment
            gdpValuation: 21000000000  // $21.0 Billion Real GDP Base
        },
        personal: {
            cash: 2500,
            hysaBalance: 1000,
            hysaInterestRate: 0.042,   // 4.2% APY Yield
            salary: 3500,              // Base Monthly Employment Income
            baseLivingExpenses: 1800,  // Base Monthly Living Expenses
            creditScore: 710,          // Base Credit Score (300-850)
            portfolio: {
                'SPX': 2               // 2 Initial S&P 500 Index Shares
            },
            debts: [
                {
                    id: 'STUDENT_LOAN_INIT',
                    title: 'Federal Student Debt',
                    principal: 8500,
                    rate: 0.045,
                    monthlyPayment: 120
                }
            ]
        },
        businesses: [],
        trade: {
            commodityInventory: {
                'CRUDE_OIL': 0,
                'GOLD': 0,
                'WHEAT': 0,
                'CHIPS': 0
            }
        }
    },

    // -------------------------------------------------------------------------
    // MACROECONOMIC CYCLE PHASES
    // -------------------------------------------------------------------------
    MACRO_CYCLES: ['Expansion', 'Peak', 'Contraction', 'Trough'],

    // -------------------------------------------------------------------------
    // ENTERPRISE STARTUP TEMPLATES
    // -------------------------------------------------------------------------
    STARTUP_TEMPLATES: [
        {
            type: 'ECOM',
            name: 'Direct-to-Consumer E-Commerce Store',
            startupCost: 2500,
            baseMonthlyRevenue: 950,
            baseMonthlyOpEx: 450,
            volatility: 0.15
        },
        {
            type: 'CAFE',
            name: 'Artisanal Specialty Coffee Shop',
            startupCost: 15000,
            baseMonthlyRevenue: 5200,
            baseMonthlyOpEx: 3100,
            volatility: 0.08
        },
        {
            type: 'SaaS',
            name: 'B2B Enterprise Software (SaaS)',
            startupCost: 50000,
            baseMonthlyRevenue: 18500,
            baseMonthlyOpEx: 9200,
            volatility: 0.22
        }
    ],

    // -------------------------------------------------------------------------
    // MARKET FINANCIAL ASSETS (Equities, Growth, Bonds, REITs)
    // -------------------------------------------------------------------------
    MARKET_ASSETS: [
        {
            symbol: 'SPX',
            name: 'S&P 500 Core Equity ETF',
            category: 'Equity ETF',
            price: 420.00,
            drift: 0.006,        // Base monthly upward drift (~7.2% annual)
            volatility: 0.035,   // Standard deviation shock
            dividendYield: 0.018,// 1.8% Annual Dividend Yield
            history: [412.00, 415.50, 418.20, 420.00]
        },
        {
            symbol: 'TECH',
            name: 'Frontier Tech Growth Index',
            category: 'Individual Stock',
            price: 185.00,
            drift: 0.012,        // High growth potential (~14.4% annual)
            volatility: 0.085,   // High price volatility
            dividendYield: 0.000,// Reinvests all profits
            history: [168.00, 172.50, 180.00, 185.00]
        },
        {
            symbol: 'BOND',
            name: '10-Yr Sovereign Treasury Bonds',
            category: 'Bonds',
            price: 98.50,
            drift: 0.002,        // Stable low-drift fixed income
            volatility: 0.010,   // Low volatility safe haven
            dividendYield: 0.045,// 4.5% Annual Fixed Coupon Yield
            history: [98.20, 98.35, 98.40, 98.50]
        },
        {
            symbol: 'REIT',
            name: 'Commercial Real Estate Trust',
            category: 'REIT',
            price: 115.00,
            drift: 0.004,        // Inflation-hedged real estate
            volatility: 0.028,   // Moderate volatility
            dividendYield: 0.058,// 5.8% High Dividend Yield
            history: [112.00, 113.80, 114.20, 115.00]
        }
    ],

    // -------------------------------------------------------------------------
    // GLOBAL COMMODITY & TRADE CONFIGURATION
    // -------------------------------------------------------------------------
    GLOBAL_TRADE: {
        IMPORT_TARIFF_RATE: 0.05,     // 5% Import Customs Duty
        EXPORT_TARIFF_RATE: 0.02,     // 2% Export Duty
        FREIGHT_COST_PER_UNIT: 2.00,  // Flat Logistics Cost Per Unit
        
        BASE_FX_RATES: {
            EUR: 1.085, // 1 EUR = $1.085 USD
            GBP: 1.270, // 1 GBP = $1.270 USD
            JPY: 0.0067 // 1 JPY = $0.0067 USD
        },

        COMMODITIES: [
            {
                symbol: 'CRUDE_OIL',
                name: 'Light Sweet Crude Oil (Bbl)',
                price: 78.50,
                volatility: 0.065,
                history: [74.00, 76.20, 79.10, 78.50]
            },
            {
                symbol: 'GOLD',
                name: 'Physical Gold Bullion (Oz)',
                price: 2040.00,
                volatility: 0.025,
                history: [2010.00, 2025.00, 2038.00, 2040.00]
            },
            {
                symbol: 'WHEAT',
                name: 'Agricultural Milling Wheat (Bu)',
                price: 18.20,
                volatility: 0.050,
                history: [17.50, 18.00, 18.40, 18.20]
            },
            {
                symbol: 'CHIPS',
                name: 'Semiconductor Wafer Units',
                price: 340.00,
                volatility: 0.090,
                history: [310.00, 325.00, 335.00, 340.00]
            }
        ]
    }
};