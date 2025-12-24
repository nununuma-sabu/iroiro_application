type Player = 1 | 2; // 1: 黒, 2: 白
type Cell = Player | 0; // 0: 空

class Reversi {
    private board: Cell[][] = [];
    private currentPlayer: Player = 1;
    private readonly size = 8;

    constructor() {
        this.init();
        this.setupEventListeners();
    }

    private init() {
        this.board = Array.from({ length: this.size }, () => Array(this.size).fill(0));
        // 初期配置
        this.board[3][3] = 2; this.board[3][4] = 1;
        this.board[4][3] = 1; this.board[4][4] = 2;
        this.currentPlayer = 1;
        this.render();
    }

    // 8方向の定義
    private directions = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];

    // 指定したマスに置いた時に裏返せる石を取得
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
        if (this.currentPlayer !== 1) return; // 黒（プレイヤー）の番のみ受付

        const flips = this.getFlips(r, c, 1);
        if (flips.length === 0) return;

        this.executeMove(r, c, flips);
        
        // CPUのターン
        await this.processTurn();
    }

    private executeMove(r: number, c: number, flips: {r: number, c: number}[]) {
        this.board[r][c] = this.currentPlayer;
        flips.forEach(f => this.board[f.r][f.c] = this.currentPlayer);
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.render();
    }

    private async processTurn() {
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
            if (this.currentPlayer === 2) await this.cpuMove();
            return;
        }

        if (this.currentPlayer === 2) {
            await new Promise(resolve => setTimeout(resolve, 600)); // CPUの思考時間
            await this.cpuMove();
        }
    }

    private async cpuMove() {
        const moves = this.getValidMoves(2);
        if (moves.length > 0) {
            // ランダムに選択（ここを将来AIに！）
            const move = moves[Math.floor(Math.random() * moves.length)];
            const flips = this.getFlips(move.r, move.c, 2);
            this.executeMove(move.r, move.c, flips);
        }
        await this.processTurn();
    }

    private render() {
        const boardEl = document.getElementById('board')!;
        boardEl.innerHTML = '';
        let bCount = 0, wCount = 0;

        // 置ける場所（合法手）をハイライトするためのセット
        const validMoves = this.getValidMoves(this.currentPlayer);
        const validMoveSet = new Set(validMoves.map(m => `${m.r},${m.c}`));

        this.board.forEach((row, r) => {
            row.forEach((cell, c) => {
                const cellEl = document.createElement('div');
                cellEl.className = 'cell';
                cellEl.onclick = () => this.handleMove(r, c);

                // 石が置ける場所を光らせる
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

        document.getElementById('turn-display')!.innerText = this.currentPlayer === 1 ? '黒' : '白';
        document.getElementById('score')!.innerText = `黒: ${bCount} | 白: ${wCount}`;
    }

    private showMessage(msg: string) {
        const msgEl = document.getElementById('message')!;
        msgEl.innerText = msg;
        setTimeout(() => msgEl.innerText = '', 3000);
    }

    private setupEventListeners() {
        document.getElementById('reset-btn')!.onclick = () => this.init();
    }
}

// 実行
new Reversi();