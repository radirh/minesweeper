/**
 * Stats Module
 * Handles local statistics persistence, daily resets, and updates.
 */

const STORAGE_KEY = 'minesweeper_stats';

const defaultStats = {
    totalGames: 0,
    totalWins: 0,
    totalLosses: 0,
    bestEasyTime: null,
    bestMediumTime: null,
    bestHardTime: null,
    currentWinStreak: 0,
    bestWinStreak: 0,
    currentLossStreak: 0, // Track consecutive losses
    totalFlagsPlaced: 0,
    totalTilesOpened: 0,
    smileyClicks: 0, // Total smile face clicks
    customMenuOpens: 0, // Total custom settings opened
    dailyCompletions: 0, // Total daily challenge/win completions
    
    // Daily Session summaries
    todayWins: 0,
    todayLosses: 0,
    todayNewRecords: 0,
    todayAchievements: 0,
    lastActiveDate: "" // Format: YYYY-MM-DD
};

/**
 * Loads stats from localStorage and checks for daily reset.
 * @returns {object} The loaded stats object
 */
export function loadStats() {
    let stats = defaultStats;
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            stats = { ...defaultStats, ...JSON.parse(stored) };
        }
    } catch (e) {
        console.error("Failed to load statistics from localStorage.", e);
    }

    // Daily Reset Check (UTC based)
    const todayStr = new Date().toISOString().split('T')[0];
    if (stats.lastActiveDate !== todayStr) {
        stats.todayWins = 0;
        stats.todayLosses = 0;
        stats.todayNewRecords = 0;
        stats.todayAchievements = 0;
        stats.lastActiveDate = todayStr;
        saveStats(stats);
    }

    return stats;
}

/**
 * Persists stats to localStorage
 * @param {object} stats 
 */
export function saveStats(stats) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch (e) {
        console.error("Failed to save statistics to localStorage.", e);
    }
}

/**
 * Record a game completion
 * @param {boolean} isWin 
 * @param {string} difficulty 
 * @param {number} timeSeconds 
 * @param {number} flagsPlaced 
 * @param {number} tilesOpened 
 * @returns {object} { stats, isNewRecord }
 */
export function recordGame(isWin, difficulty, timeSeconds, flagsPlaced, tilesOpened) {
    const stats = loadStats();
    
    stats.totalGames++;
    stats.totalFlagsPlaced += flagsPlaced;
    stats.totalTilesOpened += tilesOpened;

    let isNewRecord = false;

    if (isWin) {
        stats.totalWins++;
        stats.todayWins++;
        if (stats.todayWins === 1) {
            stats.dailyCompletions = (stats.dailyCompletions || 0) + 1;
        }
        stats.currentWinStreak++;
        stats.currentLossStreak = 0; // Reset loss streak on win
        if (stats.currentWinStreak > stats.bestWinStreak) {
            stats.bestWinStreak = stats.currentWinStreak;
        }

        // Check and record personal bests for preset difficulties
        if (difficulty === 'beginner') {
            if (stats.bestEasyTime === null || timeSeconds < stats.bestEasyTime) {
                stats.bestEasyTime = timeSeconds;
                isNewRecord = true;
            }
        } else if (difficulty === 'intermediate') {
            if (stats.bestMediumTime === null || timeSeconds < stats.bestMediumTime) {
                stats.bestMediumTime = timeSeconds;
                isNewRecord = true;
            }
        } else if (difficulty === 'expert') {
            if (stats.bestHardTime === null || timeSeconds < stats.bestHardTime) {
                stats.bestHardTime = timeSeconds;
                isNewRecord = true;
            }
        }

        if (isNewRecord) {
            stats.todayNewRecords++;
        }
    } else {
        stats.totalLosses++;
        stats.todayLosses++;
        stats.currentWinStreak = 0;
        stats.currentLossStreak++; // Increment consecutive losses
    }

    saveStats(stats);
    return { stats, isNewRecord };
}

/**
 * Helper to calculate active win rate percentage
 * @param {object} stats 
 * @returns {number} Win rate (0 - 100)
 */
export function getWinRate(stats) {
    if (stats.totalGames === 0) return 0;
    return Math.floor((stats.totalWins / stats.totalGames) * 100);
}
