/**
 * WEALTH QUEST: SOVEREIGN ECONOMY
 * UI Renderer Module
 * 
 * Orchestrates HUD updates, DOM element syncs, dashboard tab switching,
 * asset rendering, business list rendering, and trade view updates.
 */

import { ChartRenderer } from './ChartRenderer.js';
import { IconGenerator } from './IconGenerator.js';

export class UIRenderer {
    constructor() {
        this.cacheDOM();
        this.bindEvents();
    }

    /**
     * Cache all required DOM references for high-performance updates
     */
    cacheDOM() {
        this.hudElements = {
            cash: document.getElementById('hud-cash'),
            hysa: document.getElementById('hud-hysa'),
            netWorth: document.getElementById('hud-networth'),
            monthYear: document.getElementById('hud-time'),
            economicCycle: document.getElementById('hud-cycle'),
            inflationRate: document.getElementById('hud-inflation'),
            centralBankRate: document.getElementById('hud-rate'),
            unemploymentRate: document.getElementById('hud-unemployment')
        };

        this.tabButtons = document.querySelectorAll('.wq-tab-btn');
        this.tabPanels = document.querySelectorAll('.wq-tab-panel');
        
        this.containers = {
            marketList: document.getElementById('market-asset-list'),
            businessList: document.getElementById('business-list'),
            tradeList: document.getElementById('trade-commodity-list'),
            portfolioList: document.getElementById('portfolio-holdings-list'),
            mainChartCanvas: document.getElementById('main-performance-chart')
        };
    }

