import pytest
import sys
import os

# srcディレクトリへのパスを通す（簡易的な方法）
sys.path.append(os.path.join(os.path.dirname(__file__), "../src"))

from prime_utils import lucas_lehmer

# --- テストデータ ---
# (p, 期待される結果)
TEST_CASES = [
    (2, True),  # M_2 = 3 (素数)
    (3, True),  # M_3 = 7 (素数)
    (5, True),  # M_5 = 31 (素数)
    (7, True),  # M_7 = 127 (素数)
    (11, False),  # M_11 = 2047 = 23 * 89 (合成数)
    (13, True),  # M_13 = 8191 (素数)
    (17, True),
    (19, True),
    (23, False),  # M_23 (合成数)
    (31, True),  # M_31 (素数)
    (61, True),  # M_61 (素数: かなり大きい数)
]


@pytest.mark.parametrize("p, expected", TEST_CASES)
def test_lucas_lehmer_basic(p, expected):
    """基本的な素数・合成数の判定テスト"""
    result = lucas_lehmer(p)
    assert result == expected, f"Failed for p={p}. Expected {expected}, got {result}"


def test_lucas_lehmer_invalid_input():
    """無効な入力に対する例外送出テスト"""
    with pytest.raises(ValueError):
        lucas_lehmer(1)

    with pytest.raises(ValueError):
        lucas_lehmer(-5)


def test_performance_check():
    """
    CI環境で極端に遅くなっていないかを確認するスモークテスト。
    M_127 (39桁) 程度の計算は一瞬で終わるはず。
    """
    assert lucas_lehmer(127) is True
