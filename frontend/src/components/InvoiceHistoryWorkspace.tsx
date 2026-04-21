import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';

type EmployeeRole = 'Admin' | 'Provider' | 'Retailer' | 'Staff';

type InvoiceHistoryWorkspaceProps = {
  mode?: 'page' | 'report';
};

type EmployeeRelation = {
  HoTen: string | null;
  role: string | null;
};

type WarehouseRelation = {
  TenKho: string | null;
  KhuVuc: string | null;
};

type InvoiceRow = {
  MaHD: string;
  NgayLap: string;
  MaNV: string;
  MaKho: string;
  TongTien: number | null;
  GhiChu: string | null;
  NHAN_VIEN: EmployeeRelation | EmployeeRelation[] | null;
  KHO: WarehouseRelation | WarehouseRelation[] | null;
};

type ProfileRow = {
  MaNV: string;
  role: EmployeeRole;
  MaKho: string;
  KHO: { KhuVuc: string | null } | { KhuVuc: string | null }[] | null;
};

type InvoiceRecord = {
  maHD: string;
  ngayLap: string;
  maNV: string;
  maKho: string;
  tongTien: number;
  ghiChu: string;
  employeeName: string;
  employeeRole: string;
  warehouseName: string;
  region: string;
};

type RoleProfile = {
  maNV: string;
  role: EmployeeRole;
  maKho: string;
  region: string;
};

const ALLOWED_ROLES: EmployeeRole[] = ['Admin', 'Retailer', 'Staff'];

const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
};

const asSingle = <T,>(value: T | T[] | null | undefined): T | null => {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
};

const toCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

const toDateTime = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));

