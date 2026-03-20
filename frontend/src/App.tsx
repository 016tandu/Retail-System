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
  const { t, i18n } = useTranslation();

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

  const userRole = session.user.user_metadata?.role || 'Staff';

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-2xl font-bold text-indigo-600">TechStore</Link>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <NavLink to="/">{t('nav.dashboard')}</NavLink>
                <NavLink to="/products">{t('nav.products')}</NavLink>
                <NavLink to="/suppliers">{t('nav.suppliers')}</NavLink>
                
                {/* Role-Based Links */}
                {(userRole === 'Retailer' || userRole === 'Admin') && (
                  <NavLink to="/create-invoice">{t('nav.create_invoice')}</NavLink>
                )}
                
                {(userRole === 'Provider' || userRole === 'Retailer' || userRole === 'Admin') && (
                  <NavLink to="/inventory-transfer">Chuyển Kho</NavLink>
                )}

                <NavLink to="/reports">{t('nav.reports')}</NavLink>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleLanguage}
                className="px-2 py-1 text-xs font-bold border border-gray-300 rounded hover:bg-gray-100 transition-colors"
              >
                {i18n.language.toUpperCase()}
              </button>
              <div className="flex flex-col items-end">
                <div className="flex items-center space-x-1">
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 uppercase">
                    {userRole}
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {session.user.user_metadata?.full_name || t('common.staff')}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {session.user.email}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="ml-2 text-gray-500 hover:bg-red-600 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-all"
              >
                {t('common.logout')}
              </button>
            </div>
          </div>
        </div>
      </nav>

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
