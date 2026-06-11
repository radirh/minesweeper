import { Game } from './game.js';
import { loadStats, saveStats, recordGame, getWinRate } from './stats.js';
import { loadUnlockedAchievements, checkAchievements, unlockAchievement, ACHIEVEMENT_LIST } from './achievements.js';
import { StickerManager } from './stickers.js';

// ─── Global game instance ─────────────────────────────────────────────────────
const game = new Game();

// ─── DOM Selectors ────────────────────────────────────────────────────────────
const timerEl       = document.getElementById('timer');
const minesLeftEl   = document.getElementById('mines-left');
const scoreEl       = document.getElementById('score');
const resetBtn      = document.getElementById('reset-btn');
const faceIcon      = resetBtn.querySelector('.face-icon');
const boardContainer = document.getElementById('board-container');

const mobileModeReveal = document.getElementById('mobile-mode-reveal');
const mobileModeFlag   = document.getElementById('mobile-mode-flag');
let mobileActiveMode   = 'reveal';

const diffButtons = document.querySelectorAll('.diff-btn');

const customDialog      = document.getElementById('custom-dialog');
const customWidthInput  = document.getElementById('custom-width');
const customHeightInput = document.getElementById('custom-height');
const customMinesInput  = document.getElementById('custom-mines');
const customConfirmBtn  = document.getElementById('custom-confirm');
const customCancelBtn   = document.getElementById('custom-cancel');

const statsModal      = document.getElementById('stats-modal');
const statsToggleBtn  = document.getElementById('stats-toggle-btn');
const statsCloseBtn   = document.getElementById('stats-close');
const statsResetBtn   = document.getElementById('stats-reset-btn');

const themeDialog      = document.getElementById('theme-dialog');
const themeToggleBtn   = document.getElementById('theme-toggle-btn');
const themeCloseBtn    = document.getElementById('theme-close');

const achievementsModal      = document.getElementById('achievements-modal');
const achievementsToggleBtn  = document.getElementById('achievements-toggle-btn');
const achievementsCloseBtn   = document.getElementById('achievements-close');

const gameOverDialog          = document.getElementById('game-over-dialog');
const gameOverTitle           = document.getElementById('game-over-title');
const gameResultsPanel        = document.getElementById('game-results');
const newRecordAlert          = document.getElementById('new-record-alert');
const runAchievementsContainer = document.getElementById('run-achievements-container');
const runAchievementsList     = document.getElementById('run-achievements-list');
const gameOverActionBtn       = document.getElementById('game-over-action-btn');

const summaryWins         = document.getElementById('summary-wins');
const summaryLosses       = document.getElementById('summary-losses');
const summaryRecords      = document.getElementById('summary-records');
const summaryAchievements = document.getElementById('summary-achievements');

const leaderboardModal     = document.getElementById('leaderboard-modal');
const leaderboardToggleBtn = document.getElementById('leaderboard-toggle-btn');
const leaderboardCloseBtn  = document.getElementById('leaderboard-close');

// DOM Grid references for O(1) cell selection
let domGrid = [];

// ─── Session trackers ─────────────────────────────────────────────────────────
let faceClicks    = 0;
let themeOpens    = 0;

// Secret Console gesture state
let faceTapCount                = 0;
let lastFaceTapTime             = 0;
let faceLongPressTimeout        = null;
let preventResetOnConsoleOpen   = false;

// Face emoji state
let temporaryFace        = null;
let faceOverrideTimeout  = null;
let hoverActive          = false;
let hoverTimeout         = null;

// Idle / screensaver state
let idleSeconds      = 0;
let playIdleSeconds  = 0;

// Achievement toast queue
let achievementQueue    = [];
let achievementShowing  = false;
let currentToastElement = null;
let currentToastTimeout1 = null;
let currentToastTimeout2 = null;
let currentToastTimeout3 = null;

// ─── Achievement toast helpers ────────────────────────────────────────────────
function dismissAllAchievementNotifications() {
    achievementQueue = [];
    if (currentToastTimeout1) clearTimeout(currentToastTimeout1);
    if (currentToastTimeout2) clearTimeout(currentToastTimeout2);
    if (currentToastTimeout3) clearTimeout(currentToastTimeout3);
    currentToastTimeout1 = null;
    currentToastTimeout2 = null;
    currentToastTimeout3 = null;
    if (currentToastElement) {
        currentToastElement.remove();
        currentToastElement = null;
    }
    achievementShowing = false;
}

// ─── Face emoji ───────────────────────────────────────────────────────────────
function updateFaceEmoji() {
    if (temporaryFace) {
        faceIcon.textContent = temporaryFace;
        return;
    }
    if (game.status === 'won') {
        faceIcon.textContent = '😎';
        return;
    }
    if (game.status === 'lost') {
        const errors       = game.board ? game.board.getEndGameState() : [];
        const hasFalseFlag = errors.some(c => !c.isMine && c.isFlagged);
        faceIcon.textContent = hasFalseFlag ? '🤨' : '💀';
        return;
    }
    if (window.gameCheatsEnabled) {
        faceIcon.textContent = window.gameCheatInfiniteLives ? '👑' : '😈';
        return;
    }
    if (idleSeconds >= 30) {
        faceIcon.textContent = '😴';
        return;
    }
    if (game.status === 'playing' && playIdleSeconds >= 15) {
        faceIcon.textContent = '🥶';
        return;
    }
    if (hoverActive) {
        faceIcon.textContent = '🤔';
        return;
    }
    if (game.status === 'playing') {
        const totalSafe     = game.rows * game.cols - game.minesCount;
        const remainingSafe = totalSafe - game.revealedCount;
        if (remainingSafe > 0 && remainingSafe <= 3) {
            faceIcon.textContent = '😱';
            return;
        }
    }
    const currentTheme = localStorage.getItem('minesweeper_theme') || 'midnight';
    if      (currentTheme === 'halloween') faceIcon.textContent = '🎃';
    else if (currentTheme === 'christmas') faceIcon.textContent = '🎄';
    else if (currentTheme === 'cat')       faceIcon.textContent = '🐱';
    else if (currentTheme === 'banana')    faceIcon.textContent = '🍌';
    else                                   faceIcon.textContent = '🙂';
}

function triggerTemporaryFace(emoji, duration = 1500) {
    temporaryFace = emoji;
    updateFaceEmoji();
    if (faceOverrideTimeout) clearTimeout(faceOverrideTimeout);
    faceOverrideTimeout = setTimeout(() => {
        temporaryFace = null;
        updateFaceEmoji();
    }, duration);
}

// ─── Game lifecycle ───────────────────────────────────────────────────────────
function startNewGame(difficulty, customWidth, customHeight, customMines) {
    dismissAllAchievementNotifications();
    game.initGame(difficulty, customWidth, customHeight, customMines);
    game.foundEight = false;
    updateHUD();
    updateFaceEmoji();
    buildBoardDOM();
    updateCheatGridDisplay();
}

function resizeBoard() {
    if (!game || !game.board) return;
    const viewport = document.querySelector('.board-viewport');
    if (!viewport || !boardContainer) return;

    // Viewport padding (from board-viewport CSS: padding: 10px)
    const viewportPaddingX = 20;
    const viewportPaddingY = 20;

    // Board container own chrome: padding 5px each side + 1px border each side = 12px per axis
    const containerChromeX = 12;
    const containerChromeY = 12;

    const gap  = 2;
    const cols = game.cols;
    const rows = game.rows;

    const availWidth  = viewport.clientWidth  - viewportPaddingX - containerChromeX;
    const availHeight = viewport.clientHeight - viewportPaddingY - containerChromeY;

    const maxTileW = Math.floor((availWidth  - (cols - 1) * gap) / cols);
    const maxTileH = Math.floor((availHeight - (rows - 1) * gap) / rows);
    let size = Math.min(maxTileW, maxTileH);

    // Clamp to sensible min/max per difficulty so tiles never become unplayable
    if      (game.difficulty === 'beginner')     size = Math.min(Math.max(size, 26), 48);
    else if (game.difficulty === 'intermediate') size = Math.min(Math.max(size, 20), 36);
    else                                         size = Math.min(Math.max(size, 14), 28);

    boardContainer.style.setProperty('--tile-size', `${size}px`);
    boardContainer.style.gridTemplateRows    = `repeat(${rows}, ${size}px)`;
    boardContainer.style.gridTemplateColumns = `repeat(${cols}, ${size}px)`;
}


