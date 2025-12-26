from deepface import DeepFace
import json


def test_analyze():
    img_path = "test_image.jpg"
    try:
        results = DeepFace.analyze(img_path, actions=["age", "gender"])

        # 取得した結果を一度辞書として取り出し、数値をキャストする
        res = results[0]
        serializable_res = {
            "age": int(res["age"]),  # float32 -> int に変換
            "dominant_gender": res["dominant_gender"],
            "gender": {
                k: float(v) for k, v in res["gender"].items()
            },  # 各性別の確率も変換
        }

        print(json.dumps(serializable_res, indent=2))
        # ------------------

    except Exception as e:
        print(f"エラーが発生しました: {e}")


if __name__ == "__main__":
    test_analyze()
