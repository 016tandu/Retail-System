import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';

type Product = {
  MaSP: string;
  TenSP: string;
  DonViTinh: string;
  GiaNiemYet: number;
};

type UserProfile = {
  role: 'Admin' | 'Provider' | 'Retailer' | 'Staff' | string;
  MaKho: string;
  HoTen: string;
};

type Warehouse = {
  MaKho: string;
  TenKho: string;
  KhuVuc: string;
  WarehouseType: 'stock_warehouse' | 'retail_warehouse' | string;
};

type StockRow = {
  MaKho: string;
  MaSP: string;
  SoLuongTon: number;
  LastUpdated: string | null;
};

type DisplayRow = {
  MaKho: string;
  TenKho: string;
  KhuVuc: string;
  WarehouseType: string;
  currentQty: number;
  lastUpdated: string | null;
  editable: boolean;
};

const InfoIcon = ({ text }: { text: string }) => (
  <div className="group relative inline-block ml-2">
    <span className="cursor-help text-gray-400 bg-gray-100 dark:bg-slate-800 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold border border-gray-200 dark:border-gray-700">i</span>
    <div className="invisible group-hover:visible absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-80 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-50 opacity-95 transition-all">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
    </div>
  </div>
);

const warehouseTypeLabel = (warehouseType: string) => {
  if (warehouseType === 'stock_warehouse') return 'stock_warehouse';
  if (warehouseType === 'retail_warehouse') return 'retail_warehouse';
  return warehouseType || '-';
};

const formatDateTime = (value: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
};