function buildBoardDOM() {
    boardContainer.innerHTML = '';
    domGrid = [];
    resizeBoard();

    for (let r = 0; r < game.rows; r++) {
        const domRow = [];
        for (let c = 0; c < game.cols; c++) {
            const tile = document.createElement('div');
            tile.classList.add('tile');
            tile.dataset.row = r;
            tile.dataset.col = c;
            boardContainer.appendChild(tile);
            domRow.push(tile);
        }
        domGrid.push(domRow);
    }
}

// ─── Reveal animations ────────────────────────────────────────────────────────
function animateRippleReveal(updated, originRow, originCol) {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (updated.length >= 15) triggerTemporaryFace('🤯', 1500);

    updated.forEach(cell => {
        const tileEl = domGrid[cell.row][cell.col];
        if (!tileEl) return;

        tileEl.style.setProperty(
            '--ripple-delay',
            prefersReducedMotion
                ? '0ms'
                : `{Math.abs(cell.row - originRow) + Math.abs(cell.col - originCol)) * 18}ms`
        );
        updateTileDOM(cell);
    });

    updateCheatGridDisplay();
    checkGameOver();
}

// ─── Cell interaction handlers ────────────────────────────────────────────────
function handleCellLeftClick(row, col) {
    const cell = game.board.grid[row][col];
    if (cell.isRevealed) {
        handleCellChord(row, col);
        return;
    }

    const prob   = getCellProbability(row, col);
    const isRisky = prob !== null && prob > 50;

    const updated = game.reveal(row, col, (time) => {
        timerEl.textContent = String(time).padStart(3, '0');
    });

    if (updated.length > 0) {
        if (isRisky && game.status !== 'lost') triggerTemporaryFace('😅', 1500);
        animateRippleReveal(updated, row, col);
    }
}

function handleCellRightClick(row, col) {
    const updatedCell = game.cycleMark(row, col);
    if (updatedCell) {
        updateTileDOM(updatedCell);
        updateHUD();
        updateCheatGridDisplay();
    }
}

function handleCellChord(row, col) {
    const updated = game.chord(row, col);
    if (updated.length > 0) {
        triggerTemporaryFace('🧐', 1200);
        animateRippleReveal(updated, row, col);
    }
}

// ─── HUD ──────────────────────────────────────────────────────────────────────
function updateHUD() {
    minesLeftEl.textContent = String(game.getMinesLeftCount()).padStart(3, '0');
    scoreEl.textContent     = String(game.score).padStart(4, '0');
    timerEl.textContent     = String(game.timer).padStart(3, '0');

    let cheatBadge  = document.getElementById('hud-cheat-badge');
    let devBadge    = document.getElementById('hud-dev-badge');
    const hudContainer = document.querySelector('.hud-container');

    if (window.gameCheatsEnabled) {
        if (!cheatBadge && hudContainer) {
            cheatBadge = document.createElement('span');
            cheatBadge.id        = 'hud-cheat-badge';
            cheatBadge.className = 'cheat-badge';
            cheatBadge.textContent = '⚡ CHEAT MODE ENABLED';
            hudContainer.insertBefore(cheatBadge, resetBtn);
        }
        if (window.gameCheatInfiniteLives) {
            if (!devBadge && hudContainer) {
                devBadge = document.createElement('span');
                devBadge.id        = 'hud-dev-badge';
                devBadge.className = 'dev-badge';
                devBadge.textContent = 'DEV';
                hudContainer.insertBefore(devBadge, resetBtn.nextSibling);
            }
        } else if (devBadge) {
            devBadge.remove();
        }
    } else {
        if (cheatBadge) cheatBadge.remove();
        if (devBadge)   devBadge.remove();
    }
}

// ─── Tile DOM sync ────────────────────────────────────────────────────────────
function updateTileDOM(cell) {
    const tileEl = domGrid[cell.row][cell.col];
    if (!tileEl) return;

    tileEl.className   = 'tile';
    tileEl.textContent = '';

    if (cell.isRevealed) {
        tileEl.classList.add('revealed');
        if (cell.isMine) {
            tileEl.classList.add('mine');
            if (cell.exploded) tileEl.classList.add('exploded');
        } else if (cell.neighborMines > 0) {
            if (window.gameCheatsEnabled && window.gameCheatHideNumbers) {
                tileEl.classList.add('num-hidden');
            }
            tileEl.classList.add(`num-${cell.neighborMines}`);
            tileEl.textContent = cell.neighborMines;

            if (cell.neighborMines === 8) {
                unlockAchievement('lucky_survivor');
                game.foundEight = true;
            }
        }
    } else {
        if      (cell.isFlagged)   tileEl.classList.add('flagged');
        else if (cell.isQuestion)  tileEl.classList.add('question');
    }
}

// ─── Game over ────────────────────────────────────────────────────────────────
function checkGameOver() {
    if (game.status === 'won') {
        updateFaceEmoji();
        highlightWin();
        const cascadeDelay = (game.rows + game.cols) * 25 + 150;
        setTimeout(() => showGameOverModal(true), cascadeDelay);
    } else if (game.status === 'lost') {
        updateFaceEmoji();
        revealMinesOnLoss();
        const waveDelay = Math.max(game.rows, game.cols) * 30 + 200;
        setTimeout(() => showGameOverModal(false), waveDelay);
    }
}

function revealMinesOnLoss() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const errors = game.board.getEndGameState();

    let originRow = 0, originCol = 0;
    outer: for (let r = 0; r < game.rows; r++) {
        for (let c = 0; c < game.cols; c++) {
            if (game.board.grid[r][c].exploded) {
                originRow = r;
                originCol = c;
                break outer;
            }
        }
    }

    errors.forEach(cell => {
        const tileEl = domGrid[cell.row][cell.col];
        if (!tileEl) return;

        const apply = () => {
            if (cell.isMine && !cell.isFlagged)      tileEl.classList.add('revealed', 'mine');
            else if (!cell.isMine && cell.isFlagged) tileEl.classList.add('false-flag');
        };

        if (prefersReducedMotion) {
            apply();
        } else {
            const dist = Math.abs(cell.row - originRow) + Math.abs(cell.col - originCol);
            setTimeout(apply, dist * 30);
        }
    });
}

function highlightWin() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const minesToFlag = [];

    for (let r = 0; r < game.rows; r++) {
        for (let c = 0; c < game.cols; c++) {
            const cell = game.board.grid[r][c];
            if (cell.isMine && !cell.isFlagged) {
                cell.isFlagged = true;
                minesToFlag.push(cell);
            }
        }
    }

    if (prefersReducedMotion || minesToFlag.length === 0) {
        minesToFlag.forEach(c => updateTileDOM(c));
        updateHUD();
        return;
    }

    minesToFlag.forEach(cell => {
        const delay = (cell.row + cell.col) * 25;
        setTimeout(() => { updateTileDOM(cell); updateHUD(); }, delay);
    });
}

