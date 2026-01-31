import { Routes, Route, Link, useLocation } from 'react-router-dom';
import ProductsPage from './pages/ProductsPage';
import SuppliersPage from './pages/SuppliersPage';
import ReportsPage from './pages/ReportsPage';
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
  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-shrink-0">
              <Link to="/" className="text-2xl font-bold text-gray-900">TechStore</Link>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <NavLink to="/">Sản Phẩm</NavLink>
                <NavLink to="/suppliers">Nhà Cung Cấp</NavLink>
                <NavLink to="/reports">Báo Cáo</NavLink>
              </div>
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
              <Route path="/reports" element={<ReportsPage />} />
            </Routes>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
