import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import { createCustomerAttribute } from '../api/customer';
import type { CustomerAttributeCreate } from '../types/customer';

interface FaceRecognitionScreenProps {
  storeId: number;
  onAttributeRegistered: (attributeId: number) => void;
  onSkip: () => void;
}

const FaceRecognitionScreen: React.FC<FaceRecognitionScreenProps> = ({
  storeId,
  onAttributeRegistered,
  onSkip,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectionResult, setDetectionResult] = useState<{
    age: number;
    gender: string;
  } | null>(null);

  // モデルのロード
  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector. loadFromUri('/models');
        await faceapi.nets. ageGenderNet.loadFromUri('/models');
        setModelsLoaded(true);
        console.log('✅ Face detection models loaded');
      } catch (err) {
        console.error('Failed to load models:', err);
        setError('顔認証モデルの読み込みに失敗しました');
      }
    };
    loadModels();
  }, []);

  // カメラの起動
  useEffect(() => {
    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 720, height: 560 },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Camera access denied:', err);
        setError('カメラへのアクセスが拒否されました');
      }
    };

    if (modelsLoaded) {
      startVideo();
    }

    return () => {
      if (videoRef.current?. srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [modelsLoaded]);

  const getAgeGroup = (age: number): string => {
    if (age < 20) return '10代';
    if (age < 30) return '20代';
    if (age < 40) return '30代';
    if (age < 50) return '40代';
    if (age < 60) return '50代';
    return '60代以上';
  };

  const getGenderJapanese = (gender: string): string => {
    return gender === 'male' ? '男性' : '女性';
  };

  const detectFace = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setDetecting(true);
    setError(null);

    try {
      const detections = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withAgeAndGender();

      if (!detections) {
        setError('顔が検出されませんでした。カメラに顔を向けてください。');
        setDetecting(false);
        return;
      }

      const { age, gender } = detections;
      setDetectionResult({ age:  Math.round(age), gender });

      const canvas = canvasRef.current;
      const displaySize = {
        width: videoRef.current.videoWidth,
        height: videoRef.current. videoHeight,
      };
      faceapi.matchDimensions(canvas, displaySize);
      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resizedDetections);
      }

      await registerAttribute(age, gender);
    } catch (err) {
      console.error('Face detection error:', err);
      setError('顔認証に失敗しました');
      setDetecting(false);
    }
  };

  const registerAttribute = async (age:  number, gender: string) => {
    try {
      const attributeData: CustomerAttributeCreate = {
        store_id: storeId,
        age_group: getAgeGroup(age),
        gender: getGenderJapanese(gender),
      };

      const response = await createCustomerAttribute(attributeData);
      
      setTimeout(() => {
        onAttributeRegistered(response.attribute_id);
      }, 2000);
    } catch (error) {
      console.error('Failed to register attribute:', error);
      setError('属性の登録に失敗しました');
      setDetecting(false);
    }
  };

  if (error && !modelsLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 max-w-md text-center shadow-xl">
          <p className="text-red-500 font-bold mb-4">{error}</p>
          <button
            onClick={onSkip}
            className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700"
          >
            手動入力に切り替える
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 flex items-center justify-center p-6 font-sans">
      <div className="bg-white rounded-[3rem] shadow-2xl p-12 max-w-3xl w-full border border-gray-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-600 rounded-full mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-3">
            顔認証
          </h2>
          <p className="text-gray-500 font-medium">
            カメラに顔を向けて「認証開始」をクリックしてください
          </p>
        </div>

        <div className="relative mb-6 rounded-3xl overflow-hidden bg-gray-900">
          <video
            ref={videoRef}
            autoPlay
            muted
            className="w-full h-auto"
            onLoadedMetadata={() => {
              if (canvasRef.current && videoRef.current) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
              }
            }}
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full"
          />
          
          {detectionResult && (
            <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
              <div className="flex justify-around text-center">
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">年齢</p>
                  <p className="text-2xl font-black text-purple-600">
                    {detectionResult. age}歳
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">性別</p>
                  <p className="text-2xl font-black text-purple-600">
                    {getGenderJapanese(detectionResult.gender)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">年齢層</p>
                  <p className="text-2xl font-black text-purple-600">
                    {getAgeGroup(detectionResult. age)}
                  </p>
                </div>
              </div>
              <p className="text-center text-sm text-gray-600 mt-3 font-medium">
                ✅ 登録中...  メニュー画面に移動します
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <p className="text-red-600 font-bold text-sm text-center">{error}</p>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={detectFace}
            disabled={! modelsLoaded || detecting}
            className="flex-1 py-5 bg-purple-600 text-white rounded-[2rem] font-black text-xl hover:bg-purple-700 active:scale-[0.98] transition-all disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed shadow-lg"
          >
            {detecting ? '認証中...' : '認証開始'}
          </button>
          <button
            onClick={onSkip}
            className="px-8 py-5 bg-gray-100 text-gray-600 rounded-[2rem] font-bold text-lg hover:bg-gray-200 active:scale-[0.98] transition-all"
          >
            スキップ
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          ※ 顔認証データは保存されません。年齢層と性別のみ統計に利用されます。
        </p>
      </div>
    </div>
  );
};

export default FaceRecognitionScreen;