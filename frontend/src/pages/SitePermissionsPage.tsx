import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';

type Retailer = { user_id: string; HoTen: string; MaKho: string };
type Supplier = { MaNCC: string; TenNCC: string; KhuVuc: string };
type Provider = { user_id: string; HoTen: string; MaKho: string };
type Warehouse = {
  MaKho: string;
  TenKho: string;
  KhuVuc: string;
  WarehouseType: 'stock_warehouse' | 'retail_warehouse';
};

type PermissionLink = { id: string; retailer_user_id: string; supplier_ma_ncc: string };
type ProviderWarehouseLink = {
  id: string;
  provider_user_id: string;
  ma_kho: string;
  is_manual: boolean;
  created_at: string;
};

const warehouseTypeLabel = (value: string) => {
  if (value === 'stock_warehouse') return 'stock_warehouse';
  if (value === 'retail_warehouse') return 'retail_warehouse';
  return value;
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

export default function SitePermissionsPage() {
  const { t } = useTranslation();
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [links, setLinks] = useState<PermissionLink[]>([]);

  const [providers, setProviders] = useState<Provider[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [providerWarehouseLinks, setProviderWarehouseLinks] = useState<ProviderWarehouseLink[]>([]);

  const [loading, setLoading] = useState(true);

  const [selectedRetailer, setSelectedRetailer] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');

  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');

  useEffect(() => {
    void fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    const [retRes, suppRes, linkRes, providerRes, warehouseRes, providerWarehouseRes] = await Promise.all([
      supabase.from('NHAN_VIEN').select('user_id, HoTen, MaKho').eq('role', 'Retailer').eq('TrangThai', 'Active'),
      supabase.from('NHA_CUNG_CAP').select('MaNCC, TenNCC, KhuVuc').order('KhuVuc').order('MaNCC'),
      supabase.from('RETAILER_SUPPLIER_LINK').select('*').order('created_at', { ascending: false }),
      supabase.from('NHAN_VIEN').select('user_id, HoTen, MaKho').eq('role', 'Provider').eq('TrangThai', 'Active').not('user_id', 'is', null),
      supabase.from('KHO').select('MaKho, TenKho, KhuVuc, WarehouseType').order('KhuVuc').order('MaKho'),
      supabase.from('PROVIDER_WAREHOUSE_LINK').select('id, provider_user_id, ma_kho, is_manual, created_at').order('created_at', { ascending: false }),
    ]);

    setRetailers((retRes.data || []) as Retailer[]);
    setSuppliers((suppRes.data || []) as Supplier[]);
    setLinks((linkRes.data || []) as PermissionLink[]);
    setProviders((providerRes.data || []) as Provider[]);
    setWarehouses((warehouseRes.data || []) as Warehouse[]);
    setProviderWarehouseLinks((providerWarehouseRes.data || []) as ProviderWarehouseLink[]);

    setLoading(false);
  };

  const linkedWarehouseIds = useMemo(() => {
    return new Set(
      providerWarehouseLinks
        .filter((item) => item.provider_user_id === selectedProvider)
        .map((item) => item.ma_kho)
    );
  }, [providerWarehouseLinks, selectedProvider]);

  const availableWarehouses = useMemo(() => {
    if (!selectedProvider) return warehouses;
    return warehouses.filter((warehouse) => !linkedWarehouseIds.has(warehouse.MaKho));
  }, [warehouses, selectedProvider, linkedWarehouseIds]);

  useEffect(() => {
    if (!selectedWarehouse) return;
    if (!availableWarehouses.some((warehouse) => warehouse.MaKho === selectedWarehouse)) {
      setSelectedWarehouse('');
    }
  }, [availableWarehouses, selectedWarehouse]);

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from('RETAILER_SUPPLIER_LINK').insert({
      retailer_user_id: selectedRetailer,
      supplier_ma_ncc: selectedSupplier,
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert('Cap quyen thanh cong!');
    await fetchData();
  };

  const handleDeleteLink = async (id: string) => {
    if (!window.confirm('Thu hoi quyen cua Retailer nay doi voi Supplier?')) return;
    await supabase.from('RETAILER_SUPPLIER_LINK').delete().eq('id', id);
    await fetchData();
  };

  const handleCreateProviderWarehouseLink = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from('PROVIDER_WAREHOUSE_LINK').insert({
      provider_user_id: selectedProvider,
      ma_kho: selectedWarehouse,
      is_manual: true,
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert('Da them kho lien ket cho Provider.');
    setSelectedWarehouse('');
    await fetchData();
  };

  const handleDeleteProviderWarehouseLink = async (id: string) => {
    const link = providerWarehouseLinks.find((item) => item.id === id);
    if (!link?.is_manual) {
      alert('Default region link khong the xoa o giao dien nay.');
      return;
    }

    if (!window.confirm('Xoa kho lien ket thu cong nay?')) return;

    await supabase.from('PROVIDER_WAREHOUSE_LINK').delete().eq('id', id);
    await fetchData();
  };

  if (loading) return <div className="text-center py-10 dark:text-gray-400 italic">{t('common.loading')}</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex items-center border-b dark:border-slate-800 pb-6">
        <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight italic">Phan Quyen Site</h2>
        <InfoIcon text="Admin co the quan ly 2 nhom lien ket: Retailer-Supplier va Provider-Warehouse. Provider-Warehouse dung cho cross-site transfer theo migration moi." />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 p-8 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-indigo-50 dark:border-slate-800">
          <h3 className="text-lg font-black text-gray-800 dark:text-white uppercase tracking-tight mb-6">Cap quyen Retailer-Supplier</h3>
          <form onSubmit={handleCreateLink} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-2">Chon Retailer</label>
              <select
                value={selectedRetailer}
                onChange={(e) => setSelectedRetailer(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold dark:text-white"
              >
                <option value="">-- Chon Retailer --</option>
                {retailers.map((retailer) => (
                  <option key={retailer.user_id} value={retailer.user_id}>
                    {retailer.HoTen} ({retailer.MaKho})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-2">Chon Supplier</label>
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold dark:text-white"
              >
                <option value="">-- Chon Supplier --</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.MaNCC} value={supplier.MaNCC}>
                    {supplier.TenNCC} ({supplier.KhuVuc})
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-lg hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center">
              <i className="fas fa-link mr-2"></i> Cap quyen truy cap
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
          <div className="p-6 border-b dark:border-slate-800 bg-gray-50 dark:bg-slate-950">
            <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest">Danh sach Retailer-Supplier hien tai</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-[10px] uppercase font-black text-gray-400 dark:text-slate-500 tracking-widest border-b dark:border-slate-800">
                <tr>
                  <th className="px-8 py-4">Retailer</th>
                  <th className="px-8 py-4">Supplier (Authorized)</th>
                  <th className="px-8 py-4 text-right">Thao tac</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {links.map((link) => {
                  const ret = retailers.find((item) => item.user_id === link.retailer_user_id);
                  const supp = suppliers.find((item) => item.MaNCC === link.supplier_ma_ncc);
                  return (
                    <tr key={link.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-8 py-4">
                        <div className="font-bold dark:text-white uppercase">{ret?.HoTen}</div>
                        <div className="text-[9px] text-gray-400 font-mono">Site: {ret?.MaKho}</div>
                      </td>
                      <td className="px-8 py-4 text-sm">
                        <div className="font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter">{supp?.TenNCC}</div>
                        <div className="text-[9px] text-gray-400 uppercase font-black tracking-widest">Vung: {supp?.KhuVuc}</div>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <button onClick={() => void handleDeleteLink(link.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all shadow-sm">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 p-8 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-emerald-50 dark:border-slate-800">
          <h3 className="text-lg font-black text-gray-800 dark:text-white uppercase tracking-tight mb-6">Them kho lien ket cho Provider</h3>
          <p className="text-[11px] text-slate-500 font-bold mb-4">
            Dropdown kho hien thi tat ca kho trong he thong (khong chi 1 site).
          </p>
          <form onSubmit={handleCreateProviderWarehouseLink} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-2">Chon Provider</label>
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold dark:text-white"
              >
                <option value="">-- Chon Provider --</option>
                {providers.map((provider) => (
                  <option key={provider.user_id} value={provider.user_id}>
                    {provider.HoTen} ({provider.MaKho})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-2">Chon Kho</label>
              <select
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold dark:text-white"
              >
                <option value="">-- Chon Kho --</option>
                {availableWarehouses.map((warehouse) => (
                  <option key={warehouse.MaKho} value={warehouse.MaKho}>
                    {warehouse.TenKho} ({warehouse.MaKho}) - {warehouse.KhuVuc} - {warehouseTypeLabel(warehouse.WarehouseType)}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-lg hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center">
              <i className="fas fa-warehouse mr-2"></i> Them lien ket kho
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
          <div className="p-6 border-b dark:border-slate-800 bg-gray-50 dark:bg-slate-950">
            <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest">Danh sach Provider-Warehouse links</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-[10px] uppercase font-black text-gray-400 dark:text-slate-500 tracking-widest border-b dark:border-slate-800">
                <tr>
                  <th className="px-8 py-4">Provider</th>
                  <th className="px-8 py-4">Warehouse</th>
                  <th className="px-8 py-4">Type</th>
                  <th className="px-8 py-4 text-right">Thao tac</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {providerWarehouseLinks.map((link) => {
                  const provider = providers.find((item) => item.user_id === link.provider_user_id);
                  const warehouse = warehouses.find((item) => item.MaKho === link.ma_kho);
                  return (
                    <tr key={link.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-8 py-4">
                        <div className="font-bold dark:text-white uppercase">{provider?.HoTen || link.provider_user_id}</div>
                        <div className="text-[9px] text-gray-400 font-mono">Home: {provider?.MaKho || '-'}</div>
                      </td>
                      <td className="px-8 py-4 text-sm">
                        <div className="font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">{warehouse?.TenKho || link.ma_kho}</div>
                        <div className="text-[9px] text-gray-400 uppercase font-black tracking-widest">
                          {warehouse?.MaKho || link.ma_kho} - {warehouse?.KhuVuc || '-'}
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <span className={`inline-flex px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded ${link.is_manual ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                          {link.is_manual ? 'manual' : 'default'}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-right">
                        {link.is_manual ? (
                          <button onClick={() => void handleDeleteProviderWarehouseLink(link.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all shadow-sm">
                            <i className="fas fa-trash"></i>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Auto</span>
                        )}
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
