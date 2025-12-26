from database import engine, Base
import models

# 起動時にテーブル作成
models.Base.metadata.create_all(bind=engine)
