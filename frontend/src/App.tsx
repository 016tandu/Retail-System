import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient';
import type { Session } from '@supabase/supabase-js';
import ProductsPage from './pages/ProductsPage';
import SuppliersPage from './pages/SuppliersPage';
import ReportsPage from './pages/ReportsPage';
import LoginPage from './pages/LoginPage';
import CreateInvoicePage from './pages/CreateInvoicePage';
import './App.css';

const NavLink = ({ to, children }: { to: string, children: React.ReactNode }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  const activeClass = 'bg-gray-900 text-white';
  const inactiveClass = 'text-gray-500 hover:bg-gray-700 hover:text-white';

  return (
    <Link to={to} className={`${isActive ? activeClass : inactiveClass} px-3 py-2 rounded-md text-sm font-medium`}>
      {children}
    </Link>
  );
};

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl font-medium">Đang tải...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <LoginPage />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-2xl font-bold text-gray-900">TechStore</Link>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <NavLink to="/">Sản Phẩm</NavLink>
                <NavLink to="/suppliers">Nhà Cung Cấp</NavLink>
                <NavLink to="/create-invoice">Tạo Hóa Đơn</NavLink>
                <NavLink to="/reports">Báo Cáo</NavLink>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex flex-col items-end">
                <span className="text-sm font-bold text-gray-900">
                  {session.user.user_metadata?.full_name || 'Nhân viên'}
                </span>
                <span className="text-xs text-gray-500">
                  {session.user.email}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="ml-2 text-gray-500 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <Routes>
              <Route path="/" element={<ProductsPage />} />
              <Route path="/suppliers" element={<SuppliersPage />} />
              <Route path="/create-invoice" element={<CreateInvoicePage />} />
              <Route path="/reports" element={<ReportsPage />} />
            </Routes>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
