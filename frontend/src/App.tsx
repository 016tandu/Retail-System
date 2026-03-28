import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient';
import type { Session } from '@supabase/supabase-js';
import { useTranslation } from 'react-i18next';
import ProductsPage from './pages/ProductsPage';
import SuppliersPage from './pages/SuppliersPage';
import ReportsPage from './pages/ReportsPage';
import LoginPage from './pages/LoginPage';
import CreateInvoicePage from './pages/CreateInvoicePage';
import InventoryTransferPage from './pages/InventoryTransferPage';
import Dashboard from './pages/Dashboard';
import './App.css';

const NavLink = ({ to, children }: { to: string, children: React.ReactNode }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  const activeClass = 'bg-indigo-600 text-white shadow-sm';
  const inactiveClass = 'text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-800 hover:text-indigo-600';

  return (
    <Link to={to} className={`${isActive ? activeClass : inactiveClass} px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 flex items-center`}>
      {children}
    </Link>
  );
};

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{HoTen: string, role: string, TrangThai: string} | null>(null);
  const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('NHAN_VIEN')
      .select('HoTen, role, TrangThai')
      .eq('user_id', userId)
      .single();
    
    if (!error && data) setProfile(data);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(newLang);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen dark:bg-gray-900">
        <p className="text-xl font-bold text-indigo-600 animate-pulse">{t('common.loading')}</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <LoginPage />
      </div>
    );
  }

  const userRole = profile?.role || 'Staff';
  const isResigned = profile?.TrangThai === 'Resigned';

  const roleDescriptions: Record<string, string> = {
    'Admin': 'Toàn quyền: Quản lý kho, nhân sự, xem toàn bộ báo cáo và thực hiện mọi giao dịch.',
    'Provider': 'Cung ứng: Nhập hàng từ nhà cung cấp và điều phối chuyển kho đến các chi nhánh.',
    'Retailer': 'Bán lẻ: Tạo hóa đơn cho khách hàng và nhận hàng điều chuyển từ kho tổng.',
    'Staff': 'Nhân viên: Xem danh mục sản phẩm, tồn kho và các báo cáo cơ bản.'
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans transition-colors duration-300">
      <nav className="bg-white dark:bg-gray-800 shadow-lg border-b border-indigo-100 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">
                TECH<span className="text-gray-900 dark:text-white">STORE</span>
              </Link>
            </div>
            
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-2">
                <NavLink to="/">{t('nav.dashboard')}</NavLink>
                <NavLink to="/products">{t('nav.products')}</NavLink>
                <NavLink to="/suppliers">{t('nav.suppliers')}</NavLink>
                
                {(userRole === 'Retailer' || userRole === 'Admin') && !isResigned && (
                  <NavLink to="/create-invoice">{t('nav.create_invoice')}</NavLink>
                )}
                
                {(userRole === 'Provider' || userRole === 'Retailer' || userRole === 'Admin') && !isResigned && (
                  <NavLink to="/inventory-transfer">Chuyển Kho</NavLink>
                )}

                <NavLink to="/reports">{t('nav.reports')}</NavLink>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors"
                title="Đổi giao diện"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>

              <button
                onClick={toggleLanguage}
                className="px-2 py-1 text-xs font-black border-2 border-gray-200 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors bg-white dark:bg-gray-800 shadow-sm"
              >
                {i18n.language.toUpperCase()}
              </button>

              <div className="flex flex-col items-end border-l pl-3 border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  {isResigned && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-600 text-white animate-pulse">
                      RESIGNED
                    </span>
                  )}
                  {/* Role with Hover Explanation */}
                  <div className="group relative">
                    <span className="text-[10px] cursor-help font-black px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 uppercase tracking-widest border border-indigo-200 dark:border-indigo-800">
                      {userRole}
                    </span>
                    <div className="invisible group-hover:visible absolute right-0 mt-2 w-64 p-3 bg-gray-900 dark:bg-gray-950 text-white text-xs rounded-xl shadow-2xl z-50 border border-gray-700 opacity-95">
                       <p className="font-bold text-indigo-400 mb-1 border-b border-gray-800 pb-1 italic">Quyền hạn {userRole}:</p>
                       <p className="leading-relaxed text-gray-300">{roleDescriptions[userRole]}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {profile?.HoTen || t('common.staff')}
                  </span>
                </div>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                  {session.user.email}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="ml-2 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-2 rounded-lg hover:bg-red-600 hover:text-white transition-all duration-200 border border-red-100 dark:border-red-900/50"
                title={t('common.logout')}
              >
                🚪
              </button>
            </div>
          </div>
        </div>
      </nav>

      {isResigned && (
        <div className="bg-red-600 text-white p-1 text-center text-[10px] font-black uppercase tracking-[0.2em]">
          Tài khoản đã nghỉ việc - Chức năng giao dịch bị khóa
        </div>
      )}

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/suppliers" element={<SuppliersPage />} />
          <Route path="/create-invoice" element={<CreateInvoicePage />} />
          <Route path="/inventory-transfer" element={<InventoryTransferPage />} />
          <Route path="/reports" element={<ReportsPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
