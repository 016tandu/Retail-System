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
  const activeClass = 'bg-gray-900 text-white';
  const inactiveClass = 'text-gray-500 hover:bg-gray-700 hover:text-white';

  return (
    <Link to={to} className={`${isActive ? activeClass : inactiveClass} px-3 py-2 rounded-md text-sm font-medium transition-colors`}>
      {children}
    </Link>
  );
};

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{HoTen: string, role: string, TrangThai: string} | null>(null);
  const { t, i18n } = useTranslation();

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
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl font-medium">{t('common.loading')}</p>
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

  const userRole = profile?.role || 'Staff';
  const isResigned = profile?.TrangThai === 'Resigned';

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans">
      <nav className="bg-white shadow-md border-b-2 border-indigo-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-2xl font-bold text-indigo-600 tracking-tight">TechStore</Link>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
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
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleLanguage}
                className="px-2 py-1 text-xs font-bold border border-gray-300 rounded hover:bg-gray-100 transition-colors bg-white shadow-sm"
              >
                {i18n.language.toUpperCase()}
              </button>
              <div className="flex flex-col items-end">
                <div className="flex items-center space-x-1">
                  {isResigned && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-600 text-white animate-pulse">
                      RESIGNED
                    </span>
                  )}
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 uppercase">
                    {userRole}
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {profile?.HoTen || t('common.staff')}
                  </span>
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  {session.user.email}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="ml-2 text-gray-500 hover:bg-red-600 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 border border-transparent hover:border-red-700"
              >
                {t('common.logout')}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {isResigned && (
        <div className="bg-red-50 border-b border-red-200 p-2 text-center">
          <p className="text-red-700 text-xs font-bold">
            Tài khoản này thuộc về nhân viên đã nghỉ việc. Một số chức năng tạo dữ liệu đã bị khóa.
          </p>
        </div>
      )}

      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/suppliers" element={<SuppliersPage />} />
              <Route path="/create-invoice" element={<CreateInvoicePage />} />
              <Route path="/inventory-transfer" element={<InventoryTransferPage />} />
              <Route path="/reports" element={<ReportsPage />} />
            </Routes>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
