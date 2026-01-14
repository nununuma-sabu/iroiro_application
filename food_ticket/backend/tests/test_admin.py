# tests/test_admin.py
# -*- coding: utf-8 -*-
import pytest
from app.db import models


class TestCategoryAPI:
    """カテゴリ管理APIのテスト"""

    def test_get_categories(self, client):
        """カテゴリ一覧を取得"""
        response = client.get("/admin/categories")
        assert response.status_code == 200
        categories = response.json()
        assert len(categories) >= 1
        assert categories[0]["category_name"] == "Teishoku"

    def test_create_category(self, client):
        """新しいカテゴリを作成"""
        # ユニークな名前を使用して重複を回避
        import time

        category_name = f"drinks_{int(time.time()*1000)}"

        response = client.post(
            "/admin/categories", json={"category_name": category_name}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["category_name"] == category_name
        assert "category_id" in data


class TestProductAPI:
    """商品管理APIのテスト"""

    def test_get_products(self, client):
        """商品一覧を取得"""
        response = client.get("/admin/products")
        assert response.status_code == 200
        products = response.json()
        assert len(products) >= 1

    def test_create_product(self, client):
        """新しい商品を作成"""
        response = client.post(
            "/admin/products",
            json={
                "product_name": "new_product",
                "category_id": 1,
                "standard_price": 1000,
                "image_url": "/images/new.jpg",
                "initial_stock": 20,
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["product_name"] == "new_product"
        assert data["standard_price"] == 1000


class TestInventoryAPI:
    """在庫管理APIのテスト"""

    def test_get_inventories(self, client):
        """在庫一覧を取得"""
        response = client.get("/admin/inventories? store_id=1")
        assert response.status_code == 200
        inventories = response.json()
        assert len(inventories) >= 1
        assert "current_stock" in inventories[0]
        assert inventories[0]["current_stock"] >= 0