function showGameOverModal(isWin) {
    let flagsPlaced = 0;
    for (let r = 0; r < game.rows; r++) {
        for (let c = 0; c < game.cols; c++) {
            if (game.board.grid[r][c].isFlagged) flagsPlaced++;
        }
    }
    const tilesOpened = game.revealedCount;

    let stats         = loadStats();
    let isNewRecord   = false;
    if (!window.gameCheatsEnabled) {
        const result  = recordGame(isWin, game.difficulty, game.timer, flagsPlaced, tilesOpened);
        stats         = result.stats;
        isNewRecord   = result.isNewRecord;
    }

    const newlyUnlocked = checkAchievements(game, stats);

    if (isWin) {
        gameOverTitle.textContent  = '🎉 VICTORY!';
        gameOverTitle.style.color  = 'var(--accent-color)';
        const bannerShow           = isNewRecord && !window.gameCheatsEnabled;

        gameResultsPanel.innerHTML = `
            Time Elapsed: <span>${game.timer} seconds</span><br>
            Game Score: <span>${window.gameCheatsEnabled ? 0 : game.score} pts</span>
        `;
        gameOverActionBtn.textContent = 'Play Again';

        if (bannerShow) newRecordAlert.classList.remove('hidden');
        else            newRecordAlert.classList.add('hidden');

        if (newlyUnlocked.length > 0) {
            runAchievementsContainer.classList.remove('hidden');
            runAchievementsList.innerHTML = '';
            newlyUnlocked.forEach(ach => {
                const badge       = document.createElement('div');
                badge.className   = 'badge-item';
                badge.innerHTML   = `<span>${ach.icon}</span> ${ach.title}`;
                runAchievementsList.appendChild(badge);
            });
        } else {
            runAchievementsContainer.classList.add('hidden');
        }
    } else {
        gameOverTitle.textContent  = '💥 GAME OVER';
        gameOverTitle.style.color  = 'var(--mine-color)';

        const totalNonMines = (game.rows * game.cols) - game.minesCount;
        const pctCleared    = Math.floor((game.revealedCount / totalNonMines) * 100);

        gameResultsPanel.innerHTML = `
            Board Cleared: <span>${pctCleared}%</span><br>
            Opened <span>${game.revealedCount}</span> cells
        `;
        gameOverActionBtn.textContent = 'Retry Grid';
        newRecordAlert.classList.add('hidden');
        runAchievementsContainer.classList.add('hidden');
    }

    summaryWins.textContent         = stats.todayWins;
    summaryLosses.textContent       = stats.todayLosses;
    summaryRecords.textContent      = stats.todayNewRecords;
    summaryAchievements.textContent = stats.todayAchievements;

    gameOverDialog.classList.remove('hidden');
}

// ─── Stats modal ──────────────────────────────────────────────────────────────
function renderStatsModal() {
    const stats = loadStats();
    document.getElementById('stats-games').textContent       = stats.totalGames;
    document.getElementById('stats-wins').textContent        = stats.totalWins;
    document.getElementById('stats-losses').textContent      = stats.totalLosses;
    document.getElementById('stats-winrate').textContent     = `${getWinRate(stats)}%`;
    document.getElementById('stats-best-easy').textContent   = stats.bestEasyTime   !== null ? `${stats.bestEasyTime}s`   : 'N/A';
    document.getElementById('stats-best-medium').textContent = stats.bestMediumTime !== null ? `${stats.bestMediumTime}s` : 'N/A';
    document.getElementById('stats-best-hard').textContent   = stats.bestHardTime   !== null ? `${stats.bestHardTime}s`   : 'N/A';
    document.getElementById('stats-streak').textContent      = stats.currentWinStreak;
    document.getElementById('stats-best-streak').textContent = stats.bestWinStreak;
    document.getElementById('stats-flags').textContent       = stats.totalFlagsPlaced;
    document.getElementById('stats-tiles').textContent       = stats.totalTilesOpened;
}

// ─── Achievements modal ───────────────────────────────────────────────────────
function renderAchievementsModal() {
    const body = document.getElementById('achievements-list-body');
    if (!body) return;

    const unlocked = loadUnlockedAchievements();
    body.innerHTML = '';

    ACHIEVEMENT_LIST.forEach(ach => {
        const isUnlocked = unlocked.includes(ach.id);
        if (ach.secret && !isUnlocked) return;

        const item       = document.createElement('div');
        item.className   = `achievement-item ${isUnlocked ? 'unlocked' : ''}`;
        item.innerHTML   = `
            <div class="achievement-item-icon">${isUnlocked ? ach.icon : '🔒'}</div>
            <div class="achievement-item-details">
                <span class="achievement-item-title">${ach.title}</span>
                <span class="achievement-item-desc">${ach.desc}</span>
            </div>
            <div class="achievement-item-status">${isUnlocked ? 'Unlocked' : 'Locked'}</div>
        `;
        body.appendChild(item);
    });
}

// ─── Probability helper ───────────────────────────────────────────────────────
function getCellProbability(row, col) {
    const cell = game.board.grid[row][col];
    if (cell.isRevealed || cell.isFlagged) return null;

    let maxProb = 0;
    const neighbors = game.board.getNeighbors(row, col);
    let hasNumberedNeighbor = false;

    neighbors.forEach(n => {
        if (n.isRevealed && n.neighborMines > 0) {
            hasNumberedNeighbor = true;
            const closedNeighbors = game.board.getNeighbors(n.row, n.col).filter(cn => !cn.isRevealed);
            const closedCount     = closedNeighbors.length;
            if (closedCount > 0) {
                const flagCount      = game.board.getNeighbors(n.row, n.col).filter(cn => cn.isFlagged).length;
                const activeMinesLeft = Math.max(0, n.neighborMines - flagCount);
                const prob           = activeMinesLeft / closedCount;
                if (prob > maxProb) maxProb = prob;
            }
        }
    });

    if (!hasNumberedNeighbor) {
        let closedCount = 0;
        for (let r = 0; r < game.rows; r++) {
            for (let c = 0; c < game.cols; c++) {
                const tile = game.board.grid[r][c];
                if (!tile.isRevealed && !tile.isFlagged) closedCount++;
            }
        }
        if (closedCount > 0) {
            return Math.floor((game.getMinesLeftCount() / closedCount) * 100);
        }
        return 0;
    }

    return Math.floor(maxProb * 100);
}

// ─── Cheat grid overlay ───────────────────────────────────────────────────────
function updateCheatGridDisplay() {
    const currentTheme = localStorage.getItem('minesweeper_theme') || 'midnight';
    const themeMeta    = THEME_REGISTRY.find(t => t.id === currentTheme);
    const isStandardTheme = themeMeta && themeMeta.category === 'standard';

    if (!window.gameCheatsEnabled || isStandardTheme) {
        for (let r = 0; r < game.rows; r++) {
            for (let c = 0; c < game.cols; c++) {
                const tileEl = domGrid[r]?.[c];
                if (tileEl) {
                    tileEl.classList.remove('has-prob', 'mine-reveal-cheat');
                    if (tileEl.textContent.endsWith('%')) tileEl.textContent = '';
                }
            }
        }
        return;
    }

    const showProb  = window.gameCheatProbabilityHelper;
    const showMines = window.gameCheatRevealMines;

    for (let r = 0; r < game.rows; r++) {
        for (let c = 0; c < game.cols; c++) {
            const cell   = game.board.grid[r][c];
            const tileEl = domGrid[r][c];
            if (!tileEl) continue;

            tileEl.classList.remove('has-prob', 'mine-reveal-cheat');

            if (!cell.isRevealed) {
                if (showMines && cell.isMine && !cell.isFlagged) {
                    tileEl.classList.add('mine-reveal-cheat');
                }
                if (showProb && !cell.isFlagged) {
                    const prob = getCellProbability(r, c);
                    if (prob !== null) {
                        tileEl.classList.add('has-prob');
                        tileEl.textContent = `${prob}%`;
                    }
                } else {
                    if (tileEl.textContent.endsWith('%')) tileEl.textContent = '';
                }
            }
        }
    }
}

