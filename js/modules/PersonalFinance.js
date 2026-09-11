/**
 * WEALTH QUEST: SOVEREIGN ECONOMY
 * Personal Finance Module
 * 
 * Manages income, living costs, emergency reserves (HYSA),
 * debt liabilities, loan amortization, and credit scoring.
 */

export class PersonalFinance {
    /**
     * @param {Object} state - Reference to global game state
     * @param {Object} economyEngine - Reference to EconomyEngine instance
     */
    constructor(state, economyEngine) {
        this.state = state;
        this.economyEngine = economyEngine;
    }

    /**
     * Processes monthly personal cash flows:
     * - Collects employment salary
     * - Collects high-yield savings account (HYSA) interest
     * - Pays inflation-adjusted living expenses
     * - Services active debt repayments
     * 
     * @returns {number} Net monthly cash flow
     */
    processMonthlyCashFlow() {
        const personal = this.state.personal;
        const inflation = this.state.macro.cpiInflationRate || 0.025;

        // 1. Calculate Monthly Salary Income
        const grossSalary = personal.salary || 3500;

        // 2. Calculate HYSA Interest Yield (APY converted to monthly yield)
        const monthlyHysaRate = (personal.hysaInterestRate || 0.042) / 12;
        const hysaInterestEarned = personal.hysaBalance * monthlyHysaRate;
        personal.hysaBalance += hysaInterestEarned;

        // 3. Calculate Inflation-Adjusted Living Expenses
        // Living costs scale directly with CPI inflation over time
        const baseLivingCosts = personal.baseLivingExpenses || 1800;
        const currentLivingExpenses = baseLivingCosts * (1 + inflation);

        // 4. Service Debt Obligations & Amortize Principals
        let totalDebtService = 0;
        if (Array.isArray(personal.debts) && personal.debts.length > 0) {
            personal.debts = personal.debts.filter(debt => {
                if (debt.principal <= 0) return false;

                const monthlyInterest = (debt.principal * (debt.rate / 12));
                const payment = Math.min(debt.monthlyPayment, debt.principal + monthlyInterest);
                const principalRepayment = payment - monthlyInterest;

                debt.principal = Math.max(0, debt.principal - principalRepayment);
                totalDebtService += payment;

                // Keep loan in debt array if principal remains unpaid
                return debt.principal > 0;
            });
        }

        // 5. Net Personal Cashflow Calculation
        const netCashflow = grossSalary + hysaInterestEarned - currentLivingExpenses - totalDebtService;
        personal.cash = Math.max(0, personal.cash + netCashflow);

        // Update Credit Score based on liquidity and debt ratio
        this.updateCreditScore(totalDebtService, currentLivingExpenses);

        return Math.round(netCashflow);
    }

    /**
     * Deposit cash into High-Yield Savings Account
     * @param {number} amount 
     * @returns {boolean} Success state
     */
    depositHYSA(amount) {
        const deposit = Math.abs(amount);
        if (this.state.personal.cash >= deposit) {
            this.state.personal.cash -= deposit;
            this.state.personal.hysaBalance += deposit;
            return true;
        }
        return false;
    }

    /**
     * Withdraw cash from High-Yield Savings Account
     * @param {number} amount 
     * @returns {boolean} Success state
     */
    withdrawHYSA(amount) {
        const withdrawal = Math.abs(amount);
        if (this.state.personal.hysaBalance >= withdrawal) {
            this.state.personal.hysaBalance -= withdrawal;
            this.state.personal.cash += withdrawal;
            return true;
        }
        return false;
    }

    /**
     * Issue a new personal or commercial debt line
     * @param {number} amount - Loan principal amount
     * @param {number} termMonths - Repayment term duration
     * @returns {boolean}
     */
    takeLoan(amount, termMonths = 12) {
        const centralBankRate = this.state.macro.centralBankRate || 0.05;
        
        // Interest rate is Central Bank Policy Rate + Credit Score Risk Margin
        const creditRiskSpread = (850 - this.state.personal.creditScore) / 10000;
        const annualRate = centralBankRate + creditRiskSpread + 0.03; // Base margin

        const monthlyRate = annualRate / 12;
        // Amortized monthly payment formula: P * (r(1+r)^n) / ((1+r)^n - 1)
        const monthlyPayment = (amount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                               (Math.pow(1 + monthlyRate, termMonths) - 1);

        this.state.personal.cash += amount;
        this.state.personal.debts.push({
            id: 'LOAN_' + Date.now(),
            title: `Commercial Credit Line ($${amount.toLocaleString()})`,
            principal: amount,
            rate: annualRate,
            monthlyPayment: Math.round(monthlyPayment)
        });

        return true;
    }

    /**
     * Recalculates credit score dynamically (Range: 300 - 850)
     */
    updateCreditScore(debtService, livingExpenses) {
        let score = this.state.personal.creditScore || 700;

        // Debt Utilization & Liquidity Ratios
        const totalDebt = this.state.personal.debts.reduce((sum, d) => sum + d.principal, 0);
        const liquidReserves = this.state.personal.cash + this.state.personal.hysaBalance;

        // Reward liquid reserves covering 3+ months of expenses
        if (liquidReserves >= (livingExpenses * 3)) {
            score += 2;
        } else if (liquidReserves < livingExpenses) {
            score -= 3;
        }

        // Penalty for high total debt load relative to cash
        if (totalDebt > (liquidReserves * 2)) {
            score -= 4;
        } else if (totalDebt === 0) {
            score += 1;
        }

        // Clamp credit score between standard 300 and 850 boundaries
        this.state.personal.creditScore = Math.min(850, Math.max(300, score));
    }
}