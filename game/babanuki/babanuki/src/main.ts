/**
 * カードのスート定義
 */
type Suit = '♠' | '♥' | '♦' | '♣' | 'Joker';

/**
 * カードの数字定義（1〜13、またはJoker）
 */
type Rank = number | 'Joker';

/**
 * カードオブジェクトの構造
 */
interface Card {
    suit: Suit;
    rank: Rank;
}

/**
 * プレイヤーの状態管理構造
 */
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
     * コンストラクタ：初期イベントのバインド
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
     * ゲームの初期化：プレイヤー生成、山札配布、初期ペア捨てを実行
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
     * 山札（52枚 + Joker）の生成
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
     * フィッシャー–イェーツのアルゴリズムによる配列のシャッフル
     */
    private shuffle(deck: Card[]) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    }

    /**
     * 手札から同じ数字のペアを探して削除するロジック
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
     * 現在のプレイヤーから見て「左隣のまだ脱落していない人」のインデックスを取得
     */
    private getTargetIndex(currentIndex: number): number {
        let next = (currentIndex + 1) % this.players.length;
        while (this.players[next].isFinished) {
            next = (next + 1) % this.players.length;
        }
        return next;
    }

    /**
     * プレイヤーがカードをクリックした際のイベントハンドラ
     */
    private async handleDraw(fromIdx: number, cardIdx: number) {
        if (this.isGameOver || this.players[this.currentPlayerIndex].isCPU) return;
        this.executeMove(fromIdx, cardIdx);
    }

    /**
     * 実際にカードを移動させ、ペア捨てと上がり判定を行うコアロジック
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
     * プレイヤーの手札が0になったかを確認し、ランキングに登録する
     */
    private checkFinish(player: Player) {
        if (player.hand.length === 0 && !player.isFinished) {
            player.isFinished = true;
            this.ranking.push(player);
            this.log(`${player.name} が上がりました！ (${this.ranking.length}位)`);
        }
    }

    /**
     * ターンを次のプレイヤーに回し、CPUであれば自動実行を開始する
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
     * CPUによる自動カード選択ロジック
     */
    private cpuAction() {
        if (this.isGameOver) return;
        const targetIdx = this.getTargetIndex(this.currentPlayerIndex);
        const randomCardIdx = Math.floor(Math.random() * this.players[targetIdx].hand.length);
        this.executeMove(targetIdx, randomCardIdx);
    }

    /**
     * 残り人数を確認し、最下位が決定したか判定する
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
     * ゲーム終了時の最終順位表をHTMLにレンダリングする
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
                    <span>${index === this.ranking.length - 1 ? '負け...' : '上がり'}</span>
                </div>
            `;
        });
        display.innerHTML = html;
        document.getElementById('reset-btn')!.style.display = 'inline-block';
    }

    /**
     * 現在のゲーム状態を画面全体に反映する
     */
    private render() {
        const cpuContainer = document.getElementById('cpu-container')!;
        cpuContainer.innerHTML = '';
        const playerContainer = document.getElementById('player-cards')!;
        playerContainer.innerHTML = '';

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
                    p.hand.forEach((_, cardIdx) => {
                        const cardEl = this.createCardDiv(null, true);
                        if (i === targetIdx && this.currentPlayerIndex === 0 && !this.isGameOver) {
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
     * 個別のカードDOM要素を生成する（スートやアニメーションの付与）
     */
    private createCardDiv(card: Card | null, isBack: boolean): HTMLElement {
        const div = document.createElement('div');
        div.className = 'card' + (isBack ? ' back' : '');
        if (!isBack && card) {
            if (card.suit === '♥' || card.suit === '♦') div.classList.add('red');
            if (card.rank === 'Joker') {
                div.classList.add('joker');
                div.classList.add('joker-animation');
                div.innerHTML = `J<span>🤡</span>`;
            } else {
                div.innerHTML = `${card.rank}<span>${card.suit}</span>`;
            }
        } else {
            div.textContent = '?';
        }
        return div;
    }

    /**
     * 画面上のログエリアにメッセージを出力する
     */
    private log(m: string) {
        document.getElementById('message-log')!.innerHTML = `<p>${m}</p>`;
    }
}

/**
 * ページロード完了時にゲームインスタンスを生成
 */
window.onload = () => new BabanukiGame();