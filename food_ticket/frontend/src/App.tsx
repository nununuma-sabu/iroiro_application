import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import StorePage from './pages/StorePage';
import AdminPage from './pages/AdminPage';
import Header from './components/Header';

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        {/* 顧客向けページ */}
        <Route path="/" element={<StorePage />} />
        
        {/* 管理画面 */}
        <Route path="/admin/*" element={<AdminPage />} />
      </Routes>
    </Router>
  );
}

export default App;