/**
 * WEALTH QUEST: SOVEREIGN ECONOMY
 * Render Engine Module
 * 
 * Manages DOM updates, UI rendering, view switching, modal dialogue handlers,
 * metric readouts, trade controls, and Canvas price charts.
 */

export class RenderEngine {
    /**
     * @param {Object} state - Reference to global game state
     * @param {Object} economyEngine - Master Economy Engine instance
     * @param {Object} stateManager - State Manager instance
     */
    constructor(state, economyEngine, stateManager) {
        this.state = state;
        this.economyEngine = economyEngine;
        this.stateManager = stateManager;

        this.chartCanvas = null;
        this.chartCtx = null;
    }

    /**
     * Complete UI re-render pass across header metrics and active tab views
     */
    render() {
        this.renderHeader();
        this.renderActiveTab();
    }

    /**
     * Render persistent header bar indicators (Net Worth, Cash, Calendar, Macro Phase)
     */
    renderHeader() {
        const netWorth = this.stateManager.calculateNetWorth(
            this.state, 
            this.economyEngine.getMarketEngine().getAssets()
        );

        const elNetWorth = document.getElementById('hdr-net-worth');
        const elCash = document.getElementById('hdr-cash');
        const elDate = document.getElementById('hdr-date');
        const elCycle = document.getElementById('hdr-cycle');

        if (elNetWorth) elNetWorth.innerText = `$${netWorth.toLocaleString()}`;
        if (elCash) elCash.innerText = `$${Math.floor(this.state.personal.cash).toLocaleString()}`;
        if (elDate) elDate.innerText = this.economyEngine.getTimeEngine().getFormattedDate();
        if (elCycle) elCycle.innerText = `${this.state.macro.economicCycle}`;
    }

    /**
     * Determines active view tab and triggers view-specific render method
     */
    renderActiveTab() {
        const activeTab = document.querySelector('.nav-tab.active')?.dataset.tab || 'dashboard';

        switch (activeTab) {
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'personal':
                this.renderPersonalFinance();
                break;
            case 'business':
                this.renderBusinessView();
                break;
            case 'markets':
                this.renderMarketsView();
                break;
            case 'trade':
                this.renderTradeView();
                break;
            default:
                this.renderDashboard();
                break;
        }
    }

    /**
     * Render Macro Dashboard & Overview View
     */
    renderDashboard() {
        const container = document.getElementById('view-content');
        if (!container) return;

        const macro = this.state.macro;
        const personal = this.state.personal;

        container.innerHTML = `
            <div class="dashboard-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;">
                <div class="card card-macro" style="border: 1px solid #333; padding: 1rem; border-radius: 8px;">
                    <h3>Macroeconomic Outlook</h3>
                    <hr style="border-color: #444;" />
                    <p><strong>Economic Phase:</strong> ${macro.economicCycle}</p>
                    <p><strong>Central Bank Rate:</strong> ${(macro.centralBankRate * 100).toFixed(2)}%</p>
                    <p><strong>CPI Inflation Rate:</strong> ${(macro.cpiInflationRate * 100).toFixed(2)}%</p>
                    <p><strong>Unemployment Rate:</strong> ${(macro.unemploymentRate * 100).toFixed(2)}%</p>
                    <p><strong>Real GDP:</strong> $${(macro.gdpValuation / 1e9).toFixed(2)} Billion</p>
                </div>

                <div class="card card-liquidity" style="border: 1px solid #333; padding: 1rem; border-radius: 8px;">
                    <h3>Personal Liquidity & Credit</h3>
                    <hr style="border-color: #444;" />
                    <p><strong>Liquid Cash:</strong> $${Math.floor(personal.cash).toLocaleString()}</p>
                    <p><strong>High-Yield Savings (HYSA):</strong> $${Math.floor(personal.hysaBalance).toLocaleString()}</p>
                    <p><strong>HYSA APY Yield:</strong> ${(personal.hysaInterestRate * 100).toFixed(2)}%</p>
                    <p><strong>Credit Score:</strong> <span style="color: ${personal.creditScore >= 700 ? '#4CAF50' : '#FF5252'}">${personal.creditScore}</span></p>
                    <p><strong>Monthly Salary:</strong> $${personal.salary.toLocaleString()}</p>
                </div>
            </div>
        `;
    }

