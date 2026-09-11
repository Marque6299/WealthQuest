/**
 * WEALTH QUEST: SOVEREIGN ECONOMY
 * Event Engine System
 * 
 * Generates and triggers random macroeconomic shocks, policy shifts,
 * and personal financial decision events with multi-choice outcomes.
 */

export class EventEngine {
    /**
     * @param {Object} state - Reference to global game state
     */
    constructor(state) {
        this.state = state;
        
        // Base probability of an event triggering on any given turn (25%)
        this.baseEventChance = 0.25;

        // Pool of potential macroeconomic and personal financial events
        this.eventsPool = [
            {
                id: 'CENTRAL_BANK_RATE_HIKE',
                title: 'Central Bank Rate Hike',
                category: 'Macroeconomic Policy',
                description: 'The Central Bank has aggressively raised interest rates by 150 basis points to curb surging inflation. Yields on savings have increased, but borrowing costs are rising.',
                condition: (state) => state.macro.cpiInflationRate > 0.03,
                choices: [
                    {
                        title: 'Capitalize on Savings Yields',
                        description: 'Shift $1,000 liquid cash into High-Yield Savings (HYSA).',
                        impact: (state) => {
                            state.macro.centralBankRate += 0.015;
                            state.personal.hysaInterestRate += 0.015;
                            if (state.personal.cash >= 1000) {
                                state.personal.cash -= 1000;
                                state.personal.hysaBalance += 1000;
                            }
                        }
                    },
                    {
                        title: 'Acknowledge Policy Shift',
                        description: 'Accept rate change without adjusting liquid capital allocation.',
                        impact: (state) => {
                            state.macro.centralBankRate += 0.015;
                            state.personal.hysaInterestRate += 0.015;
                        }
                    }
                ]
            },
            {
                id: 'SUPPLY_CHAIN_DISRUPTION',
                title: 'Global Supply Chain Bottleneck',
                category: 'Global Trade Shock',
                description: 'Geopolitical tensions and port congestion have throttled raw material imports. Manufacturing costs are up, driving consumer prices higher.',
                condition: () => true,
                choices: [
                    {
                        title: 'Absorb Consumer Cost Increases',
                        description: 'Pay a one-time supply surcharge of $400 on living expenses.',
                        impact: (state) => {
                            state.personal.cash = Math.max(0, state.personal.cash - 400);
                            state.macro.cpiInflationRate += 0.008;
                        }
                    },
                    {
                        title: 'Speculate on Commodity Shortages',
                        description: 'Allocate $600 cash to buy raw material contracts.',
                        impact: (state) => {
                            if (state.personal.cash >= 600) {
                                state.personal.cash -= 600;
                                state.trade.commodityInventory.CRUDE_OIL += 5;
                            }
                            state.macro.cpiInflationRate += 0.008;
                        }
                    }
                ]
            },
            {
                id: 'INNOVATION_TECH_BOOM',
                title: 'Frontier Tech Breakthrough',
                category: 'Market Rally',
                description: 'A major technological innovation has triggered a surge in productivity and market enthusiasm across equity growth funds.',
                condition: () => true,
                choices: [
                    {
                        title: 'Invest Liquid Cash in Growth Sector',
                        description: 'Deploy $500 cash into the TECH growth asset.',
                        impact: (state) => {
                            if (state.personal.cash >= 500) {
                                state.personal.cash -= 500;
                                state.personal.portfolio['TECH'] = (state.personal.portfolio['TECH'] || 0) + 2;
                            }
                        }
                    },
                    {
                        title: 'Hold Cash Reserve',
                        description: 'Maintain existing asset allocation.',
                        impact: () => {}
                    }
                ]
            },
            {
                id: 'UNEXPECTED_HEALTH_EXPENSE',
                title: 'Emergency Out-of-Pocket Expense',
                category: 'Personal Microfinance',
                description: 'An urgent medical or home maintenance expense requires immediate cash settlement. Do you pay upfront or finance it?',
                condition: (state) => state.personal.cash > 1000,
                choices: [
                    {
                        title: 'Pay In Full From Liquid Reserves',
                        description: 'Cover the full $800 out of pocket.',
                        impact: (state) => {
                            state.personal.cash = Math.max(0, state.personal.cash - 800);
                        }
                    },
                    {
                        title: 'Finance via Credit Line',
                        description: 'Create an $800 debt liability at 12% annual interest.',
                        impact: (state) => {
                            state.personal.debts.push({
                                id: 'MEDICAL_LOAN_' + Date.now(),
                                title: 'Emergency Debt Line',
                                principal: 800,
                                rate: 0.12,
                                monthlyPayment: 75
                            });
                        }
                    }
                ]
            }
        ];
    }

    /**
     * Evaluates whether a random event should fire on the current turn.
     * Filter eligible events based on current game state conditions.
     * 
     * @returns {Object|null} Selected event object or null
     */
    evaluateTrigger() {
        if (Math.random() > this.baseEventChance) {
            return null;
        }

        const eligibleEvents = this.eventsPool.filter(event => {
            return typeof event.condition === 'function' ? event.condition(this.state) : true;
        });

        if (eligibleEvents.length === 0) {
            return null;
        }

        const randomIndex = Math.floor(Math.random() * eligibleEvents.length);
        return eligibleEvents[randomIndex];
    }
}