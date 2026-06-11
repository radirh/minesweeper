/**
 * Board Class
 * Represents the Minesweeper logical grid state and operations.
 */
export class Board {
    constructor(rows, cols, minesCount) {
        this.rows = rows;
        this.cols = cols;
        this.minesCount = minesCount;
        this.isGenerated = false;
        this.grid = [];
        this.minesCoords = [];
        this._initGrid();
    }
    /**
     * Initializes the grid array with default cell structures
     * @private
     */
    _initGrid() {
        this.grid = [];
        for (let r = 0; r < this.rows; r++) {
            const row = [];
            for (let c = 0; c < this.cols; c++) {
                row.push({
                    row: r,
                    col: c,
                    isMine: false,
                    neighborMines: 0,
                    isRevealed: false,
                    isFlagged: false,
                    isQuestion: false,
                    exploded: false
                });
            }
            this.grid.push(row);
        }
    }
    /**
     * Helper to retrieve valid neighbor cells
     * @param {number} row 
     * @param {number} col 
     * @returns {Array} List of cell objects
     */
    getNeighbors(row, col) {
        const neighbors = [];
        for (let r = row - 1; r <= row + 1; r++) {
            for (let c = col - 1; c <= col + 1; c++) {
                if (r === row && c === col) continue;
                if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
                    neighbors.push(this.grid[r][c]);
                }
            }
        }
        return neighbors;
    }
    /**
     * Dynamically generates mines on the board.
     * Guarantees a 3x3 safe area around the first click.
     * @param {number} firstRow 
     * @param {number} firstCol 
     */
    generate(firstRow, firstCol) {
        if (this.isGenerated) return;
        const totalCells = this.rows * this.cols;
        const safeCoords = new Set();
        // 3x3 Safe zone coordinates collection
        for (let r = firstRow - 1; r <= firstRow + 1; r++) {
            for (let c = firstCol - 1; c <= firstCol + 1; c++) {
                if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
                    safeCoords.add(`${r},${c}`);
                }
            }
        }
        // Fallback if too many mines requested (must at least keep clicked cell safe)
        if (totalCells - safeCoords.size < this.minesCount) {
            safeCoords.clear();
            safeCoords.add(`${firstRow},${firstCol}`);
        }
        // Extreme fallback if mines count equals or exceeds total cells
        if (totalCells - safeCoords.size < this.minesCount) {
            safeCoords.clear();
        }
        // Create pool of eligible cell coordinates
        const pool = [];
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (!safeCoords.has(`${r},${c}`)) {
                    pool.push({ r, c });
                }
            }
        }
        // Shuffle pool using Fisher-Yates algorithm
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = pool[i];
            pool[i] = pool[j];
            pool[j] = temp;
        }
        // Place mines
        const actualMinesCount = Math.min(this.minesCount, pool.length);
        this.minesCoords = [];
        for (let i = 0; i < actualMinesCount; i++) {
            const { r, c } = pool[i];
            this.grid[r][c].isMine = true;
            this.minesCoords.push({ row: r, col: c });
        }
        // Calculate neighbor numbers
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = this.grid[r][c];
                if (cell.isMine) continue;
                let count = 0;
                const neighbors = this.getNeighbors(r, c);
                for (const n of neighbors) {
                    if (n.isMine) count++;
                }
                cell.neighborMines = count;
            }
        }
        this.isGenerated = true;
    }
    /**
     * Reveals a cell. Uses BFS to recursively flood fill 0-neighbor regions.
     * @param {number} row 
     * @param {number} col 
     * @returns {Array} List of cells updated during reveal
     */
    revealCell(row, col) {
        const cell = this.grid[row][col];
        if (cell.isRevealed || cell.isFlagged || cell.isQuestion) return [];
        // Generate mines on first reveal click
        if (!this.isGenerated) {
            this.generate(row, col);
        }
        // If mine clicked, explode!
        if (cell.isMine) {
            cell.isRevealed = true;
            cell.exploded = true;
            return [cell];
        }
        // BFS Flood Reveal
        const updatedCells = [];
        const queue = [cell];
        const visited = new Set([`${row},${col}`]);
        while (queue.length > 0) {
            const curr = queue.shift();
            curr.isRevealed = true;
            updatedCells.push(curr);
            if (curr.neighborMines === 0) {
                const neighbors = this.getNeighbors(curr.row, curr.col);
                for (const n of neighbors) {
                    if (!n.isRevealed && !n.isFlagged && !n.isQuestion) {
                        const key = `${n.row},${n.col}`;
                        if (!visited.has(key)) {
                            visited.add(key);
                            queue.push(n);
                        }
                    }
                }
            }
        }
        return updatedCells;
    }
    /**
     * Cycles cell mark state: closed -> flagged -> question -> closed
     * @param {number} row 
     * @param {number} col 
     * @returns {object|null} The modified cell object, or null if cell is already revealed
     */
    cycleMark(row, col) {
        const cell = this.grid[row][col];
        if (cell.isRevealed) return null;
        if (!cell.isFlagged && !cell.isQuestion) {
            cell.isFlagged = true;
        } else if (cell.isFlagged) {
            cell.isFlagged = false;
            cell.isQuestion = true;
        } else {
            cell.isQuestion = false;
        }
        return cell;
    }
    /**
     * Performs chord operation on a revealed cell.
     * If surrounding flags equal neighboring mine count, reveals remaining unflagged neighbors.
     * @param {number} row 
     * @param {number} col 
     * @returns {Array} List of cells updated (revealed)
     */
    chord(row, col) {
        const cell = this.grid[row][col];
        if (!cell.isRevealed || cell.neighborMines === 0) return [];
        const neighbors = this.getNeighbors(row, col);
        let flagCount = 0;
        for (const n of neighbors) {
            if (n.isFlagged) flagCount++;
        }
        // Chord only proceeds if flag count matches adjacent mine count
        if (flagCount === cell.neighborMines) {
            const cellsToReveal = [];
            for (const n of neighbors) {
                if (!n.isRevealed && !n.isFlagged && !n.isQuestion) {
                    cellsToReveal.push(n);
                }
            }
            const updatedCells = [];
            let hitMine = false;
            for (const target of cellsToReveal) {
                if (target.isMine) {
                    hitMine = true;
                    target.isRevealed = true;
                    target.exploded = true;
                    updatedCells.push(target);
                } else {
                    // Do normal reveal (which uses BFS if neighborMines === 0)
                    const subRevealed = this.revealCell(target.row, target.col);
                    updatedCells.push(...subRevealed);
                }
            }
            return updatedCells;
        }
        return [];
    }
    /**
     * Check if game is in a win state
     * @returns {boolean}
     */
    checkWin() {
        if (!this.isGenerated) return false;
        
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = this.grid[r][c];
                // If there's a non-mine cell that is not revealed yet, game is not won
                if (!cell.isMine && !cell.isRevealed) {
                    return false;
                }
            }
        }
        return true;
    }
    /**
     * Check if board has any exploded mines (lose state)
     * @returns {boolean}
     */
    checkLose() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.grid[r][c].exploded) {
                    return true;
                }
            }
        }
        return false;
    }
    /**
     * Returns list of all incorrectly flagged coordinates and unflagged mines.
     * Used to display full board state on game loss.
     * @returns {Array} List of cell objects that were mines or falsely flagged
     */
    getEndGameState() {
        const list = [];
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = this.grid[r][c];
                if (cell.isMine && !cell.isFlagged && !cell.isRevealed) {
                    list.push(cell); // Unrevealed, unflagged mine
                } else if (!cell.isMine && cell.isFlagged) {
                    list.push(cell); // False flag
                }
            }
        }
        return list;
    }
}
