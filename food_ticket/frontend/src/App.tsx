import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import StorePage from './pages/StorePage';
import AdminPage from './pages/AdminPage';
import Header from './components/Header';
import { Toaster } from 'react-hot-toast'; // alert→トースト対応で追加

function App() {
  return (
    <Router>
      <Toaster position="top-center" reverseOrder={false} />
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