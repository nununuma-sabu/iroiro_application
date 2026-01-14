# tests/test_models.py
import pytest
from datetime import datetime
from app.db import models
from app.core.security import get_password_hash, verify_password


class TestStoreModel:
    """Storeモデルのテ��ト"""

    def test_create_store(self, db_session):
        """店舗を作成できる"""
        # 都道府県と市町村を先に作成
        prefecture = models.Prefecture(prefecture_id=1, prefecture_name="東京都")
        db_session.add(prefecture)

        municipality = models.Municipality(
            municipality_id=1, prefecture_id=1, municipality_name="渋谷区"
        )
        db_session.add(municipality)
        db_session.commit()

        # 店舗を作成
        store = models.Store(
            store_id=100,
            municipality_id=1,
            store_name="渋谷店",
            address_detail="渋谷1-1-1",
            password_hash=get_password_hash("test_pass"),
        )
        db_session.add(store)
        db_session.commit()

        # 取得して確認
        saved_store = db_session.query(models.Store).filter_by(store_id=100).first()
        assert saved_store is not None
        assert saved_store.store_name == "渋谷店"
        assert verify_password("test_pass", saved_store.password_hash)


class TestProductModel:
    """Productモデルのテスト"""

    def test_create_product_with_category(self, db_session):
        """カテゴリ付きの商品を作成"""
        category = models.Category(category_id=10, category_name="ドリンク")
        db_session.add(category)
        db_session.commit()

        product = models.Product(
            product_id=200,
            category_id=10,
            product_name="コーラ",
            standard_price=150,
            image_url="/images/cola.jpg",
        )
        db_session.add(product)
        db_session.commit()

        saved_product = (
            db_session.query(models.Product).filter_by(product_id=200).first()
        )
        assert saved_product.product_name == "コーラ"
        assert saved_product.category.category_name == "ドリンク"


class TestOrderModel:
    """Orderモデルのテスト"""

    def test_create_order_with_details(self, db_session, seed_test_data):
        """注文と注文明細を作成"""
        # 顧客属性
        attr = models.CustomerAttribute(store_id=1, age_group="30-39", gender="女性")
        db_session.add(attr)
        db_session.flush()

        # 注文
        order = models.Order(
            store_id=1,
            attribute_id=attr.attribute_id,
            total_amount=1500,
            payment_method="カード",
            take_out_type="持ち帰り",
        )
        db_session.add(order)
        db_session.flush()

        # 注文明細
        detail = models.OrderDetail(
            order_id=order.order_id, product_id=1, quantity=2, unit_price=750
        )
        db_session.add(detail)
        db_session.commit()

        # 確認 (order_details が正しいrelationship名)
        saved_order = (
            db_session.query(models.Order).filter_by(order_id=order.order_id).first()
        )
        assert saved_order.total_amount == 1500
        assert len(saved_order.order_details) == 1  # ✅ details → order_details
        assert saved_order.order_details[0].quantity == 2
