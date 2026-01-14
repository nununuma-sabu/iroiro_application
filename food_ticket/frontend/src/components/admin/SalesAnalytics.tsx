import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import * as adminApi from '../../api/admin';
import './SalesAnalytics.css';

// カスタムTooltipの型定義
interface CustomTooltipProps {
  active?:  boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

// カスタムTooltipコンポーネント（売上推移用）
const CustomTrendTooltip = ({ active, payload, label }:  CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: 'white',
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ margin: '4px 0', color: entry.color }}>
            {entry.name === 'total_sales' && `売上:  ¥${entry.value?. toLocaleString()}`}
            {entry.name === 'total_orders' && `注文数: ${entry.value}件`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// カスタムTooltipコンポーネント（販売数用）
const CustomBarTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: 'white',
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>{label}</p>
        <p style={{ margin: '4px 0', color: '#3B82F6' }}>
          販売数: {payload[0]?.value}個
        </p>
      </div>
    );
  }
  return null;
};

function SalesAnalytics() {
  const storeId = 1; // デフォルト店舗ID

  // State管理
  const [summary, setSummary] = useState<adminApi.SalesSummary | null>(null);
  const [trends, setTrends] = useState<adminApi.SalesTrend[]>([]);
  const [popularProducts, setPopularProducts] = useState<adminApi.PopularProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30); // 表示日数

  // データ取得
  useEffect(() => {
    fetchAnalyticsData();
  }, [days]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const [summaryData, trendsData, productsData] = await Promise.all([
        adminApi.getSalesSummary(storeId),
        adminApi.getSalesTrends(storeId, days),
        adminApi.getPopularProducts(storeId, 10),
      ]);

      setSummary(summaryData);
      setTrends(trendsData);
      setPopularProducts(productsData);
    } catch (error:  any) {
      console.error('売上データの取得に失敗しました:', error);
      alert(error.message || '売上データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>データを読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="sales-analytics">
      <h2 className="page-title">📊 売上分析</h2>

      {/* サマリーカード */}
      <div className="summary-cards">
        <div className="summary-card blue">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <h3>総売上</h3>
            <p className="card-value">¥{(summary?.total_sales ??  0).toLocaleString()}</p>
          </div>
        </div>

        <div className="summary-card green">
          <div className="card-icon">📦</div>
          <div className="card-content">
            <h3>注文件数</h3>
            <p className="card-value">¥{(summary?.total_orders ?? 0).toLocaleString()}件</p>
          </div>
        </div>

        <div className="summary-card orange">
          <div className="card-icon">📈</div>
          <div className="card-content">
            <h3>平均客単価</h3>
            <p className="card-value">¥{(summary?.average_order_value ?? 0).toLocaleString()}</p> 
          </div>
        </div>
      </div>

      {/* 売上推移グラフ */}
      <div className="chart-section">
        <div className="chart-header">
          <h3>📅 売上推移</h3>
          <div className="period-selector">
            <button
              className={days === 7 ? 'active' : ''}
              onClick={() => setDays(7)}
            >
              過去7日
            </button>
            <button
              className={days === 30 ? 'active' : ''}
              onClick={() => setDays(30)}
            >
              過去30日
            </button>
            <button
              className={days === 90 ? 'active' : ''}
              onClick={() => setDays(90)}
            >
              過去90日
            </button>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={trends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTrendTooltip />} />
            <Legend
              formatter={(value:  string) => {
                if (value === 'total_sales') return '売上';
                if (value === 'total_orders') return '注文数';
                return value;
              }}
            />
            <Line
              type="monotone"
              dataKey="total_sales"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ r: 3 }}
              name="total_sales"
            />
            <Line
              type="monotone"
              dataKey="total_orders"
              stroke="#10B981"
              strokeWidth={2}
              dot={{ r:  3 }}
              name="total_orders"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 人気商品ランキング */}
      <div className="ranking-section">
        <h3>🏆 人気商品ランキング TOP10</h3>

        {popularProducts.length === 0 ?  (
          <p className="no-data">売上データがありません</p>
        ) : (
          <div className="ranking-grid">
            {popularProducts.map((product, index) => (
              <div key={product.product_id} className="ranking-card">
                <div className="rank-badge">{index + 1}</div>
                <div className="product-image">
                  {product.image_url ? (
                    <img src={product. image_url} alt={product. product_name} />
                  ) : (
                    <div className="no-image">📷</div>
                  )}
                </div>
                <div className="product-info">
                  <h4>{product. product_name}</h4>
                  <p className="category">{product.category_name}</p>
                  <div className="product-stats">
                    <div className="stat">
                      <span className="label">販売数: </span>
                      <span className="value">{product.total_quantity}個</span>
                    </div>
                    <div className="stat">
                      <span className="label">売上:</span>
                      <span className="value">¥{product.total_sales.toLocaleString()}</span>
                    </div>
                    <div className="stat">
                      <span className="label">注文回数:</span>
                      <span className="value">{product. order_count}回</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 売上推移バーチャート（販売数） */}
      <div className="chart-section">
        <h3>📊 販売数推移（TOP10商品）</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={popularProducts. slice(0, 10)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="product_name" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip content={<CustomBarTooltip />} />
            <Bar dataKey="total_quantity" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default SalesAnalytics;