// ─── Achievement toast ────────────────────────────────────────────────────────
window.addEventListener('achievement-unlocked', (e) => {
    achievementQueue.push(e.detail);
    processAchievementQueue();
});

function processAchievementQueue() {
    if (achievementShowing || achievementQueue.length === 0) return;
    achievementShowing = true;

    const ach            = achievementQueue.shift();
    triggerTemporaryFace('🥳', 2000);

    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) { achievementShowing = false; return; }

    const toast       = document.createElement('div');
    toast.className   = 'toast';
    toast.innerHTML   = `
        <div class="toast-icon">${ach.icon}</div>
        <div class="toast-content">
            <span class="toast-title">Achievement Unlocked!</span>
            <span class="toast-desc">${ach.title}: ${ach.desc}</span>
        </div>
    `;
    toastContainer.appendChild(toast);
    currentToastElement = toast;

    currentToastTimeout1 = setTimeout(() => {
        toast.classList.add('hide');
        currentToastTimeout2 = setTimeout(() => {
            toast.remove();
            currentToastElement = null;
            achievementShowing  = false;
            currentToastTimeout3 = setTimeout(processAchievementQueue, 200);
        }, 300);
    }, 2800);
}

// ─── Theme system ─────────────────────────────────────────────────────────────
function setTheme(themeName) {
    document.body.className = `theme-${themeName}`;
    localStorage.setItem('minesweeper_theme', themeName);

    if (themeName === 'chaos') {
        const randHue = () => Math.floor(Math.random() * 360);
        document.body.style.setProperty('--accent-color',   `hsl(${randHue()}, 80%, 50%)`);
        document.body.style.setProperty('--tile-color',     `hsl(${randHue()}, 40%, 25%)`);
        document.body.style.setProperty('--bg-color',       `hsl(${randHue()}, 50%, 10%)`);
        document.body.style.setProperty('--revealed-color', `hsl(${randHue()}, 30%, 8%)`);
    } else {
        document.body.style.removeProperty('--accent-color');
        document.body.style.removeProperty('--tile-color');
        document.body.style.removeProperty('--bg-color');
        document.body.style.removeProperty('--revealed-color');
    }

    resizeBoard();
    updateCheatGridDisplay();
    StickerManager.setTheme(themeName);
    updateFaceEmoji();
}

// ─── Theme registry & catalog ─────────────────────────────────────────────────
const THEME_REGISTRY = [
    { id: 'midnight',    name: 'Midnight',    category: 'standard', icon: '🌌', desc: 'Deep space blue styling for nightly sweeps.',       achievement: 'None', unlockDesc: 'Available by default' },
    { id: 'forest',      name: 'Forest',      category: 'standard', icon: '🌲', desc: 'A lush green oasis to calm your nerves.',           achievement: 'None', unlockDesc: 'Available by default' },
    { id: 'classic',     name: 'Classic',     category: 'standard', icon: '💾', desc: 'Retro monochrome, straight from the 90s.',          achievement: 'None', unlockDesc: 'Available by default' },
    { id: 'neon',        name: 'Neon',        category: 'standard', icon: '⚡', desc: 'Vibrant neon purple and yellow grid.',              achievement: 'None', unlockDesc: 'Available by default' },
    { id: 'ocean',       name: 'Ocean',       category: 'standard', icon: '🌊', desc: 'Cool blue waters and deep sea diving.',             achievement: 'None', unlockDesc: 'Available by default' },
    { id: 'sunset',      name: 'Sunset',      category: 'standard', icon: '🌇', desc: 'Warm orange gradients of a dying sun.',            achievement: 'None', unlockDesc: 'Available by default' },
    { id: 'aurora',      name: 'Aurora',      category: 'standard', icon: '🌌', desc: 'Borealis green ribbons across the sky.',           achievement: 'None', unlockDesc: 'Available by default' },
    { id: 'retro',       name: 'Retro',       category: 'standard', icon: '🕹️', desc: 'Arcade neon cyan and hot pink tones.',             achievement: 'None', unlockDesc: 'Available by default' },
    { id: 'cyberpunk',   name: 'Cyberpunk',   category: 'standard', icon: '🦾', desc: 'High tech, low life neon city glow.',              achievement: 'None', unlockDesc: 'Available by default' },
    { id: 'minimal',     name: 'Minimal',     category: 'standard', icon: '▫️', desc: 'Clean slate grey lines, absolute focus.',          achievement: 'None', unlockDesc: 'Available by default' },

    { id: 'halloween',   name: 'Halloween 🎃', category: 'seasonal', icon: '🎃', desc: 'Spooky orange and purple vibes.',                 achievement: 'absurd_halloween', unlockDesc: 'Play a game in October' },
    { id: 'christmas',   name: 'Christmas 🎄', category: 'seasonal', icon: '🎄', desc: 'Festive red and pine green cheer.',               achievement: 'absurd_christmas', unlockDesc: 'Play a game in December' },
    { id: 'valentine',   name: 'Valentine 💘', category: 'seasonal', icon: '💘', desc: 'Sweet pink and heart red tones.',                 achievement: 'absurd_valentine', unlockDesc: 'Play a game in February' },
    { id: 'newyear',     name: 'New Year 🎆',  category: 'seasonal', icon: '🎆', desc: 'Explosive gold and dark sky glitz.',              achievement: 'absurd_newyear',   unlockDesc: 'Play a game in January' },
    { id: 'summer',      name: 'Summer ☀️',    category: 'seasonal', icon: '☀️', desc: 'Bright yellow sand and clear blue sky.',          achievement: 'absurd_summer',    unlockDesc: 'Play a game in June-August' },
    { id: 'winter',      name: 'Winter ❄️',    category: 'seasonal', icon: '❄️', desc: 'Frosty cyan ice and snow white sheet.',           achievement: 'absurd_winter',    unlockDesc: 'Play a game in Dec-Feb' },
    { id: 'spring',      name: 'Spring 🌸',    category: 'seasonal', icon: '🌸', desc: 'Fresh pink cherry blossoms in bloom.',            achievement: 'absurd_spring',    unlockDesc: 'Play a game in March-May' },
    { id: 'autumn',      name: 'Autumn 🍂',    category: 'seasonal', icon: '🍂', desc: 'Golden amber fall leaves and harvest gold.',      achievement: 'absurd_autumn',    unlockDesc: 'Play a game in Sept-Nov' },

    { id: 'derly',       name: 'Derly Theme',       category: 'secret', icon: '💜', desc: 'Developer purple grid of absolute power.',      achievement: 'who_is_derly',     unlockDesc: 'Enter cheat code DERLYIMUP',  secret: true },
    { id: 'matrix',      name: 'Matrix Theme',      category: 'secret', icon: '💊', desc: 'Wake up, Neo... Follow the white rabbit.',      achievement: 'the_matrix',       unlockDesc: 'Enter cheat code WAKEUPNEO', secret: true },
    { id: 'void',        name: 'Void Theme',        category: 'secret', icon: '🌑', desc: 'Embrace the darkness. Zero emission grid.',     achievement: 'void_embrace',     unlockDesc: 'Enter cheat code VOID',      secret: true },
    { id: 'cat',         name: 'Cat Theme',         category: 'secret', icon: '🐾', desc: 'Meow! Purrfectly aligned kitty paws.',         achievement: 'cat_sweeper',      unlockDesc: 'Enter cheat code MEOW',      secret: true },
    { id: 'banana',      name: 'Banana Theme',      category: 'secret', icon: '🍌', desc: 'Watch your step, peel security is active.',     achievement: 'banana_security',  unlockDesc: 'Enter cheat code BANANA',    secret: true },
    { id: 'potato',      name: 'Potato Theme',      category: 'secret', icon: '🥔', desc: 'Fueled by starch. Ultimate potato power.',      achievement: 'potato_computer',  unlockDesc: 'Enter cheat code POTATO',    secret: true },

    { id: 'upside',      name: 'Upside Down Theme', category: 'absurd', icon: '🙃', desc: 'Why? Everything is flipped upside down.',       achievement: 'absurd_upside',    unlockDesc: 'Enter cheat code UPSIDEDOWN' },
    { id: 'comic',       name: 'Comic Sans Theme',  category: 'absurd', icon: '💀', desc: 'Crimes against typography. Truly horrifying.',  achievement: 'absurd_comic',     unlockDesc: 'Enter cheat code COMICSANS'  },
    { id: 'vhs',         name: 'VHS Theme',         category: 'absurd', icon: '📼', desc: 'CRT scanlines and magnetic tape rewind.',        achievement: 'absurd_vhs',       unlockDesc: 'Enter cheat code VHS'        },
    { id: 'nokia',       name: 'Nokia Theme',       category: 'absurd', icon: '📱', desc: 'Green monochrome. 3310 battery life.',           achievement: 'absurd_nokia',     unlockDesc: 'Enter cheat code NOKIA'      },
    { id: 'disco',       name: 'Disco Theme',       category: 'absurd', icon: '🪩', desc: 'Funk beats. Grid colors change constantly.',     achievement: 'absurd_disco',     unlockDesc: 'Enter cheat code DISCO'      },
    { id: 'chaos',       name: 'Chaos Theme',       category: 'absurd', icon: '🤯', desc: 'What am I looking at? Random grid cells.',       achievement: 'absurd_chaos',     unlockDesc: 'Enter cheat code CHAOS'      },

    { id: 'quiet_scholar',     name: 'The Quiet Scholar', category: 'character', icon: '📚', desc: 'Some minds shine brightest in silence.',      achievement: 'endless_knowledge', unlockDesc: 'Discover secret code AYYASH', secret: true },
    { id: 'strawberry_spirit', name: 'Strawberry Spirit', category: 'character', icon: '🍓', desc: 'Every victory deserves a fresh batch.',        achievement: 'cookie_master',     unlockDesc: 'Discover secret code MIWA',   secret: true },
    { id: 'silent_devotion',   name: 'Silent Devotion',   category: 'character', icon: '💜', desc: 'Some stories are never spoken aloud.',         achievement: 'unspoken_feelings', unlockDesc: 'Discover secret code RAFA',   secret: true },
];

