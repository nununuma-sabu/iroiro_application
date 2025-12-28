# Food Ticket System (食券機システム)

飲食店向けのデジタル食券機シミュレーター。顧客向けの注文画面と、管理者向けの商品・在庫管理機能を備えたWebアプリケーションです。

## 📋 目次

- [機能概要](#機能概要)
- [技術スタック](#技術スタック)
- [セットアップ](#セットアップ)
- [使い方](#使い方)
- [プロジェクト構成](#プロジェクト構成)
- [開発履歴](#開発履歴)
- [API仕様](#api仕様)
- [データベース構成](#データベース構成)
- [開発用コマンド](#開発用コマンド)
- [トラブルシューティング](#トラブルシューティング)
- [今後の開発予定](#今後の開発予定)

---

## 🎯 機能概要

### 顧客向け機能
- ✅ **店舗ログイン** - 店舗IDとパスワードで認証
- ✅ **顔認証シミュレーション** - 顧客属性（年齢層・性別）の自動検出
- ✅ **手動属性入力** - 顔認証スキップ時の手動入力
- ✅ **商品閲覧** - カテゴリ別の商品表示（動的カテゴリ対応）
- ✅ **カート機能** - 商品の追加・削除・数量変更
- ✅ **注文確定** - 在庫の自動減少、注文履歴の保存

### 管理者向け機能
- ✅ **カテゴリ管理** - カテゴリの追加・編集・削除（CRUD操作）
- ✅ **商品管理** - 商品の追加・編集・削除（CRUD操作）
- ✅ **画像アップロード** - 商品画像のアップロード機能
- ✅ **カテゴリフィルター** - カテゴリ別の商品絞り込み
- ✅ **初期在庫設定** - 商品登録時に在庫数も同時設定
- 🚧 **在庫管理** - （未実装）在庫の一括管理・販売状態の切り替え
- 🚧 **売上分析** - （未実装）売上グラフ・人気商品ランキング

---

## 🛠 技術スタック

### バックエンド
- **Python 3.10+**
- **FastAPI** - 高速なWebフレームワーク
- **SQLAlchemy** - ORM（Object-Relational Mapping）
- **SQLite** - データベース
- **Passlib** - パスワードハッシュ化
- **python-multipart** - ファイルアップロード対応

### フロントエンド
- **React 18** + **TypeScript**
- **Vite** - 高速ビルドツール
- **React Router** - ルーティング
- **Axios** - HTTP通信
- **Tailwind CSS** - スタイリング

---

## 🚀 セットアップ

### 必要な環境
- Python 3.10以上
- Node.js 18以上
- npm または yarn

### 1. リポジトリのクローン

```bash
git clone https://github.com/nununuma-sabu/iroiro_application.git
cd iroiro_application/food_ticket
```

### 2. バックエンドのセットアップ

```bash
cd backend

# 仮想環境の作成（推奨）
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 依存パッケージのインストール
pip install -r requirements.txt

# データベースの作成
python -m scripts.create_db

# 初期データの投入
python -m scripts.seed

# サーバー起動
uvicorn app.main:app --reload
```

バックエンドは `http://127.0.0.1:8000` で起動します。

### 3. フロントエンドのセットアップ

```bash
cd ../frontend

# 依存パッケージのインストール
npm install

# 開発サーバー起動
npm run dev
```

フロントエンドは `http://localhost:5173` で起動します。

---

## 📖 使い方

### 顧客画面

1. ブラウザで `http://localhost:5173` にアクセス
2. ログイン画面で以下を入力：
   - **店舗ID**: `1`
   - **パスワード**: `password123`
3. 顔認証画面でカメラを起動、または「手動で入力する」をクリック
4. 商品を選択してカートに追加
5. 「注文を確定する」ボタンで注文完了

### 管理画面

1. ブラウザで `http://localhost:5173/admin` にアクセス
2. サイドバーから機能を選択：
   - **カテゴリ管理** (`/admin/categories`) - カテゴリの追加・編集・削除
   - **商品管理** (`/admin/products`) - 商品の追加・編集・削除、画像アップロード

#### カテゴリ管理
- 新しいカテゴリを追加
- 既存カテゴリの名前を編集
- カテゴリの削除（商品が紐付いていない場合のみ）

#### 商品管理
- 新規商品の追加（商品名、カテゴリ、価格、画像、初期在庫）
- 商品情報の編集
- 商品の削除
- カテゴリでフィルタリング

---

## 📂 プロジェクト構成

```
food_ticket/
├── backend/
│   ├── app/
│   │   ├── core/              # セキュリティ、設定
│   │   │   └── security.py
│   │   ├── db/                # データベース関連
│   │   │   ├── models.py      # テーブル定義
│   │   │   └── session.py     # DB接続
│   │   ├── routers/           # APIルーター
│   │   │   ├── __init__.py
│   │   │   └── admin.py       # 管理画面API
│   │   ├── schemas/           # Pydanticスキーマ
│   │   │   └── admin.py       # 管理画面スキーマ
│   │   └── main.py            # FastAPIアプリ本体
│   ├── scripts/
│   │   ├── create_db.py       # DB作成スクリプト
│   │   └── seed.py            # 初期データ投入
│   ├── requirements.txt       # Python依存パッケージ
│   └── vending_machine.db     # SQLiteデータベース（自動生成）
│
└── frontend/
    ├── src/
    │   ├── api/               # API通信
    │   │   ├── client.ts      # 共通axiosクライアント
    │   │   ├── admin.ts       # 管理画面API関数
    │   │   ├── store.ts       # 店舗API関数
    │   │   └── order.ts       # 注文API関数
    │   ├── components/        # Reactコンポーネント
    │   │   ├── admin/
    │   │   │   ├── CategoryManager. tsx
    │   │   │   ├── CategoryManager.css
    │   │   │   ├── ProductManager.tsx
    │   │   │   └── ProductManager.css
    │   │   ├── LoginScreen.tsx
    │   │   ├── FaceRecognitionScreen.tsx
    │   │   ├── CustomerAttributeScreen.tsx
    │   │   └── MenuScreen.tsx
    │   ├── pages/             # ページコンポーネント
    │   │   ├── StorePage.tsx  # 顧客画面
    │   │   └── AdminPage.tsx  # 管理画面
    │   ├── types/             # TypeScript型定義
    │   │   ├── auth.ts
    │   │   ├── store.ts
    │   │   └── order.ts
    │   └── App.tsx            # ルートコンポーネント
    ├── public/
    │   └── images/            # アップロード画像保存先
    ├── package.json
    └── vite.config.ts
```

---

## 🔄 開発履歴

### 2025-12-28:  管理画面の実装

#### Step 1: API基盤の共通化
- **実装内容**
  - `frontend/src/api/client.ts` を作成し、axios共通インスタンスを実装
  - `frontend/src/api/store.ts` を更新し、共通クライアントを使用
  - エラーハンドリングのインターセプターを追加

```typescript
// frontend/src/api/client.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});
```

#### Step 2: バックエンドの管理画面API
- **実装内容**
  - `backend/app/schemas/admin.py` を作成（カテゴリ・商品のスキーマ定義）
  - `backend/app/routers/admin.py` を作成（管理画面API実装）
  - `backend/app/main.py` に管理画面ルーターを登録

- **API一覧**
  - カテゴリCRUD:  GET/POST/PUT/DELETE `/admin/categories`
  - 商品CRUD: GET/POST/PUT/DELETE `/admin/products`
  - 画像アップロード: POST `/admin/upload-image`

#### Step 3: フロントエンドのルーティング変更
- **実装内容**
  - `frontend/src/App.tsx` をReact Routerで更新
  - `frontend/src/pages/StorePage.tsx` を作成（顧客向けページ）
  - `frontend/src/pages/AdminPage. tsx` を作成（管理画面レイアウト）

```typescript
// App.tsx
<Router>
  <Routes>
    <Route path="/" element={<StorePage />} />
    <Route path="/admin/*" element={<AdminPage />} />
  </Routes>
</Router>
```

#### Step 4: 管理画面API関数
- **実装内容**
  - `frontend/src/api/admin.ts` を作成
  - カテゴリ・商品のCRUD関数を実装
  - 画像アップロード関数を実装

#### Step 5: カテゴリ管理画面
- **実装内容**
  - `frontend/src/components/admin/CategoryManager.tsx` を作成
  - カテゴリ一覧表示、追加、編集、削除機能を実装
  - インライン編集可能なUI

#### Step 6: 商品管理画面
- **実装内容**
  - `frontend/src/components/admin/ProductManager.tsx` を作成
  - 商品一覧表示（グリッドレイアウト）
  - 商品追加・編集・削除機能
  - カテゴリフィルター機能
  - 画像アップロード対応
  - 初期在庫設定

#### Step 7: 注文画面の改善
- **実装内容**
  - `frontend/src/components/MenuScreen.tsx` を更新
  - APIから全カテゴリを動的に取得
  - 商品がないカテゴリも表示
  - 管理画面で追加したカテゴリが即反映されるように改善

```typescript
// MenuScreen.tsx
const [categories, setCategories] = useState<Category[]>([]);

useEffect(() => {
  const fetchData = async () => {
    const [productsData, categoriesData] = await Promise.all([
      getStoreProducts(storeId),
      getAllCategories(),
    ]);
    setProducts(productsData || []);
    setCategories(categoriesData || []);
  };
  fetchData();
}, [storeId]);
```

---

## 🔌 API仕様

### 顧客向けAPI

#### `POST /login/store`
店舗ログイン

**リクエスト:**
```json
{
  "store_id": 1,
  "password": "password123"
}
```

**レスポンス:**
```json
{
  "status": "success",
  "store_info": {
    "id": 1,
    "name": "新宿本店",
    "prefecture": "東京都",
    "municipality": "新宿区"
  }
}
```

#### `POST /customer-attributes`
顧客属性登録

**リクエスト:**
```json
{
  "store_id": 1,
  "age_group": "20代",
  "gender": "男性"
}
```

**レスポンス:**
```json
{
  "attribute_id": 1,
  "store_id": 1,
  "age_group": "20代",
  "gender": "男性",
  "scanned_at": "2025-12-28T12:34:56"
}
```

#### `GET /stores/{store_id}/products`
販売中の商品一覧を取得

**レスポンス:**
```json
[
  {
    "product_id": 1,
    "product_name": "ハンバーグ定食",
    "category_name": "定食",
    "price": 850,
    "stock":  50,
    "image_url":  "/images/hamburg.jpg"
  }
]
```

#### `POST /orders`
注文を確定

**リクエスト:**
```json
{
  "store_id": 1,
  "attribute_id": 1,
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "unit_price": 850
    }
  ],
  "total_amount": 1700,
  "payment_method": "現金",
  "take_out_type": "店内"
}
```

**レスポンス:**
```json
{
  "status": "success",
  "order_id": 1
}
```

### 管理画面API

#### カテゴリ管理

**`GET /admin/categories`** - カテゴリ一覧取得

レスポンス:
```json
[
  {
    "category_id": 1,
    "category_name": "定食"
  }
]
```

**`POST /admin/categories`** - カテゴリ追加

リクエスト:
```json
{
  "category_name": "ドリンク"
}
```

**`PUT /admin/categories/{category_id}`** - カテゴリ更新

リクエスト: 
```json
{
  "category_name": "ソフトドリンク"
}
```

**`DELETE /admin/categories/{category_id}`** - カテゴリ削除

レスポンス:
```json
{
  "status": "success",
  "message": "カテゴリを削除しました"
}
```

#### 商品管理

**`GET /admin/products`** - 商品一覧取得

クエリパラメータ: 
- `category_id` (optional): カテゴリIDでフィルター

レスポンス:
```json
[
  {
    "product_id": 1,
    "product_name": "ハンバーグ定食",
    "category_id": 1,
    "category_name": "定食",
    "standard_price": 850,
    "image_url": "/images/hamburg. jpg",
    "stock": 50,
    "is_on_sale": true
  }
]
```

**`POST /admin/products`** - 商品追加

リクエスト:
```json
{
  "product_name": "コーラ",
  "category_id":  2,
  "standard_price": 350,
  "image_url": "/images/cola. jpg",
  "initial_stock": 99
}
```

**`PUT /admin/products/{product_id}`** - 商品更新

リクエスト: 
```json
{
  "product_name": "コカコーラ",
  "standard_price": 300
}
```

**`DELETE /admin/products/{product_id}`** - 商品削除

レスポンス:
```json
{
  "status":  "success",
  "message":  "商品を削除しました"
}
```

#### 画像アップロード

**`POST /admin/upload-image`** - 商品画像をアップロード

リクエスト:
- Content-Type: `multipart/form-data`
- フィールド: `file` (画像ファイル)

レスポンス:
```json
{
  "status": "success",
  "image_url": "/images/1735380123_product. jpg"
}
```

詳細は `http://127.0.0.1:8000/docs` のSwagger UIを参照してください。

---

## 🗄 データベース構成

### 主要テーブル

#### prefectures（都道府県）
```sql
CREATE TABLE prefectures (
    prefecture_id INTEGER PRIMARY KEY,
    prefecture_name VARCHAR(10) NOT NULL
);
```

#### municipalities（市町村）
```sql
CREATE TABLE municipalities (
    municipality_id INTEGER PRIMARY KEY,
    prefecture_id INTEGER NOT NULL,
    municipality_name VARCHAR(50) NOT NULL,
    FOREIGN KEY (prefecture_id) REFERENCES prefectures(prefecture_id)
);
```

#### stores（店舗）
```sql
CREATE TABLE stores (
    store_id INTEGER PRIMARY KEY AUTOINCREMENT,
    municipality_id INTEGER NOT NULL,
    store_name VARCHAR(100) NOT NULL,
    address_detail VARCHAR(200),
    password_hash VARCHAR(255) NOT NULL,
    FOREIGN KEY (municipality_id) REFERENCES municipalities(municipality_id)
);
```

#### categories（カテゴリ）
```sql
CREATE TABLE categories (
    category_id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_name VARCHAR(50) NOT NULL UNIQUE
);
```

#### products（商品）
```sql
CREATE TABLE products (
    product_id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    product_name VARCHAR(100) NOT NULL,
    standard_price INTEGER NOT NULL,
    image_url VARCHAR(255),
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
);
```

#### store_inventories（店舗在庫）
```sql
CREATE TABLE store_inventories (
    inventory_id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    current_stock INTEGER NOT NULL DEFAULT 0,
    is_on_sale BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (store_id) REFERENCES stores(store_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);
```

#### customer_attributes（顧客属性）
```sql
CREATE TABLE customer_attributes (
    attribute_id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    age_group VARCHAR(20),
    gender VARCHAR(10),
    scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(store_id)
);
```

#### orders（注文）
```sql
CREATE TABLE orders (
    order_id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    attribute_id INTEGER,
    total_amount INTEGER NOT NULL,
    payment_method VARCHAR(20),
    take_out_type VARCHAR(20),
    ordered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(store_id),
    FOREIGN KEY (attribute_id) REFERENCES customer_attributes(attribute_id)
);
```

#### order_details（注文明細）
```sql
CREATE TABLE order_details (
    detail_id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price INTEGER NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);
```

ER図については `/backend/ER図.md` を参照してください。

---

## 🔧 開発用コマンド

### バックエンド起動
```bash
cd ~/iroiro_application/food_ticket/backend/
uvicorn app.main:app --reload
```

### フロントエンド起動
```bash
cd ~/iroiro_application/food_ticket/frontend/
npm run dev
```

### データベースリセット
```bash
cd ~/iroiro_application/food_ticket/backend/
rm vending_machine.db
python -m scripts.create_db
python -m scripts.seed
```

### テストデータ

初期データ（`scripts/seed.py`）には以下が含まれます：

**店舗:**
- ID: 1
- 名前: 新宿本店
- パスワード: `password123`

**カテゴリ:**
- 定食（ID: 1）
- サイドメニュー（ID: 2）
- 単品（ID: 3）

**商品:**
1. ハンバーグ定食（定食、¥850、在庫50）
2. からあげ定食（定食、¥750、在庫30）
3. フライドポテト（サイドメニュー、¥300、在庫100）
4. とんかつ定食（定食、¥900、在庫40）

---

## 🐛 トラブルシューティング

### エラー:  `Form data requires "python-multipart" to be installed`

**原因:** 画像アップロード機能に必要なパッケージが不足

**解決方法:**
```bash
cd ~/iroiro_application/food_ticket/backend/
pip install python-multipart
uvicorn app.main:app --reload
```

### エラー: 画像アップロード時に `FileNotFoundError`

**原因:** 画像保存ディレクトリが存在しない

**解決方法:**
```bash
cd ~/iroiro_application/food_ticket/frontend/public
mkdir -p images
```

### カテゴリを追加しても注文画面に表示されない

**原因:** 以前の実装では、商品が存在するカテゴリのみ表示していた

**解決済み:** MenuScreen.tsxを更新し、APIから全カテゴリを取得するように変更済み

### CORS エラーが発生する

**原因:** バックエンドのCORS設定

**解決方法:** `backend/app/main.py` のCORS設定を確認
```python
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
```

---

## 📝 今後の開発予定

### 優先度:  高
- [ ] **在庫管理画面** - リアルタイム在庫確認、販売中/停止の切り替え
  - 店舗別の在庫一覧表示
  - 在庫の増減機能
  - 販売状態の一括切り替え
  
- [ ] **売上分析ダッシュボード** - 日別/月別売上グラフ、人気商品ランキング
  - Chart.jsやRechartsを使った売上グラフ
  - 時間帯別の売上分析
  - 顧客属性別の購入傾向

### 優先度: 中
- [ ] **注文履歴画面** - 過去の注文一覧・詳細表示
  - 日付範囲での絞り込み
  - 注文詳細の表示
  - 注文のキャンセル機能
  
- [ ] **店舗管理** - 複数店舗の管理、店舗情報編集
  - 店舗一覧表示
  - 店舗情報の編集
  - 店舗ごとの設定
  
- [ ] **管理画面認証** - ログイン必須化、ユーザー権限管理
  - 管理者ログイン機能
  - ロールベースのアクセス制御
  - セッション管理

### 優先度: 低
- [ ] **通知機能** - 在庫アラート、注文完了通知
  - Webプッシュ通知
  - メール通知
  - Slack連携
  
- [ ] **レポート出力** - 売上レポートのPDF/CSV出力
  - 日次/月次レポート
  - CSV/Excel出力
  - PDF帳票出力
  
- [ ] **モバイル最適化** - レスポンシブデザインの改善
  - スマートフォン向けUI
  - タブレット対応
  - PWA化

---

## 🤝 コントリビューション

プルリクエストを歓迎します！大きな変更の場合は、まずissueを開いて変更内容を議論してください。

### コミット規約

```
feat: 新機能
fix: バグ修正
docs: ドキュメント更新
refactor: リファクタリング
chore: ビルドプロセスや補助ツールの変更
```

---

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

---

## 👤 作成者

[@nununuma-sabu](https://github.com/nununuma-sabu)

---

## 📚 参考資料

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Vite Documentation](https://vitejs.dev/)
