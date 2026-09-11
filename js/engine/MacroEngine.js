/**
 * WEALTH QUEST: SOVEREIGN ECONOMY
 * Macroeconomic Simulation Engine
 * 
 * Simulates four-stage macro cycles (Expansion, Peak, Contraction, Trough),
 * central bank monetary policy adjustments (interest rates), CPI inflation shifts,
 * and unemployment rate fluctuations.
 */

export class MacroEngine {
    constructor(initialMacroState) {
        this.cyclePhases = ['Expansion', 'Peak', 'Contraction', 'Trough'];
        this.phaseDurations = {
            'Expansion': 12,   // Average 12 turns (months)
            'Peak': 4,         // Average 4 turns
            'Contraction': 8,  // Average 8 turns
            'Trough': 4        // Average 4 turns
        };
    }

    /**
     * Advances the macroeconomic state by one turn tick
     * 
     * @param {Object} macroState - Reference to state.macro
     */
    step(macroState) {
        if (!macroState) return;

        macroState.cycleProgress = (macroState.cycleProgress || 0) + 1;
        const currentPhase = macroState.economicCycle || 'Expansion';
        const targetDuration = this.phaseDurations[currentPhase] || 10;

        // Check for phase transition with slight randomness
        const transitionProbability = macroState.cycleProgress / targetDuration;
        if (Math.random() < transitionProbability && macroState.cycleProgress >= 3) {
            const currentIndex = this.cyclePhases.indexOf(currentPhase);
            const nextIndex = (currentIndex + 1) % this.cyclePhases.length;
            macroState.economicCycle = this.cyclePhases[nextIndex];
            macroState.cycleProgress = 0;
        }

        // Adjust macroeconomic variables based on current cycle phase
        this.updateIndicators(macroState);
    }

    /**
     * Updates CPI Inflation, Central Bank Interest Rates, and Unemployment
     * 
     * @param {Object} macro - Reference to state.macro
     */
    updateIndicators(macro) {
        const noise = () => (Math.random() - 0.5) * 0.002;

        switch (macro.economicCycle) {
            case 'Expansion':
                // Steady growth: Inflation rises moderately, unemployment falls, rate stays stable or increases slowly
                macro.cpiInflationRate = Math.min(0.06, macro.cpiInflationRate + 0.001 + noise());
                macro.unemploymentRate = Math.max(0.03, macro.unemploymentRate - 0.001 + noise());
                if (macro.cpiInflationRate > 0.035) {
                    macro.centralBankRate = Math.min(0.08, macro.centralBankRate + 0.0025); // Rate hike to curb inflation
                }
                break;

            case 'Peak':
                // High inflation, tight labor market, high central bank policy rate
                macro.cpiInflationRate = Math.min(0.09, macro.cpiInflationRate + 0.002 + noise());
                macro.centralBankRate = Math.min(0.095, macro.centralBankRate + 0.0025);
                break;

            case 'Contraction':
                // Slowdown: Inflation drops, unemployment rises, central bank cuts rates
                macro.cpiInflationRate = Math.max(0.005, macro.cpiInflationRate - 0.002 + noise());
                macro.unemploymentRate = Math.min(0.095, macro.unemploymentRate + 0.002 + noise());
                macro.centralBankRate = Math.max(0.01, macro.centralBankRate - 0.0025); // Rate cuts to stimulate
                break;

            case 'Trough':
                // Bottoming out: Low inflation, elevated unemployment, low interest rate environment
                macro.cpiInflationRate = Math.max(0.01, macro.cpiInflationRate + noise());
                macro.unemploymentRate = Math.max(0.04, macro.unemploymentRate - 0.0005 + noise());
                macro.centralBankRate = Math.max(0.005, macro.centralBankRate);
                break;
        }

        // Clamp values within reasonable bounds
        macro.cpiInflationRate = Math.max(0, parseFloat(macro.cpiInflationRate.toFixed(4)));
        macro.centralBankRate = Math.max(0.001, parseFloat(macro.centralBankRate.toFixed(4)));
        macro.unemploymentRate = Math.max(0.02, parseFloat(macro.unemploymentRate.toFixed(4)));
    }
}