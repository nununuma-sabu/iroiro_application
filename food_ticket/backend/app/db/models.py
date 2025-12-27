# app/db/models.py
import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship

# 同階層の base.py から Base を読み込む
from app.db.base import Base


# --- 地域マスタ ---
class Prefecture(Base):
    __tablename__ = "prefectures"
    prefecture_id = Column(Integer, primary_key=True)
    prefecture_name = Column(String, nullable=False)

    municipalities = relationship("Municipality", back_populates="prefecture")


class Municipality(Base):
    __tablename__ = "municipalities"
    municipality_id = Column(Integer, primary_key=True)
    prefecture_id = Column(Integer, ForeignKey("prefectures.prefecture_id"))
    municipality_name = Column(String, nullable=False)

    prefecture = relationship("Prefecture", back_populates="municipalities")
    stores = relationship("Store", back_populates="municipality")


# --- 店舗・商品マスタ ---
class Store(Base):
    __tablename__ = "stores"
    store_id = Column(Integer, primary_key=True, index=True)
    municipality_id = Column(Integer, ForeignKey("municipalities.municipality_id"))
    store_name = Column(String, nullable=False)
    address_detail = Column(String)
    password_hash = Column(String, nullable=False)

    municipality = relationship("Municipality", back_populates="stores")
    inventories = relationship("StoreInventory", back_populates="store")
    attributes = relationship("CustomerAttribute", back_populates="store")
    orders = relationship("Order", back_populates="store")


class Category(Base):
    __tablename__ = "categories"
    category_id = Column(Integer, primary_key=True)
    category_name = Column(String, nullable=False)

    products = relationship("Product", back_populates="category")


class Product(Base):
    __tablename__ = "products"
    product_id = Column(Integer, primary_key=True)
    category_id = Column(Integer, ForeignKey("categories.category_id"))
    product_name = Column(String, nullable=False)
    standard_price = Column(Integer, nullable=False)
    image_url = Column(String)

    category = relationship("Category", back_populates="products")
    inventories = relationship("StoreInventory", back_populates="product")
    order_details = relationship("OrderDetail", back_populates="product")


# --- 在庫管理 ---
class StoreInventory(Base):
    __tablename__ = "store_inventories"
    store_id = Column(Integer, ForeignKey("stores.store_id"), primary_key=True)
    product_id = Column(Integer, ForeignKey("products.product_id"), primary_key=True)
    current_stock = Column(Integer, default=0)
    is_on_sale = Column(Boolean, default=True)

    store = relationship("Store", back_populates="inventories")
    product = relationship("Product", back_populates="inventories")


# --- 分析・売上 ---
class CustomerAttribute(Base):
    __tablename__ = "customer_attributes"
    attribute_id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.store_id"))
    age_group = Column(String)
    gender = Column(String)
    scanned_at = Column(DateTime, default=datetime.datetime.now)

    store = relationship("Store", back_populates="attributes")
    orders = relationship("Order", back_populates="attribute")


class Order(Base):
    __tablename__ = "orders"
    order_id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.store_id"))
    attribute_id = Column(Integer, ForeignKey("customer_attributes.attribute_id"))
    ordered_at = Column(DateTime, default=datetime.datetime.now)
    total_amount = Column(Integer)
    payment_method = Column(String)
    take_out_type = Column(String)

    store = relationship("Store", back_populates="orders")
    attribute = relationship("CustomerAttribute", back_populates="orders")
    order_details = relationship("OrderDetail", back_populates="order")


class OrderDetail(Base):
    __tablename__ = "order_details"
    detail_id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("orders.order_id"))
    product_id = Column(Integer, ForeignKey("products.product_id"))
    quantity = Column(Integer)
    unit_price = Column(Integer)

    order = relationship("Order", back_populates="order_details")
    product = relationship("Product", back_populates="order_details")