const csvEscape = (value: string | number) => {
  const text = String(value ?? '');
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const isAutoInvoice = (item: InvoiceRecord) => {
  const note = item.ghiChu.toLowerCase();
  return (
    item.maHD.startsWith('AT-') ||
    note.includes('auto') ||
    note.startsWith('hoa don [') ||
    note.startsWith('hóa đơn [')
  );
};

export default function InvoiceHistoryWorkspace({ mode = 'page' }: InvoiceHistoryWorkspaceProps) {
  const [profile, setProfile] = useState<RoleProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<InvoiceRecord[]>([]);

  const [startDate, setStartDate] = useState(daysAgo(30));
  const [endDate, setEndDate] = useState(today());
  const [regionFilter, setRegionFilter] = useState('ALL');
  const [warehouseFilter, setWarehouseFilter] = useState('ALL');
  const [employeeFilter, setEmployeeFilter] = useState('ALL');
  const [keyword, setKeyword] = useState('');
  const [minTotal, setMinTotal] = useState('');
  const [maxTotal, setMaxTotal] = useState('');
  const [onlyAuto, setOnlyAuto] = useState(false);
  const [sortBy, setSortBy] = useState<'NgayLap' | 'TongTien'>('NgayLap');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      setError(null);
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;

      if (!user) {
        setError('Khong tim thay phien dang nhap.');
        setLoading(false);
        return;
      }

      const metadataRole = (user.user_metadata?.role as EmployeeRole | undefined) ?? 'Staff';
      const { data: profileRow, error: profileError } = await supabase
        .from('NHAN_VIEN')
        .select('MaNV, role, MaKho, KHO!NHAN_VIEN_MaKho_fkey(KhuVuc)')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }

      const typedProfile = profileRow as ProfileRow | null;
      const warehouse = asSingle(typedProfile?.KHO);
      const region = warehouse?.KhuVuc ?? '';

      setProfile({
        maNV: typedProfile?.MaNV ?? '',
        role: typedProfile?.role ?? metadataRole,
        maKho: typedProfile?.MaKho ?? '',
        region,
      });
      setLoading(false);
    };

    void bootstrap();
  }, []);

  const loadData = async () => {
    if (!profile) return;
    if (!ALLOWED_ROLES.includes(profile.role)) {
      setRecords([]);
      return;
    }

    setLoading(true);
    setError(null);

    let allowedWarehouses: string[] | null = null;
    if (profile.role === 'Retailer') {
      const { data: khoRows, error: khoError } = await supabase
        .from('KHO')
        .select('MaKho')
        .eq('KhuVuc', profile.region);
      if (khoError) {
        setError(khoError.message);
        setLoading(false);
        return;
      }
      allowedWarehouses = (khoRows || [])
        .map((item) => item.MaKho)
        .filter((item): item is string => typeof item === 'string' && item.length > 0);
    }

    let query = supabase
      .from('HOA_DON')
      .select('MaHD, NgayLap, MaNV, MaKho, TongTien, GhiChu, NHAN_VIEN!HOA_DON_MaNV_fkey(HoTen, role), KHO!HOA_DON_MaKho_fkey(TenKho, KhuVuc)')
      .gte('NgayLap', `${startDate}T00:00:00`)
      .lte('NgayLap', `${endDate}T23:59:59`)
      .order(sortBy, { ascending: sortDir === 'asc' });

    if (profile.role === 'Staff') {
      query = query.eq('MaNV', profile.maNV);
    } else if (profile.role === 'Retailer') {
      const warehouses = allowedWarehouses || [];
      if (warehouses.length === 0) {
        setRecords([]);
        setLoading(false);
        return;
      }
      query = query.in('MaKho', warehouses);
    }

    const { data, error: invoiceError } = await query;
    if (invoiceError) {
      setError(invoiceError.message);
      setLoading(false);
      return;
    }

    const mapped: InvoiceRecord[] = ((data || []) as InvoiceRow[]).map((item) => {
      const employee = asSingle(item.NHAN_VIEN);
      const warehouse = asSingle(item.KHO);
      return {
        maHD: item.MaHD,
        ngayLap: item.NgayLap,
        maNV: item.MaNV,
        maKho: item.MaKho,
        tongTien: Number(item.TongTien || 0),
        ghiChu: item.GhiChu || '',
        employeeName: employee?.HoTen || 'Unknown',
        employeeRole: employee?.role || '-',
        warehouseName: warehouse?.TenKho || item.MaKho,
        region: warehouse?.KhuVuc || '-',
      };
    });

    setRecords(mapped);
    setLoading(false);
  };

  useEffect(() => {
    if (!profile) return;
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, startDate, endDate, sortBy, sortDir]);

  const regions = useMemo(
    () =>
      Array.from(new Set(records.map((item) => item.region).filter((item) => item && item !== '-'))).sort(),
    [records]
  );

  const warehouses = useMemo(
    () =>
      Array.from(
        new Map(
          records.map((item) => [item.maKho, { maKho: item.maKho, name: item.warehouseName, region: item.region }])
        ).values()
      ),
    [records]
  );

  const employees = useMemo(
    () =>
      Array.from(
        new Map(records.map((item) => [item.maNV, { maNV: item.maNV, name: item.employeeName, role: item.employeeRole }])).values()
      ),
    [records]
  );

  const filteredRecords = useMemo(() => {
    const keywordLower = keyword.trim().toLowerCase();
    const min = minTotal.trim() === '' ? null : Number(minTotal);
    const max = maxTotal.trim() === '' ? null : Number(maxTotal);

    return records.filter((item) => {
      if (regionFilter !== 'ALL' && item.region !== regionFilter) return false;
      if (warehouseFilter !== 'ALL' && item.maKho !== warehouseFilter) return false;
      if (employeeFilter !== 'ALL' && item.maNV !== employeeFilter) return false;
      if (onlyAuto && !isAutoInvoice(item)) return false;
      if (min !== null && Number.isFinite(min) && item.tongTien < min) return false;
      if (max !== null && Number.isFinite(max) && item.tongTien > max) return false;
      if (!keywordLower) return true;

      const haystack = [
        item.maHD,
        item.maNV,
        item.employeeName,
        item.employeeRole,
        item.maKho,
        item.warehouseName,
        item.region,
        item.ghiChu,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(keywordLower);
    });
  }, [records, regionFilter, warehouseFilter, employeeFilter, onlyAuto, minTotal, maxTotal, keyword]);

  const summary = useMemo(() => {
    const count = filteredRecords.length;
    const revenue = filteredRecords.reduce((sum, item) => sum + item.tongTien, 0);
    const avg = count === 0 ? 0 : revenue / count;
    return { count, revenue, avg };
  }, [filteredRecords]);

  const exportCsv = () => {
    const headers = ['MaHD', 'NgayLap', 'KhuVuc', 'MaKho', 'TenKho', 'MaNV', 'NguoiTao', 'RoleNguoiTao', 'TongTien', 'GhiChu'];
    const rows = filteredRecords.map((item) =>
      [
        item.maHD,
        item.ngayLap,
        item.region,
        item.maKho,
        item.warehouseName,
        item.maNV,
        item.employeeName,
        item.employeeRole,
        item.tongTien,
        item.ghiChu,
      ]
        .map(csvEscape)
        .join(',')
    );
    const csv = `${headers.join(',')}\n${rows.join('\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `invoice_history_${today()}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  if (loading && !profile) {
    return <div className="text-center py-10 dark:text-gray-400 italic font-black animate-pulse">Dang tai lich su hoa don...</div>;
  }

  if (!profile) {
    return <div className="text-center py-10 text-red-600 font-bold">Khong xac dinh duoc profile hien tai.</div>;
  }

  if (!ALLOWED_ROLES.includes(profile.role)) {
    return (
      <div className="max-w-3xl mx-auto mt-6 p-8 bg-orange-50 dark:bg-orange-950/20 border-2 border-orange-200 dark:border-orange-900 rounded-3xl text-center">
        <h3 className="text-xl font-black uppercase tracking-tight text-orange-700 dark:text-orange-400">Role khong duoc cap quyen</h3>
        <p className="text-orange-600 dark:text-orange-500/70 font-medium mt-2">Trang nay chi mo cho Admin, Retailer va Staff.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {mode === 'page' && (
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b dark:border-slate-800 pb-5 gap-4">
          <div>
            <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Lich Su Hoa Don</h2>
            <p className="text-gray-500 dark:text-slate-400 font-bold mt-1 uppercase tracking-widest text-[10px]">Invoice History Workspace</p>
          </div>
          <div className="px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-300 text-[10px] font-black uppercase tracking-widest">
            Role: {profile.role} {profile.role !== 'Staff' ? `| Region: ${profile.region || '-'}` : ''}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tu ngay</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold dark:text-white"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Den ngay</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold dark:text-white"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Khu vuc</label>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold dark:text-white"
              disabled={profile.role === 'Retailer'}
            >
              <option value="ALL">Tat ca</option>
              {regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Kho</label>
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold dark:text-white"
            >
              <option value="ALL">Tat ca</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.maKho} value={warehouse.maKho}>
                  {warehouse.maKho} - {warehouse.name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nguoi tao</label>
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold dark:text-white"
              disabled={profile.role === 'Staff'}
            >
              <option value="ALL">Tat ca</option>
              {employees.map((employee) => (
                <option key={employee.maNV} value={employee.maNV}>
                  {employee.maNV} - {employee.name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tim nhanh</label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Ma HD, kho, nhan su..."
              className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold dark:text-white"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tong tien tu</label>
            <input
              type="number"
              value={minTotal}
              onChange={(e) => setMinTotal(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold dark:text-white"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tong tien den</label>
            <input
              type="number"
              value={maxTotal}
              onChange={(e) => setMaxTotal(e.target.value)}
              placeholder="999999999"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold dark:text-white"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'NgayLap' | 'TongTien')}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold dark:text-white"
            >
              <option value="NgayLap">Ngay lap</option>
              <option value="TongTien">Tong tien</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Chieu sap xep</label>
            <select
              value={sortDir}
              onChange={(e) => setSortDir(e.target.value as 'asc' | 'desc')}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold dark:text-white"
            >
              <option value="desc">Giam dan</option>
              <option value="asc">Tang dan</option>
            </select>
          </div>
          <div className="md:col-span-2 flex items-end">
            <label className="inline-flex items-center space-x-2 text-[11px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest">
              <input type="checkbox" checked={onlyAuto} onChange={(e) => setOnlyAuto(e.target.checked)} />
              <span>Chi hoa don auto</span>
            </label>
          </div>
          <div className="md:col-span-4 flex items-end gap-2">
            <button
              onClick={() => void loadData()}
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white font-black py-2.5 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-all uppercase text-[10px] tracking-widest active:scale-95"
            >
              {loading ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-arrows-rotate mr-2"></i>}
              Lam moi
            </button>
            <button
              onClick={exportCsv}
              disabled={filteredRecords.length === 0}
              className="flex-1 bg-emerald-600 text-white font-black py-2.5 rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 dark:shadow-none transition-all uppercase text-[10px] tracking-widest active:scale-95 disabled:opacity-50"
            >
              <i className="fas fa-file-csv mr-2"></i>
              Export CSV
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50 dark:bg-indigo-950/20 p-4">
            <div className="text-[10px] uppercase tracking-widest font-black text-indigo-500">So hoa don</div>
            <div className="text-2xl font-black text-indigo-700 dark:text-indigo-300">{summary.count}</div>
          </div>
          <div className="rounded-2xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/20 p-4">
            <div className="text-[10px] uppercase tracking-widest font-black text-emerald-500">Tong doanh thu</div>
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{toCurrency(summary.revenue)}</div>
          </div>
          <div className="rounded-2xl border border-amber-100 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 p-4">
            <div className="text-[10px] uppercase tracking-widest font-black text-amber-500">Trung binh / hoa don</div>
            <div className="text-2xl font-black text-amber-700 dark:text-amber-300">{toCurrency(summary.avg)}</div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 border border-red-100 dark:border-red-900/40 text-sm font-bold">
            {error}
          </div>
        )}

        <div className="mt-6 overflow-x-auto rounded-2xl border dark:border-slate-800">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-slate-950 text-[10px] uppercase font-black text-gray-500 dark:text-slate-500 tracking-[0.2em] border-b dark:border-slate-800">
              <tr>
                <th className="px-5 py-4">Ma HD</th>
                <th className="px-5 py-4">Ngay lap</th>
                <th className="px-5 py-4">Khu vuc</th>
                <th className="px-5 py-4">Kho</th>
                <th className="px-5 py-4">Nguoi tao</th>
                <th className="px-5 py-4 text-right">Tong tien</th>
                <th className="px-5 py-4">Ghi chu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-gray-400 italic font-medium">
                    Khong co hoa don phu hop bo loc.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item) => (
                  <tr key={item.maHD} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs font-bold">{item.maHD}</td>
                    <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">{toDateTime(item.ngayLap)}</td>
                    <td className="px-5 py-4">
                      <span className="px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-300">
                        {item.region}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm">
                      <div className="font-black text-slate-700 dark:text-slate-200">{item.maKho}</div>
                      <div className="text-xs text-slate-400">{item.warehouseName}</div>
                    </td>
                    <td className="px-5 py-4 text-sm">
                      <div className="font-black text-slate-700 dark:text-slate-200">{item.employeeName}</div>
                      <div className="text-xs text-slate-400">
                        {item.maNV} - {item.employeeRole}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right font-black text-emerald-600 dark:text-emerald-400">{toCurrency(item.tongTien)}</td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      {item.ghiChu ? (
                        <span
                          className={`px-2 py-1 rounded-lg border ${
                            isAutoInvoice(item)
                              ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-900/40'
                              : 'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800'
                          }`}
                        >
                          {item.ghiChu}
                        </span>
                      ) : (
                        '-'
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
