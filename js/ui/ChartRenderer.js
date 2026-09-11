/**
 * WEALTH QUEST: SOVEREIGN ECONOMY
 * Chart Renderer Module
 * 
 * High-performance HTML5 Canvas chart renderer for market price histories,
 * macroeconomic trends, and net worth progress.
 */

export class ChartRenderer {
    /**
     * Renders a single-line financial chart on a target HTML5 Canvas element
     * 
     * @param {HTMLCanvasElement} canvas - Target Canvas DOM Element
     * @param {Array<number>} data - Numerical data points to render
     * @param {Object} options - Custom visual configuration parameters
     */
    static renderLineChart(canvas, data = [], options = {}) {
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Handle high DPI / Retina displays by scaling canvas pixel ratio
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const width = rect.width;
        const height = rect.height;

        // Default style configurations
        const config = {
            strokeColor: options.strokeColor || '#4CAF50',
            fillColor: options.fillColor || 'rgba(76, 175, 80, 0.12)',
            gridColor: options.gridColor || '#222222',
            textColor: options.textColor || '#888888',
            lineWidth: options.lineWidth || 2,
            padding: options.padding || 30,
            showGradient: options.showGradient !== false,
            ...options
        };

        // Clear canvas context
        ctx.clearRect(0, 0, width, height);

        if (!Array.isArray(data) || data.length < 2) {
            ctx.fillStyle = config.textColor;
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Awaiting historical price data...', width / 2, height / 2);
            return;
        }

        // Calculate min/max data range with a 5% margin buffer
        let rawMin = Math.min(...data);
        let rawMax = Math.max(...data);
        if (rawMin === rawMax) {
            rawMin *= 0.95;
            rawMax *= 1.05;
        }
        
        const minVal = rawMin * 0.98;
        const maxVal = rawMax * 1.02;
        const range = maxVal - minVal || 1;

        const plotX = config.padding;
        const plotY = config.padding / 2;
        const plotWidth = width - config.padding * 1.5;
        const plotHeight = height - config.padding * 1.5;

        // 1. Draw Horizontal Grid Lines & Y-Axis Labels
        const gridLines = 4;
        ctx.strokeStyle = config.gridColor;
        ctx.fillStyle = config.textColor;
        ctx.font = '10px monospace';
        ctx.textAlign = 'right';
        ctx.lineWidth = 1;

        for (let i = 0; i <= gridLines; i++) {
            const ratio = i / gridLines;
            const y = plotY + plotHeight - (ratio * plotHeight);
            const val = minVal + (ratio * range);

            // Gridline
            ctx.beginPath();
            ctx.moveTo(plotX, y);
            ctx.lineTo(plotX + plotWidth, y);
            ctx.stroke();

            // Y-Axis Value Label
            ctx.fillText(`$${val.toFixed(2)}`, plotX - 6, y + 3);
        }

        // 2. Compute Data Points Coordinates
        const stepX = plotWidth / (data.length - 1);
        const points = data.map((val, idx) => {
            const x = plotX + (idx * stepX);
            const normalizedY = (val - minVal) / range;
            const y = plotY + plotHeight - (normalizedY * plotHeight);
            return { x, y };
        });

        // 3. Draw Gradient Background Fill
        if (config.showGradient) {
            const gradient = ctx.createLinearGradient(0, plotY, 0, plotY + plotHeight);
            gradient.addColorStop(0, config.fillColor);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            points.forEach(p => ctx.lineTo(p.x, p.y));
            ctx.lineTo(points[points.length - 1].x, plotY + plotHeight);
            ctx.lineTo(points[0].x, plotY + plotHeight);
            ctx.closePath();
            ctx.fillStyle = gradient;
            ctx.fill();
        }

        // 4. Draw Primary Trend Line
        ctx.beginPath();
        ctx.strokeStyle = config.strokeColor;
        ctx.lineWidth = config.lineWidth;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        points.forEach((p, idx) => {
            if (idx === 0) {
                ctx.moveTo(p.x, p.y);
            } else {
                ctx.lineTo(p.x, p.y);
            }
        });
        ctx.stroke();

        // 5. Highlight Latest Data Point Node
        const lastPoint = points[points.length - 1];
        ctx.beginPath();
        ctx.arc(lastPoint.x, lastPoint.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = config.strokeColor;
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }
}