export default function ProductInventoryPage() {
  const { t } = useTranslation();
  const { maSP } = useParams<{ maSP: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [product, setProduct] = useState<Product | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [rows, setRows] = useState<DisplayRow[]>([]);
  const [draftQuantities, setDraftQuantities] = useState<Record<string, string>>({});

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmReason, setConfirmReason] = useState('');

  const canEditInventory = profile?.role === 'Admin' || profile?.role === 'Provider' || profile?.role === 'Supplier';

  const changedRows = useMemo(() => {
    return rows
      .filter((row) => row.editable)
      .map((row) => {
        const rawValue = draftQuantities[row.MaKho];
        const parsed = Number(rawValue);
        const nextQty = Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : row.currentQty;
        return { row, nextQty };
      })
      .filter(({ row, nextQty }) => nextQty !== row.currentQty);
  }, [rows, draftQuantities]);

  const regionSummaries = useMemo(() => {
    const regionMap = new Map<string, number>();
    rows.forEach((row) => {
      const current = regionMap.get(row.KhuVuc) || 0;
      regionMap.set(row.KhuVuc, current + row.currentQty);
    });
    return Array.from(regionMap.entries()).map(([region, qty]) => ({ region, qty }));
  }, [rows]);

  useEffect(() => {
    void fetchPageData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maSP]);

  const fetchPageData = async () => {
    if (!maSP) {
      setError('Missing product id.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError(t('common.auth_error'));
      setLoading(false);
      return;
    }

    const [productRes, profileRes, warehouseRes, stockRes] = await Promise.all([
      supabase.from('SAN_PHAM').select('MaSP, TenSP, DonViTinh, GiaNiemYet').eq('MaSP', maSP).maybeSingle(),
      supabase.from('NHAN_VIEN').select('role, MaKho, HoTen').eq('user_id', user.id).maybeSingle(),
      supabase.from('KHO').select('MaKho, TenKho, KhuVuc, WarehouseType').order('KhuVuc').order('MaKho'),
      supabase.from('TON_KHO').select('MaKho, MaSP, SoLuongTon, LastUpdated').eq('MaSP', maSP),
    ]);

    if (productRes.error) {
      setError(productRes.error.message);
      setLoading(false);
      return;
    }
    if (!productRes.data) {
      setError(t('common.no_data'));
      setLoading(false);
      return;
    }

    if (profileRes.error || !profileRes.data) {
      setError(profileRes.error?.message || t('common.employee_error'));
      setLoading(false);
      return;
    }

    if (warehouseRes.error) {
      setError(warehouseRes.error.message);
      setLoading(false);
      return;
    }

    if (stockRes.error) {
      setError(stockRes.error.message);
      setLoading(false);
      return;
    }

    const currentProfile = profileRes.data as UserProfile;
    const warehouses = (warehouseRes.data || []) as Warehouse[];
    const stockRows = (stockRes.data || []) as StockRow[];

    const warehouseMap = new Map<string, Warehouse>();
    warehouses.forEach((item) => warehouseMap.set(item.MaKho, item));

    const stockMap = new Map<string, StockRow>();
    stockRows.forEach((item) => stockMap.set(item.MaKho, item));

    const ownWarehouse = warehouseMap.get(currentProfile.MaKho);
    const ownRegion = ownWarehouse?.KhuVuc || null;

    let candidateWarehouses: Warehouse[] = [];

    if (currentProfile.role === 'Admin') {
      const stockWarehouses = warehouses.filter((item) => item.WarehouseType === 'stock_warehouse');
      candidateWarehouses = stockWarehouses.length > 0 ? stockWarehouses : warehouses;
    } else if (currentProfile.role === 'Provider' || currentProfile.role === 'Supplier') {
      if (ownWarehouse) {
        candidateWarehouses = [ownWarehouse];
      } else {
        candidateWarehouses = [
          {
            MaKho: currentProfile.MaKho,
            TenKho: currentProfile.MaKho,
            KhuVuc: '-',
            WarehouseType: '-',
          },
        ];
      }
    } else {
      candidateWarehouses = ownRegion
        ? warehouses.filter((item) => item.KhuVuc === ownRegion)
        : ownWarehouse
          ? [ownWarehouse]
          : [];
    }

    const displayRows: DisplayRow[] = candidateWarehouses.map((warehouse) => {
      const stock = stockMap.get(warehouse.MaKho);
      const currentQty = stock?.SoLuongTon ?? 0;
      return {
        MaKho: warehouse.MaKho,
        TenKho: warehouse.TenKho,
        KhuVuc: warehouse.KhuVuc,
        WarehouseType: warehouse.WarehouseType,
        currentQty,
        lastUpdated: stock?.LastUpdated || null,
        editable:
          currentProfile.role === 'Admin' ||
          ((currentProfile.role === 'Provider' || currentProfile.role === 'Supplier') && warehouse.MaKho === currentProfile.MaKho),
      };
    });

    const nextDrafts: Record<string, string> = {};
    displayRows.forEach((row) => {
      nextDrafts[row.MaKho] = String(row.currentQty);
    });

    setProduct(productRes.data as Product);
    setProfile(currentProfile);
    setRows(displayRows);
    setDraftQuantities(nextDrafts);
    setLoading(false);
  };

  const openConfirmModal = () => {
    if (!canEditInventory) return;
    if (changedRows.length === 0) {
      window.alert(t('product_inventory.no_change_detected'));
      return;
    }
    setShowConfirmModal(true);
  };

  const saveInventoryChanges = async () => {
    if (!maSP || !canEditInventory || changedRows.length === 0) return;
    if (!confirmReason.trim()) {
      window.alert(t('product_inventory.reason_required'));
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = changedRows.map(({ row, nextQty }) => ({
        MaKho: row.MaKho,
        MaSP: maSP,
        SoLuongTon: nextQty,
        LastUpdated: new Date().toISOString(),
      }));

      const { error: upsertError } = await supabase
        .from('TON_KHO')
        .upsert(payload, { onConflict: 'MaKho,MaSP' });

      if (upsertError) throw upsertError;

      setShowConfirmModal(false);
      setConfirmReason('');
      window.alert(t('product_inventory.save_success'));
      await fetchPageData();
    } catch (err: any) {
      setError(err?.message || 'Unknown error while saving inventory.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10 dark:text-gray-400 italic font-black animate-pulse">{t('common.loading')}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b dark:border-slate-800 pb-6 gap-3">
        <div>
          <div className="flex items-center">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
              {t('product_inventory.title')}
            </h2>
            <InfoIcon text={t('product_inventory.info_text')} />
          </div>
          <p className="text-gray-500 dark:text-slate-400 font-bold mt-1 uppercase tracking-widest text-[10px]">
            {product?.TenSP || '-'} ({product?.MaSP || '-'})
          </p>
        </div>
        <Link
          to="/products"
          className="inline-flex items-center px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-sm font-black uppercase tracking-widest text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
        >
          <i className="fas fa-arrow-left mr-2"></i>
          {t('common.back')}
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-2xl border dark:border-red-800 text-sm font-bold">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {regionSummaries.length === 0 ? (
          <div className="md:col-span-3 p-4 rounded-2xl bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 text-sm font-bold text-gray-500">
            {t('product_inventory.no_inventory_in_scope')}
          </div>
        ) : (
          regionSummaries.map((summary) => (
            <div key={summary.region} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black">{t('product_inventory.region')}</p>
              <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">{summary.region}</p>
              <p className="text-xs text-gray-500 font-bold mt-1">
                {t('product_inventory.total_stock_label')}: {summary.qty}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-slate-950 text-[10px] uppercase font-black text-gray-500 dark:text-slate-500 tracking-[0.2em] border-b dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">{t('product_inventory.region')}</th>
                <th className="px-6 py-4">{t('product_inventory.warehouse')}</th>
                <th className="px-6 py-4">{t('product_inventory.warehouse_type')}</th>
                <th className="px-6 py-4">{t('product_inventory.current_stock')}</th>
                <th className="px-6 py-4">{t('product_inventory.edit_stock')}</th>
                <th className="px-6 py-4">{t('product_inventory.last_updated')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-gray-400 italic font-medium">
                    {t('product_inventory.no_inventory_in_scope')}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.MaKho} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-black text-gray-900 dark:text-white uppercase">{row.KhuVuc || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-800 dark:text-gray-100 uppercase">{row.TenKho || row.MaKho}</div>
                      <div className="text-[10px] font-mono text-gray-400">{row.MaKho}</div>
                    </td>
                    <td className="px-6 py-4 text-xs uppercase font-black text-teal-700 dark:text-teal-300">
                      {warehouseTypeLabel(row.WarehouseType)}
                    </td>
                    <td className="px-6 py-4 font-black text-indigo-600 dark:text-indigo-400">{row.currentQty}</td>
                    <td className="px-6 py-4">
                      {row.editable ? (
                        <input
                          type="number"
                          min={0}
                          value={draftQuantities[row.MaKho] ?? String(row.currentQty)}
                          onChange={(e) => setDraftQuantities((prev) => ({ ...prev, [row.MaKho]: e.target.value }))}
                          className="w-28 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-950 text-sm font-black outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                        />
                      ) : (
                        <span className="text-sm font-bold text-gray-500">{t('product_inventory.read_only')}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 font-mono">{formatDateTime(row.lastUpdated)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {canEditInventory && (
        <div className="flex justify-end">
          <button
            onClick={openConfirmModal}
            disabled={saving}
            className="inline-flex items-center px-6 py-3 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest text-[11px] hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            <i className="fas fa-floppy-disk mr-2"></i>
            {t('product_inventory.save_button')}
          </button>
        </div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => {
              if (!saving) setShowConfirmModal(false);
            }}
          ></div>
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">
              {t('product_inventory.confirm_title')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
              {t('product_inventory.confirm_description')}
            </p>
            <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-700 px-4 py-3 text-xs font-bold">
              {t('product_inventory.confirm_warning')}
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest font-black text-gray-500 mb-2">
                {t('product_inventory.reason_label')}
              </label>
              <textarea
                value={confirmReason}
                onChange={(e) => setConfirmReason(e.target.value)}
                rows={3}
                placeholder={t('product_inventory.reason_placeholder')}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-950 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={saving}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-200 font-black uppercase text-[10px] tracking-widest disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => void saveInventoryChanges()}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[10px] tracking-widest disabled:opacity-50"
              >
                {saving ? t('common.loading') : t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
