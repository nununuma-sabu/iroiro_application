# 🍽️ 社食チケット管理システム

FastAPI と React を使った社食チケット管理システムです。

## 📋 目次
- [概要](#概要)
- [主な機能](#主な機能)
- [技術スタック](#技術スタック)
- [プロジェクト構成](#プロジェクト構成)
- [セットアップ](#セットアップ)
- [使い方](#使い方)
- [API仕様](#api仕様)
- [開発履歴](#開発履歴)
- [今後の開発予定](#今後の開発予定)

---

## 概要

社員食堂のチケット管理を効率化するWebアプリケーションです。従業員は好きなメニューを選んでチケットを購入し、食堂で使用できます。管理者は商品・店舗・カテゴリの管理、在庫管理が可能です。

---

## 主な機能

### ユーザー向け機能
- 🏪 **店舗選択** - 複数の店舗から選択可能
- 📂 **カテゴリフィルター** - 定食、丼物、麺類などでフィルタリング
- 🛒 **商品選択** - 商品画像・名前・価格を表示
- 🎟️ **チケット購入** - 選択した商品のチケットを発行
- 📱 **QRコード表示** - チケットごとにQRコード生成・表示
- ⏰ **現在時刻表示** - ヘッダーに現在時刻をリアルタイム表示

### 管理者向け機能
- ✅ **商品管理** - 商品の登録・編集・削除・画像アップロード
- ✅ **店舗管理** - 店舗情報の登録・編集
- ✅ **カテゴリ管理** - カテゴリの登録・編集
- ✅ **在庫管理** - 在庫の一括管理・販売状態の切り替え

---

## 技術スタック

### バックエンド
- **FastAPI** - 高速なPython Webフレームワーク
- **SQLAlchemy** - ORM（Object-Relational Mapping）
- **MySQL** - データベース
- **Pydantic** - データバリデーション

### フロントエンド
- **React** - UIライブラリ
- **TypeScript** - 型安全なJavaScript
- **React Router** - ルーティング
- **Axios** - HTTP通信
- **QRCode.react** - QRコード生成

### その他
- **Docker** - コンテナ化
- **Docker Compose** - 複数コンテナの管理

---

## プロジェクト構成

```
food_ticket/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPIアプリケーションのエントリーポイント
│   │   ├── database.py                # データベース接続設定
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── store.py               # 店舗モデル
│   │   │   ├── category.py            # カテゴリモデル
│   │   │   ├── product.py             # 商品モデル
│   │   │   ├── inventory.py           # 在庫モデル
│   │   │   └── ticket.py              # チケットモデル
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── store.py               # 店舗スキーマ
│   │   │   ├── category.py            # カテゴリスキーマ
│   │   │   ├── product.py             # 商品スキーマ
│   │   │   ├── inventory.py           # 在庫スキーマ
│   │   │   ├── ticket.py              # チケットスキーマ
│   │   │   └── admin.py               # 管理者用スキーマ
│   │   └── routers/
│   │       ├── __init__.py
│   │       ├── stores.py              # 店舗API
│   │       ├── categories.py          # カテゴリAPI
│   │       ├── products.py            # 商品API
│   │       ├── inventories.py         # 在庫API
│   │       ├── tickets.py             # チケットAPI
│   │       └── admin.py               # 管理者API
│   ├── uploads/                       # アップロード画像保存ディレクトリ
│   ├── requirements.txt               # Python依存パッケージ
│   └── Dockerfile
├── frontend/
│   ├── public/
│   │   └── images/                    # 商品画像
│   ├── src/
│   │   ├── App.tsx                    # メインアプリケーション
│   │   ├── App.css
│   │   ├── index.tsx
│   │   ├── index.css
│   │   ├── components/
│   │   │   ├── Header.tsx             # ヘッダーコンポーネント
│   │   │   ├── Header.css
│   │   │   ├── StoreSelector.tsx      # 店舗選択
│   │   │   ├── StoreSelector.css
│   │   │   ├── CategoryFilter.tsx     # カテゴリフィルター
│   │   │   ├── CategoryFilter.css
│   │   │   ├── ProductList.tsx        # 商品一覧
│   │   │   ├── ProductList.css
│   │   │   ├── TicketList.tsx         # チケット一覧
│   │   │   ├── TicketList.css
│   │   │   └── admin/
│   │   │       ├── StoreManager.tsx
│   │   │       ├── StoreManager.css
│   │   │       ├── CategoryManager.tsx
│   │   │       ├── CategoryManager.css
│   │   │       ├── ProductManager.tsx
│   │   │       ├── ProductManager.css
│   │   │       ├── InventoryManager.tsx
│   │   │       └── InventoryManager.css
│   │   ├── pages/
│   │   │   ├── UserPage.tsx           # ユーザー画面
│   │   │   ├── UserPage.css
│   │   │   ├── AdminPage.tsx          # 管理者画面
│   │   │   └── AdminPage.css
│   │   └── api/
│   │       └── client.ts              # API通信クライアント
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## セットアップ

### 前提条件
- Docker Desktop がインストールされていること
- Git がインストールされていること

### 起動手順

1. **リポジトリのクローン**
```bash
git clone <repository-url>
cd food_ticket
```

2. **Docker Composeで起動**
```bash
docker-compose up --build
```

3. **アクセス**
- フロントエンド: http://localhost:3000
- バックエンドAPI: http://localhost:8000
- API仕様書（Swagger UI）: http://localhost:8000/docs

### 初期データの投入

初回起動時、以下の初期データが自動的に作成されます：

- **店舗**: A食堂、B食堂
- **カテゴリ**: 定食、丼物、麺類、カレー、サイドメニュー
- **商品**: 各店舗に複数の商品（画像付き）
- **在庫**: 各商品の初期在庫

---

## 使い方

### ユーザー画面

1. **店舗選択** (`/`)
   - トップページで利用する店舗を選択
   - A食堂またはB食堂から選択可能

2. **商品選択**
   - カテゴリでフィルタリング
   - 商品カードをクリックしてチケット購入

3. **チケット管理**
   - 購入したチケットの一覧表示
   - 各チケットのQRコード表示
   - 使用済みチケットは自動的に非表示

### 管理画面

管理画面 (`/admin`) では以下の機能が利用できます：

- **店舗管理** (`/admin/stores`) - 店舗の追加・編集
- **カテゴリ管理** (`/admin/categories`) - カテゴリの追加・編集
- **商品管理** (`/admin/products`) - 商品の追加・編集・画像アップロード
- **在庫管理** (`/admin/inventory`) - 在庫の確認・更新、販売状態の切り替え

#### 店舗管理
- 新しい店舗の追加
- 既存店舗の編集

#### カテゴリ管理
- 新しいカテゴリの追加
- 既存カテゴリの編集

#### 商品管理
- 新しい商品の追加（基本情報 + 各店舗の在庫設定）
- 既存商品の編集
- 商品画像のアップロード

#### 在庫管理
- 店舗の全商品の在庫を一覧表示
- 在庫数の編集（インライン編集または+10/-10のクイック調整）
- 販売中/販売停止の切り替え
- カテゴリ別のフィルタリング
- 在庫アラート表示（10以下で警告、0で危険）

---

## API仕様

### ユーザー向けAPI

#### 店舗

**`GET /stores`** - 店舗一覧取得

レスポンス例:
```json
[
  {
    "store_id": 1,
    "store_name": "A食堂",
    "location": "本社1F"
  }
]
```

#### カテゴリ

**`GET /categories`** - カテゴリ一覧取得

レスポンス例:
```json
[
  {
    "category_id": 1,
    "category_name": "定食"
  }
]
```

#### 商品

**`GET /products?store_id={store_id}&category_id={category_id}`** - 商品一覧取得

レスポンス例:
```json
[
  {
    "product_id": 1,
    "product_name": "ハンバーグ定食",
    "category_name": "定食",
    "standard_price": 850,
    "image_url": "/images/hamburg.jpg",
    "inventory_id": 10001,
    "current_stock": 50,
    "is_on_sale": true
  }
]
```

#### チケット

**`POST /tickets`** - チケット発行

リクエスト例:
```json
{
  "user_id": 1,
  "inventory_id": 10001
}
```

レスポンス例:
```json
{
  "ticket_id": 100,
  "user_id": 1,
  "inventory_id": 10001,
  "product_name": "ハンバーグ定食",
  "store_name": "A食堂",
  "price": 850,
  "qr_code": "TICKET-100-USER-1",
  "issued_at": "2025-12-29T10:30:00",
  "is_used": false
}
```

**`GET /tickets?user_id={user_id}`** - チケット一覧取得

**`PUT /tickets/{ticket_id}/use`** - チケット使用

---

### 管理画面API

#### 店舗管理

**`POST /admin/stores`** - 店舗作成

リクエスト:
```json
{
  "store_name": "C食堂",
  "location": "本社2F"
}
```

**`PUT /admin/stores/{store_id}`** - 店舗更新

#### カテゴリ管理

**`POST /admin/categories`** - カテゴリ作成

リクエスト:
```json
{
  "category_name": "デザート"
}
```

**`PUT /admin/categories/{category_id}`** - カテゴリ更新

#### 商品管理

**`POST /admin/products`** - 商品作成（在庫も同時作成）

リクエスト:
```json
{
  "product_name": "親子丼",
  "category_id": 2,
  "standard_price": 750,
  "image_url": "/images/oyakodon.jpg",
  "inventories": [
    {
      "store_id": 1,
      "current_stock": 30,
      "is_on_sale": true
    },
    {
      "store_id": 2,
      "current_stock": 25,
      "is_on_sale": true
    }
  ]
}
```

**`PUT /admin/products/{product_id}`** - 商品更新

**`DELETE /admin/products/{product_id}`** - 商品削除

#### 画像アップロード

**`POST /admin/upload-image`** - 画像アップロード

リクエスト: `multipart/form-data`
- `file`: 画像ファイル（JPEG, PNG）

レスポンス:
```json
{
  "image_url": "/images/uploaded_image.jpg"
}
```

#### 在庫管理

**`GET /admin/inventories`** - 在庫一覧取得

クエリパラメータ:
- `store_id` (required): 店舗ID
- `category_id` (optional): カテゴリIDでフィルター

レスポンス:
```json
[
  {
    "inventory_id": 10001,
    "store_id": 1,
    "product_id": 1,
    "product_name": "ハンバーグ定食",
    "category_name": "定食",
    "standard_price": 850,
    "image_url": "/images/hamburg.jpg",
    "current_stock": 45,
    "is_on_sale": true
  }
]
```

**`PUT /admin/inventories/{store_id}/{product_id}/stock`** - 在庫数更新

リクエスト:
```json
{
  "current_stock": 50
}
```

レスポンス:
```json
{
  "status": "success",
  "message": "在庫数を更新しました"
}
```

**`PATCH /admin/inventories/{store_id}/{product_id}/sale-status`** - 販売状態切り替え

リクエスト:
```json
{
  "is_on_sale": false
}
```

レスポンス:
```json
{
  "status": "success",
  "message": "販売状態を 販売停止 に変更しました"
}
```

---

## 開発履歴

### 2025-12-28: プロジェクト開始

#### 実装内容
- **プロジェクトの初期化**
  - Docker環境構築（backend, frontend, MySQL）
  - FastAPIプロジェクト作成
  - React + TypeScriptプロジェクト作成

- **データベース設計**
  - テーブル定義: stores, categories, products, inventories, tickets
  - SQLAlchemyモデル作成
  - 初期データ投入機能

- **バックエンドAPI実装**
  - 店舗API (`/stores`)
  - カテゴリAPI (`/categories`)
  - 商品API (`/products`)
  - チケットAPI (`/tickets`)
  - 在庫管理ロジック

- **フロントエンド実装**
  - ユーザー画面
    - 店舗選択
    - カテゴリフィルター
    - 商品一覧表示
    - チケット購入機能
    - チケット一覧・QRコード表示

#### 技術的な特徴
- FastAPI + SQLAlchemy でRESTful API構築
- React Hooksを活用したステート管理
- TypeScriptによる型安全な開発
- Docker Composeによるコンテナ統合管理

---

### 2025-12-29: 管理画面の実装

#### 実装内容
- **バックエンド管理者API**
  - `backend/app/schemas/admin.py` に管理者用スキーマを追加
  - `backend/app/routers/admin.py` に管理者用APIエンドポイントを追加
  
- **フロントエンド管理画面**
  - `frontend/src/pages/AdminPage.tsx` を作成
  - `frontend/src/components/admin/StoreManager.tsx` を作成
  - `frontend/src/components/admin/CategoryManager.tsx` を作成
  - `frontend/src/components/admin/ProductManager.tsx` を作成

#### 機能詳細
- **店舗管理**: 店舗の作成・編集（店舗名、所在地）
- **カテゴリ管理**: カテゴリの作成・編集（カテゴリ名）
- **商品管理**:
  - 商品の作成・編集・削除
  - 商品画像のアップロード機能
  - 各店舗の在庫情報を一括設定
  - 販売状態（販売中/販売停止）の切り替え

#### 技術的な特徴
- 画像アップロードは `multipart/form-data` を使用
- 商品作成時に複数店舗の在庫を同時に設定可能
- レスポンシブデザイン対応

---

### 2025-12-29:  現在時刻表示機能の実装

#### 実装内容
- **Headerコンポーネントの拡張**
  - `frontend/src/components/Header.tsx` に現在時刻表示機能を追加
  - 1秒ごとに時刻を更新する `setInterval` を実装

#### 機能詳細
- ヘッダー右側に現在時刻をリアルタイム表示
- フォーマット: `YYYY年MM月DD日 HH:MM:SS`
- 日本語表記で見やすく表示

#### 技術的な特徴
- React Hooks (`useState`, `useEffect`) を活用
- コンポーネントのアンマウント時に `clearInterval` でクリーンアップ

---

### 2026-01-02: 在庫管理画面の実装

#### 実装内容
- **バックエンドの在庫管理API**
  - `backend/app/schemas/admin.py` に在庫管理用スキーマを追加
  - `backend/app/routers/admin.py` に在庫管理APIエンドポイントを追加
- **フロントエンドの在庫管理画面**
  - `frontend/src/components/admin/InventoryManager.tsx` を作成
  - `frontend/src/components/admin/InventoryManager.css` を作成
  - `frontend/src/pages/AdminPage.tsx` に在庫管理へのルーティングを追加

#### 機能詳細
- **在庫一覧表示** - 店舗別・カテゴリ別に在庫を表示
- **在庫数の編集** - リアルタイムで在庫数を更新
- **クイック調整** - +10/-10ボタンで素早く在庫を増減
- **販売状態の切り替え** - 販売中/販売停止をワンクリックで切り替え
- **カテゴリフィルター** - カテゴリごとに在庫を絞り込み表示
- **在庫アラート** - 在庫が10以下の商品を黄色、0の商品を赤色で警告表示

---

## 今後の開発予定

### 優先度: 高
- **チケット使用画面** - QRコードスキャン機能（カメラ使用）
- **売上レポート** - 日次・月次の売上集計と可視化

### 優先度: 中
- **ユーザー認証** - ログイン機能・権限管理
- **通知機能** - チケット発行通知・在庫アラート
- **検索機能** - 商品名での検索

### 優先度: 低
- **多言語対応** - 英語・中国語などの対応
- **テーマ切り替え** - ダークモード対応
- **モバイルアプリ化** - React Nativeでのネイティブアプリ化

---

## ライセンス

MIT License

---

## 作成者

nununuma-sabu

---

## 備考

- 本プロジェクトは学習・デモ目的で作成されています
- 本番環境での使用には、セキュリティ強化（認証・認可）が必要です
- 画像ファイルは `frontend/public/images/` に配置してください