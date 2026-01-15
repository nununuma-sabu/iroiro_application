import { useState, useEffect } from 'react';
import './CurrentTime.css';

const CurrentTime = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date()); // 1分ごとに更新したい
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date:  Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const weekday = weekdays[date.getDay()];

    return `${year}年${month}月${day}日(${weekday}) ${hours}:${minutes}`;
  };

  return (
    <div className="current-time">
      ⏱ {formatTime(currentTime)}
    </div>
  );
};

export default CurrentTime;