    /**
     * Render Personal Finance & Debt Management View
     */
    renderPersonalFinance() {
        const container = document.getElementById('view-content');
        if (!container) return;

        const personal = this.state.personal;
        const debtsList = personal.debts.map(d => `
            <tr>
                <td>${d.title}</td>
                <td>$${Math.floor(d.principal).toLocaleString()}</td>
                <td>${(d.rate * 100).toFixed(2)}%</td>
                <td>$${d.monthlyPayment}/mo</td>
            </tr>
        `).join('') || '<tr><td colspan="4">No outstanding liabilities.</td></tr>';

        container.innerHTML = `
            <div class="pf-container" style="display: flex; flex-direction: column; gap: 1.5rem;">
                <div class="card" style="border: 1px solid #333; padding: 1rem; border-radius: 8px;">
                    <h3>Emergency Savings (HYSA)</h3>
                    <p>Balance: $${Math.floor(personal.hysaBalance).toLocaleString()} @ ${(personal.hysaInterestRate * 100).toFixed(2)}% APY</p>
                    <div style="display: flex; gap: 0.5rem;">
                        <button id="btn-deposit-hysa" style="padding: 0.5rem 1rem;">Deposit $500</button>
                        <button id="btn-withdraw-hysa" style="padding: 0.5rem 1rem;">Withdraw $500</button>
                    </div>
                </div>

                <div class="card" style="border: 1px solid #333; padding: 1rem; border-radius: 8px;">
                    <h3>Liabilities & Credit Lines</h3>
                    <table style="width: 100%; text-align: left; border-collapse: collapse;">
                        <thead>
                            <tr style="border-bottom: 1px solid #444;">
                                <th>Loan Title</th>
                                <th>Remaining Principal</th>
                                <th>Interest Rate</th>
                                <th>Monthly Service</th>
                            </tr>
                        </thead>
                        <tbody>${debtsList}</tbody>
                    </table>
                    <br />
                    <button id="btn-take-loan" style="padding: 0.5rem 1rem;">Borrow $5,000 Loan</button>
                </div>
            </div>
        `;

        this.bindPersonalFinanceEvents();
    }

    /**
     * Bind Personal Finance View Action Listeners
     */
    bindPersonalFinanceEvents() {
        const pf = this.economyEngine.getPersonalFinance();

        document.getElementById('btn-deposit-hysa')?.addEventListener('click', () => {
            if (pf.depositHYSA(500)) this.render();
        });

        document.getElementById('btn-withdraw-hysa')?.addEventListener('click', () => {
            if (pf.withdrawHYSA(500)) this.render();
        });

        document.getElementById('btn-take-loan')?.addEventListener('click', () => {
            if (pf.takeLoan(5000, 24)) this.render();
        });
    }

    /**
     * Render Enterprise & Business Operations View
     */
    renderBusinessView() {
        const container = document.getElementById('view-content');
        if (!container) return;

        const businesses = this.state.businesses || [];
        const bizCards = businesses.map(b => `
            <div class="card" style="border: 1px solid #333; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                <h4>${b.name} (Lvl ${b.level}) - ${b.type}</h4>
                <p>Gross Revenue: $${b.lastMonthlyRevenue.toLocaleString()}/mo</p>
                <p>OpEx Costs: $${b.lastMonthlyOpEx.toLocaleString()}/mo</p>
                <p>Net Profit: <strong style="color: ${b.lastMonthlyNetProfit >= 0 ? '#4CAF50' : '#FF5252'}">$${b.lastMonthlyNetProfit.toLocaleString()}/mo</strong></p>
                <button class="btn-upgrade-biz" data-id="${b.id}" style="padding: 0.4rem 0.8rem;">Scale Enterprise (CapEx)</button>
            </div>
        `).join('') || '<p>No active enterprises owned.</p>';

        container.innerHTML = `
            <div class="business-container">
                <div style="margin-bottom: 1.5rem;">
                    <h3>Enterprise Incubation</h3>
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        <button class="btn-launch-startup" data-type="ECOM">Launch E-Commerce Store ($2,500)</button>
                        <button class="btn-launch-startup" data-type="CAFE">Launch Boutique Cafe ($15,000)</button>
                        <button class="btn-launch-startup" data-type="SaaS">Launch SaaS Platform ($50,000)</button>
                    </div>
                </div>
                <h3>Active Enterprises</h3>
                <div>${bizCards}</div>
            </div>
        `;

        this.bindBusinessEvents();
    }

