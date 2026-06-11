import { Board } from './board.js';
/**
 * Audio Synthesizer using Web Audio API
 * Generates short classic game sound effects programmatically.
 */
class SoundEffects {
    constructor() {
        this.ctx = null;
    }
    _init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        // Resume AudioContext if suspended (browser security policy)
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }
    play(type) {
        try {
            this._init();
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            const now = this.ctx.currentTime;
            if (type === 'click') {
                // Short, sharp click sound (max 50ms)
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.04);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
                osc.start(now);
                osc.stop(now + 0.05);
            } 
            else if (type === 'flag') {
                // Quick rising chime (80ms)
                osc.type = 'sine';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(600, now + 0.07);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.07);
                osc.start(now);
                osc.stop(now + 0.08);
            } 
            else if (type === 'lose') {
                // Harsh falling buzz/explosion
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(180, now);
                osc.frequency.linearRampToValueAtTime(60, now + 0.25);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
                osc.start(now);
                osc.stop(now + 0.26);
            } 
            else if (type === 'win') {
                // Triumphant rising arpeggio (little victory chime)
                const playChime = (freq, startOffset, duration) => {
                    const o = this.ctx.createOscillator();
                    const g = this.ctx.createGain();
                    o.connect(g);
                    g.connect(this.ctx.destination);
                    o.type = 'sine';
                    o.frequency.setValueAtTime(freq, now + startOffset);
                    g.gain.setValueAtTime(0.15, now + startOffset);
                    g.gain.exponentialRampToValueAtTime(0.01, now + startOffset + duration - 0.01);
                    o.start(now + startOffset);
                    o.stop(now + startOffset + duration);
                };
                playChime(523.25, 0.0, 0.08); // C5
                playChime(659.25, 0.08, 0.08); // E5
                playChime(783.99, 0.16, 0.08); // G5
                playChime(1046.50, 0.24, 0.18); // C6
            }
        } catch (e) {
            console.warn("Audio Context playback failed or blocked by autoplay permissions.", e);
        }
    }
}
export class Game {
    constructor() {
        this.board = null;
        this.status = 'idle'; // 'idle', 'playing', 'won', 'lost'
        this.difficulty = 'beginner';
        this.rows = 9;
        this.cols = 9;
        this.minesCount = 10;
        this.timer = 0;
        this.timerInterval = null;
        this.score = 0;
        this.revealedCount = 0;
        this.sounds = new SoundEffects();
        // Preset parameters
        this.presets = {
            beginner: { rows: 9, cols: 9, mines: 10 },
            intermediate: { rows: 16, cols: 16, mines: 40 },
            expert: { rows: 16, cols: 30, mines: 99 } // 30x16 Expert
        };
    }
    /**
     * Instantiates a new game session with selected preset
     */
    initGame(difficulty, customWidth = 10, customHeight = 10, customMines = 15) {
        this.stopTimer();
        this.difficulty = difficulty;
        this.timer = 0;
        this.score = 0;
        this.revealedCount = 0;
        this.status = 'idle';
        if (difficulty === 'custom') {
            this.rows = Math.min(Math.max(customHeight, 8), 24);
            this.cols = Math.min(Math.max(customWidth, 8), 30);
            // Limit mines to a max of 90% of grid
            const maxMines = Math.floor((this.rows * this.cols) * 0.9);
            this.minesCount = Math.min(Math.max(customMines, 1), maxMines);
        } else {
            const preset = this.presets[difficulty] || this.presets.beginner;
            this.rows = preset.rows;
            this.cols = preset.cols;
            this.minesCount = preset.mines;
        }
        this.board = new Board(this.rows, this.cols, this.minesCount);
    }
    /**
     * Start the clock interval
     */
    startTimer(onTick) {
        if (this.timerInterval) return;
        this.timerInterval = setInterval(() => {
            this.timer++;
            // Caps at 999 to fit standard three digit displays
            if (this.timer > 999) {
                this.timer = 999;
                this.stopTimer();
            }
            if (onTick) onTick(this.timer);
        }, 1000);
    }
    /**
     * Stop the clock interval
     */
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    /**
     * Triggers reveal action on a coordinate
     */
    reveal(row, col, onTick) {
        if (this.status === 'won' || this.status === 'lost') return [];
        const isFirstClick = !this.board.isGenerated;
        if (isFirstClick) {
            this.status = 'playing';
            this.startTimer(onTick);
        }
        const revealedCells = this.board.revealCell(row, col);
        if (revealedCells.length === 0) return [];
        this.sounds.play('click');
        this.revealedCount += revealedCells.length;
        
        // Calculate dynamic active score
        const mult = this.difficulty === 'expert' ? 3 : this.difficulty === 'intermediate' ? 2 : 1;
        this.score = this.revealedCount * mult * 10;
        if (this.board.checkLose()) {
            this.loseGame();
            return revealedCells;
        }
        if (this.board.checkWin()) {
            this.winGame();
        }
        return revealedCells;
    }
    /**
     * Triggers flag/question mark cycles on a coordinate
     */
    cycleMark(row, col) {
        if (this.status === 'won' || this.status === 'lost') return null;
        
        const cell = this.board.cycleMark(row, col);
        if (cell) {
            this.sounds.play('flag');
        }
        return cell;
    }
    /**
     * Triggers chording on a coordinate
     */
    chord(row, col) {
        if (this.status === 'won' || this.status === 'lost') return [];
        const revealedCells = this.board.chord(row, col);
        if (revealedCells.length === 0) return [];
        this.sounds.play('click');
        this.revealedCount += revealedCells.length;
        const mult = this.difficulty === 'expert' ? 3 : this.difficulty === 'intermediate' ? 2 : 1;
        this.score = this.revealedCount * mult * 10;
        if (this.board.checkLose()) {
            this.loseGame();
        } else if (this.board.checkWin()) {
            this.winGame();
        }
        return revealedCells;
    }
    /**
     * Flags left counter subtraction helper
     */
    getMinesLeftCount() {
        if (!this.board) return this.minesCount;
        let flags = 0;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.board.grid[r][c].isFlagged) flags++;
            }
        }
        return Math.max(0, this.minesCount - flags);
    }
    winGame() {
        this.status = 'won';
        this.stopTimer();
        this.sounds.play('win');
        // Add speed bonus for winning
        const speedBonus = Math.max(0, 1000 - this.timer) * (this.difficulty === 'expert' ? 5 : this.difficulty === 'intermediate' ? 3 : 1);
        this.score += speedBonus;
    }
    loseGame() {
        this.status = 'lost';
        this.stopTimer();
        this.sounds.play('lose');
    }
}
