/**
 * WEALTH QUEST: SOVEREIGN ECONOMY
 * Asset Icon Generator Module
 * 
 * Generates programmatic SVG vector icons, dynamic Canvas UI badges,
 * asset category emblems, and browser favicons at runtime without external dependencies.
 */

export class IconGenerator {
    /**
     * Set of predefined SVG vector paths for core game icons
     */
    static ICONS = {
        CASH: `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-1c-1.1 0-2-.9-2-2v-1c0-1.1.9-2 2-2h3v-2h-4V7h2v1c1.1 0 2 .9 2 2v1c0 1.1-.9 2-2 2h-3v2h4v2z" fill="currentColor"/>`,
        EQUITY: `<path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z" fill="currentColor"/>`,
        BUSINESS: `<path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" fill="currentColor"/>`,
        COMMODITY: `<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.78c0-2.33 4.67-3.62 7-3.62s7 1.29 7 3.62v.78z" fill="currentColor"/>`,
        BANK: `<path d="M4 10v7h3v-7H4zm6 0v7h3v-7h-3zM2 22h19v-3H2v3zm14-12v7h3v-7h-3zm-7-7L2 6v2h19V6L11 3z" fill="currentColor"/>`,
        MACRO: `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor"/>`
    };

    /**
     * Returns an inline SVG string for a given icon key
     * 
     * @param {string} iconKey - Key matching ICONS object (e.g. 'CASH', 'EQUITY')
     * @param {string} color - Fill CSS color string
     * @param {number} size - Pixel dimensions (width and height)
     * @returns {string} Inline SVG string
     */
    static getSVG(iconKey, color = '#4CAF50', size = 24) {
        const path = this.ICONS[iconKey] || this.ICONS.CASH;
        return `
            <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" style="color: ${color}; display: inline-block; vertical-align: middle;">
                ${path}
            </svg>
        `.trim();
    }

    /**
     * Generates a dynamic Favicon on the fly and attaches it to the document head
     */
    static generateFavicon() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        // Background Circle
        ctx.fillStyle = '#141416';
        ctx.beginPath();
        ctx.arc(32, 32, 30, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#00ADB5';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Sovereign Currency Emblem ($)
        ctx.fillStyle = '#4E9F3D';
        ctx.font = 'bold 36px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', 32, 34);

        // Inject as Link Tag
        const link = document.createElement('link');
        link.rel = 'icon';
        link.type = 'image/x-icon';
        link.href = canvas.toDataURL('image/x-icon');

        const existingFavicon = document.querySelector("link[rel*='icon']");
        if (existingFavicon) {
            document.head.removeChild(existingFavicon);
        }
        document.head.appendChild(link);
    }

    /**
     * Programmatically renders a Data URL image badge for asset listings
     * 
     * @param {string} symbol - Ticker symbol (e.g. 'SPX', 'GOLD')
     * @param {string} bgColor - Hex background color
     * @returns {string} Base64 Data URL string
     */
    static createAssetBadgeDataUrl(symbol = '', bgColor = '#2A2A2D') {
        const canvas = document.createElement('canvas');
        canvas.width = 48;
        canvas.height = 48;
        const ctx = canvas.getContext('2d');

        if (!ctx) return '';

        // Rounded Rect Frame
        ctx.fillStyle = bgColor;
        ctx.beginPath();
        ctx.roundRect(0, 0, 48, 48, 8);
        ctx.fill();

        // Text Initials
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(symbol.substring(0, 3).toUpperCase(), 24, 24);

        return canvas.toDataURL('image/png');
    }
}