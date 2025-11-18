/**
 * Player color utilities for consistent color theming across the game
 */

export interface PlayerColorInfo {
    name: string;
    textColor: string;
    bgColor: string;
    borderColor: string;
    glowColor: string;
}

/**
 * Color mapping for player aliases
 */
export const PLAYER_COLORS: Record<string, PlayerColorInfo> = {
    '0xRed': {
        name: '0xRed',
        textColor: '#FF4444', // Bright red
        bgColor: '#FF4444/20',
        borderColor: '#FF4444/50',
        glowColor: '#FF4444'
    },
    '0xBlue': {
        name: '0xBlue',
        textColor: '#4488FF', // Bright blue
        bgColor: '#4488FF/20',
        borderColor: '#4488FF/50',
        glowColor: '#4488FF'
    },
    '0xPurple': {
        name: '0xPurple',
        textColor: '#AA44FF', // Bright purple
        bgColor: '#AA44FF/20',
        borderColor: '#AA44FF/50',
        glowColor: '#AA44FF'
    },
    '0xYellow': {
        name: '0xYellow',
        textColor: '#FFDD44', // Bright yellow
        bgColor: '#FFDD44/20',
        borderColor: '#FFDD44/50',
        glowColor: '#FFDD44'
    }
};

/**
 * Get color info for a player name
 */
export function getPlayerColor(playerName: string): PlayerColorInfo | null {
    return PLAYER_COLORS[playerName] || null;
}

/**
 * Get text color for a player name
 */
export function getPlayerTextColor(playerName: string): string {
    const colorInfo = getPlayerColor(playerName);
    return colorInfo ? colorInfo.textColor : '#FFFFFF'; // Default to white
}

/**
 * Check if a player name has a color mapping
 */
export function hasPlayerColor(playerName: string): boolean {
    return playerName in PLAYER_COLORS;
}

/**
 * Get CSS style object for player name coloring
 */
export function getPlayerNameStyle(playerName: string): React.CSSProperties {
    const colorInfo = getPlayerColor(playerName);
    if (!colorInfo) {
        return { color: '#FFFFFF' };
    }

    return {
        color: colorInfo.textColor,
        textShadow: `0 0 8px ${colorInfo.glowColor}`,
    };
}

/**
 * Get Tailwind classes for player name coloring
 */
export function getPlayerNameClasses(playerName: string): string {
    const colorInfo = getPlayerColor(playerName);
    if (!colorInfo) {
        return 'text-white';
    }

    // Return custom style since Tailwind doesn't have these exact colors
    return 'font-bold';
}