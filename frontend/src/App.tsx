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
import MyProfilePage from './pages/MyProfilePage';
import ManagementPage from './pages/ManagementPage';
import WarehouseSettingsPage from './pages/WarehouseSettingsPage';
import './App.css';

const NavLink = ({ to, children }: { to: string, children: React.ReactNode }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  const activeClass = 'bg-indigo-600 text-white shadow-lg scale-105';
  const inactiveClass = 'text-gray-600 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-slate-900 hover:text-indigo-600';

  return (
    <Link to={to} className={`${isActive ? activeClass : inactiveClass} px-4 py-2 rounded-lg text-sm font-black transition-all duration-200 flex items-center`}>
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
      .maybeSingle();
    
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
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-black">
        <div className="text-center">
          <i className="fas fa-circle-notch fa-spin text-4xl text-indigo-600 mb-4"></i>
          <p className="text-xl font-black text-indigo-600 tracking-widest animate-pulse uppercase">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center p-4">
        <LoginPage />
      </div>
    );
  }

  const userRole = profile?.role || 'Staff';
  const isResigned = profile?.TrangThai === 'Resigned';

  const roleDescriptions: Record<string, string> = {
    'Admin': 'Toàn quyền: Quản lý kho, nhân sự cấp trung, xem toàn bộ báo cáo và thực hiện mọi giao dịch.',
    'Provider': 'Cung ứng: Quản lý thông tin Kho, nhập hàng từ NCC và điều phối chuyển kho.',
    'Retailer': 'Bán lẻ: Quản lý nhân viên chi nhánh, tạo hóa đơn và nhận hàng điều chuyển.',
    'Staff': 'Nhân viên: Xem danh mục sản phẩm, tồn kho và các báo cáo cơ bản.'
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-800 dark:text-gray-200 font-sans transition-colors duration-500">
      <nav className="bg-white dark:bg-slate-950 shadow-2xl border-b border-indigo-100 dark:border-slate-800 sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-3xl font-black text-indigo-600 dark:text-indigo-500 tracking-tighter hover:scale-105 transition-transform">
                TECH<span className="text-gray-900 dark:text-white">STORE</span>
              </Link>
            </div>
            
            <div className="hidden xl:block">
              <div className="ml-10 flex items-baseline space-x-1">
                <NavLink to="/"><i className="fas fa-chart-line mr-2"></i>{t('nav.dashboard')}</NavLink>
                <NavLink to="/products"><i className="fas fa-boxes mr-2"></i>{t('nav.products')}</NavLink>
                <NavLink to="/suppliers"><i className="fas fa-truck-field mr-2"></i>{t('nav.suppliers')}</NavLink>
                
                {(userRole === 'Retailer' || userRole === 'Admin') && !isResigned && (
                  <NavLink to="/create-invoice"><i className="fas fa-file-invoice-dollar mr-2"></i>{t('nav.create_invoice')}</NavLink>
                )}
                
                {(userRole === 'Provider' || userRole === 'Retailer' || userRole === 'Admin') && !isResigned && (
                  <NavLink to="/inventory-transfer"><i className="fas fa-right-left mr-2"></i>Chuyển Kho</NavLink>
                )}

                <NavLink to="/reports"><i className="fas fa-file-contract mr-2"></i>{t('nav.reports')}</NavLink>

                {/* New Role-Based Management Links */}
                {(userRole === 'Admin' || userRole === 'Retailer') && !isResigned && (
                  <NavLink to="/management"><i className="fas fa-users-cog mr-2"></i>Quản Lý</NavLink>
                )}

                {(userRole === 'Admin' || userRole === 'Provider') && !isResigned && (
                  <NavLink to="/warehouse-settings"><i className="fas fa-cogs mr-2"></i>Cấu Hình Kho</NavLink>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-yellow-400 hover:rotate-12 transition-all border border-transparent hover:border-indigo-500"
              >
                <i className={`fas ${darkMode ? 'fa-sun' : 'fa-moon'} text-lg`}></i>
              </button>

              <button
                onClick={toggleLanguage}
                className="px-3 py-1 text-xs font-black border-2 border-gray-200 dark:border-slate-800 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors bg-white dark:bg-slate-950 dark:text-indigo-400 shadow-sm"
              >
                {i18n.language.toUpperCase()}
              </button>

              <div className="flex flex-col items-end border-l-2 pl-4 border-gray-100 dark:border-slate-800 ml-2">
                <div className="flex items-center space-x-3">
                  {isResigned && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-red-600 text-white animate-pulse shadow-lg shadow-red-500/50">
                      RESIGNED
                    </span>
                  )}
                  <div className="group relative">
                    <span className="text-[10px] cursor-help font-black px-2 py-1 rounded bg-indigo-600 dark:bg-indigo-900 text-white dark:text-indigo-200 uppercase tracking-widest border border-indigo-500 dark:border-indigo-800 shadow-md">
                      {userRole}
                    </span>
                    <div className="invisible group-hover:visible absolute right-0 mt-3 w-72 p-4 bg-slate-950 text-white text-xs rounded-2xl shadow-2xl z-50 border border-slate-800 opacity-98 backdrop-blur-md">
                       <p className="font-black text-indigo-400 mb-2 border-b border-slate-800 pb-2 flex items-center uppercase tracking-widest">
                         <i className="fas fa-shield-halved mr-2"></i> Quyền hạn {userRole}
                       </p>
                       <p className="leading-relaxed text-gray-300 font-medium">{roleDescriptions[userRole]}</p>
                    </div>
                  </div>
                  <Link to="/profile" className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    {profile?.HoTen || t('common.staff')}
                  </Link>
                </div>
                <span className="text-[10px] text-gray-500 dark:text-slate-500 font-mono font-bold">
                  {session.user.email}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="ml-2 w-10 h-10 flex items-center justify-center bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all duration-300 border border-red-100 dark:border-red-900/30 group"
              >
                <i className="fas fa-power-off group-hover:scale-110"></i>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {isResigned && (
        <div className="bg-red-600 text-white py-1.5 text-center text-[10px] font-black uppercase tracking-[0.3em] shadow-inner">
          <i className="fas fa-user-slash mr-2"></i> Tài khoản đã nghỉ việc - Chức năng giao dịch bị khóa <i className="fas fa-user-slash ml-2"></i>
        </div>
      )}

      <main className="max-w-[1600px] mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/suppliers" element={<SuppliersPage />} />
          <Route path="/create-invoice" element={<CreateInvoicePage />} />
          <Route path="/inventory-transfer" element={<InventoryTransferPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/profile" element={<MyProfilePage />} />
          <Route path="/management" element={<ManagementPage />} />
          <Route path="/warehouse-settings" element={<WarehouseSettingsPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
