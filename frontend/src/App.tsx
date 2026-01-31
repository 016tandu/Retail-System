import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient.ts';
import './App.css';

// Define a type for our product data for type safety
type Product = {
  MaSP: string;
  TenSP: string;
  DonViTinh: string;
  GiaNiemYet: number;
};

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('SAN_PHAM')
          .select('*');

        if (error) {
          throw error;
        }

        setProducts(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const renderContent = () => {
    if (loading) {
      return <p className="text-center text-gray-500">Loading products...</p>;
    }

    if (error) {
      return <p className="text-center text-red-500">Error: {error}</p>;
    }

    if (products.length === 0) {
      return <p className="text-center text-gray-500">No products found.</p>;
    }

    return (
      <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="py-3 px-6">Mã SP</th>
              <th scope="col" className="py-3 px-6">Tên Sản Phẩm</th>
              <th scope="col" className="py-3 px-6">Đơn Vị Tính</th>
              <th scope="col" className="py-3 px-6">Giá Niêm Yết</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.MaSP} className="bg-white border-b hover:bg-gray-50">
                <th scope="row" className="py-4 px-6 font-medium text-gray-900 whitespace-nowrap">
                  {product.MaSP}
                </th>
                <td className="py-4 px-6">{product.TenSP}</td>
                <td className="py-4 px-6">{product.DonViTinh}</td>
                <td className="py-4 px-6">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.GiaNiemYet)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-gray-900">TechStore</h1>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <a href="#" className="bg-gray-900 text-white px-3 py-2 rounded-md text-sm font-medium">Sản Phẩm</a>
                <a href="#" className="text-gray-500 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Nhà Cung Cấp</a>
                <a href="#" className="text-gray-500 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Báo Cáo</a>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
