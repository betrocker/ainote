// Apple-like semantičke boje (Light/Dark) — minimal set

export const ios = {
    // Backgrounds
    bg: "#F2F2F7",     // systemGroupedBackground (light)
    surface: "#FFFFFF", // systemBackground (cards, modals)

    // Labels (text)
    label: "#000000",      // primarni tekst (Apple koristi skoro crnu, ali 100% je ok u light)
    label2: "#3C3C4399",   // secondary (60%)

    // Separators & Fills
    sep: "#3C3C434A",      // separator
    fill: "#78788029",     // secondary fill (16%) za kartice i button backgrounds

    // Accents
    blue: "#007AFF",       // systemBlue (link, primary action)

    // Status
    red: "#FF3B30",        // systemRed
    green: "#34C759",      // systemGreen
    orange: "#FF9500",     // systemOrange
};

export const iosd = {
    // Backgrounds
    bg: "#1C1C1E",     // systemGroupedBackground (dark)
    surface: "#2C2C2E", // systemBackground (cards, modals)

    // Labels (text)
    label: "#FFFFFF",      // primarni tekst (Apple koristi skoro belu, 100% je ok u dark)
    label2: "#EBEBF599",   // secondary (60%)

    // Separators & Fills
    sep: "#54545899",      // separator
    fill: "#78788052",     // secondary fill (32%) za kartice i button backgrounds

    // Accents
    blue: "#0A84FF",       // systemBlue (dark variant)

    // Status
    red: "#FF453A",        // systemRed (dark)
    green: "#30D158",      // systemGreen (dark)
    orange: "#FF9F0A",     // systemOrange (dark)
};

export const tokens = {ios, iosd};
export type ThemeTokens = typeof tokens;
