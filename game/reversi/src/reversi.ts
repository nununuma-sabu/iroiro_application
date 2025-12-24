type Player = 1 | 2; // 1: 黒, 2: 白
type Cell = Player | 0; // 0: 空

class Reversi {
    private board: Cell[][] = [];
    private currentPlayer: Player = 1;
    private readonly size = 8;

    private humanPlayer: Player = 1;
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

    private roleLocked = false;
    private gameId = 0;

    /**
     * コンストラクタ
     * イベントリスナーを設定し、新しいゲームを開始する
     */
    constructor() {
        // UIのイベントリスナーを初期化
        this.setupEventListeners();
        // 初回のゲームを開始
        this.startNewGameFromUI();
    }

    /**
     * 役割選択セレクトボックスの有効/無効を設定
     * @param enabled - trueで有効、falseで無効
     */
    private setRoleSelectEnabled(enabled: boolean) {
        // 役割選択のセレクトボックス要素を取得
        const roleSelect = document.getElementById('role-select') as HTMLSelectElement | null;
        if (! roleSelect) return;
        // disabledプロパティを反転して設定
        roleSelect.disabled = !enabled;
    }

    /**
     * ボードを初期化
     * 8x8の盤面を作成し、中央4マスに初期配置を設定
     * 現在のプレイヤーを黒（1）に設定
     */
    private initBoard() {
        // 8x8の2次元配列を0（空）で初期化
        this.board = Array. from({ length: this.size }, () => Array(this.size).fill(0));
        // 中央4マスに初期配置を設定（リバーシのルール通り）
        this.board[3][3] = 2; // 白
        this.board[3][4] = 1; // 黒
        this.board[4][3] = 1; // 黒
        this.board[4][4] = 2; // 白
        // 最初のプレイヤーは黒
        this.currentPlayer = 1;
    }

    /**
     * UIから新しいゲームを開始
     * ゲームIDをインクリメントし、役割選択をリセット
     * UIから選択された役割に基づいてプレイヤーとCPUを設定
     */
    private startNewGameFromUI() {
        // ゲームIDをインクリメント（古いゲームの非同期処理を無効化するため）
        this.gameId++;
        // 役割ロックを解除
        this. roleLocked = false;
        // 役割選択を有効化
        this.setRoleSelectEnabled(true);

        // 役割選択セレクトボックスから値を取得
        const roleSelect = document.getElementById('role-select') as HTMLSelectElement | null;
        // ユーザーが選択した役割を設定（デフォルトは黒=1）
        this.humanPlayer = roleSelect?.value === '2' ? 2 : 1;
        // CPUはユーザーの反対側
        this.cpuPlayer = this.humanPlayer === 1 ? 2 : 1;

        // 盤面を初期化
        this. initBoard();
        // UIを更新
        this.render();
        // ターン処理を開始（CPUが先手の場合はCPUが打つ）
        void this.processTurn(this.gameId);
    }

