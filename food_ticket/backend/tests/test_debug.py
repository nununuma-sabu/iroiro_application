# tests/test_debug.py
# -*- coding: utf-8 -*-
import pytest


def test_seed_data_exists(seed_test_data, db_session):
    """シードデータが正しく作成されているか確認"""
    from app.db import models

    # カテゴリを確認
    category = db_session.query(models.Category).filter_by(category_id=1).first()
    assert category is not None, "Category not found!"
    print(f"Category name: {category.category_name}")

    # 店舗を確認
    store = db_session.query(models.Store).filter_by(store_id=1).first()
    assert store is not None, "Store not found!"
    print(f"Store name: {store.store_name}")

    # 在庫を確認
    inventory = (
        db_session.query(models.StoreInventory)
        .filter_by(store_id=1, product_id=1)
        .first()
    )
    assert inventory is not None, "Inventory not found!"
    print(f"Inventory stock: {inventory.current_stock}")
