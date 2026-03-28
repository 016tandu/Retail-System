import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';

type Warehouse = {
  MaKho: string;
  TenKho: string;
  KhuVuc: string;
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

export default function WarehouseSettingsPage() {
  const { t } = useTranslation();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Warehouse | null>(null);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    setLoading(true);
    const { data } = await supabase.from('KHO').select('*').order('MaKho');
    setWarehouses(data || []);
    setLoading(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editData) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.rpc('update_warehouse_info', {
        p_ma_kho: editData.MaKho,
        p_ten_kho: editData.TenKho,
        p_khu_vuc: editData.KhuVuc
      });

      if (error) throw error;
      alert('Cập nhật kho thành công!');
      setEditId(null);
      fetchWarehouses();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-10 dark:text-gray-400 italic">{t('common.loading')}</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center border-b dark:border-slate-800 pb-6">
        <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Cấu Hình Kho Hàng</h2>
        <InfoIcon text="Dành cho Nhà cung cấp: Quản lý thông tin định danh và khu vực của các kho/chi nhánh trong hệ thống." />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {warehouses.map(w => (
          <div key={w.MaKho} className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 p-6 transition-all hover:shadow-2xl">
            {editId === w.MaKho ? (
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Mã Kho</label>
                    <div className="px-4 py-2 bg-gray-50 dark:bg-slate-950 rounded-lg text-gray-500 font-mono font-bold border dark:border-slate-800">
                      {w.MaKho}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Tên Kho</label>
                    <input 
                      type="text" 
                      value={editData?.TenKho || ''} 
                      onChange={e => editData && setEditData({...editData, TenKho: e.target.value})}
                      className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Khu Vực</label>
                    <select 
                      value={editData?.KhuVuc || ''} 
                      onChange={e => editData && setEditData({...editData, KhuVuc: e.target.value})}
                      className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-bold"
                    >
                      <option value="MN">Miền Nam</option>
                      <option value="MB">Miền Bắc</option>
                      <option value="MT">Miền Trung</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={() => setEditId(null)} className="px-4 py-2 text-gray-500 font-bold uppercase text-[10px] tracking-widest">Hủy</button>
                  <button type="submit" disabled={submitting} className="px-6 py-2 bg-green-600 text-white font-black rounded-lg uppercase text-[10px] tracking-widest hover:bg-green-700 transition-all">Lưu thay đổi</button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mr-4">
                    <i className="fas fa-warehouse text-xl"></i>
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight">{w.TenKho}</h3>
                    <div className="flex space-x-3 mt-1">
                      <span className="text-[10px] font-bold text-gray-400 font-mono">ID: {w.MaKho}</span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 uppercase">
                        {w.KhuVuc === 'MN' ? 'Miền Nam' : w.KhuVuc === 'MB' ? 'Miền Bắc' : 'Miền Trung'}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => { setEditId(w.MaKho); setEditData(w); }} 
                  className="p-3 bg-gray-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                >
                  <i className="fas fa-edit"></i>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
