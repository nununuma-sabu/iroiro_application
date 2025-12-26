# scripts/create_db.py
import sys
import os

# 1. 【最優先】まずプロジェクトのルートディレクトリをパスに追加する
# これにより、scriptsフォルダの中にいても1つ上の app フォルダが見えるようになります
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

# 2. パスが通った後に、app 配下のモジュールをインポートする
from app.db.session import engine
from app.db.base import Base
from app.db import models  # テーブル情報をBaseに認識させるために必要


def create_db():
    print("データベースのテーブルを作成しています...")
    try:
        # すべてのテーブルを作成
        Base.metadata.create_all(bind=engine)
        print("成功: 全てのテーブルが正常に作成されました。")
    except Exception as e:
        print(f"エラーが発生しました: {e}")


if __name__ == "__main__":
    create_db()