let activeThemeCategory = 'standard';

function getUnlockedThemes() {
    let unlocked = ['midnight', 'forest', 'classic', 'neon', 'ocean', 'sunset', 'aurora', 'retro', 'cyberpunk', 'minimal'];
    try {
        const stored = localStorage.getItem('minesweeper_unlocked_themes');
        if (stored) {
            JSON.parse(stored).forEach(t => { if (!unlocked.includes(t)) unlocked.push(t); });
        }
    } catch (e) {}

    const today  = new Date();
    const month  = today.getMonth();
    const seasonMap = {
        halloween: month === 9,
        christmas: month === 11,
        valentine: month === 1,
        newyear:   month === 0,
        summer:    month >= 5 && month <= 7,
        winter:    month === 11 || month === 0 || month === 1,
        spring:    month >= 2 && month <= 4,
        autumn:    month >= 8 && month <= 10,
    };

    let newlyUnlocked = false;
    for (const [themeId, active] of Object.entries(seasonMap)) {
        if (active && !unlocked.includes(themeId)) {
            unlocked.push(themeId);
            newlyUnlocked = true;
            unlockAchievement(`absurd_${themeId}`);
        }
    }
    if (newlyUnlocked) {
        localStorage.setItem('minesweeper_unlocked_themes', JSON.stringify(unlocked));
    }
    return unlocked;
}

function unlockTheme(themeId) {
    const unlocked = getUnlockedThemes();
    if (!unlocked.includes(themeId)) {
        unlocked.push(themeId);
        localStorage.setItem('minesweeper_unlocked_themes', JSON.stringify(unlocked));
    }
}

function renderThemeCatalog() {
    const container = document.getElementById('theme-list-container');
    if (!container) return;
    container.innerHTML = '';

    const unlocked     = getUnlockedThemes();
    const currentTheme = localStorage.getItem('minesweeper_theme') || 'midnight';

    const charThemes       = THEME_REGISTRY.filter(t => t.category === 'character');
    const unlockedCharCount = charThemes.filter(t => unlocked.includes(t.id)).length;

    const charTabBtn     = document.getElementById('theme-cat-char-btn');
    const charProgress   = document.getElementById('theme-char-progress');
    const charProgressVal = document.getElementById('theme-char-progress-val');

    if (unlockedCharCount > 0) {
        charTabBtn?.classList.remove('hidden-tab');
        charProgress?.classList.remove('hidden');
        if (charProgressVal) charProgressVal.textContent = `${unlockedCharCount} / 3`;
    } else {
        charTabBtn?.classList.add('hidden-tab');
        charProgress?.classList.add('hidden');
        if (activeThemeCategory === 'character') {
            activeThemeCategory = 'standard';
            document.querySelectorAll('.theme-cat-btn').forEach(t => {
                t.classList.toggle('active', t.dataset.cat === 'standard');
            });
            renderThemeCatalog();
            return;
        }
    }

    const themesToRender = THEME_REGISTRY.filter(t => {
        if (t.category === 'character' && unlockedCharCount === 0) return false;
        return t.category === activeThemeCategory;
    });

    themesToRender.forEach(theme => {
        const isUnlocked = unlocked.includes(theme.id);
        const isActive   = currentTheme === theme.id;

        const item       = document.createElement('div');
        item.className   = `theme-item ${isUnlocked ? '' : 'locked'} ${isActive ? 'active' : ''}`;
        item.dataset.theme = theme.id;

        if (isUnlocked) {
            item.innerHTML = `
                <div class="theme-item-icon">${theme.icon}</div>
                <div class="theme-item-details">
                    <span class="theme-item-name">${theme.name}</span>
                    <span class="theme-item-desc">${theme.desc}</span>
                    ${theme.achievement !== 'None' ? `<span class="theme-item-unlock">🏆 Unlocked by achievement</span>` : ''}
                </div>
                <div class="theme-item-status">${isActive ? 'Active' : 'Select'}</div>
            `;
            item.addEventListener('click', () => {
                setTheme(theme.id);
                renderThemeCatalog();
            });
        } else {
            const isSecret = theme.secret || ['secret', 'absurd', 'character'].includes(theme.category);
            let hint = 'Some secrets are waiting.';
            if (theme.id === 'quiet_scholar')     hint = 'A quiet scholar watches from the shadows.';
            else if (theme.id === 'strawberry_spirit') hint = 'Fresh cookies and endless energy.';
            else if (theme.id === 'silent_devotion')   hint = 'Purple memories never fade.';

            item.innerHTML = isSecret
                ? `<div class="theme-item-icon">❓</div>
                   <div class="theme-item-details">
                       <span class="theme-item-name">???</span>
                       <span class="theme-item-desc">${hint}</span>
                       <span class="theme-item-unlock">Hidden Theme</span>
                   </div>
                   <div class="theme-item-status">Locked</div>`
                : `<div class="theme-item-icon">❓</div>
                   <div class="theme-item-details">
                       <span class="theme-item-name">???</span>
                       <span class="theme-item-desc">Unlock condition:</span>
                       <span class="theme-item-unlock">${theme.unlockDesc}</span>
                   </div>
                   <div class="theme-item-status">Locked</div>`;
        }
        container.appendChild(item);
    });
}

