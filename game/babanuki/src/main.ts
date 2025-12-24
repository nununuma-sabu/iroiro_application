type Suit = '♠' | '♥' | '♦' | '♣' | 'Joker';
type Rank = number | 'Joker';

interface Card {
    suit: Suit;
    rank: Rank;
}

interface Player {
    id: number;
    name: string;
    hand: Card[];
    isCPU: boolean;
    isFinished: boolean;
}

class BabanukiGame {
    private players: Player[] = [];
    private ranking: Player[] = [];
    private currentPlayerIndex: number = 0;
    private isGameOver: boolean = false;

    /**
     * コンストラクタ：初期ボタンイベントの登録
     */
    constructor() {
        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.onclick = () => {
                const countInput = document.getElementById('player-count') as HTMLInputElement;
                let count = parseInt(countInput.value);
                if (count < 2) count = 2;
                if (count > 6) count = 6;
                this.init(count);
            };
        }

        const resetBtn = document.getElementById('reset-btn');
        if (resetBtn) {
            resetBtn.onclick = () => {
                document.getElementById('setup-area')!.style.display = 'block';
                document.getElementById('reset-btn')!.style.display = 'none';
                document.getElementById('ranking-display')!.style.display = 'none';
                document.getElementById('cpu-container')!.innerHTML = '';
                document.getElementById('player-cards')!.innerHTML = '';
                this.log("人数を決めて開始してください");
            };
        }
    }

    /**
     * ゲームの初期化処理
     */
    private init(playerCount: number) {
        this.isGameOver = false;
        this.currentPlayerIndex = 0;
        this.ranking = [];
        document.getElementById('setup-area')!.style.display = 'none';
        document.getElementById('ranking-display')!.style.display = 'none';
        
        this.players = [];
        for (let i = 0; i < playerCount; i++) {
            this.players.push({
                id: i,
                name: i === 0 ? "あなた" : `CPU ${i}`,
                hand: [],
                isCPU: i !== 0,
                isFinished: false
            });
        }

        const deck = this.createDeck();
        this.shuffle(deck);
        deck.forEach((card, i) => {
            this.players[i % playerCount].hand.push(card);
        });

        this.players.forEach(p => p.hand = this.discardPairs(p.hand));
        this.players.forEach(p => this.checkFinish(p));

        this.render();
        this.log("ゲーム開始！左隣のカードを引いてください。");
    }

    /**
     * トランプの数字を表示用文字列（A, J, Q, K）に変換
     */
    private getRankDisplay(rank: Rank): string {
        if (rank === 'Joker') return 'JOKER';
        if (rank === 1) return 'A';
        if (rank === 11) return 'J';
        if (rank === 12) return 'Q';
        if (rank === 13) return 'K';
        return rank.toString();
    }

    /**
     * 53枚の山札を生成
     */
    private createDeck(): Card[] {
        const deck: Card[] = [];
        const suits: (Exclude<Suit, 'Joker'>)[] = ['♠', '♥', '♦', '♣'];
        for (const suit of suits) {
            for (let rank = 1; rank <= 13; rank++) deck.push({ suit, rank });
        }
        deck.push({ suit: 'Joker', rank: 'Joker' });
        return deck;
    }

    /**
     * フィッシャー–イェーツのシャッフル
     */
    private shuffle(deck: Card[]) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    }

    /**
     * 手札の重複ペアを削除
     */
    private discardPairs(hand: Card[]): Card[] {
        const rankMap = new Map<Rank, Card[]>();
        hand.forEach(card => {
            const list = rankMap.get(card.rank) || [];
            list.push(card);
            rankMap.set(card.rank, list);
        });
        const newHand: Card[] = [];
        rankMap.forEach((cards, rank) => {
            if (rank === 'Joker' || cards.length % 2 !== 0) {
                newHand.push(cards[0]);
            }
        });
        return newHand;
    }

    /**
     * 左隣の有効なプレイヤーのインデックスを計算
     */
    private getTargetIndex(currentIndex: number): number {
        let next = (currentIndex + 1) % this.players.length;
        while (this.players[next].isFinished) {
            next = (next + 1) % this.players.length;
        }
        return next;
    }

    /**
     * プレイヤーがカードをクリックした際のドロー実行
     */
    private async handleDraw(fromIdx: number, cardIdx: number) {
        if (this.isGameOver || this.players[this.currentPlayerIndex].isCPU) return;
        this.executeMove(fromIdx, cardIdx);
    }

    /**
     * カードの移動とペア捨て、勝利判定を含むコアムーブ
     */
    private executeMove(fromIdx: number, cardIdx: number) {
        const currentPlayer = this.players[this.currentPlayerIndex];
        const targetPlayer = this.players[fromIdx];

        const card = targetPlayer.hand.splice(cardIdx, 1)[0];
        currentPlayer.hand.push(card);
        currentPlayer.hand = this.discardPairs(currentPlayer.hand);

        this.log(`${currentPlayer.name} が ${targetPlayer.name} から引きました。`);
        
        this.checkFinish(targetPlayer);
        this.checkFinish(currentPlayer);
        
        if (this.checkGameOver()) {
            this.render();
            return;
        }

        this.nextTurn();
    }

    /**
     * 個別プレイヤーの上がりチェック
     */
    private checkFinish(player: Player) {
        if (player.hand.length === 0 && !player.isFinished) {
            player.isFinished = true;
            this.ranking.push(player);
            this.log(`${player.name} が上がりました！ (${this.ranking.length}位)`);
        }
    }

    /**
     * ターンを次に進め、CPUの場合はAIを起動
     */
    private nextTurn() {
        if (this.isGameOver) return;
        do {
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        } while (this.players[this.currentPlayerIndex].isFinished);

        this.render();

        if (this.players[this.currentPlayerIndex].isCPU) {
            setTimeout(() => this.cpuAction(), 1000);
        }
    }

    /**
     * CPUによるランダムなドロー操作
     */
    private cpuAction() {
        if (this.isGameOver) return;
        const targetIdx = this.getTargetIndex(this.currentPlayerIndex);
        const randomCardIdx = Math.floor(Math.random() * this.players[targetIdx].hand.length);
        this.executeMove(targetIdx, randomCardIdx);
    }

    /**
     * ゲーム全体の終了判定
     */
    private checkGameOver(): boolean {
        const remaining = this.players.filter(p => !p.isFinished);
        if (remaining.length === 1) {
            this.ranking.push(remaining[0]);
            this.isGameOver = true;
            this.showFinalRanking();
            return true;
        }
        return false;
    }

    /**
     * 最終順位のHTML表示
     */
    private showFinalRanking() {
        this.log("ゲーム終了！最終結果を表示します。");
        const display = document.getElementById('ranking-display')!;
        display.style.display = 'block';
        
        let html = "<h3>最終順位</h3>";
        this.ranking.forEach((player, index) => {
            html += `
                <div class="ranking-item">
                    <span>${index + 1}位: ${player.name}</span>
                    <span>${index === this.ranking.length - 1 ? '最下位' : '上がり'}</span>
                </div>
            `;
        });
        display.innerHTML = html;
        document.getElementById('reset-btn')!.style.display = 'inline-block';
    }

    /**
     * 画面全体のレンダリング（透視モード対応）
     */
    private render() {
        const cpuContainer = document.getElementById('cpu-container')!;
        cpuContainer.innerHTML = '';
        const playerContainer = document.getElementById('player-cards')!;
        playerContainer.innerHTML = '';

        const isPlayerFinished = this.players[0].isFinished;
        const targetIdx = this.getTargetIndex(this.currentPlayerIndex);

        this.players.forEach((p, i) => {
            if (i === 0) {
                p.hand.forEach(card => playerContainer.appendChild(this.createCardDiv(card, false)));
                if (p.isFinished) playerContainer.innerHTML = "<h3>✨ 上がり済み ✨</h3>";
            } else {
                const area = document.createElement('div');
                area.className = `cpu-player-area ${i === this.currentPlayerIndex ? 'active' : ''}`;
                area.innerHTML = `<h4>${p.name} (${p.hand.length}枚)</h4>`;
                
                const cardsDiv = document.createElement('div');
                cardsDiv.className = 'cards-container';
                
                if (p.isFinished) {
                    cardsDiv.innerHTML = "<p>🏳️ 上がり済み</p>";
                } else {
                    p.hand.forEach((card, cardIdx) => {
                        // プレイヤーが上がった後はCPUの手札を公開する
                        const showFace = isPlayerFinished;
                        const cardEl = this.createCardDiv(card, !showFace);

                        if (i === targetIdx && this.currentPlayerIndex === 0 && !this.isGameOver && !isPlayerFinished) {
                            cardEl.onclick = () => this.handleDraw(i, cardIdx);
                            cardEl.style.cursor = 'pointer';
                        }
                        cardsDiv.appendChild(cardEl);
                    });
                }
                area.appendChild(cardsDiv);
                cpuContainer.appendChild(area);
            }
        });
    }

    /**
     * トランプ1枚のDOM要素を生成
     */
    private createCardDiv(card: Card, isBack: boolean): HTMLElement {
        const div = document.createElement('div');
        div.className = 'card' + (isBack ? ' back' : '');
        
        if (!isBack && card) {
            if (card.suit === '♥' || card.suit === '♦') div.classList.add('red');
            const rankLabel = this.getRankDisplay(card.rank);

            if (card.rank === 'Joker') {
                div.classList.add('joker');
                div.classList.add('joker-animation');
                div.innerHTML = `${rankLabel}<span>🤡</span>`;
            } else {
                div.innerHTML = `${rankLabel}<span>${card.suit}</span>`;
            }
        } else {
            div.textContent = '?';
        }
        return div;
    }

    /**
     * メッセージログの更新
     */
    private log(m: string) {
        document.getElementById('message-log')!.innerHTML = `<p>${m}</p>`;
    }
}

window.onload = () => new BabanukiGame();