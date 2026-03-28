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

const SidebarLink = ({ to, icon, children, collapsed }: { to: string, icon: string, children: React.ReactNode, collapsed: boolean }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  const activeClass = 'bg-indigo-600 text-white shadow-lg translate-x-[-4px]';
  const inactiveClass = 'text-slate-400 hover:bg-slate-800 hover:text-indigo-400';

  return (
    <Link to={to} className={`${isActive ? activeClass : inactiveClass} group flex items-center px-4 py-3.5 mb-2 rounded-2xl transition-all duration-300 relative overflow-hidden`}>
      <i className={`${icon} w-6 text-center text-lg ${isActive ? 'text-white' : 'group-hover:scale-110'} transition-transform`}></i>
      {!collapsed && <span className="ml-4 font-black text-[11px] uppercase tracking-widest whitespace-nowrap">{children}</span>}
      {collapsed && (
        <div className="invisible group-hover:visible absolute right-full mr-4 px-3 py-2 bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-2xl border border-slate-800 whitespace-nowrap z-50">
          {children}
        </div>
      )}
    </Link>
  );
};

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{HoTen: string, role: string, TrangThai: string} | null>(null);
  const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-800 dark:text-gray-200 font-sans transition-colors duration-500 flex flex-row-reverse overflow-x-hidden">
      {/* Sidebar (Right-side) */}
      <aside className={`fixed right-0 h-full bg-white dark:bg-slate-950 border-l border-indigo-100 dark:border-slate-800 transition-all duration-500 z-40 hidden xl:flex flex-col shadow-2xl ${sidebarCollapsed ? 'w-20' : 'w-72'}`}>
        <div className="p-6 flex items-center justify-between border-b border-gray-100 dark:border-slate-900">
          {!sidebarCollapsed && (
            <Link to="/" className="text-2xl font-black text-indigo-600 dark:text-indigo-500 tracking-tighter uppercase italic">
              Tech<span className="text-gray-900 dark:text-white">Store</span>
            </Link>
          )}
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-slate-900 text-gray-400 hover:text-indigo-500 transition-colors"
          >
            <i className={`fas ${sidebarCollapsed ? 'fa-indent' : 'fa-outdent'}`}></i>
          </button>
        </div>

        <div className="flex-1 px-4 py-6 overflow-y-auto overflow-x-hidden scrollbar-hide">
          <SidebarLink to="/" icon="fas fa-chart-line" collapsed={sidebarCollapsed}>{t('nav.dashboard')}</SidebarLink>
          <SidebarLink to="/products" icon="fas fa-boxes" collapsed={sidebarCollapsed}>{t('nav.products')}</SidebarLink>
          <SidebarLink to="/suppliers" icon="fas fa-truck-field" collapsed={sidebarCollapsed}>{t('nav.suppliers')}</SidebarLink>
          
          {(userRole === 'Retailer' || userRole === 'Admin') && !isResigned && (
            <SidebarLink to="/create-invoice" icon="fas fa-file-invoice-dollar" collapsed={sidebarCollapsed}>{t('nav.create_invoice')}</SidebarLink>
          )}
          
          {(userRole === 'Provider' || userRole === 'Retailer' || userRole === 'Admin') && !isResigned && (
            <SidebarLink to="/inventory-transfer" icon="fas fa-right-left" collapsed={sidebarCollapsed}>Chuyển Kho</SidebarLink>
          )}

          <SidebarLink to="/reports" icon="fas fa-file-contract" collapsed={sidebarCollapsed}>{t('nav.reports')}</SidebarLink>

          <div className="my-6 border-t border-gray-100 dark:border-slate-900"></div>

          {(userRole === 'Admin' || userRole === 'Retailer') && !isResigned && (
            <SidebarLink to="/management" icon="fas fa-users-cog" collapsed={sidebarCollapsed}>Quản Lý</SidebarLink>
          )}

          {(userRole === 'Admin' || userRole === 'Provider') && !isResigned && (
            <SidebarLink to="/warehouse-settings" icon="fas fa-cogs" collapsed={sidebarCollapsed}>Cấu Hình Kho</SidebarLink>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-slate-900">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3.5 rounded-2xl bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-500 hover:bg-red-600 hover:text-white transition-all duration-300 group"
          >
            <i className="fas fa-power-off w-6 text-center text-lg"></i>
            {!sidebarCollapsed && <span className="ml-4 font-black text-[11px] uppercase tracking-[0.2em]">Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Top Nav & Burger */}
      <nav className="xl:hidden fixed top-0 left-0 w-full h-16 bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800 z-50 px-4 flex items-center justify-between shadow-md">
        <Link to="/" className="text-xl font-black text-indigo-600 tracking-tighter italic">TECHSTORE</Link>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-slate-900"
        >
          <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'} text-gray-600 dark:text-white`}></i>
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="xl:hidden fixed inset-0 bg-white dark:bg-slate-950 z-[49] pt-20 px-6 animate-in slide-in-from-right duration-300">
           {/* Mobile links go here */}
           <div className="flex flex-col space-y-4" onClick={() => setMobileMenuOpen(false)}>
              <Link to="/" className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-900 font-black uppercase text-xs tracking-widest text-center">{t('nav.dashboard')}</Link>
              <Link to="/products" className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-900 font-black uppercase text-xs tracking-widest text-center">{t('nav.products')}</Link>
              <button onClick={handleLogout} className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 text-red-600 font-black uppercase text-xs tracking-widest">Đăng xuất</button>
           </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 min-h-screen transition-all duration-500 flex flex-col ${sidebarCollapsed ? 'xl:mr-20' : 'xl:mr-72'} pt-16 xl:pt-0`}>
        {/* Top Header Section inside Main */}
        <header className="h-20 px-8 flex items-center justify-between bg-white/50 dark:bg-slate-950/50 backdrop-blur-xl border-b border-gray-100 dark:border-slate-900 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 text-gray-600 dark:text-yellow-400 shadow-sm border border-gray-100 dark:border-slate-800 hover:scale-110 transition-transform"
            >
              <i className={`fas ${darkMode ? 'fa-sun' : 'fa-moon'}`}></i>
            </button>
            <button
              onClick={toggleLanguage}
              className="px-3 py-1 text-[10px] font-black bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-lg shadow-sm dark:text-indigo-400 uppercase"
            >
              {i18n.language}
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex flex-col items-end mr-2">
              <div className="flex items-center space-x-2">
                {isResigned && <span className="px-1.5 py-0.5 bg-red-600 text-[8px] text-white font-black rounded uppercase animate-pulse">Resigned</span>}
                <div className="group relative">
                  <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-[9px] font-black rounded-md uppercase tracking-tighter border border-indigo-200 dark:border-indigo-800 cursor-help">
                    {userRole}
                  </span>
                  <div className="invisible group-hover:visible absolute right-0 mt-2 w-64 p-4 bg-slate-950 text-white text-[10px] rounded-2xl shadow-2xl z-50 border border-slate-800 opacity-98 backdrop-blur-md">
                    <p className="font-black text-indigo-400 mb-2 border-b border-slate-800 pb-2 flex items-center uppercase italic">
                      <i className="fas fa-shield-halved mr-2"></i> Quyền hạn {userRole}
                    </p>
                    <p className="leading-relaxed text-gray-300 font-medium">{roleDescriptions[userRole]}</p>
                  </div>
                </div>
                <Link to="/profile" className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight hover:text-indigo-600 transition-colors">
                  {profile?.HoTen || t('common.staff')}
                </Link>
              </div>
              <span className="text-[10px] text-gray-400 font-mono">{session.user.email}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none">
              <i className="fas fa-user-ninja"></i>
            </div>
          </div>
        </header>

        {isResigned && (
          <div className="bg-red-600 text-white py-1.5 text-center text-[10px] font-black uppercase tracking-[0.3em] shadow-inner">
            Tài khoản đã nghỉ việc - Giao dịch bị khóa
          </div>
        )}

        <section className="p-8 flex-1">
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
        </section>
      </main>
    </div>
  );
}

export default App;
