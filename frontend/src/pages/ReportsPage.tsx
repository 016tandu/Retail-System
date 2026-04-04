import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient.ts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

type RevenueReport = { khu_vuc: string; so_don_hang: number; doanh_thu: number };
type InventoryReport = { ma_kho: string; ten_kho: string; khu_vuc: string; so_luong_ton: number };
type TopSellingReport = { masp: string; tensp: string; total_sold: number };
type ProfitabilityReport = {
  ma_sp: string;
  ten_sp: string;
  so_luong_ban: number;
  doanh_thu: number;
  gia_von: number;
  loi_nhuan: number;
  ty_suat_loi_nhuan: number;
};

type ReportRow = Record<string, unknown>;
type ReportType = 'revenue' | 'inventory' | 'top_selling' | 'profitability';
type ProductOption = { MaSP: string; TenSP: string };

const getToday = () => new Date().toISOString().split('T')[0];
const toText = (value: unknown) => (value === null || value === undefined ? '' : String(value));

const InfoIcon = ({ text }: { text: string }) => (
  <div className="group relative inline-block ml-2">
    <span className="cursor-help text-gray-400 bg-gray-100 dark:bg-slate-800 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold border border-gray-200 dark:border-gray-700">i</span>
    <div className="invisible group-hover:visible absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-50 opacity-95 transition-all">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
    </div>
  </div>
);

