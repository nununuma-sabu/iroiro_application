def lucas_lehmer(p: int) -> bool:
    """
    リュカ・レーマー判定法を用いて、メルセンヌ数 M_p = 2^p - 1 が
    素数かどうかを判定する。

    Args:
        p (int): メルセンヌ数の指数 (M_p の p)。
                 ※数学的要件として、pは素数である必要があります。

    Returns:
        bool: M_p が素数なら True, そうでなければ False

    Raises:
        ValueError: p が 2未満の場合
    """
    if p < 2:
        raise ValueError("p must be greater than or equal to 2")

    # M_2 = 3 は素数
    if p == 2:
        return True

    # pが偶数（2以外）の場合、M_pは必ず合成数となるためFalse
    if p % 2 == 0:
        return False

    # メルセンヌ数 M_p = 2^p - 1
    m_p = (1 << p) - 1

    # 初期値 s_0 = 4
    s = 4

    # 漸化式 s_{i+1} = (s_i^2 - 2) mod M_p を p-2回繰り返す
    for _ in range(p - 2):
        s = (s * s - 2) % m_p

    return s == 0