function setupThemeTabs() {
    document.querySelectorAll('.theme-cat-btn').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.theme-cat-btn').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeThemeCategory = tab.dataset.cat;
            renderThemeCatalog();
        });
    });
}

// ─── Event: difficulty buttons ────────────────────────────────────────────────
diffButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const diff = btn.dataset.diff;
        diffButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (diff === 'custom') {
            customDialog.classList.remove('hidden');
        } else {
            startNewGame(diff);
        }
    });
});

// ─── Event: custom dialog ─────────────────────────────────────────────────────
customConfirmBtn.addEventListener('click', () => {
    const width  = parseInt(customWidthInput.value,  10);
    const height = parseInt(customHeightInput.value, 10);
    const mines  = parseInt(customMinesInput.value,  10);
    customDialog.classList.add('hidden');
    startNewGame('custom', width, height, mines);
});

customCancelBtn.addEventListener('click', () => {
    customDialog.classList.add('hidden');
    diffButtons.forEach(b => {
        b.classList.toggle('active', b.dataset.diff === game.difficulty);
    });
});

// ─── Event: reset button ──────────────────────────────────────────────────────
resetBtn.addEventListener('click', () => {
    if (preventResetOnConsoleOpen) {
        preventResetOnConsoleOpen = false;
        return;
    }

    const now = Date.now();
    if (now - lastFaceTapTime < 500) {
        faceTapCount++;
    } else {
        faceTapCount = 1;
    }
    lastFaceTapTime = now;

    if (faceTapCount >= 5) {
        faceTapCount = 0;
        preventResetOnConsoleOpen = true;
        openSecretConsole();
        return;
    }

    faceClicks++;
    if (faceClicks === 5)  unlockAchievement('surely_this_time');
    if (faceClicks === 20) unlockAchievement('face_spammer');

    startNewGame(game.difficulty, game.cols, game.rows, game.minesCount);
});

resetBtn.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    unlockAchievement('conspiracy_theorist');
});

// Long press reset button → secret console
resetBtn.addEventListener('pointerdown', () => {
    if (faceLongPressTimeout) clearTimeout(faceLongPressTimeout);
    faceLongPressTimeout = setTimeout(() => {
        preventResetOnConsoleOpen = true;
        openSecretConsole();
    }, 3000);
});
['pointerup', 'pointercancel', 'pointerleave'].forEach(evt => {
    resetBtn.addEventListener(evt, () => {
        if (faceLongPressTimeout) clearTimeout(faceLongPressTimeout);
    });
});

// ─── Event: mobile mode toggles ───────────────────────────────────────────────
mobileModeReveal.addEventListener('click', () => {
    mobileActiveMode = 'reveal';
    mobileModeReveal.classList.add('active');
    mobileModeFlag.classList.remove('active');
});
mobileModeFlag.addEventListener('click', () => {
    mobileActiveMode = 'flag';
    mobileModeFlag.classList.add('active');
    mobileModeReveal.classList.remove('active');
});

// ─── Event: stats modal ───────────────────────────────────────────────────────
statsToggleBtn.addEventListener('click', () => {
    renderStatsModal();
    statsModal.classList.remove('hidden');
});
statsCloseBtn.addEventListener('click', () => statsModal.classList.add('hidden'));
statsResetBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all your stats and win streaks? This cannot be undone.')) {
        localStorage.removeItem('minesweeper_stats');
        localStorage.removeItem('minesweeper_achievements');
        renderStatsModal();
    }
});

// ─── Event: achievements modal ────────────────────────────────────────────────
achievementsToggleBtn.addEventListener('click', () => {
    renderAchievementsModal();
    achievementsModal.classList.remove('hidden');
});
achievementsCloseBtn.addEventListener('click', () => achievementsModal.classList.add('hidden'));

// ─── Event: theme modal ───────────────────────────────────────────────────────
themeToggleBtn.addEventListener('click', () => {
    themeOpens++;
    if (themeOpens === 5) unlockAchievement('curious_sweeper');
    renderThemeCatalog();
    themeDialog.classList.remove('hidden');
});
themeCloseBtn.addEventListener('click', () => themeDialog.classList.add('hidden'));

// ─── Event: game over modal ───────────────────────────────────────────────────
gameOverActionBtn.addEventListener('click', () => {
    gameOverDialog.classList.add('hidden');
    startNewGame(game.difficulty, game.cols, game.rows, game.minesCount);
});

// ─── Event: leaderboard modal ─────────────────────────────────────────────────
leaderboardToggleBtn.addEventListener('click', () => {
    if (window.gameCheatsEnabled) {
        alert('Leaderboards are disabled while cheat mode is active!');
        return;
    }
    leaderboardModal.classList.remove('hidden');
});
leaderboardCloseBtn.addEventListener('click', () => leaderboardModal.classList.add('hidden'));

document.getElementById('settings-toggle-btn')?.addEventListener('click', () => {
    document.getElementById('settings-modal')?.classList.remove('hidden');
});
document.getElementById('settings-close')?.addEventListener('click', () => {
    document.getElementById('settings-modal')?.classList.add('hidden');
});

// ─── Event: board interaction (pointer delegation) ───────────────────────────
let touchTimer        = null;
let touchMoved        = false;
let touchTriggeredFlag = false;
let touchStartX       = 0;
let touchStartY       = 0;
let lastClickTimes    = {};

boardContainer.addEventListener('pointerdown', (e) => {
    const tileEl = e.target.closest('.tile');
    if (!tileEl) return;

    const r    = parseInt(tileEl.dataset.row, 10);
    const c    = parseInt(tileEl.dataset.col, 10);
    const cell = game.board.grid[r][c];

    if (game.status === 'playing' || game.status === 'idle') {
        temporaryFace = '😮';
        updateFaceEmoji();
    }

    if (!cell.isRevealed && !cell.isFlagged) tileEl.classList.add('active-press');

    if (e.pointerType === 'touch') {
        touchStartX        = e.clientX;
        touchStartY        = e.clientY;
        touchMoved         = false;
        touchTriggeredFlag = false;

        if (game.status === 'won' || game.status === 'lost') return;

        if (touchTimer) clearTimeout(touchTimer);
        touchTimer = setTimeout(() => {
            if (!touchMoved) {
                handleCellRightClick(r, c);
                touchTriggeredFlag = true;
                tileEl.classList.remove('active-press');
            }
        }, 280);
    }
});

boardContainer.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'touch') return;
    const delta = Math.hypot(e.clientX - touchStartX, e.clientY - touchStartY);
    if (delta > 8) {
        touchMoved = true;
        if (touchTimer) clearTimeout(touchTimer);
        e.target.closest('.tile')?.classList.remove('active-press');
    }
});

boardContainer.addEventListener('pointerup', (e) => {
    if (touchTimer) clearTimeout(touchTimer);

    if (temporaryFace === '😮') { temporaryFace = null; }
    updateFaceEmoji();

    const tileEl = e.target.closest('.tile');
    if (!tileEl) return;
    tileEl.classList.remove('active-press');

    if (game.status === 'won' || game.status === 'lost') return;

    const r = parseInt(tileEl.dataset.row, 10);
    const c = parseInt(tileEl.dataset.col, 10);

    if (e.pointerType === 'touch' && touchTriggeredFlag) return;
    if (e.pointerType === 'touch' && touchMoved)         return;

    if (e.pointerType !== 'touch' && (e.button === 2 || e.button === 1)) {
        handleCellRightClick(r, c);
        return;
    }

    if (e.pointerType === 'touch' || e.button === 0) {
        const key     = `${r},${c}`;
        const now     = performance.now();
        const prev    = lastClickTimes[key] || 0;

        if (now - prev < 250) {
            handleCellChord(r, c);
        } else {
            if (e.pointerType === 'touch' && mobileActiveMode === 'flag') {
                handleCellRightClick(r, c);
            } else {
                handleCellLeftClick(r, c);
            }
        }
        lastClickTimes[key] = now;
    }
});

