# tests/test_main.py
# -*- coding: utf-8 -*-
import pytest
from datetime import datetime


class TestRootEndpoint:
    """ルートエンドポイントのテスト"""

    def test_read_root(self, client):
        """GET / が正常に動作するか"""
        response = client.get("/")
        assert response.status_code == 200
        assert response.json() == {"message": "Vending Machine API is running"}


class TestStoreLogin:
    """店舗ログインAPIのテスト"""

    def test_login_success(self, client):
        """正しい店舗ID・パスワードでログイン成功"""
        response = client.post(
            "/login/store", json={"store_id": 1, "password": "password123"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["store_info"]["id"] == 1

    def test_login_wrong_password(self, client):
        """間違ったパスワードでログイン失敗"""
        response = client.post(
            "/login/store", json={"store_id": 1, "password": "wrong_password"}
        )
        assert response.status_code == 401

    def test_login_nonexistent_store(self, client):
        """存在しない店舗IDでログイン失敗"""
        response = client.post(
            "/login/store", json={"store_id": 9999, "password": "any_password"}
        )
        assert response.status_code == 401


class TestGetStoreProducts:
    """店舗商品取得APIのテスト"""

    def test_get_products_success(self, client):
        """販売中の商品一覧を正常に取得"""
        response = client.get("/stores/1/products")

        assert response.status_code == 200
        products = response.json()
        assert len(products) == 1
        assert products[0]["product_id"] == 1

    def test_get_products_empty_store(self, client):
        """在庫がない店舗の場合、空のリストを返す"""
        response = client.get("/stores/999/products")
        assert response.status_code == 200
        assert response.json() == []


class TestCustomerAttribute:
    """顧客属性登録APIのテスト"""

    def test_create_customer_attribute_success(self, client):
        """顧客属性を正常に登録"""
        response = client.post(
            "/customer-attributes",
            json={
                "store_id": 1,
                "age_group": "20-29",
                "gender": "male",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "attribute_id" in data
        assert data["store_id"] == 1


class TestCreateOrder:
    """注文作成APIのテスト"""

    def test_create_order_success(self, client, db_session):
        """正常に注文を作成し、在庫が減る"""
        # まず顧客属性を作成
        attr_response = client.post(
            "/customer-attributes",
            json={"store_id": 1, "age_group": "20-29", "gender": "male"},
        )
        assert attr_response.status_code == 200
        attribute_id = attr_response.json()["attribute_id"]

        # 注文を作成
        response = client.post(
            "/orders",
            json={
                "store_id": 1,
                "attribute_id": attribute_id,
                "items": [{"product_id": 1, "quantity": 2, "unit_price": 800}],
                "total_amount": 1600,
                "payment_method": "cash",
                "take_out_type": "dine_in",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "order_id" in data

    def test_create_order_insufficient_stock(self, client):
        """在庫不足の場合エラーを返す"""
        attr_response = client.post(
            "/customer-attributes",
            json={"store_id": 1, "age_group": "20-29", "gender": "male"},
        )
        assert attr_response.status_code == 200
        attribute_id = attr_response.json()["attribute_id"]

        response = client.post(
            "/orders",
            json={
                "store_id": 1,
                "attribute_id": attribute_id,
                "items": [{"product_id": 1, "quantity": 100, "unit_price": 800}],
                "total_amount": 80000,
                "payment_method": "cash",
                "take_out_type": "dine_in",
            },
        )

        assert response.status_code == 400
