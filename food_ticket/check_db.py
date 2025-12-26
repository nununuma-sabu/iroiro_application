# check_db.py
from sqlalchemy import inspect
from database import engine

# データベースの状態を検査するオブジェクトを作成
inspector = inspect(engine)

# 全てのテーブル名を取得して表示
tables = inspector.get_table_names()

if tables:
    print("作成されているテーブル一覧:")
    for table in tables:
        print(f" - {table}")
else:
    print("テーブルは見つかりませんでした。")
