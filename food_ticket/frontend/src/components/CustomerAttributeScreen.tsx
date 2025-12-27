// src/components/CustomerAttributeScreen.tsx
import React, { useState } from 'react';
import { createCustomerAttribute } from '../api/customer';
import type { CustomerAttributeCreate } from '../types/customer';

interface CustomerAttributeScreenProps {
  storeId: number;
  onAttributeRegistered: (attributeId: number) => void;
}

const CustomerAttributeScreen: React.FC<CustomerAttributeScreenProps> = ({
  storeId,
  onAttributeRegistered,
}) => {
  const [ageGroup, setAgeGroup] = useState<string>('');
  const [gender, setGender] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const ageGroups = ['10代', '20代', '30代', '40代', '50代', '60代以上'];
  const genders = ['男性', '女性', 'その他'];

  const handleSubmit = async () => {
    if (!ageGroup || !gender) {
      alert('年齢層と性別を選択してください');
      return;
    }

    setLoading(true);

    try {
      const attributeData: CustomerAttributeCreate = {
        store_id: storeId,
        age_group:  ageGroup,
        gender:  gender,
      };

      const response = await createCustomerAttribute(attributeData);
      onAttributeRegistered(response.attribute_id);
    } catch (error:  any) {
      console.error('Failed to register customer attribute:', error);
      alert('登録に失敗しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6 font-sans">
      <div className="bg-white rounded-[3rem] shadow-2xl p-12 max-w-2xl w-full border border-gray-100">
        {/* ヘッダー */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-6">
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
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-3">
            ようこそ！
          </h2>
          <p className="text-gray-500 font-medium">
            ご注文の前に、簡単なアンケートにご協力ください
          </p>
        </div>

        {/* 年齢層選択 */}
        <div className="mb-10">
          <label className="block text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">
            年齢層
          </label>
          <div className="grid grid-cols-3 gap-3">
            {ageGroups.map((age) => (
              <button
                key={age}
                onClick={() => setAgeGroup(age)}
                className={`py-4 px-6 rounded-2xl font-bold text-sm transition-all ${
                  ageGroup === age
                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {age}
              </button>
            ))}
          </div>
        </div>

        {/* 性別選択 */}
        <div className="mb-10">
          <label className="block text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">
            性別
          </label>
          <div className="grid grid-cols-3 gap-3">
            {genders.map((g) => (
              <button
                key={g}
                onClick={() => setGender(g)}
                className={`py-4 px-6 rounded-2xl font-bold text-sm transition-all ${
                  gender === g
                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* 送信ボタン */}
        <button
          onClick={handleSubmit}
          disabled={! ageGroup || !gender || loading}
          className="w-full py-5 bg-gray-900 text-white rounded-[2rem] font-black text-xl hover:bg-blue-600 active:scale-[0.98] transition-all disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed shadow-lg"
        >
          {loading ? '登録中...' : 'メニューを見る'}
        </button>
      </div>
    </div>
  );
};

export default CustomerAttributeScreen;