    /**
     * Set up tab switching listeners
     */
    bindEvents() {
        if (this.tabButtons) {
            this.tabButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const targetTab = e.currentTarget.dataset.tab;
                    this.switchTab(targetTab);
                });
            });
        }
    }

    /**
     * Switch active view tab panel
     * 
     * @param {string} tabId - Target tab identifier
     */
    switchTab(tabId) {
        this.tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });

        this.tabPanels.forEach(panel => {
            panel.classList.toggle('active', panel.id === `tab-${tabId}`);
        });
    }

    /**
     * Updates top HUD bar with state metrics
     * 
     * @param {Object} state - Global game state object
     * @param {number} totalNetWorth - Calculated total player net worth
     */
    updateHUD(state, totalNetWorth = 0) {
        if (!state) return;

        const { personal, time, macro } = state;

        // Cash & Liquid Savings
        if (this.hudElements.cash) {
            this.hudElements.cash.textContent = `$${Math.floor(personal.cash).toLocaleString()}`;
        }
        if (this.hudElements.hysa) {
            this.hudElements.hysa.textContent = `$${Math.floor(personal.hysaBalance).toLocaleString()}`;
        }

        // Calculated Total Net Worth
        if (this.hudElements.netWorth) {
            this.hudElements.netWorth.textContent = `$${Math.floor(totalNetWorth).toLocaleString()}`;
        }

        // Calendar Date
        if (this.hudElements.monthYear) {
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthStr = monthNames[(time.month - 1) % 12];
            this.hudElements.monthYear.textContent = `Yr ${time.year}, ${monthStr}`;
        }

        // Macroeconomic State Indicators
        if (macro) {
            if (this.hudElements.economicCycle) {
                this.hudElements.economicCycle.textContent = macro.economicCycle;
                this.hudElements.economicCycle.className = `wq-badge wq-badge-${macro.economicCycle.toLowerCase()}`;
            }
            if (this.hudElements.inflationRate) {
                this.hudElements.inflationRate.textContent = `${(macro.cpiInflationRate * 100).toFixed(1)}%`;
            }
            if (this.hudElements.centralBankRate) {
                this.hudElements.centralBankRate.textContent = `${(macro.centralBankRate * 100).toFixed(1)}%`;
            }
            if (this.hudElements.unemploymentRate) {
                this.hudElements.unemploymentRate.textContent = `${(macro.unemploymentRate * 100).toFixed(1)}%`;
            }
        }
    }

    /**
     * Complete full UI sync pass across all tabs and charts
     * 
     * @param {Object} state - Current global game state
     * @param {Array} marketAssets - Available tradable securities
     * @param {Array} commodities - Global trade commodities
     * @param {number} netWorth - Calculated total player net worth
     * @param {Array<number>} netWorthHistory - Net worth history curve
     */
    renderAll(state, marketAssets = [], commodities = [], netWorth = 0, netWorthHistory = []) {
        this.updateHUD(state, netWorth);
        this.renderMarket(marketAssets, state.personal.portfolio);
        this.renderBusinesses(state.businesses);
        this.renderTrade(commodities, state.trade.commodityInventory);
        this.renderPortfolio(state, marketAssets);

        // Render main portfolio performance canvas chart
        if (this.containers.mainChartCanvas && netWorthHistory.length > 1) {
            ChartRenderer.renderLineChart(this.containers.mainChartCanvas, netWorthHistory, {
                strokeColor: '#00ADB5',
                fillColor: 'rgba(0, 173, 181, 0.15)',
                gridColor: '#252528',
                textColor: '#888888'
            });
        }
    }

    /**
     * Render financial asset market cards
     */
    renderMarket(assets = [], portfolio = {}) {
        if (!this.containers.marketList) return;

        this.containers.marketList.innerHTML = assets.map(asset => {
            const owned = portfolio[asset.symbol] || 0;
            const badgeDataUrl = IconGenerator.createAssetBadgeDataUrl(asset.symbol, '#2A2A2D');

            return `
                <div class="wq-card wq-asset-card" data-symbol="${asset.symbol}">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <img src="${badgeDataUrl}" alt="${asset.symbol}" style="width: 40px; height: 40px; border-radius: 6px;" />
                        <div>
                            <div style="font-weight: 700; color: #FFF;">${asset.name}</div>
                            <div style="font-size: 0.8rem; color: #888;">${asset.symbol} • ${asset.category}</div>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: 700; font-family: monospace; color: #FFF;">$${asset.price.toFixed(2)}</div>
                        <div style="font-size: 0.8rem; color: #4E9F3D;">Yield: ${(asset.dividendYield * 100).toFixed(1)}%</div>
                    </div>
                    <div style="font-size: 0.85rem; color: #AAA; width: 100%;">
                        Owned: <strong style="color: #FFF;">${owned}</strong> shares ($${(owned * asset.price).toFixed(2)})
                    </div>
                    <div style="display: flex; gap: 8px; width: 100%;">
                        <button class="wq-btn wq-btn-buy" data-symbol="${asset.symbol}" style="flex: 1;">Buy</button>
                        <button class="wq-btn wq-btn-sell" data-symbol="${asset.symbol}" style="flex: 1;" ${owned <= 0 ? 'disabled' : ''}>Sell</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Render owned business enterprises
     */
    renderBusinesses(businesses = []) {
        if (!this.containers.businessList) return;

        if (businesses.length === 0) {
            this.containers.businessList.innerHTML = `
                <div style="grid-column: 1 / -1; padding: 30px; text-align: center; background: #18181A; border-radius: 8px; color: #777;">
                    No operational enterprise entities. Launch a business from the startup panel above.
                </div>
            `;
            return;
        }

        this.containers.businessList.innerHTML = businesses.map(biz => `
            <div class="wq-card">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; color: #FFF;">${biz.name}</h3>
                    <span class="wq-badge" style="background: #2A2A2D; color: #00ADB5;">${biz.type}</span>
                </div>
                <div style="margin-top: 10px; font-size: 0.85rem; color: #AAA;">
                    <div>Monthly Revenue: <strong style="color: #4E9F3D;">+$${biz.baseMonthlyRevenue.toLocaleString()}</strong></div>
                    <div>Monthly OpEx: <strong style="color: #FF5252;">-$${biz.baseMonthlyOpEx.toLocaleString()}</strong></div>
                    <div>Valuation: <strong style="color: #FFF;">$${biz.valuation.toLocaleString()}</strong></div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Render global commodity market
     */
    renderTrade(commodities = [], inventory = {}) {
        if (!this.containers.tradeList) return;

        this.containers.tradeList.innerHTML = commodities.map(item => {
            const qty = inventory[item.symbol] || 0;

            return `
                <div class="wq-card">
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-weight: 700; color: #FFF;">${item.name}</span>
                        <span style="font-family: monospace; color: #00ADB5;">$${item.price.toFixed(2)}</span>
                    </div>
                    <div style="font-size: 0.85rem; color: #888; margin-top: 6px;">
                        Inventory: <strong style="color: #FFF;">${qty} units</strong>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Render portfolio overview tab
     */
    renderPortfolio(state, assets = []) {
        if (!this.containers.portfolioList) return;

        const holdings = state.personal.portfolio;
        const rows = Object.entries(holdings).map(([symbol, qty]) => {
            const asset = assets.find(a => a.symbol === symbol);
            const price = asset ? asset.price : 0;
            const totalVal = qty * price;

            return `
                <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #222;">
                    <div>
                        <div style="font-weight: 600; color: #FFF;">${symbol}</div>
                        <div style="font-size: 0.8rem; color: #777;">${qty} Units</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: 600; color: #FFF;">$${totalVal.toFixed(2)}</div>
                        <div style="font-size: 0.8rem; color: #888;">@ $${price.toFixed(2)}</div>
                    </div>
                </div>
            `;
        }).join('');

        this.containers.portfolioList.innerHTML = rows || `<div style="color: #666; font-size: 0.85rem;">No holdings currently in portfolio.</div>`;
    }
}