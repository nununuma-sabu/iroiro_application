var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class Reversi {
    constructor() {
        this.board = [];
        this.currentPlayer = 1;
        this.size = 8;
        this.humanPlayer = 1;
        this.cpuPlayer = 2;
        // 盤面の位置による重み付けテーブル（評価関数用）
        this.weightTable = [
            [100, -20, 10, 5, 5, 10, -20, 100],
            [-20, -50, -2, -2, -2, -2, -50, -20],
            [10, -2, 1, 1, 1, 1, -2, 10],
            [5, -2, 1, 0, 0, 1, -2, 5],
            [5, -2, 1, 0, 0, 1, -2, 5],
            [10, -2, 1, 1, 1, 1, -2, 10],
            [-20, -50, -2, -2, -2, -2, -50, -20],
            [100, -20, 10, 5, 5, 10, -20, 100]
        ];
        this.roleLocked = false;
        this.gameId = 0;
        this.directions = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
        this.setupEventListeners();
        this.startNewGameFromUI();
    }
    setRoleSelectEnabled(enabled) {
        const roleSelect = document.getElementById('role-select');
        if (!roleSelect)
            return;
        roleSelect.disabled = !enabled;
    }
    initBoard() {
        this.board = Array.from({ length: this.size }, () => Array(this.size).fill(0));
        this.board[3][3] = 2;
        this.board[3][4] = 1;
        this.board[4][3] = 1;
        this.board[4][4] = 2;
        this.currentPlayer = 1;
    }
    startNewGameFromUI() {
        this.gameId++;
        this.roleLocked = false;
        this.setRoleSelectEnabled(true);
        const roleSelect = document.getElementById('role-select');
        this.humanPlayer = (roleSelect === null || roleSelect === void 0 ? void 0 : roleSelect.value) === '2' ? 2 : 1;
        this.cpuPlayer = this.humanPlayer === 1 ? 2 : 1;
        this.initBoard();
        this.render();
        void this.processTurn(this.gameId);
    }
    getFlips(r, c, player, targetBoard = this.board) {
        if (targetBoard[r][c] !== 0)
            return [];
        const opponent = player === 1 ? 2 : 1;
        let totalFlips = [];
        for (const [dr, dc] of this.directions) {
            let temp = [];
            let nr = r + dr, nc = c + dc;
            while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && targetBoard[nr][nc] === opponent) {
                temp.push({ r: nr, c: nc });
                nr += dr;
                nc += dc;
            }
            if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && targetBoard[nr][nc] === player) {
                totalFlips = totalFlips.concat(temp);
            }
        }
        return totalFlips;
    }
    getValidMoves(player, targetBoard = this.board) {
        const moves = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (this.getFlips(r, c, player, targetBoard).length > 0)
                    moves.push({ r, c });
            }
        }
        return moves;
    }
    handleMove(r, c) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.currentPlayer !== this.humanPlayer)
                return;
            const myGameId = this.gameId;
            const flips = this.getFlips(r, c, this.humanPlayer);
            if (flips.length === 0)
                return;
            this.executeMove(r, c, flips);
            yield this.processTurn(myGameId);
        });
    }
    executeMove(r, c, flips) {
        if (!this.roleLocked) {
            this.roleLocked = true;
            this.setRoleSelectEnabled(false);
        }
        this.board[r][c] = this.currentPlayer;
        flips.forEach(f => this.board[f.r][f.c] = this.currentPlayer);
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.render();
    }
    processTurn(gameId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (gameId !== this.gameId)
                return;
            const validMoves = this.getValidMoves(this.currentPlayer);
            if (validMoves.length === 0) {
                const opponentValidMoves = this.getValidMoves(this.currentPlayer === 1 ? 2 : 1);
                if (opponentValidMoves.length === 0) {
                    this.showMessage("ゲーム終了！");
                    return;
                }
                this.showMessage(`${this.currentPlayer === 1 ? '黒' : '白'}はパスです`);
                this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
                this.render();
                if (this.currentPlayer === this.cpuPlayer) {
                    yield new Promise(resolve => setTimeout(resolve, 600));
                    yield this.cpuMove(gameId);
                }
                return;
            }
            if (this.currentPlayer === this.cpuPlayer) {
                yield new Promise(resolve => setTimeout(resolve, 600));
                yield this.cpuMove(gameId);
            }
        });
    }
    cpuMove(gameId) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (gameId !== this.gameId || this.currentPlayer !== this.cpuPlayer)
                return;
            const moves = this.getValidMoves(this.cpuPlayer);
            if (moves.length === 0)
                return;
            const aiMode = ((_a = document.getElementById('ai-mode')) === null || _a === void 0 ? void 0 : _a.value) || 'random';
            let selectedMove = moves[0];
            if (aiMode === 'minimax') {
                let bestScore = -Infinity;
                for (const move of moves) {
                    const nextBoard = this.simulateMove(this.board, move.r, move.c, this.cpuPlayer);
                    const score = this.minimax(nextBoard, 3, -Infinity, Infinity, false, this.cpuPlayer);
                    if (score > bestScore) {
                        bestScore = score;
                        selectedMove = move;
                    }
                }
            }
            else if (aiMode === 'eval') {
                let maxScore = -Infinity;
                for (const move of moves) {
                    const score = this.evaluateMove(move.r, move.c, this.cpuPlayer);
                    if (score > maxScore) {
                        maxScore = score;
                        selectedMove = move;
                    }
                }
            }
            else {
                selectedMove = moves[Math.floor(Math.random() * moves.length)];
            }
            const flips = this.getFlips(selectedMove.r, selectedMove.c, this.cpuPlayer);
            this.executeMove(selectedMove.r, selectedMove.c, flips);
            yield this.processTurn(gameId);
        });
    }
    minimax(board, depth, alpha, beta, isMax, ai) {
        const opponent = ai === 1 ? 2 : 1;
        const currentPlayer = isMax ? ai : opponent;
        const moves = this.getValidMoves(currentPlayer, board);
        if (depth === 0 || moves.length === 0) {
            return this.evaluateBoard(board, ai);
        }
        if (isMax) {
            let maxEval = -Infinity;
            for (const m of moves) {
                const next = this.simulateMove(board, m.r, m.c, currentPlayer);
                const ev = this.minimax(next, depth - 1, alpha, beta, false, ai);
                maxEval = Math.max(maxEval, ev);
                alpha = Math.max(alpha, ev);
                if (beta <= alpha)
                    break;
            }
            return maxEval;
        }
        else {
            let minEval = Infinity;
            for (const m of moves) {
                const next = this.simulateMove(board, m.r, m.c, currentPlayer);
                const ev = this.minimax(next, depth - 1, alpha, beta, true, ai);
                minEval = Math.min(minEval, ev);
                beta = Math.min(beta, ev);
                if (beta <= alpha)
                    break;
            }
            return minEval;
        }
    }
    simulateMove(board, r, c, player) {
        const nextBoard = board.map(row => [...row]);
        const flips = this.getFlips(r, c, player, board);
        nextBoard[r][c] = player;
        flips.forEach(f => nextBoard[f.r][f.c] = player);
        return nextBoard;
    }
    evaluateBoard(board, player) {
        let score = 0;
        const opponent = player === 1 ? 2 : 1;
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (board[i][j] === player)
                    score += this.weightTable[i][j];
                else if (board[i][j] === opponent)
                    score -= this.weightTable[i][j];
            }
        }
        return score;
    }
    evaluateMove(r, c, player) {
        const tempBoard = this.simulateMove(this.board, r, c, player);
        return this.evaluateBoard(tempBoard, player);
    }
    render() {
        const boardEl = document.getElementById('board');
        boardEl.innerHTML = '';
        let bCount = 0, wCount = 0;
        const validMoves = this.currentPlayer === this.humanPlayer ? this.getValidMoves(this.currentPlayer) : [];
        const validMoveSet = new Set(validMoves.map(m => `${m.r},${m.c}`));
        this.board.forEach((row, r) => {
            row.forEach((cell, c) => {
                const cellEl = document.createElement('div');
                cellEl.className = 'cell';
                cellEl.onclick = () => this.handleMove(r, c);
                if (cell === 0 && validMoveSet.has(`${r},${c}`))
                    cellEl.classList.add('valid-move');
                if (cell !== 0) {
                    const piece = document.createElement('div');
                    piece.className = `piece ${cell === 1 ? 'black' : 'white'}`;
                    cellEl.appendChild(piece);
                    cell === 1 ? bCount++ : wCount++;
                }
                boardEl.appendChild(cellEl);
            });
        });
        const turnText = this.currentPlayer === 1 ? '黒' : '白';
        const who = this.currentPlayer === this.humanPlayer ? 'あなた' : 'CPU';
        document.getElementById('turn-display').innerText = `${turnText}（${who}）`;
        document.getElementById('score').innerText = `黒: ${bCount} | 白: ${wCount}`;
    }
    showMessage(msg) {
        const msgEl = document.getElementById('message');
        msgEl.innerText = msg;
        setTimeout(() => msgEl.innerText = '', 3000);
    }
    setupEventListeners() {
        document.getElementById('reset-btn').onclick = () => {
            const roleSelect = document.getElementById('role-select');
            if (roleSelect)
                roleSelect.value = "1";
            const aiModeSelect = document.getElementById('ai-mode');
            if (aiModeSelect)
                aiModeSelect.value = "random";
            this.startNewGameFromUI();
        };
        const roleSelect = document.getElementById('role-select');
        if (roleSelect)
            roleSelect.onchange = () => this.startNewGameFromUI();
    }
}
new Reversi();
