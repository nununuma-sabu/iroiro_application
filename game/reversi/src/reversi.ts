type Player = 1 | 2; // 1: 黒, 2: 白
type Cell = Player | 0; // 0: 空

class Reversi {
    private board: Cell[][] = [];
    private currentPlayer: Player = 1;
    private readonly size = 8;

    private humanPlayer: Player = 1; // デフォルト: 先手（黒）
    private cpuPlayer: Player = 2;

    // 盤面の位置による重み付けテーブル（評価関数用）
    private readonly weightTable = [
        [100, -20, 10,  5,  5, 10, -20, 100],
        [-20, -50, -2, -2, -2, -2, -50, -20],
        [ 10,  -2,  1,  1,  1,  1,  -2,  10],
        [  5,  -2,  1,  0,  0,  1,  -2,   5],
        [  5,  -2,  1,  0,  0,  1,  -2,   5],
        [  10,  -2,  1,  1,  1,  1,  -2,  10],
        [-20, -50, -2, -2, -2, -2, -50, -20],
        [100, -20, 10,  5,  5, 10, -20, 100]
    ];

    // 1手でも進んだら、ロール（先手/後手）変更をロックする
    private roleLocked = false;

    // CPU思考中にリセット等が走っても、古い非同期処理が盤面を触らないようにする
    private gameId = 0;

    constructor() {
        this.setupEventListeners();
        // 初期UI（先手/後手）を読み取り、ゲーム開始
        this.startNewGameFromUI();
    }

    private setRoleSelectEnabled(enabled: boolean) {
        const roleSelect = document.getElementById('role-select') as HTMLSelectElement | null;
        if (!roleSelect) return;
        roleSelect.disabled = !enabled;
        roleSelect.title = enabled ? '' : 'ゲーム中は変更できません（リセットで変更できます）';
    }

    private initBoard() {
        this.board = Array.from({ length: this.size }, () => Array(this.size).fill(0));
        // 初期配置
        this.board[3][3] = 2; this.board[3][4] = 1;
        this.board[4][3] = 1; this.board[4][4] = 2;
        this.currentPlayer = 1; // 黒が先手
    }

    private startNewGameFromUI() {
        this.gameId++;
        this.roleLocked = false;
        this.setRoleSelectEnabled(true);

        const roleSelect = document.getElementById('role-select') as HTMLSelectElement | null;
        const value = roleSelect?.value;
        this.humanPlayer = value === '2' ? 2 : 1;
        this.cpuPlayer = this.humanPlayer === 1 ? 2 : 1;

        this.initBoard();
        this.render();

        // 後手（白）を選んだ場合は、CPU（黒）が最初に着手する
        void this.processTurn(this.gameId);
    }

