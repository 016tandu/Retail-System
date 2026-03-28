import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';

type Retailer = { user_id: string; HoTen: string; MaKho: string };
type Supplier = { MaNCC: string; TenNCC: string; KhuVuc: string };
type PermissionLink = { id: string; retailer_user_id: string; supplier_ma_ncc: string };

const InfoIcon = ({ text }: { text: string }) => (
  <div className="group relative inline-block ml-2">
    <span className="cursor-help text-gray-400 bg-gray-100 dark:bg-slate-800 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold border border-gray-200 dark:border-gray-700">i</span>
    <div className="invisible group-hover:visible absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-50 opacity-95 transition-all">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
    </div>
  </div>
);

export default function SitePermissionsPage() {
  const { t } = useTranslation();
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [links, setLinks] = useState<PermissionLink[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedRetailer, setSelectedRetailer] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: retData } = await supabase.from('NHAN_VIEN').select('user_id, HoTen, MaKho').eq('role', 'Retailer');
    const { data: suppData } = await supabase.from('NHA_CUNG_CAP').select('MaNCC, TenNCC, KhuVuc');
    const { data: linkData } = await supabase.from('RETAILER_SUPPLIER_LINK').select('*');

    setRetailers(retData || []);
    setSuppliers(suppData || []);
    setLinks(linkData || []);
    setLoading(false);
  };

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('RETAILER_SUPPLIER_LINK').insert({
      retailer_user_id: selectedRetailer,
      supplier_ma_ncc: selectedSupplier
    });

    if (error) alert(error.message);
    else {
      alert('Cấp quyền thành công!');
      fetchData();
    }
  };

  const handleDeleteLink = async (id: string) => {
    if (!window.confirm('Thu hồi quyền của Retailer này đối với Supplier?')) return;
    await supabase.from('RETAILER_SUPPLIER_LINK').delete().eq('id', id);
    fetchData();
  };

  if (loading) return <div className="text-center py-10 dark:text-gray-400 italic">{t('common.loading')}</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex items-center border-b dark:border-slate-800 pb-6">
        <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight italic">Phân Quyền Chi Nhánh</h2>
        <InfoIcon text="Dành cho Admin: Thiết lập mối quan hệ giữa Quản lý chi nhánh (Retailer) và Nhà cung cấp (Supplier). Retailer chỉ có thể xem và nhận hàng từ các Supplier đã được cấp quyền tại đây." />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 p-8 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-indigo-50 dark:border-slate-800">
          <h3 className="text-lg font-black text-gray-800 dark:text-white uppercase tracking-tight mb-6">Cấp quyền mới</h3>
          <form onSubmit={handleCreateLink} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-2">Chọn Retailer</label>
              <select value={selectedRetailer} onChange={e => setSelectedRetailer(e.target.value)} required className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold dark:text-white">
                <option value="">-- Chọn Retailer --</option>
                {retailers.map(r => <option key={r.user_id} value={r.user_id}>{r.HoTen} ({r.MaKho})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-2">Chọn Supplier</label>
              <select value={selectedSupplier} onChange={e => setSelectedSupplier(e.target.value)} required className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold dark:text-white">
                <option value="">-- Chọn Supplier --</option>
                {suppliers.map(s => <option key={s.MaNCC} value={s.MaNCC}>{s.TenNCC} ({s.KhuVuc})</option>)}
              </select>
            </div>
            <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-lg hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center">
              <i className="fas fa-link mr-2"></i> Cấp quyền truy cập
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
          <div className="p-6 border-b dark:border-slate-800 bg-gray-50 dark:bg-slate-950">
            <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest">Danh sách quyền hiện tại</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-[10px] uppercase font-black text-gray-400 dark:text-slate-500 tracking-widest border-b dark:border-slate-800">
                <tr>
                  <th className="px-8 py-4">Retailer</th>
                  <th className="px-8 py-4">Supplier (Authorized)</th>
                  <th className="px-8 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {links.map(link => {
                  const ret = retailers.find(r => r.user_id === link.retailer_user_id);
                  const supp = suppliers.find(s => s.MaNCC === link.supplier_ma_ncc);
                  return (
                    <tr key={link.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-8 py-4">
                        <div className="font-bold dark:text-white uppercase">{ret?.HoTen}</div>
                        <div className="text-[9px] text-gray-400 font-mono">Site: {ret?.MaKho}</div>
                      </td>
                      <td className="px-8 py-4 text-sm">
                        <div className="font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter">{supp?.TenNCC}</div>
                        <div className="text-[9px] text-gray-400 uppercase font-black tracking-widest">Vùng: {supp?.KhuVuc}</div>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <button onClick={() => handleDeleteLink(link.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all shadow-sm">
                          <i className="fas fa-unlink"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
