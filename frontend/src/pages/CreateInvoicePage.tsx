import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

type Product = {
  MaSP: string;
  TenSP: string;
  GiaNiemYet: number;
};

type InvoiceItem = {
  MaSP: string;
  TenSP: string;
  SoLuong: number;
  DonGia: number;
};

export default function CreateInvoicePage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('SAN_PHAM').select('MaSP, TenSP, GiaNiemYet');
      if (error) setError(error.message);
      else setProducts(data || []);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const addItem = () => {
    const product = products.find(p => p.MaSP === selectedProduct);
    if (!product) return;

    const existingItemIndex = items.findIndex(item => item.MaSP === selectedProduct);
    if (existingItemIndex >= 0) {
      const newItems = [...items];
      newItems[existingItemIndex].SoLuong += quantity;
      setItems(newItems);
    } else {
      setItems([...items, {
        MaSP: product.MaSP,
        TenSP: product.TenSP,
        SoLuong: quantity,
        DonGia: product.GiaNiemYet
      }]);
    }
    setQuantity(1);
    setSelectedProduct('');
  };

  const removeItem = (maSP: string) => {
    setItems(items.filter(item => item.MaSP !== maSP));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.SoLuong * item.DonGia), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      setError('Vui lòng thêm ít nhất một sản phẩm vào hóa đơn.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Người dùng chưa đăng nhập');

      // Fetch the employee info to get MaNV and MaKho
      const { data: employee, error: empError } = await supabase
        .from('NHAN_VIEN')
        .select('MaNV, MaKho')
        .eq('user_id', user.id)
        .single();

      if (empError || !employee) throw new Error('Không tìm thấy thông tin nhân viên.');

      const { data: maHD, error: rpcError } = await supabase.rpc('create_invoice', {
        p_ma_nv: employee.MaNV,
        p_ma_kho: employee.MaKho,
        p_items: items.map(item => ({
          MaSP: item.MaSP,
          SoLuong: item.SoLuong,
          DonGia: item.DonGia
        }))
      });

      if (rpcError) throw rpcError;

      alert(`Tạo hóa đơn ${maHD} thành công!`);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-10">Đang tải danh sách sản phẩm...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-100">
      <h2 className="text-3xl font-bold text-gray-900 mb-8 border-b pb-4">Tạo Hóa Đơn Mới</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Chọn sản phẩm</label>
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">-- Chọn sản phẩm --</option>
            {products.map(p => (
              <option key={p.MaSP} value={p.MaSP}>
                {p.TenSP} - {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.GiaNiemYet)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Số lượng</label>
          <div className="flex space-x-2">
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <button
              onClick={addItem}
              disabled={!selectedProduct}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              Thêm
            </button>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Danh sách sản phẩm đã chọn</h3>
        <div className="overflow-hidden border border-gray-200 rounded-lg">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-sm font-semibold text-gray-700">Tên sản phẩm</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-700 text-right">Đơn giá</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-700 text-center">Số lượng</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-700 text-right">Thành tiền</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500 italic">Chưa có sản phẩm nào được chọn.</td>
                </tr>
              ) : (
                items.map(item => (
                  <tr key={item.MaSP}>
                    <td className="px-4 py-3 text-sm text-gray-800">{item.TenSP}</td>
                    <td className="px-4 py-3 text-sm text-gray-800 text-right">
                      {new Intl.NumberFormat('vi-VN').format(item.DonGia)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 text-center">{item.SoLuong}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                      {new Intl.NumberFormat('vi-VN').format(item.SoLuong * item.DonGia)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => removeItem(item.MaSP)}
                        className="text-red-500 hover:text-red-700 font-bold"
                      >
                        Gỡ
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {items.length > 0 && (
              <tfoot className="bg-gray-50 font-bold">
                <tr>
                  <td colSpan={3} className="px-4 py-4 text-right text-gray-900">Tổng cộng:</td>
                  <td className="px-4 py-4 text-right text-xl text-indigo-700">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(calculateTotal())}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded shadow-sm">
          {error}
        </div>
      )}

      <div className="flex justify-end space-x-4">
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-50 transition-colors"
        >
          Hủy bỏ
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting || items.length === 0}
          className="px-8 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 shadow-lg hover:shadow-green-100 transition-all active:scale-95"
        >
          {submitting ? 'Đang xử lý...' : 'Xác nhận tạo hóa đơn'}
        </button>
      </div>
    </div>
  );
}