    private directions = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];

    private getFlips(r: number, c: number, player: Player): {r: number, c: number}[] {
        if (this.board[r][c] !== 0) return [];
        const opponent = player === 1 ? 2 : 1;
        let totalFlips: {r: number, c: number}[] = [];

        for (const [dr, dc] of this.directions) {
            let temp: {r: number, c: number}[] = [];
            let nr = r + dr, nc = c + dc;

            while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && this.board[nr][nc] === opponent) {
                temp.push({r: nr, c: nc});
                nr += dr; nc += dc;
            }
            if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && this.board[nr][nc] === player) {
                totalFlips = totalFlips.concat(temp);
            }
        }
        return totalFlips;
    }

    private getValidMoves(player: Player) {
        const moves: {r: number, c: number}[] = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (this.getFlips(r, c, player).length > 0) moves.push({r, c});
            }
        }
        return moves;
    }

    private async handleMove(r: number, c: number) {
        if (this.currentPlayer !== this.humanPlayer) return;

        const myGameId = this.gameId;
        const flips = this.getFlips(r, c, this.humanPlayer);
        if (flips.length === 0) return;

        this.executeMove(r, c, flips);
        await this.processTurn(myGameId);
    }

    private executeMove(r: number, c: number, flips: { r: number, c: number }[]) {
        if (!this.roleLocked) {
            this.roleLocked = true;
            this.setRoleSelectEnabled(false);
        }
        this.board[r][c] = this.currentPlayer;
        flips.forEach(f => this.board[f.r][f.c] = this.currentPlayer);
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.render();
    }

    private async processTurn(gameId: number) {
        if (gameId !== this.gameId) return;

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
                await new Promise(resolve => setTimeout(resolve, 600));
                await this.cpuMove(gameId);
            }
            return;
        }

        if (this.currentPlayer === this.cpuPlayer) {
            await new Promise(resolve => setTimeout(resolve, 600));
            await this.cpuMove(gameId);
        }
    }

    private async cpuMove(gameId: number) {
        if (gameId !== this.gameId) return;
        if (this.currentPlayer !== this.cpuPlayer) return;

        const moves = this.getValidMoves(this.cpuPlayer);
        if (moves.length === 0) return;

        // HTML側のセレクトボックスからAIモードを取得
        const aiMode = (document.getElementById('ai-mode') as HTMLSelectElement)?.value || 'random';
        let selectedMove = moves[0];

        if (aiMode === 'eval') {
            // 評価関数モード：各候補手をシミュレーションして最高スコアの手を選択
            let maxScore = -Infinity;
            for (const move of moves) {
                const score = this.evaluateMove(move.r, move.c, this.cpuPlayer);
                if (score > maxScore) {
                    maxScore = score;
                    selectedMove = move;
                }
            }
        } else {
            // ランダムモード
            selectedMove = moves[Math.floor(Math.random() * moves.length)];
        }

        const flips = this.getFlips(selectedMove.r, selectedMove.c, this.cpuPlayer);
        this.executeMove(selectedMove.r, selectedMove.c, flips);
        await this.processTurn(gameId);
    }

    // 特定の座標に石を置いた場合の盤面全体の評価値を計算
    private evaluateMove(r: number, c: number, player: Player): number {
        const flips = this.getFlips(r, c, player);
        // 盤面をディープコピーしてシミュレーション
        const tempBoard = this.board.map(row => [...row]);
        tempBoard[r][c] = player;
        flips.forEach(f => tempBoard[f.r][f.c] = player);

        let score = 0;
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (tempBoard[i][j] === player) {
                    // 自分の石がある場所の重みを加算
                    score += this.weightTable[i][j];
                } else if (tempBoard[i][j] !== 0) {
                    // 相手の石がある場所の重みを減算
                    score -= this.weightTable[i][j];
                }
            }
        }
        return score;
    }

    private render() {
        const boardEl = document.getElementById('board')!;
        boardEl.innerHTML = '';
        let bCount = 0, wCount = 0;

        const validMoves = this.currentPlayer === this.humanPlayer
            ? this.getValidMoves(this.currentPlayer)
            : [];
        const validMoveSet = new Set(validMoves.map(m => `${m.r},${m.c}`));

        this.board.forEach((row, r) => {
            row.forEach((cell, c) => {
                const cellEl = document.createElement('div');
                cellEl.className = 'cell';
                cellEl.onclick = () => this.handleMove(r, c);

                // 有効な着手箇所をハイライト
                if (cell === 0 && validMoveSet.has(`${r},${c}`)) {
                    cellEl.classList.add('valid-move');
                }

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
        document.getElementById('turn-display')!.innerText = `${turnText}（${who}）`;
        document.getElementById('score')!.innerText = `黒: ${bCount} | 白: ${wCount}`;
    }

    private showMessage(msg: string) {
        const msgEl = document.getElementById('message')!;
        msgEl.innerText = msg;
        setTimeout(() => msgEl.innerText = '', 3000);
    }

    private setupEventListeners() {
        document.getElementById('reset-btn')!.onclick = () => this.startNewGameFromUI();
        const roleSelect = document.getElementById('role-select') as HTMLSelectElement | null;
        if (roleSelect) {
            roleSelect.onchange = () => this.startNewGameFromUI();
        }
    }
}

new Reversi();