# pink_noise_generator.py

ピンクノイズ（1/f ノイズ）を WAV ファイルとして生成する Python スクリプトです。
ホワイトノイズよりも高音が抑えられ、低音寄りで「柔らかい」聞こえ方になるのが特徴です。

---

## 概要

`pink_noise_generator.py` は、FFT ベースの 1/f フィルタを用いてピンクノイズを生成し、16bit PCM の WAV ファイルとして保存するツールです。

想定している用途の例:

* 作業用／睡眠用 BGM のベース音源
* スピーカーやヘッドフォンなどオーディオ機器の動作確認
* 信号処理・音響関連の学習用サンプル

---

## 特徴

* **ピンクノイズ（1/f ノイズ）の生成**
  周波数成分のパワーが周波数に反比例するよう調整されたノイズを生成します。

* **WAV 形式で出力**
  16bit PCM の WAV ファイルとして保存され、多くのプレイヤーでそのまま再生できます。

* **シンプルなコマンドラインインターフェース**
  再生時間・音量・サンプリングレート・チャンネル数・出力ファイル名をオプションで指定できます。

* **モノラル／ステレオ対応**
  `-c/--channels` で 1（モノラル）または 2（ステレオ）を選択可能です。

---

## 必要要件

* **Python**

  * Python 3.8 以降（目安）

* **ライブラリ**

  * 標準ライブラリ
    `argparse`, `wave`, `pathlib`
  * 外部ライブラリ
    `numpy`

---

## インストール

1. Python をインストール（未インストールの場合）。

2. 必要なライブラリをインストールします。

   ```bash
   pip install numpy
   ```

3. 本スクリプト `pink_noise_generator.py` を任意のディレクトリに配置します。

---

## 使い方

### 基本的な実行

デフォルト設定（10 分 = 600 秒、音量 0.3、サンプリングレート 44100 Hz、ステレオ、出力ファイル名 `pink_noise.wav`）でピンクノイズを生成します。

```bash
python pink_noise_generator.py
```

### 再生時間を指定して実行

例: 30 分（1800 秒）のピンクノイズを生成する場合:

```bash
python pink_noise_generator.py -d 1800
```

### ヘルプの表示

利用可能なオプション一覧を確認できます。

```bash
python pink_noise_generator.py -h
# または
python pink_noise_generator.py --help
```

---

## オプションの指定例

### 音量と出力ファイル名を指定

10 分、音量 0.2、出力ファイル名 `relax_noise.wav` で生成する例:

```bash
python pink_noise_generator.py -d 600 -v 0.2 -o relax_noise.wav
```

### モノラル出力（1 チャンネル）

```bash
python pink_noise_generator.py -c 1 -o pink_mono.wav
```

### 高サンプリングレート（96 kHz）で生成

```bash
python pink_noise_generator.py -r 96000 -o pink_96k.wav
```

### 短時間＆高音量のテストノイズ（10 秒）

> ⚠ 音量 0.8 はかなり大きいため、再生機器側の音量を十分に絞った状態での利用をおすすめします。

```bash
python pink_noise_generator.py -d 10 -v 0.8 -o pink_loud_test.wav
```

---

## コマンドライン引数

`main()` 内で定義されている引数は次の通りです。

| オプション                | 型       | デフォルト            | 説明                                            |
| -------------------- | ------- | ---------------- | --------------------------------------------- |
| `-d`, `--duration`   | `int`   | `600`            | 再生時間（秒）。例: `600` = 10 分                       |
| `-v`, `--volume`     | `float` | `0.3`            | 音量スケール（0.0〜1.0）。推奨: `0.2〜0.4`                 |
| `-o`, `--output`     | `str`   | `pink_noise.wav` | 出力ファイル名（拡張子 `.wav` を推奨）                       |
| `-r`, `--samplerate` | `int`   | `44100`          | サンプリングレート（Hz）。例: `44100`, `48000`, `96000` など |
| `-c`, `--channels`   | `int`   | `2`              | チャンネル数。`1`: モノラル, `2`: ステレオ                   |

---

## アルゴリズム詳細

### ピンクノイズ生成 (`generate_pink_noise`)

```python
def generate_pink_noise(
    duration_sec: int,
    volume: float = 0.3,
    sample_rate: int = 44100,
    channels: int = 2,
) -> np.ndarray:
    ...
```