    // 8方向のベクトル（上左、上、上右、左、右、下左、下、下右）
    private directions = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];

    /**
     * 指定した位置に石を置いた場合、ひっくり返せる石の位置を取得
     * @param r - 行インデックス（0-7）
     * @param c - 列インデックス（0-7）
     * @param player - 現在のプレイヤー（1 or 2）
     * @param targetBoard - 対象となる盤面（デフォルトは現在の盤面）
     * @returns ひっくり返せる石の位置の配列
     */
    private getFlips(r: number, c: number, player: Player, targetBoard:  Cell[][] = this.board): {r:  number, c: number}[] {
        // 既に石がある場合は置けない
        if (targetBoard[r][c] !== 0) return [];
        
        // 相手プレイヤーを決定
        const opponent = player === 1 ? 2 : 1;
        // ひっくり返せる石を格納する配列
        let totalFlips: {r: number, c: number}[] = [];

        // 8方向それぞれをチェック
        for (const [dr, dc] of this.directions) {
            // この方向でひっくり返せる石の一時配列
            let temp: {r: number, c:  number}[] = [];
            // 次の位置を計算
            let nr = r + dr, nc = c + dc;

            // 盤面内かつ相手の石が続く限りループ
            while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && targetBoard[nr][nc] === opponent) {
                // 相手の石を一時配列に追加
                temp. push({r: nr, c:  nc});
                // さらに次の位置へ
                nr += dr;
                nc += dc;
            }
            
            // 最後に自分の石があれば、挟めたことになる
            if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && targetBoard[nr][nc] === player) {
                // この方向のひっくり返せる石を全体に追加
                totalFlips = totalFlips.concat(temp);
            }
        }
        return totalFlips;
    }

    /**
     * 指定されたプレイヤーが置ける有効な手をすべて取得
     * @param player - 対象プレイヤー（1 or 2）
     * @param targetBoard - 対象となる盤面（デフォルトは現在の盤面）
     * @returns 有効な手の位置の配列
     */
    private getValidMoves(player: Player, targetBoard: Cell[][] = this.board) {
        const moves: {r: number, c:  number}[] = [];
        // 盤面の全マスをチェック
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                // そのマスに石を置いたときにひっくり返せる石があれば有効な手
                if (this.getFlips(r, c, player, targetBoard).length > 0) {
                    moves.push({r, c});
                }
            }
        }
        return moves;
    }

    /**
     * 人間プレイヤーの手を処理
     * @param r - 行インデックス（0-7）
     * @param c - 列インデックス（0-7）
     */
    private async handleMove(r: number, c: number) {
        // 現在のターンが人間プレイヤーでなければ何もしない
        if (this.currentPlayer !== this.humanPlayer) return;
        
        // 現在のゲームIDを保存（非同期処理中の整合性チェック用）
        const myGameId = this.gameId;
        
        // この位置に石を置いた場合にひっくり返せる石を取得
        const flips = this.getFlips(r, c, this.humanPlayer);
        // ひっくり返せる石がなければ無効な手なので何もしない
        if (flips.length === 0) return;

        // 手を実行
        this.executeMove(r, c, flips);
        // 次のターン処理へ
        await this.processTurn(myGameId);
    }

    /**
     * 手を実行して盤面を更新
     * 石を配置し、ひっくり返し、プレイヤーを交代
     * @param r - 行インデックス（0-7）
     * @param c - 列インデックス（0-7）
     * @param flips - ひっくり返す石の位置の配列
     */
    private executeMove(r: number, c:  number, flips: { r: number, c: number }[]) {
        // 最初の手が打たれたら役割選択をロック
        if (! this.roleLocked) {
            this.roleLocked = true;
            this.setRoleSelectEnabled(false);
        }
        
        // 指定位置に現在のプレイヤーの石を配置
        this. board[r][c] = this.currentPlayer;
        // ひっくり返す石をすべて現在のプレイヤーの色に変更
        flips.forEach(f => this.board[f.r][f.c] = this.currentPlayer);
        
        // プレイヤーを交代
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        // UIを更新
        this.render();
    }

    /**
     * ターンを処理
     * 有効な手があるかチェックし、CPUのターンであれば自動的に手を打つ
     * ゲーム終了やパスの判定も行う
     * @param gameId - 現在のゲームID（非同期処理中のゲーム識別用）
     */
    private async processTurn(gameId: number) {
        // 古いゲームの処理であれば中断
        if (gameId !== this.gameId) return;
        
        // 現在のプレイヤーの有効な手を取得
        const validMoves = this.getValidMoves(this.currentPlayer);

        // 有効な手がない場合
        if (validMoves.length === 0) {
            // 相手プレイヤーの有効な手も取得
            const opponentValidMoves = this.getValidMoves(this.currentPlayer === 1 ? 2 : 1);
            
            // 双方とも打てる手がなければゲーム終了
            if (opponentValidMoves.length === 0) {
                this.showMessage("ゲーム終了！");
                return;
            }
            
            // 相手は打てるのでパス
            this.showMessage(`${this.currentPlayer === 1 ? '黒' : '白'}はパスです`);
            // プレイヤーを交代
            this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
            // UIを更新
            this. render();

            // パス後がCPUのターンなら、CPUに手を打たせる
            if (this. currentPlayer === this.cpuPlayer) {
                // 少し待ってからCPUの手を実行（視認性のため）
                await new Promise(resolve => setTimeout(resolve, 600));
                await this.cpuMove(gameId);
            }
            return;
        }

        // 有効な手があり、CPUのターンならCPUに手を打たせる
        if (this.currentPlayer === this.cpuPlayer) {
            // 少し待ってからCPUの手を実行（視認性のため）
            await new Promise(resolve => setTimeout(resolve, 600));
            await this.cpuMove(gameId);
        }
    }

    /**
     * CPUの手を実行
     * AIモード（ランダム、評価関数、ミニマックス）に応じて最適な手を選択
     * @param gameId - 現在のゲームID（非同期処理中のゲーム識別用）
     */
    private async cpuMove(gameId: number) {
        // 古いゲームの処理、または現在のターンがCPUでなければ中断
        if (gameId !== this.gameId || this.currentPlayer !== this.cpuPlayer) return;

        // CPUの有効な手を取得
        const moves = this.getValidMoves(this.cpuPlayer);
        // 打てる手がなければ何もしない
        if (moves.length === 0) return;

        // AIモードを取得（デフォルトはランダム）
        const aiMode = (document.getElementById('ai-mode') as HTMLSelectElement)?.value || 'random';
        // 選択する手（初期値は最初の有効手）
        let selectedMove = moves[0];

        // ミニマックスモード
        if (aiMode === 'minimax') {
            let bestScore = -Infinity;
            // すべての有効な手を評価
            for (const move of moves) {
                // この手を打った後の盤面をシミュレート
                const nextBoard = this.simulateMove(this.board, move.r, move.c, this.cpuPlayer);
                // ミニマックスアルゴリズムで評価（深さ3）
                const score = this. minimax(nextBoard, 3, -Infinity, Infinity, false, this.cpuPlayer);
                // 最高スコアの手を選択
                if (score > bestScore) {
                    bestScore = score;
                    selectedMove = move;
                }
            }
        } 
        // 評価関数モード
        else if (aiMode === 'eval') {
            let maxScore = -Infinity;
            // すべての有効な手を評価
            for (const move of moves) {
                // この手の評価スコアを計算
                const score = this.evaluateMove(move.r, move.c, this.cpuPlayer);
                // 最高スコアの手を選択
                if (score > maxScore) {
                    maxScore = score;
                    selectedMove = move;
                }
            }
        } 
        // ランダムモード
        else {
            // 有効な手の中からランダムに選択
            selectedMove = moves[Math.floor(Math.random() * moves.length)];
        }

        // 選択した手でひっくり返せる石を取得
        const flips = this.getFlips(selectedMove.r, selectedMove.c, this.cpuPlayer);
        // 手を実行
        this. executeMove(selectedMove.r, selectedMove.c, flips);
        // 次のターン処理へ
        await this.processTurn(gameId);
    }

    /**
     * ミニマックスアルゴリズム（αβ枝刈り付き）
     * 指定した深さまでゲーム木を探索し、最適な評価値を返す
     * @param board - 評価対象の盤面
     * @param depth - 探索の残り深さ
     * @param alpha - αβ枝刈りのα値
     * @param beta - αβ枝刈りのβ値
     * @param isMax - true:  最大化ノード、false: 最小化ノード
     * @param ai - AIプレイヤー（1 or 2）
     * @returns 評価値
     */
    private minimax(board: Cell[][], depth: number, alpha: number, beta: number, isMax:  boolean, ai: Player): number {
        // 相手プレイヤーを決定
        const opponent = ai === 1 ? 2 : 1;
        // 現在のノードで手を打つプレイヤー
        const currentPlayer = isMax ? ai : opponent;
        // 現在のプレイヤーの有効な手を取得
        const moves = this.getValidMoves(currentPlayer, board);

        // 探索深さが0、または有効な手がなければ評価値を返す（葉ノード）
        if (depth === 0 || moves.length === 0) {
            return this.evaluateBoard(board, ai);
        }

        // 最大化ノード（AIのターン）
        if (isMax) {
            let maxEval = -Infinity;
            // すべての有効な手を試す
            for (const m of moves) {
                // この手を打った後の盤面をシミュレート
                const next = this.simulateMove(board, m.r, m.c, currentPlayer);
                // 再帰的に次のノードを評価（最小化ノードへ）
                const ev = this.minimax(next, depth - 1, alpha, beta, false, ai);
                // 最大値を更新
                maxEval = Math.max(maxEval, ev);
                // α値を更新
                alpha = Math.max(alpha, ev);
                // β枝刈り
                if (beta <= alpha) break;
            }
            return maxEval;
        } 
        // 最小化ノード（相手のターン）
        else {
            let minEval = Infinity;
            // すべての有効な手を試す
            for (const m of moves) {
                // この手を打った後の盤面をシミュレート
                const next = this.simulateMove(board, m.r, m. c, currentPlayer);
                // 再帰的に次のノードを評価（最大化ノードへ）
                const ev = this.minimax(next, depth - 1, alpha, beta, true, ai);
                // 最小値を更新
                minEval = Math.min(minEval, ev);
                // β値を更新
                beta = Math.min(beta, ev);
                // α枝刈り
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }

    /**
     * 手を仮想的に実行して新しい盤面を返す
     * 元の盤面は変更しない
     * @param board - 元となる盤面
     * @param r - 行インデックス（0-7）
     * @param c - 列インデックス（0-7）
     * @param player - 手を打つプレイヤー（1 or 2）
     * @returns 手を実行後の新しい盤面
     */
    private simulateMove(board: Cell[][], r:  number, c: number, player:  Player): Cell[][] {
        // 盤面をディープコピー（各行も個別にコピー）
        const nextBoard = board.map(row => [...row]);
        // この手でひっくり返せる石を取得
        const flips = this.getFlips(r, c, player, board);
        // 指定位置に石を配置
        nextBoard[r][c] = player;
        // ひっくり返す石をすべてプレイヤーの色に変更
        flips.forEach(f => nextBoard[f.r][f.c] = player);
        return nextBoard;
    }

    /**
     * 盤面を評価して数値スコアを返す
     * weightTableを使用して位置による重み付けを行う
     * @param board - 評価対象の盤面
     * @param player - 評価するプレイヤー（1 or 2）
     * @returns 評価スコア（高いほど有利）
     */
    private evaluateBoard(board: Cell[][], player: Player): number {
        let score = 0;
        // 相手プレイヤーを決定
        const opponent = player === 1 ? 2 : 1;
        
        // 盤面の全マスをチェック
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                // 自分の石があれば重みを加算
                if (board[i][j] === player) {
                    score += this.weightTable[i][j];
                } 
                // 相手の石があれば重みを減算
                else if (board[i][j] === opponent) {
                    score -= this.weightTable[i][j];
                }
            }
        }
        return score;
    }

    /**
     * 特定の手の評価スコアを計算
     * @param r - 行インデックス（0-7）
     * @param c - 列インデックス（0-7）
     * @param player - 手を打つプレイヤー（1 or 2）
     * @returns 評価スコア
     */
    private evaluateMove(r: number, c: number, player: Player): number {
        // この手を打った後の盤面をシミュレート
        const tempBoard = this.simulateMove(this.board, r, c, player);
        // シミュレート後の盤面を評価
        return this.evaluateBoard(tempBoard, player);
    }

    /**
     * 盤面と情報を画面に描画
     * 各セルの状態、有効な手のハイライト、ターン表示、スコアを更新
     */
    private render() {
        // ボード要素を取得
        const boardEl = document.getElementById('board')!;
        // 既存の内容をクリア
        boardEl. innerHTML = '';
        
        // 黒と白の石の数をカウント
        let bCount = 0, wCount = 0;

        // 人間プレイヤーのターンなら有効な手を取得してハイライト用に準備
        const validMoves = this.currentPlayer === this.humanPlayer ? this.getValidMoves(this.currentPlayer) : [];
        // 高速検索のためにSetに変換
        const validMoveSet = new Set(validMoves. map(m => `${m.r},${m.c}`));

        // 盤面の各マスを描画
        this.board.forEach((row, r) => {
            row.forEach((cell, c) => {
                // セル要素を作成
                const cellEl = document.createElement('div');
                cellEl.className = 'cell';
                // クリックイベントを設定
                cellEl.onclick = () => this.handleMove(r, c);
                
                // 空きマスで有効な手の場合はハイライト
                if (cell === 0 && validMoveSet.has(`${r},${c}`)) {
                    cellEl.classList.add('valid-move');
                }

                // 石がある場合
                if (cell !== 0) {
                    // 石要素を作成
                    const piece = document.createElement('div');
                    piece.className = `piece ${cell === 1 ?  'black' : 'white'}`;
                    cellEl.appendChild(piece);
                    // 石の数をカウント
                    cell === 1 ? bCount++ : wCount++;
                }
                
                // セルをボードに追加
                boardEl.appendChild(cellEl);
            });
        });

        // ターン表示を更新
        const turnText = this.currentPlayer === 1 ? '黒' : '白';
        const who = this.currentPlayer === this.humanPlayer ? 'あなた' : 'CPU';
        document.getElementById('turn-display')!.innerText = `${turnText}（${who}）`;
        
        // スコア表示を更新
        document.getElementById('score')!.innerText = `黒:  ${bCount} | 白: ${wCount}`;
    }

    /**
     * メッセージを表示し、3秒後に自動的に消す
     * @param msg - 表示するメッセージ
     */
    private showMessage(msg: string) {
        // メッセージ要素を取得
        const msgEl = document.getElementById('message')!;
        // メッセージを設定
        msgEl.innerText = msg;
        // 3秒後にメッセージをクリア
        setTimeout(() => msgEl.innerText = '', 3000);
    }

    /**
     * UIのイベントリスナーを設定
     * リセットボタンと役割選択セレクトボックスのイベントを登録
     */
    private setupEventListeners() {
        // リセットボタンのクリックイベント
        document.getElementById('reset-btn')!.onclick = () => {
            // 役割選択をデフォルト（黒=1）に戻す
            const roleSelect = document.getElementById('role-select') as HTMLSelectElement | null;
            if (roleSelect) roleSelect.value = "1";

            // AIモードをデフォルト（ランダム）に戻す
            const aiModeSelect = document.getElementById('ai-mode') as HTMLSelectElement | null;
            if (aiModeSelect) aiModeSelect.value = "random";

            // 新しいゲームを開始
            this.startNewGameFromUI();
        };
        
        // 役割選択セレクトボックスの変更イベント
        const roleSelect = document.getElementById('role-select') as HTMLSelectElement | null;
        if (roleSelect) {
            // 役割が変更されたら新しいゲームを開始
            roleSelect.onchange = () => this.startNewGameFromUI();
        }
    }
}

// アプリケーション起動時にReversiクラスをインスタンス化
new Reversi();