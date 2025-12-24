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
    private currentPlayerIndex: number = 0;
    private isGameOver: boolean = false;

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
                document.getElementById('cpu-container')!.innerHTML = '';
                document.getElementById('player-cards')!.innerHTML = '';
                this.log("人数を決めて開始してください");
            };
        }
    }

    private init(playerCount: number) {
        this.isGameOver = false;
        this.currentPlayerIndex = 0;
        document.getElementById('setup-area')!.style.display = 'none';
        
        // プレイヤー初期化
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

        // 山札作成・シャッフル・配布
        const deck = this.createDeck();
        this.shuffle(deck);
        deck.forEach((card, i) => {
            this.players[i % playerCount].hand.push(card);
        });

        // 全員初期ペア捨て
        this.players.forEach(p => p.hand = this.discardPairs(p.hand));

        this.render();
        this.log("ゲーム開始！左隣のCPUのカードを1枚選んでください。");
    }

    private createDeck(): Card[] {
        const deck: Card[] = [];
        const suits: (Exclude<Suit, 'Joker'>)[] = ['♠', '♥', '♦', '♣'];
        for (const suit of suits) {
            for (let rank = 1; rank <= 13; rank++) deck.push({ suit, rank });
        }
        deck.push({ suit: 'Joker', rank: 'Joker' });
        return deck;
    }

    // アルゴリズムとして「フィッシャー–イェーツのシャッフル」を使用
    private shuffle(deck: Card[]) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    }

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

    // 「左隣のまだ終わっていない人」のインデックスを取得
    private getTargetIndex(currentIndex: number): number {
        let next = (currentIndex + 1) % this.players.length;
        while (this.players[next].isFinished) {
            next = (next + 1) % this.players.length;
        }
        return next;
    }

    private async handleDraw(fromIdx: number, cardIdx: number) {
        if (this.isGameOver || this.players[this.currentPlayerIndex].isCPU) return;
        this.executeMove(fromIdx, cardIdx);
    }

    private executeMove(fromIdx: number, cardIdx: number) {
        const currentPlayer = this.players[this.currentPlayerIndex];
        const targetPlayer = this.players[fromIdx];

        const card = targetPlayer.hand.splice(cardIdx, 1)[0];
        currentPlayer.hand.push(card);
        currentPlayer.hand = this.discardPairs(currentPlayer.hand);

        this.log(`${currentPlayer.name} が ${targetPlayer.name} からカードを引きました。`);
        
        this.checkFinish(targetPlayer);
        this.checkFinish(currentPlayer);
        
        if (this.checkGameOver()) {
            this.render();
            return;
        }

        this.nextTurn();
    }

    private checkFinish(player: Player) {
        if (player.hand.length === 0 && !player.isFinished) {
            player.isFinished = true;
            this.log(`${player.name} が上がりました！`);
        }
    }

    private nextTurn() {
        do {
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        } while (this.players[this.currentPlayerIndex].isFinished);

        this.render();

        if (this.players[this.currentPlayerIndex].isCPU) {
            setTimeout(() => this.cpuAction(), 1200);
        } else {
            this.log("あなたの番です。左隣のカードを引いてください。");
        }
    }

    private cpuAction() {
        if (this.isGameOver) return;
        const targetIdx = this.getTargetIndex(this.currentPlayerIndex);
        const randomCardIdx = Math.floor(Math.random() * this.players[targetIdx].hand.length);
        this.executeMove(targetIdx, randomCardIdx);
    }

    private checkGameOver(): boolean {
        const remaining = this.players.filter(p => !p.isFinished);
        if (remaining.length === 1) {
            this.log(`ゲーム終了！最下位は ${remaining[0].name} です。`);
            this.isGameOver = true;
            document.getElementById('reset-btn')!.style.display = 'inline-block';
            return true;
        }
        return false;
    }

    private render() {
        const cpuContainer = document.getElementById('cpu-container')!;
        cpuContainer.innerHTML = '';
        const playerContainer = document.getElementById('player-cards')!;
        playerContainer.innerHTML = '';

        const targetIdx = this.getTargetIndex(this.currentPlayerIndex);

        this.players.forEach((p, i) => {
            if (i === 0) {
                p.hand.forEach(card => playerContainer.appendChild(this.createCardDiv(card, false)));
                if (p.isFinished) playerContainer.innerHTML = "<h3>✨ 上がり！ ✨</h3>";
            } else {
                const area = document.createElement('div');
                area.className = `cpu-player-area ${i === this.currentPlayerIndex ? 'active' : ''}`;
                area.innerHTML = `<h4>${p.name} (${p.hand.length}枚)</h4>`;
                
                const cardsDiv = document.createElement('div');
                cardsDiv.className = 'cards-container';
                
                if (p.isFinished) {
                    cardsDiv.innerHTML = "<p>🏳️ 上がり</p>";
                } else {
                    p.hand.forEach((_, cardIdx) => {
                        const cardEl = this.createCardDiv(null, true);
                        // 自分の番で、かつ隣のCPUならクリック可能
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

    private createCardDiv(card: Card | null, isBack: boolean): HTMLElement {
        const div = document.createElement('div');
        div.className = 'card' + (isBack ? ' back' : '');
        if (!isBack && card) {
            if (card.suit === '♥' || card.suit === '♦') div.classList.add('red');
            if (card.rank === 'Joker') div.classList.add('joker');
            div.innerHTML = `${card.rank === 'Joker' ? 'J' : card.rank}<span>${card.suit === 'Joker' ? '🤡' : card.suit}</span>`;
        } else {
            div.textContent = '?';
        }
        return div;
    }

    private log(m: string) {
        document.getElementById('message-log')!.innerHTML = `<p>${m}</p>`;
    }
}

window.onload = () => new BabanukiGame();