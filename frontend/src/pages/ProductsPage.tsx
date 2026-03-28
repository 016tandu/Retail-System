import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient.ts';
import { useTranslation } from 'react-i18next';

type Product = {
  MaSP: string;
  TenSP: string;
  DonViTinh: string;
  GiaNiemYet: number;
};

const InfoIcon = ({ text }: { text: string }) => (
  <div className="group relative inline-block ml-2">
    <span className="cursor-help text-gray-400 bg-gray-100 dark:bg-slate-800 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold border border-gray-200 dark:border-gray-700">i</span>
    <div className="invisible group-hover:visible absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-50 opacity-95 transition-all">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
    </div>
  </div>
);

export default function ProductsPage() {
  const { t, i18n } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // CRUD State
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Product>({ MaSP: '', TenSP: '', DonViTinh: 'Cái', GiaNiemYet: 0 });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from('NHAN_VIEN').select('role').eq('user_id', user.id).maybeSingle();
      setUserRole(profile?.role || 'Staff');
    }
    fetchProducts();
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('SAN_PHAM').select('*').order('MaSP');
    if (error) setError(error.message); else setProducts(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('SAN_PHAM').upsert(formData);
    if (error) alert(error.message);
    else {
      setIsEditing(false);
      setFormData({ MaSP: '', TenSP: '', DonViTinh: 'Cái', GiaNiemYet: 0 });
      fetchProducts();
    }
  };

  const handleDelete = async (maSP: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
    const { error } = await supabase.from('SAN_PHAM').delete().eq('MaSP', maSP);
    if (error) alert(error.message); else fetchProducts();
  };

  const canEdit = userRole === 'Admin' || userRole === 'Provider';

  if (loading) return <div className="text-center py-10 dark:text-gray-400 italic font-black animate-pulse">{t('common.loading')}</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b dark:border-slate-800 pb-6">
        <div>
          <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic flex items-center">
            {t('nav.products')}
            <InfoIcon text="Danh mục sản phẩm toàn hệ thống. Chỉ Admin và Provider mới có quyền thêm, xóa hoặc chỉnh sửa thông tin sản phẩm." />
          </h2>
          <p className="text-gray-500 dark:text-slate-400 font-bold mt-1 uppercase tracking-widest text-[10px]">Global Product Catalog</p>
        </div>

        {canEdit && !isEditing && (
          <button 
            onClick={() => { setIsEditing(true); setFormData({ MaSP: '', TenSP: '', DonViTinh: 'Cái', GiaNiemYet: 0 }); }}
            className="mt-4 md:mt-0 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 px-6 rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 uppercase text-xs tracking-widest flex items-center"
          >
            <i className="fas fa-plus mr-2"></i> Thêm sản phẩm mới
          </button>
        )}
      </div>

      {isEditing && canEdit && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl border-2 border-indigo-500/20 animate-in slide-in-from-top duration-300">
          <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-6">
            {formData.MaSP ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Mã Sản Phẩm</label>
              <input type="text" value={formData.MaSP} onChange={e => setFormData({...formData, MaSP: e.target.value})} disabled={!!products.find(p => p.MaSP === formData.MaSP && formData.MaSP !== '')} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold dark:text-white disabled:opacity-50" required />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tên Sản Phẩm</label>
              <input type="text" value={formData.TenSP} onChange={e => setFormData({...formData, TenSP: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold dark:text-white" required />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Đơn Vị Tính</label>
              <input type="text" value={formData.DonViTinh} onChange={e => setFormData({...formData, DonViTinh: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold dark:text-white" required />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Giá Niêm Yết</label>
              <input type="number" value={formData.GiaNiemYet} onChange={e => setFormData({...formData, GiaNiemYet: Number(e.target.value)})} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold dark:text-white" required />
            </div>
            <div className="md:col-span-4 flex justify-end space-x-3 pt-4">
              <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-2.5 text-gray-500 font-black uppercase text-[10px] tracking-widest hover:text-gray-700">Hủy bỏ</button>
              <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-black px-8 py-2.5 rounded-xl uppercase text-[10px] tracking-widest shadow-lg shadow-green-100 dark:shadow-none transition-all">Lưu thông tin</button>
            </div>
          </form>
        </div>
      )}

      {error && <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-2xl border dark:border-red-800 mb-6 font-bold text-sm">⚠️ {error}</div>}

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-slate-950 text-[10px] uppercase font-black text-gray-500 dark:text-slate-500 tracking-[0.2em] border-b dark:border-slate-800">
              <tr>
                <th className="px-8 py-6">{t('products.code')}</th>
                <th className="px-8 py-6">{t('products.name')}</th>
                <th className="px-8 py-6">{t('products.unit')}</th>
                <th className="px-8 py-6">{t('products.price')}</th>
                {canEdit && <th className="px-8 py-6 text-right">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {products.length === 0 ? (
                <tr><td colSpan={5} className="px-8 py-20 text-center text-gray-400 italic font-medium italic">Không có sản phẩm nào trong danh mục.</td></tr>
              ) : products.map((product) => (
                <tr key={product.MaSP} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="px-8 py-6 font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">{product.MaSP}</td>
                  <td className="px-8 py-6 font-black text-gray-900 dark:text-white uppercase tracking-tight">{product.TenSP}</td>
                  <td className="px-8 py-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest italic">{product.DonViTinh}</td>
                  <td className="px-8 py-6 font-black text-gray-900 dark:text-white">
                    {new Intl.NumberFormat(i18n.language === 'vi' ? 'vi-VN' : 'en-US', { style: 'currency', currency: i18n.language === 'vi' ? 'VND' : 'USD' }).format(product.GiaNiemYet)}
                  </td>
                  {canEdit && (
                    <td className="px-8 py-6 text-right space-x-2">
                      <button 
                        onClick={() => { setIsEditing(true); setFormData(product); }}
                        className="p-2.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        onClick={() => handleDelete(product.MaSP)}
                        className="p-2.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