export default function ReportsPage() {
  const { t, i18n } = useTranslation();
  const [activeReport, setActiveReport] = useState<ReportType>('revenue');
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('Staff');

  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState(getToday());
  const [region, setRegion] = useState('ALL');
  const [productId, setProductId] = useState('');
  const [limit, setLimit] = useState(5);

  const [products, setProducts] = useState<ProductOption[]>([]);
  const [productQuery, setProductQuery] = useState('');

  const [showPreview, setShowPreview] = useState(false);
  const [pdfOrientation, setPdfOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [sheetName, setSheetName] = useState('Report');
  const [includeTimestamp, setIncludeTimestamp] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;

      if (user) {
        const { data: profile } = await supabase
          .from('NHAN_VIEN')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();
        setUserRole(profile?.role || user.user_metadata?.role || 'Staff');
      } else {
        setUserRole('Staff');
      }

      const { data } = await supabase.from('SAN_PHAM').select('MaSP, TenSP').order('MaSP');
      setProducts((data || []) as ProductOption[]);
    };
    bootstrap();
  }, []);

  const filteredProducts = useMemo(() => {
    const needle = productQuery.trim().toLowerCase();
    if (!needle) return products;
    return products.filter((p) => `${p.MaSP} ${p.TenSP}`.toLowerCase().includes(needle));
  }, [products, productQuery]);

  const isProvider = userRole === 'Provider';
  const effectiveReport: ReportType = isProvider ? 'inventory' : activeReport;

  const reportTitle = useMemo(() => {
    if (effectiveReport === 'revenue') return 'Doanh Thu';
    if (effectiveReport === 'inventory') return 'Tồn Kho';
    if (effectiveReport === 'top_selling') return 'Bán Chạy';
    return 'Lợi Nhuận';
  }, [effectiveReport]);

  const formatCurrency = (value: unknown) => {
    const numeric = Number(value || 0);
    return new Intl.NumberFormat(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
      style: 'currency',
      currency: i18n.language === 'vi' ? 'VND' : 'USD',
    }).format(numeric);
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setRows([]);

    if (effectiveReport === 'revenue') {
      const { data, error: rpcError } = await supabase.rpc('doanh_thu_vung', {
        start_date: startDate,
        end_date: endDate,
        region_code: region,
      });
      if (rpcError) setError(rpcError.message);
      else setRows((data || []) as ReportRow[]);
    }

    if (effectiveReport === 'inventory') {
      const { data, error: rpcError } = await supabase.rpc('ton_kho_toan_quoc', {
        p_masp: productId || null,
      });
      if (rpcError) setError(rpcError.message);
      else setRows((data || []) as ReportRow[]);
    }

    if (effectiveReport === 'top_selling') {
      const { data, error: rpcError } = await supabase.rpc('top_selling_products', { p_limit: limit });
      if (rpcError) setError(rpcError.message);
      else setRows((data || []) as ReportRow[]);
    }

    if (effectiveReport === 'profitability') {
      const { data, error: rpcError } = await supabase.rpc('calculate_profitability', {
        p_start_date: startDate,
        p_end_date: endDate,
      });
      if (rpcError) setError(rpcError.message);
      else setRows((data || []) as ReportRow[]);
    }

    setLoading(false);
  };

  const exportBaseName = useMemo(() => {
    const timestamp = includeTimestamp
      ? `_${new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '')}`
      : '';
    return `TechStore_${effectiveReport}${timestamp}`;
  }, [effectiveReport, includeTimestamp]);

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName || 'Report');
    XLSX.writeFile(wb, `${exportBaseName}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: pdfOrientation });
    doc.text(`TechStore - ${reportTitle.toUpperCase()} REPORT`, 14, 15);
    if (includeTimestamp) doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 23);

    if (rows.length > 0) {
      const headers = Object.keys(rows[0]);
      const body = rows.map((item) => headers.map((header) => toText(item[header])));
      autoTable(doc, {
        head: [headers],
        body,
        startY: includeTimestamp ? 30 : 22,
      });
    }

    doc.save(`${exportBaseName}.pdf`);
  };

  const previewHeaders = rows.length > 0 ? Object.keys(rows[0]) : [];
  const previewRows = rows.slice(0, 8);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b dark:border-slate-800 pb-6 gap-4">
        <div>
          <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic flex items-center">
            {t('reports.title')}
            <InfoIcon text="Hệ thống báo cáo thông minh: phân tích doanh thu, tồn kho, sản phẩm bán chạy và lợi nhuận." />
          </h2>
          <p className="text-gray-500 dark:text-slate-400 font-bold mt-1 uppercase tracking-widest text-[10px]">Business Intelligence Module</p>
        </div>

        <div className="w-full md:w-72">
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Loại báo cáo</label>
          <select
            value={effectiveReport}
            onChange={(e) => {
              setActiveReport(e.target.value as ReportType);
              setRows([]);
              setError(null);
              setShowPreview(false);
            }}
            disabled={isProvider}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold dark:text-white"
          >
            <option value="revenue">Doanh Thu</option>
            <option value="inventory">Tồn Kho</option>
            <option value="top_selling">Bán Chạy</option>
            <option value="profitability">Lợi Nhuận</option>
          </select>
          {isProvider && (
            <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-indigo-500">
              Provider chi xem duoc report ton kho.
            </p>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end mb-6">
          {(effectiveReport === 'revenue' || effectiveReport === 'profitability') && (
            <>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Từ ngày</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Đến ngày</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold dark:text-white"
                />
              </div>
            </>
          )}

          {effectiveReport === 'revenue' && (
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Miền</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold dark:text-white"
              >
                <option value="ALL">Tất cả</option>
                <option value="MN">Miền Nam</option>
                <option value="MB">Miền Bắc</option>
                <option value="MT">Miền Trung</option>
              </select>
            </div>
          )}

          {effectiveReport === 'inventory' && (
            <div className="md:col-span-2 grid grid-cols-1 gap-3">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tìm sản phẩm (mã + tên)</label>
                <input
                  type="text"
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold dark:text-white"
                  placeholder="Ví dụ: SP001 hoặc Bàn phím..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Chọn sản phẩm</label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold dark:text-white"
                >
                  <option value="">Tất cả sản phẩm</option>
                  {filteredProducts.map((product) => (
                    <option key={product.MaSP} value={product.MaSP}>
                      {product.MaSP} - {product.TenSP}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {effectiveReport === 'top_selling' && (
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Số lượng hiển thị</label>
              <input
                type="number"
                min={1}
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value) || 1)}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold dark:text-white"
              />
            </div>
          )}

          <div className="flex space-x-2">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white font-black py-2.5 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-all uppercase text-[10px] tracking-widest active:scale-95"
            >
              {loading ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-magnifying-glass mr-2"></i>}
              Xem báo cáo
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">PDF orientation</label>
            <select
              value={pdfOrientation}
              onChange={(e) => setPdfOrientation(e.target.value as 'portrait' | 'landscape')}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold dark:text-white"
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Excel sheet name</label>
            <input
              type="text"
              value={sheetName}
              onChange={(e) => setSheetName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold dark:text-white"
            />
          </div>
          <div className="flex items-end">
            <label className="inline-flex items-center space-x-3 text-[11px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest">
              <input type="checkbox" checked={includeTimestamp} onChange={(e) => setIncludeTimestamp(e.target.checked)} />
              <span>Include timestamp</span>
            </label>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowPreview((prev) => !prev)}
              disabled={rows.length === 0}
              className="flex-1 p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border dark:border-slate-700 text-xs font-black uppercase tracking-widest"
            >
              Preview
            </button>
            <button
              onClick={exportPDF}
              disabled={rows.length === 0}
              className="p-2.5 bg-red-50 dark:bg-red-950/20 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all border dark:border-red-900/30"
              title="Export PDF"
            >
              <i className="fas fa-file-pdf"></i>
            </button>
            <button
              onClick={exportExcel}
              disabled={rows.length === 0}
              className="p-2.5 bg-green-50 dark:bg-green-950/20 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all border dark:border-green-900/30"
              title="Export Excel"
            >
              <i className="fas fa-file-excel"></i>
            </button>
          </div>
        </div>

        {showPreview && rows.length > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-widest">
                Preview ({Math.min(rows.length, 8)}/{rows.length} rows)
              </h4>
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">
                {reportTitle}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr>
                    {previewHeaders.map((header) => (
                      <th key={header} className="px-3 py-2 uppercase text-[10px] tracking-widest text-slate-500">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, idx) => (
                    <tr key={idx} className="border-t border-indigo-100/70 dark:border-indigo-900/30">
                      {previewHeaders.map((header) => (
                        <td key={`${idx}-${header}`} className="px-3 py-2 dark:text-slate-200">
                          {toText(row[header])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {error && <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-2xl border dark:border-red-800 mb-6 font-bold text-sm">⚠️ {error}</div>}

        <div className="overflow-x-auto rounded-2xl border dark:border-slate-800">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-slate-950 text-[10px] uppercase font-black text-gray-500 dark:text-slate-500 tracking-[0.2em] border-b dark:border-slate-800">
              {effectiveReport === 'revenue' && (
                <tr>
                  <th className="px-8 py-5">Khu Vực</th>
                  <th className="px-8 py-5 text-center">Số đơn hàng</th>
                  <th className="px-8 py-5 text-right">Doanh thu</th>
                </tr>
              )}
              {effectiveReport === 'inventory' && (
                <tr>
                  <th className="px-8 py-5">Mã Kho</th>
                  <th className="px-8 py-5">Tên Kho</th>
                  <th className="px-8 py-5">Khu vực</th>
                  <th className="px-8 py-5 text-center">Số lượng tồn</th>
                </tr>
              )}
              {effectiveReport === 'top_selling' && (
                <tr>
                  <th className="px-8 py-5">Mã SP</th>
                  <th className="px-8 py-5">Tên Sản Phẩm</th>
                  <th className="px-8 py-5 text-center">Số lượng đã bán</th>
                </tr>
              )}
              {effectiveReport === 'profitability' && (
                <tr>
                  <th className="px-8 py-5">Sản phẩm</th>
                  <th className="px-8 py-5 text-center">Đã bán</th>
                  <th className="px-8 py-5 text-right">Doanh thu</th>
                  <th className="px-8 py-5 text-right">Giá vốn</th>
                  <th className="px-8 py-5 text-right">Lợi nhuận</th>
                  <th className="px-8 py-5 text-center">Tỷ suất</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-8 py-20 text-center text-gray-400 italic font-medium">Chưa có dữ liệu để hiển thị.</td>
                </tr>
              ) : rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                  {effectiveReport === 'revenue' && (() => {
                    const revenueRow = row as RevenueReport;
                    return (
                      <>
                        <td className="px-8 py-5 font-bold dark:text-white uppercase tracking-tighter">{revenueRow.khu_vuc}</td>
                        <td className="px-8 py-5 text-center font-mono">{revenueRow.so_don_hang}</td>
                        <td className="px-8 py-5 text-right font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(revenueRow.doanh_thu)}</td>
                      </>
                    );
                  })()}

                  {effectiveReport === 'inventory' && (() => {
                    const inventoryRow = row as InventoryReport;
                    return (
                      <>
                        <td className="px-8 py-5 font-mono text-xs">{inventoryRow.ma_kho}</td>
                        <td className="px-8 py-5 font-bold dark:text-white">{inventoryRow.ten_kho}</td>
                        <td className="px-8 py-5 text-gray-500 uppercase font-black text-[9px] tracking-widest">{inventoryRow.khu_vuc}</td>
                        <td className="px-8 py-5 text-center font-black text-indigo-600 dark:text-indigo-400">{inventoryRow.so_luong_ton}</td>
                      </>
                    );
                  })()}

                  {effectiveReport === 'top_selling' && (() => {
                    const topSellingRow = row as TopSellingReport;
                    return (
                      <>
                        <td className="px-8 py-5 font-mono text-xs">{topSellingRow.masp}</td>
                        <td className="px-8 py-5 font-bold dark:text-white">{topSellingRow.tensp}</td>
                        <td className="px-8 py-5 text-center font-black text-green-600">{topSellingRow.total_sold}</td>
                      </>
                    );
                  })()}

                  {effectiveReport === 'profitability' && (() => {
                    const profitabilityRow = row as ProfitabilityReport;
                    return (
                      <>
                        <td className="px-8 py-5">
                          <div className="font-bold dark:text-white">{profitabilityRow.ten_sp}</div>
                          <div className="text-[9px] text-gray-400 font-mono">{profitabilityRow.ma_sp}</div>
                        </td>
                        <td className="px-8 py-5 text-center font-mono font-bold">{profitabilityRow.so_luong_ban}</td>
                        <td className="px-8 py-5 text-right font-bold text-slate-600 dark:text-slate-400 text-xs">{formatCurrency(profitabilityRow.doanh_thu)}</td>
                        <td className="px-8 py-5 text-right font-bold text-slate-600 dark:text-slate-400 text-xs">{formatCurrency(profitabilityRow.gia_von)}</td>
                        <td className="px-8 py-5 text-right font-black text-green-600">{formatCurrency(profitabilityRow.loi_nhuan)}</td>
                        <td className="px-8 py-5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${Number(profitabilityRow.ty_suat_loi_nhuan) >= 20 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {Number(profitabilityRow.ty_suat_loi_nhuan).toFixed(1)}%
                          </span>
                        </td>
                      </>
                    );
                  })()}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