boardContainer.addEventListener('pointerleave', () => {
    if (touchTimer) clearTimeout(touchTimer);
    boardContainer.querySelectorAll('.tile.active-press')
        .forEach(t => t.classList.remove('active-press'));
});

boardContainer.addEventListener('contextmenu', (e) => e.preventDefault());

window.addEventListener('pointerup', () => {
    if (temporaryFace === '😮') { temporaryFace = null; }
    updateFaceEmoji();
});

// ─── Hover / thinking face ────────────────────────────────────────────────────
boardContainer.addEventListener('pointerenter', resetHoverTimeout);
boardContainer.addEventListener('pointermove',  () => {
    if (hoverActive) { hoverActive = false; updateFaceEmoji(); }
    resetHoverTimeout();
});
boardContainer.addEventListener('pointerleave', () => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    if (hoverActive)  { hoverActive = false; updateFaceEmoji(); }
});

function resetHoverTimeout() {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    if (game.status !== 'playing') return;
    hoverTimeout = setTimeout(() => {
        hoverActive = true;
        updateFaceEmoji();
    }, 2000);
}

// ─── Idle / screensaver ───────────────────────────────────────────────────────
function resetActivity() {
    idleSeconds     = 0;
    playIdleSeconds = 0;
    // (screensaver removed — stickers are static)
    updateFaceEmoji();
}

window.addEventListener('pointermove', resetActivity);
window.addEventListener('pointerdown', resetActivity);
window.addEventListener('keydown',     resetActivity);

setInterval(() => {
    idleSeconds++;
    if (game.status === 'playing') {
        playIdleSeconds++;
    } else {
        playIdleSeconds = 0;
    }

    // (screensaver removed — stickers are static)

    if (idleSeconds     === 15 || idleSeconds     === 30 || idleSeconds     === 60 ||
        playIdleSeconds === 15 || playIdleSeconds === 30) {
        updateFaceEmoji();
    }
}, 1000);

// ─── 10-minute menu idle achievement ─────────────────────────────────────────
let menuIdleTime = 0;
const menuIdleInterval = setInterval(() => {
    if (game.status === 'idle') {
        menuIdleTime += 10;
        if (menuIdleTime >= 600) {
            unlockAchievement('just_sitting_here');
            clearInterval(menuIdleInterval);
        }
    } else {
        menuIdleTime = 0;
    }
}, 10_000);

// ─── Cheat code system ────────────────────────────────────────────────────────
let cheatBuffer = '';

function evaluateCheatStatus() {
    const isAnyActive =
        window.gameCheatInfiniteLives    ||
        window.gameCheatAutoFlag         ||
        window.gameCheatFreezeTimer      ||
        window.gameCheatRevealMines      ||
        window.gameCheatProbabilityHelper ||
        window.gameCheatUnlimitedFlags   ||
        window.gameCheatHideNumbers      ||
        window.gameCheatRainbowMode      ||
        document.body.classList.contains('party-mode') ||
        document.body.classList.contains('chaos-mode');

    if (window.gameCheatsEnabled && !isAnyActive) {
        window.gameCheatsEnabled = false;
        showCheatAlert('CHEAT MODE', false);
    } else if (isAnyActive) {
        window.gameCheatsEnabled = true;
    }
}

const CHEAT_CODES = {
    DERLYIMUP() {
        const active = !window.gameCheatInfiniteLives;
        window.gameCheatInfiniteLives     = active;
        window.gameCheatAutoFlag          = active;
        window.gameCheatFreezeTimer       = active;
        window.gameCheatRevealMines       = active;
        window.gameCheatProbabilityHelper = active;
        window.gameCheatUnlimitedFlags    = active;
        document.body.classList.toggle('chaos-mode', active);
        if (active) {
            setTheme('derly');
            unlockTheme('derly');
            unlockAchievement('who_is_derly');
            unlockAchievement('secret_developer');
            unlockAchievement('cheat_derly');
        } else {
            setTheme('midnight');
        }
        evaluateCheatStatus();
        updateCheatGridDisplay();
        updateHUD();
        if (active) showCheatAlert('ULTIMATE DEVELOPER MODE', active);
    },
    PARTYTIME() {
        document.body.classList.toggle('party-mode');
        const active = document.body.classList.contains('party-mode');
        window.gameCheatRainbowMode = active;
        if (active) unlockAchievement('cheat_party');
        evaluateCheatStatus();
        updateHUD();
        if (active) showCheatAlert('PARTY MODE', active);
    },
    BIGBRAIN() {
        window.gameCheatProbabilityHelper = !window.gameCheatProbabilityHelper;
        evaluateCheatStatus();
        updateCheatGridDisplay();
        updateHUD();
        if (window.gameCheatProbabilityHelper) unlockAchievement('cheat_brain');
        if (window.gameCheatProbabilityHelper) showCheatAlert('PROBABILITY HELPER', window.gameCheatProbabilityHelper);
    },
    ILOVEFLAGS() {
        window.gameCheatUnlimitedFlags = !window.gameCheatUnlimitedFlags;
        evaluateCheatStatus();
        updateHUD();
        if (window.gameCheatUnlimitedFlags) unlockAchievement('cheat_flags');
        if (window.gameCheatUnlimitedFlags) showCheatAlert('UNLIMITED FLAGS', window.gameCheatUnlimitedFlags);
    },
    NOPENOPENOPE() {
        window.gameCheatHideNumbers = !window.gameCheatHideNumbers;
        evaluateCheatStatus();
        updateCheatGridDisplay();
        updateHUD();
        if (window.gameCheatHideNumbers) unlockAchievement('cheat_hidden');
        if (window.gameCheatHideNumbers) showCheatAlert('HIDE NUMBERS', window.gameCheatHideNumbers);
    },
    GODMODE() {
        window.gameCheatInfiniteLives = !window.gameCheatInfiniteLives;
        evaluateCheatStatus();
        updateHUD();
        if (window.gameCheatInfiniteLives) unlockAchievement('cheat_godmode');
        if (window.gameCheatInfiniteLives) showCheatAlert('GOD MODE (INFINITE LIVES)', window.gameCheatInfiniteLives);
    },
    SHOWME() {
        window.gameCheatRevealMines = !window.gameCheatRevealMines;
        evaluateCheatStatus();
        updateCheatGridDisplay();
        updateHUD();
        if (window.gameCheatRevealMines) unlockAchievement('cheat_showme');
        if (window.gameCheatRevealMines) showCheatAlert('REVEAL MINES', window.gameCheatRevealMines);
    },
    '060928'() {
        window.gameCheatFreezeTimer = !window.gameCheatFreezeTimer;
        evaluateCheatStatus();
        updateHUD();
        if (window.gameCheatFreezeTimer) showCheatAlert('TIME FREEZE', window.gameCheatFreezeTimer);
    },
    RETRO()      { setTheme('classic');          unlockTheme('classic');          unlockAchievement('cheat_retro');        showCharacterThemeToast('🕹️', 'Retro Classic'); },
    WAKEUPNEO()  { setTheme('matrix');           unlockTheme('matrix');           unlockAchievement('the_matrix');         showCharacterThemeToast('💻', 'The Matrix'); },
    VOID()       { setTheme('void');             unlockTheme('void');             unlockAchievement('void_embrace');        showCharacterThemeToast('🌌', 'The Void'); },
    MEOW()       { setTheme('cat');              unlockTheme('cat');              unlockAchievement('cat_sweeper');         showCharacterThemeToast('🐱', 'Cat Sweeper'); },
    BANANA()     { setTheme('banana');           unlockTheme('banana');           unlockAchievement('banana_security');     showCharacterThemeToast('🍌', 'Banana Security'); },
    POTATO()     { setTheme('potato');           unlockTheme('potato');           unlockAchievement('potato_computer');     showCharacterThemeToast('🥔', 'Potato Computer'); },
    UPSIDEDOWN() { setTheme('upside');           unlockTheme('upside');           unlockAchievement('absurd_upside');       showCharacterThemeToast('🙃', 'Upside Down'); },
    COMICSANS()  { setTheme('comic');            unlockTheme('comic');            unlockAchievement('absurd_comic');        showCharacterThemeToast('🤡', 'Comic Sans'); },
    VHS()        { setTheme('vhs');              unlockTheme('vhs');              unlockAchievement('absurd_vhs');          showCharacterThemeToast('📼', 'VHS Retro'); },
    NOKIA()      { setTheme('nokia');            unlockTheme('nokia');            unlockAchievement('absurd_nokia');        showCharacterThemeToast('📱', 'Nokia 3310'); },
    DISCO()      { setTheme('disco');            unlockTheme('disco');            unlockAchievement('absurd_disco');        showCharacterThemeToast('🕺', 'Disco Party'); },
    CHAOS()      { setTheme('chaos');            unlockTheme('chaos');            unlockAchievement('absurd_chaos');        showCharacterThemeToast('🔥', 'Pure Chaos'); },
    AYYASH()     { unlockTheme('quiet_scholar');     setTheme('quiet_scholar');     unlockAchievement('endless_knowledge');  showCharacterThemeToast('📚', 'The Quiet Scholar');  renderThemeCatalog(); },
    MIWA()       { unlockTheme('strawberry_spirit'); setTheme('strawberry_spirit'); unlockAchievement('cookie_master');      showCharacterThemeToast('🍓', 'Strawberry Spirit'); renderThemeCatalog(); },
    RAFA()       { unlockTheme('silent_devotion');   setTheme('silent_devotion');   unlockAchievement('unspoken_feelings');  showCharacterThemeToast('💜', 'Silent Devotion');    renderThemeCatalog(); },
};

