var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var BabanukiGame = /** @class */ (function () {
    function BabanukiGame() {
        var _this = this;
        this.players = [];
        this.currentPlayerIndex = 0;
        this.isGameOver = false;
        var startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.onclick = function () {
                var countInput = document.getElementById('player-count');
                var count = parseInt(countInput.value);
                if (count < 2)
                    count = 2;
                if (count > 6)
                    count = 6;
                _this.init(count);
            };
        }
        var resetBtn = document.getElementById('reset-btn');
        if (resetBtn) {
            resetBtn.onclick = function () {
                document.getElementById('setup-area').style.display = 'block';
                document.getElementById('reset-btn').style.display = 'none';
                document.getElementById('cpu-container').innerHTML = '';
                document.getElementById('player-cards').innerHTML = '';
                _this.log("人数を決めて開始してください");
            };
        }
    }
    BabanukiGame.prototype.init = function (playerCount) {
        var _this = this;
        this.isGameOver = false;
        this.currentPlayerIndex = 0;
        document.getElementById('setup-area').style.display = 'none';
        // プレイヤー初期化
        this.players = [];
        for (var i = 0; i < playerCount; i++) {
            this.players.push({
                id: i,
                name: i === 0 ? "あなた" : "CPU ".concat(i),
                hand: [],
                isCPU: i !== 0,
                isFinished: false
            });
        }
        // 山札作成・シャッフル・配布
        var deck = this.createDeck();
        this.shuffle(deck);
        deck.forEach(function (card, i) {
            _this.players[i % playerCount].hand.push(card);
        });
        // 全員初期ペア捨て
        this.players.forEach(function (p) { return p.hand = _this.discardPairs(p.hand); });
        this.render();
        this.log("ゲーム開始！左隣のCPUのカードを1枚選んでください。");
    };
    BabanukiGame.prototype.createDeck = function () {
        var deck = [];
        var suits = ['♠', '♥', '♦', '♣'];
        for (var _i = 0, suits_1 = suits; _i < suits_1.length; _i++) {
            var suit = suits_1[_i];
            for (var rank = 1; rank <= 13; rank++)
                deck.push({ suit: suit, rank: rank });
        }
        deck.push({ suit: 'Joker', rank: 'Joker' });
        return deck;
    };
    // アルゴリズムとして「フィッシャー–イェーツのシャッフル」を使用
    BabanukiGame.prototype.shuffle = function (deck) {
        var _a;
        for (var i = deck.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            _a = [deck[j], deck[i]], deck[i] = _a[0], deck[j] = _a[1];
        }
    };
    BabanukiGame.prototype.discardPairs = function (hand) {
        var rankMap = new Map();
        hand.forEach(function (card) {
            var list = rankMap.get(card.rank) || [];
            list.push(card);
            rankMap.set(card.rank, list);
        });
        var newHand = [];
        rankMap.forEach(function (cards, rank) {
            if (rank === 'Joker' || cards.length % 2 !== 0) {
                newHand.push(cards[0]);
            }
        });
        return newHand;
    };
    // 「左隣のまだ終わっていない人」のインデックスを取得
    BabanukiGame.prototype.getTargetIndex = function (currentIndex) {
        var next = (currentIndex + 1) % this.players.length;
        while (this.players[next].isFinished) {
            next = (next + 1) % this.players.length;
        }
        return next;
    };
    BabanukiGame.prototype.handleDraw = function (fromIdx, cardIdx) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (this.isGameOver || this.players[this.currentPlayerIndex].isCPU)
                    return [2 /*return*/];
                this.executeMove(fromIdx, cardIdx);
                return [2 /*return*/];
            });
        });
    };
    BabanukiGame.prototype.executeMove = function (fromIdx, cardIdx) {
        var currentPlayer = this.players[this.currentPlayerIndex];
        var targetPlayer = this.players[fromIdx];
        var card = targetPlayer.hand.splice(cardIdx, 1)[0];
        currentPlayer.hand.push(card);
        currentPlayer.hand = this.discardPairs(currentPlayer.hand);
        this.log("".concat(currentPlayer.name, " \u304C ").concat(targetPlayer.name, " \u304B\u3089\u30AB\u30FC\u30C9\u3092\u5F15\u304D\u307E\u3057\u305F\u3002"));
        this.checkFinish(targetPlayer);
        this.checkFinish(currentPlayer);
        if (this.checkGameOver()) {
            this.render();
            return;
        }
        this.nextTurn();
    };
    BabanukiGame.prototype.checkFinish = function (player) {
        if (player.hand.length === 0 && !player.isFinished) {
            player.isFinished = true;
            this.log("".concat(player.name, " \u304C\u4E0A\u304C\u308A\u307E\u3057\u305F\uFF01"));
        }
    };
    BabanukiGame.prototype.nextTurn = function () {
        var _this = this;
        do {
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        } while (this.players[this.currentPlayerIndex].isFinished);
        this.render();
        if (this.players[this.currentPlayerIndex].isCPU) {
            setTimeout(function () { return _this.cpuAction(); }, 1200);
        }
        else {
            this.log("あなたの番です。左隣のカードを引いてください。");
        }
    };
    BabanukiGame.prototype.cpuAction = function () {
        if (this.isGameOver)
            return;
        var targetIdx = this.getTargetIndex(this.currentPlayerIndex);
        var randomCardIdx = Math.floor(Math.random() * this.players[targetIdx].hand.length);
        this.executeMove(targetIdx, randomCardIdx);
    };
    BabanukiGame.prototype.checkGameOver = function () {
        var remaining = this.players.filter(function (p) { return !p.isFinished; });
        if (remaining.length === 1) {
            this.log("\u30B2\u30FC\u30E0\u7D42\u4E86\uFF01\u6700\u4E0B\u4F4D\u306F ".concat(remaining[0].name, " \u3067\u3059\u3002"));
            this.isGameOver = true;
            document.getElementById('reset-btn').style.display = 'inline-block';
            return true;
        }
        return false;
    };
    BabanukiGame.prototype.render = function () {
        var _this = this;
        var cpuContainer = document.getElementById('cpu-container');
        cpuContainer.innerHTML = '';
        var playerContainer = document.getElementById('player-cards');
        playerContainer.innerHTML = '';
        var targetIdx = this.getTargetIndex(this.currentPlayerIndex);
        this.players.forEach(function (p, i) {
            if (i === 0) {
                p.hand.forEach(function (card) { return playerContainer.appendChild(_this.createCardDiv(card, false)); });
                if (p.isFinished)
                    playerContainer.innerHTML = "<h3>✨ 上がり！ ✨</h3>";
            }
            else {
                var area = document.createElement('div');
                area.className = "cpu-player-area ".concat(i === _this.currentPlayerIndex ? 'active' : '');
                area.innerHTML = "<h4>".concat(p.name, " (").concat(p.hand.length, "\u679A)</h4>");
                var cardsDiv_1 = document.createElement('div');
                cardsDiv_1.className = 'cards-container';
                if (p.isFinished) {
                    cardsDiv_1.innerHTML = "<p>🏳️ 上がり</p>";
                }
                else {
                    p.hand.forEach(function (_, cardIdx) {
                        var cardEl = _this.createCardDiv(null, true);
                        // 自分の番で、かつ隣のCPUならクリック可能
                        if (i === targetIdx && _this.currentPlayerIndex === 0 && !_this.isGameOver) {
                            cardEl.onclick = function () { return _this.handleDraw(i, cardIdx); };
                            cardEl.style.cursor = 'pointer';
                        }
                        cardsDiv_1.appendChild(cardEl);
                    });
                }
                area.appendChild(cardsDiv_1);
                cpuContainer.appendChild(area);
            }
        });
    };
    BabanukiGame.prototype.createCardDiv = function (card, isBack) {
        var div = document.createElement('div');
        div.className = 'card' + (isBack ? ' back' : '');
        if (!isBack && card) {
            if (card.suit === '♥' || card.suit === '♦')
                div.classList.add('red');
            if (card.rank === 'Joker')
                div.classList.add('joker');
            div.innerHTML = "".concat(card.rank === 'Joker' ? 'J' : card.rank, "<span>").concat(card.suit === 'Joker' ? '🤡' : card.suit, "</span>");
        }
        else {
            div.textContent = '?';
        }
        return div;
    };
    BabanukiGame.prototype.log = function (m) {
        document.getElementById('message-log').innerHTML = "<p>".concat(m, "</p>");
    };
    return BabanukiGame;
}());
window.onload = function () { return new BabanukiGame(); };
