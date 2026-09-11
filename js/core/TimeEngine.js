/**
 * WEALTH QUEST: SOVEREIGN ECONOMY
 * Time Engine System
 * 
 * Manages game time progression, month-to-year transitions,
 * total turn ticks, and economic cycle phase timing.
 */

export class TimeEngine {
    /**
     * @param {Object} state - Reference to global game state
     */
    constructor(state) {
        this.state = state;
    }

    /**
     * Advances game time by one turn (1 Month)
     * Handles year rollovers and updates total turn counters.
     * 
     * @returns {Object} Updated time object { month, year, totalTurns }
     */
    tickMonth() {
        if (!this.state.time) {
            this.state.time = { month: 1, year: 1, totalTurns: 1 };
        }

        this.state.time.month += 1;
        this.state.time.totalTurns += 1;

        // Year rollover logic (12 months per year)
        if (this.state.time.month > 12) {
            this.state.time.month = 1;
            this.state.time.year += 1;
        }

        return this.getTimeState();
    }

    /**
     * Helper to retrieve formatted calendar string
     * @returns {string} e.g. "Month 4, Year 2"
     */
    getFormattedDate() {
        const { month, year } = this.getTimeState();
        return `Month ${month}, Year ${year}`;
    }

    /**
     * Returns current time state parameters
     * @returns {Object}
     */
    getTimeState() {
        return {
            month: this.state.time.month,
            year: this.state.time.year,
            totalTurns: this.state.time.totalTurns
        };
    }

    /**
     * Checks if current turn aligns with quarterly milestones (Months 3, 6, 9, 12)
     * Useful for tax assessments, corporate earnings reports, and dividend payouts.
     * 
     * @returns {boolean}
     */
    isQuarterEnd() {
        return this.state.time.month % 3 === 0;
    }

    /**
     * Checks if current turn is an annual milestone (Month 12)
     * @returns {boolean}
     */
    isYearEnd() {
        return this.state.time.month === 12;
    }
}