function checkCheatCodes() {
    for (const code in CHEAT_CODES) {
        if (cheatBuffer.endsWith(code)) {
            CHEAT_CODES[code]();
            cheatBuffer = '';
            return;
        }
    }

    let isValidPrefix = false;
    outer: for (const code in CHEAT_CODES) {
        for (let i = 1; i <= cheatBuffer.length; i++) {
            if (code.startsWith(cheatBuffer.substring(cheatBuffer.length - i))) {
                isValidPrefix = true;
                break outer;
            }
        }
    }

    if (!isValidPrefix && cheatBuffer.length >= 8) {
        unlockAchievement('forbidden_knowledge');
        cheatBuffer = '';
    }
}

function showCheatAlert(cheatName, active) {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;
    const toast       = document.createElement('div');
    toast.className   = 'toast';
    toast.style.borderColor = active ? '#ff5500' : '#4CAF50';
    toast.innerHTML   = `
        <div class="toast-icon">${active ? '⚡' : '✅'}</div>
        <div class="toast-content">
            <span class="toast-title" style="color:${active ? '#ff5500' : '#4CAF50'}">${active ? 'Cheat Active' : 'Cheat Disabled'}</span>
            <span class="toast-desc">${cheatName}${active !== null ? (active ? ': ENABLED' : ': DISABLED') : ''}</span>
        </div>
    `;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 250);
    }, 2500);
}

function showCharacterThemeToast(icon, name) {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;
    const toast       = document.createElement('div');
    toast.className   = 'toast';
    toast.innerHTML   = `
        <div class="toast-icon">🔓</div>
        <div class="toast-content">
            <span class="toast-title">Secret Theme Discovered</span>
            <span class="toast-desc">${icon} ${name}</span>
        </div>
    `;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 250);
    }, 3200);
}

window.addEventListener('keydown', (e) => {
    if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
        cheatBuffer += e.key.toUpperCase();
        if (cheatBuffer.length > 20) cheatBuffer = cheatBuffer.slice(-20);
        checkCheatCodes();
    }
});

// ─── Secret console ───────────────────────────────────────────────────────────
const secretConsoleModal = document.getElementById('secret-console-modal');
const consoleInput       = document.getElementById('console-input');
const consoleCancelBtn   = document.getElementById('console-cancel');
const consoleUnlockBtn   = document.getElementById('console-unlock');
const consoleFeedback    = document.getElementById('console-feedback');

function openSecretConsole() {
    if (!secretConsoleModal) return;
    if (consoleInput)    consoleInput.value = '';
    if (consoleFeedback) {
        consoleFeedback.textContent = '';
        consoleFeedback.className   = 'console-feedback hidden';
    }
    secretConsoleModal.classList.remove('hidden');
    setTimeout(() => consoleInput?.focus(), 150);
}

function closeSecretConsole() {
    secretConsoleModal?.classList.add('hidden');
}

function showConsoleFeedback(msg, type) {
    if (!consoleFeedback) return;
    consoleFeedback.innerHTML   = msg;
    consoleFeedback.className   = `console-feedback ${type}`;
    consoleFeedback.classList.remove('hidden');
    if (window.consoleFeedbackTimeout) clearTimeout(window.consoleFeedbackTimeout);
    window.consoleFeedbackTimeout = setTimeout(() => {
        consoleFeedback.classList.add('hidden');
    }, 4000);
}

function handleConsoleUnlockSubmit() {
    if (!consoleInput) return;
    const code = consoleInput.value.trim().toUpperCase();
    if (!code) return;

    const THEME_CODES = ['AYYASH', 'MIWA', 'RAFA', 'VOID', 'MEOW', 'BANANA', 'WAKEUPNEO',
                         'RETRO', 'POTATO', 'UPSIDEDOWN', 'COMICSANS', 'VHS', 'NOKIA', 'DISCO', 'CHAOS'];
    const CHEAT_CONSOLE_CODES = ['DERLYIMUP', '060928', 'BIGBRAIN', 'GODMODE', 'SHOWME',
                                  'PARTYTIME', 'ILOVEFLAGS', 'NOPENOPENOPE'];

    if (CHEAT_CODES[code]) {
        CHEAT_CODES[code]();
        if (THEME_CODES.includes(code)) {
            showConsoleFeedback('🔓 Secret Discovered<br>🎨 New Theme Unlocked', 'success');
        } else if (CHEAT_CONSOLE_CODES.includes(code)) {
            showConsoleFeedback(window.gameCheatsEnabled ? '🕶️ Cheat Mode Enabled' : '✅ Cheat Mode Disabled', 'success');
        } else {
            showConsoleFeedback('🔓 Secret Discovered', 'success');
        }
        consoleInput.value = '';
    } else {
        showConsoleFeedback('🤔 Nothing happened...', 'error');
        unlockAchievement('forbidden_knowledge');
    }
}

consoleCancelBtn?.addEventListener('click', closeSecretConsole);
consoleUnlockBtn?.addEventListener('click', handleConsoleUnlockSubmit);
consoleInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleConsoleUnlockSubmit();
});

// ─── Resize listener ──────────────────────────────────────────────────────────
window.addEventListener('resize', resizeBoard);

// ─── Sticker Decoration init ─────────────────────────────────────────────────
const _initialTheme   = localStorage.getItem('minesweeper_theme') || 'midnight';
StickerManager.init(_initialTheme);

// ─── Theme tabs + initial load ────────────────────────────────────────────────
setupThemeTabs();
setTheme(_initialTheme);
startNewGame('beginner');