処理の流れ:

1. **サンプル数の算出**

   ```python
   n_samples = int(duration_sec * sample_rate)
   ```

2. **ホワイトノイズの生成**

   ```python
   white_noise = np.random.randn(n_samples, channels)
   ```

   * 平均 0、分散 1 の正規乱数を用いてホワイトノイズを生成します。
   * 形状は `(n_samples, channels)` です。

3. **FFT（高速フーリエ変換）**

   ```python
   spectrum = np.fft.rfft(white_noise, axis=0)
   ```

   * 実数用 FFT (`rfft`) を使い、時間領域から周波数領域へ変換します。
   * `axis=0`（時間方向）に対して FFT を行います。

4. **1/f フィルタの適用**

   ```python
   freqs = np.arange(1, spectrum.shape[0])
   scale = 1.0 / np.sqrt(freqs)
   scale = scale.reshape(-1, 1)
   spectrum[1:] *= scale
   ```

   * 周波数インデックス `1, 2, 3, ...` それぞれに対して振幅を `1/√f` でスケーリングします。
   * これによりパワースペクトルが概ね `1/f` に比例するピンクノイズになります。
   * DC 成分（インデックス 0）はフィルタ適用対象外です。

5. **IFFT（逆高速フーリエ変換）で時間領域へ戻す**

   ```python
   pink_noise = np.fft.irfft(spectrum, n=n_samples, axis=0)
   ```

6. **正規化（-1.0〜1.0 範囲へ）**

   ```python
   max_val = np.max(np.abs(pink_noise))
   if max_val > 0:
       pink_noise /= max_val
   ```

   * 振幅の最大絶対値で割ることで、信号全体を -1.0〜1.0 の範囲に収めます。

7. **音量適用 & `int16` への変換**

   ```python
   volume = float(volume)
   if volume < 0:
       volume = 0.0
   if volume > 1.0:
       volume = 1.0

   max_int16 = np.iinfo(np.int16).max
   pink_noise = pink_noise * (max_int16 * volume)
   return pink_noise.astype(np.int16)
   ```

   * `volume` を 0.0〜1.0 にクリップしたうえで、`int16` のダイナミックレンジにスケーリングします。

### WAV 書き込み (`write_wav`)

```python
def write_wav(filename: str, data: np.ndarray, sample_rate: int = 44100):
    n_samples, channels = data.shape
    sampwidth = 2  # int16 = 2バイト

    with wave.open(filename, "wb") as wf:
        wf.setnchannels(channels)
        wf.setsampwidth(sampwidth)
        wf.setframerate(sample_rate)
        wf.writeframes(data.tobytes())
```

* `wave` モジュールを使って、16bit PCM の WAV ファイルを生成します。

---

## 注意事項

### メモリ使用量

* 本スクリプトは **全サンプルを一括でメモリに展開** して処理します。
* 再生時間、サンプリングレート、チャンネル数が増えるほどメモリ使用量も増加します。

  * 例: 44100 Hz・ステレオ・1 時間など長時間のノイズでは、数百 MB 程度のメモリを消費する可能性があります。
* ご利用の環境によっては、まず短い時間（数分程度）で動作を確認し、その後必要に応じて再生時間を伸ばしていくと安心です。

### 音量について

* ピンクノイズは低音成分が豊富で、耳や機器への負担になりやすい音です。
* `-v/--volume` が大きい状態で、再生機器側の音量が高いと、**聴覚へのダメージ** や **耳鳴り** の原因になる可能性があります。
* 利用時のポイント:

  * まずは `-v 0.2〜0.3` 程度の控えめな値から試す。
  * OS・アンプ・スピーカーなど再生機器側のボリュームも低めから少しずつ調整する。
  * 長時間連続で聴き続けないようにし、適度に休憩を入れる。
  * 低音の振動が大きいため、集合住宅などでは周囲への配慮も必要です。

---

## ライセンス

ライセンスはプロジェクト方針に合わせて選択できます。
例として MIT License を利用する場合は、次のような文面になります（`LICENSE` ファイルとして配置することを想定）。

```text
MIT License

Copyright (c) 20xx [Your Name]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
 
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

実際に利用する際は、著作権者名や年号などを適宜書き換えて使う形になります。
