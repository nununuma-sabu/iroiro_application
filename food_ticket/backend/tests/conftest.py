# tests/conftest.py
# -*- coding: utf-8 -*-
import sys
import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

# ✅ テスト環境であることを明示
os.environ["TESTING"] = "true"

# プロジェクトルートをパスに追加
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.main import app
from app.db.session import get_db
from app.db.base import Base
from app.db import models
from app.core.security import get_password_hash


# ✅ テスト用の完全に独立したインメモリデータベース
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """テスト用DBセッションを作成"""
    # テーブルを作成
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def seed_test_data(db_session):
    """テスト用の初期データを投入"""
    # 都道府県
    prefecture = models.Prefecture(prefecture_id=13, prefecture_name="Tokyo")
    db_session.add(prefecture)
    db_session.flush()

    # 市町村
    municipality = models.Municipality(
        municipality_id=13101, prefecture_id=13, municipality_name="Chiyoda"
    )
    db_session.add(municipality)
    db_session.flush()

    # 店舗
    store = models.Store(
        store_id=1,
        municipality_id=13101,
        store_name="Test Store",
        address_detail="Chiyoda 1-1-1",
        password_hash=get_password_hash("password123"),
    )
    db_session.add(store)
    db_session.flush()

    # カテゴリ
    category = models.Category(category_id=1, category_name="Teishoku")
    db_session.add(category)
    db_session.flush()

    # 商品
    product = models.Product(
        product_id=1,
        category_id=1,
        product_name="Test Teishoku",
        standard_price=800,
        image_url="/images/test.jpg",
    )
    db_session.add(product)
    db_session.flush()

    # 在庫
    inventory = models.StoreInventory(
        store_id=1, product_id=1, current_stock=10, is_on_sale=True
    )
    db_session.add(inventory)

    db_session.commit()

    return {"store_id": 1, "product_id": 1, "category_id": 1, "password": "password123"}


@pytest.fixture(scope="function")
def client(seed_test_data, db_session):
    """FastAPIテストクライアントを作成"""

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