    /**
     * Bind Business View Action Listeners
     */
    bindBusinessEvents() {
        const bizEngine = this.economyEngine.getBusinessEngine();

        document.querySelectorAll('.btn-launch-startup').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.dataset.type;
                if (bizEngine.launchStartup(type)) this.render();
            });
        });

        document.querySelectorAll('.btn-upgrade-biz').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                if (bizEngine.upgradeBusiness(id)) this.render();
            });
        });
    }

    /**
     * Render Capital Markets & Stock Trading View with Canvas Price Charts
     */
    renderMarketsView() {
        const container = document.getElementById('view-content');
        if (!container) return;

        const marketEngine = this.economyEngine.getMarketEngine();
        const assets = marketEngine.getAssets();
        const selectedAsset = marketEngine.getSelectedAsset();

        const assetRows = assets.map(a => `
            <tr class="asset-row ${a.symbol === selectedAsset.symbol ? 'selected' : ''}" data-symbol="${a.symbol}" style="cursor: pointer;">
                <td><strong>${a.symbol}</strong></td>
                <td>${a.name}</td>
                <td>$${a.price.toFixed(2)}</td>
                <td>${(a.dividendYield * 100).toFixed(1)}%</td>
                <td>${this.state.personal.portfolio[a.symbol] || 0}</td>
            </tr>
        `).join('');

        container.innerHTML = `
            <div class="markets-container" style="display: grid; grid-template-columns: 2fr 1fr; gap: 1rem;">
                <div class="chart-section" style="border: 1px solid #333; padding: 1rem; border-radius: 8px;">
                    <h3>${selectedAsset.name} (${selectedAsset.symbol}) - Price History</h3>
                    <canvas id="marketChart" width="500" height="240" style="width: 100%; height: 240px; background: #111; border-radius: 4px;"></canvas>
                    <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                        <button id="btn-buy-asset">Buy 1 Share ($${selectedAsset.price.toFixed(2)})</button>
                        <button id="btn-sell-asset">Sell 1 Share</button>
                    </div>
                </div>

                <div class="assets-list" style="border: 1px solid #333; padding: 1rem; border-radius: 8px;">
                    <h3>Market Assets</h3>
                    <table style="width: 100%; text-align: left; border-collapse: collapse;">
                        <thead>
                            <tr>
                                <th>Ticker</th>
                                <th>Asset Name</th>
                                <th>Price</th>
                                <th>Div Yield</th>
                                <th>Owned</th>
                            </tr>
                        </thead>
                        <tbody>${assetRows}</tbody>
                    </table>
                </div>
            </div>
        `;

        this.renderCanvasChart(selectedAsset.history);
        this.bindMarketEvents();
    }

    /**
     * Draw 2D Canvas price line chart for active market asset
     * 
     * @param {Array<number>} priceHistory 
     */
    renderCanvasChart(priceHistory = []) {
        const canvas = document.getElementById('marketChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        if (priceHistory.length < 2) {
            ctx.fillStyle = '#888';
            ctx.fillText('Awaiting historical price data...', 20, height / 2);
            return;
        }

        const maxPrice = Math.max(...priceHistory) * 1.05;
        const minPrice = Math.min(...priceHistory) * 0.95;
        const priceRange = maxPrice - minPrice || 1;

        // Draw background grid lines
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
            const y = (height / 4) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // Draw Price Line Chart
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 2;
        ctx.beginPath();

        const stepX = width / (priceHistory.length - 1);

        priceHistory.forEach((price, index) => {
            const x = index * stepX;
            const normalizedY = (price - minPrice) / priceRange;
            const y = height - (normalizedY * height);

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();
    }

    /**
     * Bind Market View Action Listeners
     */
    bindMarketEvents() {
        const marketEngine = this.economyEngine.getMarketEngine();

        document.querySelectorAll('.asset-row').forEach(row => {
            row.addEventListener('click', (e) => {
                const symbol = e.currentTarget.dataset.symbol;
                marketEngine.setSelectedAsset(symbol);
                this.renderMarketsView();
            });
        });

        document.getElementById('btn-buy-asset')?.addEventListener('click', () => {
            if (marketEngine.buySelectedAsset(1)) this.render();
        });

        document.getElementById('btn-sell-asset')?.addEventListener('click', () => {
            if (marketEngine.sellSelectedAsset(1)) this.render();
        });
    }

    /**
     * Render Global Trade & Commodity Import/Export View
     */
    renderTradeView() {
        const container = document.getElementById('view-content');
        if (!container) return;

        const tradeEngine = this.economyEngine.getGlobalTrade();
        const commodities = tradeEngine.getCommodities();
        const inventory = (this.state.trade && this.state.trade.commodityInventory) ? this.state.trade.commodityInventory : {};

        const rows = commodities.map(c => `
            <tr>
                <td><strong>${c.symbol}</strong></td>
                <td>${c.name}</td>
                <td>$${c.price.toFixed(2)}</td>
                <td>${inventory[c.symbol] || 0}</td>
                <td>
                    <button class="btn-import" data-symbol="${c.symbol}">Import (+1)</button>
                    <button class="btn-export" data-symbol="${c.symbol}">Export (-1)</button>
                </td>
            </tr>
        `).join('');

        container.innerHTML = `
            <div class="trade-container" style="border: 1px solid #333; padding: 1rem; border-radius: 8px;">
                <h3>Global Commodity Desk & Customs Logistics</h3>
                <table style="width: 100%; text-align: left; border-collapse: collapse;">
                    <thead>
                        <tr style="border-bottom: 1px solid #444;">
                            <th>Symbol</th>
                            <th>Commodity</th>
                            <th>Global Spot Price</th>
                            <th>Inventory Owned</th>
                            <th>Customs Desk</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;

        this.bindTradeEvents();
    }

    /**
     * Bind Trade View Action Listeners
     */
    bindTradeEvents() {
        const tradeEngine = this.economyEngine.getGlobalTrade();

        document.querySelectorAll('.btn-import').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const symbol = e.target.dataset.symbol;
                if (tradeEngine.importCommodity(symbol, 1)) this.render();
            });
        });

        document.querySelectorAll('.btn-export').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const symbol = e.target.dataset.symbol;
                if (tradeEngine.exportCommodity(symbol, 1)) this.render();
            });
        });
    }

    /**
     * Render Modal Overlay Dialogue for Macro/Narrative Events
     * 
     * @param {Object} eventData - Dynamic Event Choice payload from EventEngine
     * @param {Function} onResolveCallback - Resolution callback on choice selection
     */
    renderEventModal(eventData, onResolveCallback) {
        if (!eventData) return;

        const backdrop = document.createElement('div');
        backdrop.id = 'event-modal-backdrop';
        backdrop.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0, 0, 0, 0.8); display: flex; justify-content: center;
            align-items: center; z-index: 9999;
        `;

        const choicesHtml = eventData.choices.map((choice, index) => `
            <div class="modal-choice-btn" data-index="${index}" style="
                border: 1px solid #444; background: #222; padding: 0.8rem; margin-top: 0.5rem;
                border-radius: 6px; cursor: pointer; text-align: left;
            ">
                <strong>${choice.title}</strong>
                <p style="margin: 0.2rem 0 0 0; font-size: 0.85rem; color: #aaa;">${choice.description}</p>
            </div>
        `).join('');

        backdrop.innerHTML = `
            <div style="background: #181818; border: 1px solid #444; padding: 1.5rem; border-radius: 10px; max-width: 500px; width: 90%;">
                <span style="font-size: 0.8rem; text-transform: uppercase; color: #888;">${eventData.category}</span>
                <h2 style="margin-top: 0.2rem;">${eventData.title}</h2>
                <p style="color: #ccc; line-height: 1.4;">${eventData.description}</p>
                <div style="margin-top: 1rem;">${choicesHtml}</div>
            </div>
        `;

        document.body.appendChild(backdrop);

        backdrop.querySelectorAll('.modal-choice-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.dataset.index, 10);
                const selectedChoice = eventData.choices[idx];
                
                if (selectedChoice && typeof selectedChoice.impact === 'function') {
                    selectedChoice.impact(this.state);
                }

                document.body.removeChild(backdrop);
                if (typeof onResolveCallback === 'function') {
                    onResolveCallback();
                }
            });
        });
    }
}