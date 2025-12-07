#!/usr/bin/env python3
"""
pink_noise_generator.py

ピンクノイズ（1/fノイズ）をWAVファイルとして生成するスクリプトです。
周波数成分のパワーが周波数に反比例するため、ホワイトノイズよりも
聴覚的に「柔らかい」「低音が効いた」音になります。

例:
    python pink_noise_generator.py           # デフォルト(10分, 音量0.3)
    python pink_noise_generator.py -d 1800   # 30分
    python pink_noise_generator.py -d 600 -v 0.2 -o relax_noise.wav
"""

import argparse
import wave
import numpy as np
from pathlib import Path


def generate_pink_noise(
    duration_sec: int,
    volume: float = 0.3,
    sample_rate: int = 44100,
    channels: int = 2,
) -> np.ndarray:
    """
    ピンクノイズのサンプルデータを生成する。
    （FFTを用いてホワイトノイズに1/sqrt(f)フィルタを適用する手法）
    """
    n_samples = int(duration_sec * sample_rate)

    # 1. ホワイトノイズの生成（平均0, 分散1）
    # shape: (n_samples, channels)
    white_noise = np.random.randn(n_samples, channels)

    # 2. FFT（高速フーリエ変換）を実行して周波数領域へ
    # axis=0 (時間軸) に対して実行
    spectrum = np.fft.rfft(white_noise, axis=0)

    # 3. 1/fフィルタの適用
    # パワースペクトルが 1/f なので、振幅スペクトルは 1/sqrt(f) でスケーリング
    # 周波数インデックスを取得 (0は直流成分なので除外して計算)
    freqs = np.arange(1, spectrum.shape[0])
    
    # スケール係数の計算 (1 / sqrt(f))
    scale = 1.0 / np.sqrt(freqs)
    
    # 放送(Broadcast)のために次元を合わせる (freqs_len, 1)
    scale = scale.reshape(-1, 1)

    # 直流成分(index 0)以外に適用
    spectrum[1:] *= scale

    # 4. IFFT（逆高速フーリエ変換）で時間領域へ戻す
    pink_noise = np.fft.irfft(spectrum, n=n_samples, axis=0)

    # 5. 正規化と音量調整
    # フィルタリングにより振幅が変わっているため、一度 -1.0〜1.0 に正規化する
    max_val = np.max(np.abs(pink_noise))
    if max_val > 0:
        pink_noise /= max_val

    # 音量適用
    volume = float(volume)
    if volume < 0:
        volume = 0.0
    if volume > 1.0:
        volume = 1.0

    # int16の最大値に合わせてスケーリング
    max_int16 = np.iinfo(np.int16).max
    pink_noise = pink_noise * (max_int16 * volume)

    return pink_noise.astype(np.int16)


def write_wav(filename: str, data: np.ndarray, sample_rate: int = 44100):
    """
    numpy配列の音声データをWAVファイルに書き込む。
    data: shape (n_samples, channels), dtype=int16
    """
    n_samples, channels = data.shape
    sampwidth = 2  # int16 = 2バイト

    with wave.open(filename, "wb") as wf:
        wf.setnchannels(channels)
        wf.setsampwidth(sampwidth)
        wf.setframerate(sample_rate)
        wf.writeframes(data.tobytes())


def main():
    parser = argparse.ArgumentParser(description="ピンクノイズWAVファイル生成スクリプト")
    parser.add_argument(
        "-d",
        "--duration",
        type=int,
        default=600,
        help="再生時間（秒）: デフォルト600秒(10分)",
    )
    parser.add_argument(
        "-v",
        "--volume",
        type=float,
        default=0.3,
        help="音量(0.0〜1.0 推奨: 0.2〜0.4)",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=str,
        default="pink_noise.wav",
        help="出力ファイル名（.wav）",
    )
    parser.add_argument(
        "-r",
        "--samplerate",
        type=int,
        default=44100,
        help="サンプリングレート(Hz) デフォルト44100",
    )
    parser.add_argument(
        "-c",
        "--channels",
        type=int,
        default=2,
        help="チャンネル数(1:モノラル, 2:ステレオ) デフォルト2",
    )

    args = parser.parse_args()

    out_path = Path(args.output)
    print(f"ピンクノイズ生成中...  duration={args.duration}s, volume={args.volume}, "
          f"samplerate={args.samplerate}Hz, channels={args.channels}")
    print("処理内容: FFT -> 1/fフィルタ -> IFFT")
    
    data = generate_pink_noise(
        duration_sec=args.duration,
        volume=args.volume,
        sample_rate=args.samplerate,
        channels=args.channels,
    )

    print(f"書き込み中: {out_path.resolve()}")
    write_wav(str(out_path), data, sample_rate=args.samplerate)

    print("完了しました。ピンクノイズはホワイトノイズより低音が響くため、")
    print("スピーカーやヘッドフォンで再生する際は低音の振動に注意してください。")


if __name__ == "__main__":
    main()
