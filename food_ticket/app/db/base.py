# app/db/base.py
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """
    全てのDBモデルが継承する基底クラス
    SQLAlchemy 2.0 スタイル
    """

    pass
