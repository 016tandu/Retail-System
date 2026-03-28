import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

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

const InfoIcon = ({ text }: { text: string }) => (
  <div className="group relative inline-block ml-2">
    <span className="cursor-help text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold border border-gray-200 dark:border-gray-700">i</span>
    <div className="invisible group-hover:visible absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-50 opacity-95 transition-all">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
    </div>
  </div>
);

export default function CreateInvoicePage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
      style: 'currency',
      currency: i18n.language === 'vi' ? 'VND' : 'USD',
    }).format(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      setError(t('invoice.empty_items'));
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t('common.auth_error'));

      const { data: employee, error: empError } = await supabase
        .from('NHAN_VIEN')
        .select('MaNV, MaKho')
        .eq('user_id', user.id)
        .single();

      if (empError || !employee) throw new Error(t('common.employee_error'));

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

      alert(t('invoice.success', { id: maHD }));
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-10 dark:text-gray-400">{t('common.loading')}</div>;

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
      <div className="flex items-center mb-8 border-b dark:border-gray-700 pb-4">
        <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
          {t('invoice.title')}
        </h2>
        <InfoIcon text="Chức năng này dành cho Retailer để ghi nhận đơn bán hàng trực tiếp. Hệ thống sẽ tự động trừ tồn kho ngay khi xác nhận." />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl border border-gray-100 dark:border-gray-800">
        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
            {t('invoice.select_product')}
          </label>
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
          >
            <option value="">{t('invoice.select_placeholder')}</option>
            {products.map(p => (
              <option key={p.MaSP} value={p.MaSP}>
                {p.TenSP} - {formatCurrency(p.GiaNiemYet)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
            {t('invoice.quantity')}
          </label>
          <div className="flex space-x-2">
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
            />
            <button
              onClick={addItem}
              disabled={!selectedProduct}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-black hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-200 dark:shadow-none active:scale-95"
            >
              {t('invoice.add')}
            </button>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
            {t('invoice.selected_items')}
          </h3>
          <InfoIcon text="Danh sách các sản phẩm khách hàng đã chọn. Bạn có thể thay đổi số lượng bằng cách thêm lại sản phẩm đó." />
        </div>
        
        <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">{t('products.name')}</th>
                <th className="px-6 py-4 text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest text-right">{t('products.price')}</th>
                <th className="px-6 py-4 text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest text-center">{t('invoice.quantity')}</th>
                <th className="px-6 py-4 text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest text-right">Thành tiền</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500 italic">
                    {t('invoice.no_items_placeholder')}
                  </td>
                </tr>
              ) : (
                items.map(item => (
                  <tr key={item.MaSP} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">{item.TenSP}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 text-right">
                      {new Intl.NumberFormat(i18n.language === 'vi' ? 'vi-VN' : 'en-US').format(item.DonGia)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white text-center font-mono">{item.SoLuong}</td>
                    <td className="px-6 py-4 text-sm font-black text-gray-900 dark:text-white text-right">
                      {new Intl.NumberFormat(i18n.language === 'vi' ? 'vi-VN' : 'en-US').format(item.SoLuong * item.DonGia)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => removeItem(item.MaSP)}
                        className="text-red-500 hover:text-red-700 font-bold text-xs uppercase tracking-tighter"
                      >
                        {t('invoice.remove')}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {items.length > 0 && (
              <tfoot className="bg-gray-50 dark:bg-gray-900 font-black">
                <tr>
                  <td colSpan={3} className="px-6 py-6 text-right text-gray-900 dark:text-white text-sm uppercase">{t('invoice.total')}</td>
                  <td className="px-6 py-6 text-right text-2xl text-indigo-600 dark:text-indigo-400">
                    {formatCurrency(calculateTotal())}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 text-red-700 dark:text-red-400 rounded-lg shadow-sm text-sm font-medium">
          ⚠️ {error}
        </div>
      )}

      <div className="flex justify-end space-x-4 border-t dark:border-gray-700 pt-8">
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-400 font-black hover:bg-gray-50 dark:hover:bg-gray-700 transition-all uppercase text-xs tracking-widest"
        >
          {t('common.cancel')}
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting || items.length === 0}
          className="px-10 py-3 bg-green-600 text-white rounded-xl font-black hover:bg-green-700 disabled:opacity-50 shadow-xl shadow-green-100 dark:shadow-none transition-all active:scale-95 uppercase text-xs tracking-widest"
        >
          {submitting ? t('login.processing') : t('invoice.submit')}
        </button>
      </div>
    </div>
  );
}
