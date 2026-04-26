import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient.ts';
import { useTranslation } from 'react-i18next';

type Product = {
  MaSP: string;
  TenSP: string;
  DonViTinh: string;
  GiaNiemYet: number;
};

const defaultProduct: Product = {
  MaSP: '',
  TenSP: '',
  DonViTinh: 'Cai',
  GiaNiemYet: 0,
};

const InfoIcon = ({ text }: { text: string }) => (
  <div className="group relative inline-block ml-2">
    <span className="cursor-help text-gray-400 bg-gray-100 dark:bg-slate-800 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold border border-gray-200 dark:border-gray-700">i</span>
    <div className="invisible group-hover:visible absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-50 opacity-95 transition-all">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
    </div>
  </div>
);

export default function ProductsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('Staff');

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Product>(defaultProduct);

  const canEditProduct = userRole === 'Admin' || userRole === 'Provider' || userRole === 'Supplier';

  useEffect(() => {
    void fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from('NHAN_VIEN')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) {
        setError(profileError.message);
      } else {
        setUserRole(profile?.role || 'Staff');
      }
    }

    await fetchProducts();
  };

  const fetchProducts = async () => {
    const { data, error: productError } = await supabase.from('SAN_PHAM').select('*').order('MaSP');
    if (productError) {
      setError(productError.message);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Product = {
      ...formData,
      MaSP: formData.MaSP.trim(),
      TenSP: formData.TenSP.trim(),
      DonViTinh: formData.DonViTinh.trim(),
      GiaNiemYet: Number(formData.GiaNiemYet) || 0,
    };

    const { error: upsertError } = await supabase.from('SAN_PHAM').upsert(payload);
    if (upsertError) {
      window.alert(upsertError.message);
      return;
    }

    setIsEditing(false);
    setFormData(defaultProduct);
    await fetchProducts();
  };

  const handleDelete = async (maSP: string) => {
    if (!window.confirm(t('products.confirm_delete'))) return;
    const { error: deleteError } = await supabase.from('SAN_PHAM').delete().eq('MaSP', maSP);
    if (deleteError) {
      window.alert(deleteError.message);
      return;
    }
    await fetchProducts();
  };

  if (loading) {
    return <div className="text-center py-10 dark:text-gray-400 italic font-black animate-pulse">{t('common.loading')}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b dark:border-slate-800 pb-6">
        <div>
          <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic flex items-center">
            {t('nav.products')}
            <InfoIcon text={t('products.info_text')} />
          </h2>
          <p className="text-gray-500 dark:text-slate-400 font-bold mt-1 uppercase tracking-widest text-[10px]">
            Global Product Catalog
          </p>
        </div>

        {canEditProduct && !isEditing && (
          <button
            onClick={() => {
              setIsEditing(true);
              setFormData(defaultProduct);
            }}
            className="mt-4 md:mt-0 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 px-6 rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 uppercase text-xs tracking-widest flex items-center"
          >
            <i className="fas fa-plus mr-2"></i> {t('products.new_product')}
          </button>
        )}
      </div>

      {isEditing && canEditProduct && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl border-2 border-indigo-500/20 animate-in slide-in-from-top duration-300">
          <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-6">
            {formData.MaSP ? t('products.edit_product') : t('products.new_product')}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{t('products.code')}</label>
              <input
                type="text"
                value={formData.MaSP}
                onChange={(e) => setFormData((prev) => ({ ...prev, MaSP: e.target.value }))}
                disabled={!!products.find((p) => p.MaSP === formData.MaSP && formData.MaSP !== '')}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold dark:text-white disabled:opacity-50"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{t('products.name')}</label>
              <input
                type="text"
                value={formData.TenSP}
                onChange={(e) => setFormData((prev) => ({ ...prev, TenSP: e.target.value }))}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{t('products.unit')}</label>
              <input
                type="text"
                value={formData.DonViTinh}
                onChange={(e) => setFormData((prev) => ({ ...prev, DonViTinh: e.target.value }))}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{t('products.price')}</label>
              <input
                type="number"
                value={formData.GiaNiemYet}
                onChange={(e) => setFormData((prev) => ({ ...prev, GiaNiemYet: Number(e.target.value) }))}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold dark:text-white"
                required
              />
            </div>
            <div className="md:col-span-4 flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-6 py-2.5 text-gray-500 font-black uppercase text-[10px] tracking-widest hover:text-gray-700"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white font-black px-8 py-2.5 rounded-xl uppercase text-[10px] tracking-widest shadow-lg shadow-green-100 dark:shadow-none transition-all"
              >
                {t('common.save')}
              </button>
            </div>
          </form>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-2xl border dark:border-red-800 mb-6 font-bold text-sm">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-slate-950 text-[10px] uppercase font-black text-gray-500 dark:text-slate-500 tracking-[0.2em] border-b dark:border-slate-800">
              <tr>
                <th className="px-8 py-6">{t('products.code')}</th>
                <th className="px-8 py-6">{t('products.name')}</th>
                <th className="px-8 py-6">{t('products.unit')}</th>
                <th className="px-8 py-6">{t('products.price')}</th>
                <th className="px-8 py-6 text-right">{t('products.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-gray-400 italic font-medium">
                    {t('products.empty')}
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.MaSP} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-8 py-6 font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">{product.MaSP}</td>
                    <td className="px-8 py-6 font-black text-gray-900 dark:text-white uppercase tracking-tight">{product.TenSP}</td>
                    <td className="px-8 py-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest italic">{product.DonViTinh}</td>
                    <td className="px-8 py-6 font-black text-gray-900 dark:text-white">
                      {new Intl.NumberFormat(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
                        style: 'currency',
                        currency: i18n.language === 'vi' ? 'VND' : 'USD',
                      }).format(product.GiaNiemYet)}
                    </td>
                    <td className="px-8 py-6 text-right space-x-2">
                      <button
                        onClick={() => navigate(`/products/${encodeURIComponent(product.MaSP)}/inventory`)}
                        className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                        title={t('products.inventory')}
                      >
                        <i className="fas fa-warehouse"></i>
                      </button>
                      {canEditProduct && (
                        <>
                          <button
                            onClick={() => {
                              setIsEditing(true);
                              setFormData(product);
                            }}
                            className="p-2.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                            title={t('products.edit_product')}
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            onClick={() => void handleDelete(product.MaSP)}
                            className="p-2.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                            title={t('common.delete')}
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
