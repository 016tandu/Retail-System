import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient.ts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Types
type RevenueReport = { khu_vuc: string; so_don_hang: number; doanh_thu: number };
type InventoryReport = { ma_kho: string; ten_kho: string; khu_vuc: string; so_luong_ton: number };
type TopSellingReport = { masp: string; tensp: string; total_sold: number };
type ProfitabilityReport = { ma_sp: string; ten_sp: string; so_luong_ban: number; doanh_thu: number; gia_von: number; loi_nhuan: number; ty_suat_loi_nhuan: number };

const getToday = () => new Date().toISOString().split('T')[0];

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
  const [activeReport, setActiveReport] = useState<'revenue' | 'inventory' | 'top_selling' | 'profitability'>('revenue');

  // States
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Params
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState(getToday());
  const [region, setRegion] = useState('ALL');
  const [productId, setProductId] = useState('SP001');
  const [limit, setLimit] = useState(5);

  const fetchRevenue = async () => {
    setLoading(true); setData([]);
    const { data, error } = await supabase.rpc('doanh_thu_vung', { start_date: startDate, end_date: endDate, region_code: region });
    if (error) setError(error.message); else setData(data || []);
    setLoading(false);
  };

  const fetchInventory = async () => {
    setLoading(true); setData([]);
    const { data, error } = await supabase.rpc('ton_kho_toan_quoc', { p_masp: productId });
    if (error) setError(error.message); else setData(data || []);
    setLoading(false);
  };

  const fetchTopSelling = async () => {
    setLoading(true); setData([]);
    const { data, error } = await supabase.rpc('top_selling_products', { p_limit: limit });
    if (error) setError(error.message); else setData(data || []);
    setLoading(false);
  };

  const fetchProfitability = async () => {
    setLoading(true); setData([]);
    const { data, error } = await supabase.rpc('calculate_profitability', { p_start_date: startDate, p_end_date: endDate });
    if (error) setError(error.message); else setData(data || []);
    setLoading(false);
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat(i18n.language === 'vi' ? 'vi-VN' : 'en-US', { style: 'currency', currency: i18n.language === 'vi' ? 'VND' : 'USD' }).format(val);

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `TechStore_Report_${activeReport}_${getToday()}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text(`TechStore - ${activeReport.toUpperCase()} REPORT`, 14, 15);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 25);
    
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      const rows = data.map(item => Object.values(item));
      autoTable(doc, { head: [headers], body: rows, startY: 35 });
    }
    doc.save(`TechStore_Report_${activeReport}_${getToday()}.pdf`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b dark:border-slate-800 pb-6">
        <div>
          <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic flex items-center">
            {t('reports.title')}
            <InfoIcon text="Hệ thống báo cáo thông minh: Hỗ trợ phân tích doanh thu, tồn kho và lợi nhuận thực tế của doanh nghiệp." />
          </h2>
          <p className="text-gray-500 dark:text-slate-400 font-bold mt-1 uppercase tracking-widest text-[10px]">Business Intelligence Module</p>
        </div>

        <div className="mt-4 md:mt-0 flex space-x-3 bg-gray-100 dark:bg-slate-900 p-1.5 rounded-2xl border dark:border-slate-800 shadow-inner">
          <button 
            onClick={() => setActiveReport('revenue')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeReport === 'revenue' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-md' : 'text-gray-500'}`}
          >Doanh Thu</button>
          <button 
            onClick={() => setActiveReport('inventory')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeReport === 'inventory' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-md' : 'text-gray-500'}`}
          >Tồn Kho</button>
          <button 
            onClick={() => setActiveReport('top_selling')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeReport === 'top_selling' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-md' : 'text-gray-500'}`}
          >Bán Chạy</button>
          <button 
            onClick={() => setActiveReport('profitability')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeReport === 'profitability' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-md' : 'text-gray-500'}`}
          >Lợi Nhuận</button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800">
        {/* Controls based on active report */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end mb-10">
          {(activeReport === 'revenue' || activeReport === 'profitability') && (
            <>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Từ ngày</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold dark:text-white" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Đến ngày</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold dark:text-white" />
              </div>
            </>
          )}
          {activeReport === 'revenue' && (
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Miền</label>
              <select value={region} onChange={e => setRegion(e.target.value)} className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold dark:text-white">
                <option value="ALL">Tất cả</option>
                <option value="MN">Miền Nam</option>
                <option value="MB">Miền Bắc</option>
                <option value="MT">Miền Trung</option>
              </select>
            </div>
          )}
          {activeReport === 'inventory' && (
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Mã sản phẩm</label>
              <input type="text" value={productId} onChange={e => setProductId(e.target.value)} className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold dark:text-white" placeholder="VD: SP001" />
            </div>
          )}
          {activeReport === 'top_selling' && (
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Số lượng hiển thị</label>
              <input type="number" value={limit} onChange={e => setLimit(Number(e.target.value))} className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold dark:text-white" />
            </div>
          )}

          <div className="flex space-x-2">
            <button 
              onClick={() => {
                if (activeReport === 'revenue') fetchRevenue();
                if (activeReport === 'inventory') fetchInventory();
                if (activeReport === 'top_selling') fetchTopSelling();
                if (activeReport === 'profitability') fetchProfitability();
              }}
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white font-black py-2.5 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-all uppercase text-[10px] tracking-widest active:scale-95"
            >
              {loading ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-magnifying-glass mr-2"></i>}
              Xem báo cáo
            </button>
            {data.length > 0 && (
              <div className="flex space-x-2">
                <button onClick={exportPDF} className="p-2.5 bg-red-50 dark:bg-red-950/20 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all border dark:border-red-900/30" title="Export PDF"><i className="fas fa-file-pdf"></i></button>
                <button onClick={exportExcel} className="p-2.5 bg-green-50 dark:bg-green-950/20 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all border dark:border-green-900/30" title="Export Excel"><i className="fas fa-file-excel"></i></button>
              </div>
            )}
          </div>
        </div>

        {error && <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-2xl border dark:border-red-800 mb-6 font-bold text-sm">⚠️ {error}</div>}

        {/* Data Table */}
        <div className="overflow-x-auto rounded-2xl border dark:border-slate-800">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-slate-950 text-[10px] uppercase font-black text-gray-500 dark:text-slate-500 tracking-[0.2em] border-b dark:border-slate-800">
              {activeReport === 'revenue' && (
                <tr><th className="px-8 py-5">Khu Vực</th><th className="px-8 py-5 text-center">Số đơn hàng</th><th className="px-8 py-5 text-right">Doanh Thu</th></tr>
              )}
              {activeReport === 'inventory' && (
                <tr><th className="px-8 py-5">Mã Kho</th><th className="px-8 py-5">Tên Kho</th><th className="px-8 py-5">Khu vực</th><th className="px-8 py-5 text-center">Số lượng tồn</th></tr>
              )}
              {activeReport === 'top_selling' && (
                <tr><th className="px-8 py-5">Mã SP</th><th className="px-8 py-5">Tên Sản Phẩm</th><th className="px-8 py-5 text-center">Số lượng đã bán</th></tr>
              )}
              {activeReport === 'profitability' && (
                <tr><th className="px-8 py-5">Sản phẩm</th><th className="px-8 py-5 text-center">Đã bán</th><th className="px-8 py-5 text-right">Doanh thu</th><th className="px-8 py-5 text-right">Giá vốn</th><th className="px-8 py-5 text-right">Lợi nhuận</th><th className="px-8 py-5 text-center">Tỷ suất</th></tr>
              )}
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {data.length === 0 ? (
                <tr><td colSpan={10} className="px-8 py-20 text-center text-gray-400 italic font-medium">Chưa có dữ liệu để hiển thị.</td></tr>
              ) : data.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                  {activeReport === 'revenue' && (
                    <><td className="px-8 py-5 font-bold dark:text-white uppercase tracking-tighter">{row.khu_vuc}</td><td className="px-8 py-5 text-center font-mono">{row.so_don_hang}</td><td className="px-8 py-5 text-right font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(row.doanh_thu)}</td></>
                  )}
                  {activeReport === 'inventory' && (
                    <><td className="px-8 py-5 font-mono text-xs">{row.ma_kho}</td><td className="px-8 py-5 font-bold dark:text-white">{row.ten_kho}</td><td className="px-8 py-5 text-gray-500 uppercase font-black text-[9px] tracking-widest">{row.khu_vuc}</td><td className="px-8 py-5 text-center font-black text-indigo-600 dark:text-indigo-400">{row.so_luong_ton}</td></>
                  )}
                  {activeReport === 'top_selling' && (
                    <><td className="px-8 py-5 font-mono text-xs">{row.masp}</td><td className="px-8 py-5 font-bold dark:text-white">{row.tensp}</td><td className="px-8 py-5 text-center font-black text-green-600">{row.total_sold}</td></>
                  )}
                  {activeReport === 'profitability' && (
                    <><td className="px-8 py-5"><div className="font-bold dark:text-white">{row.ten_sp}</div><div className="text-[9px] text-gray-400 font-mono">{row.ma_sp}</div></td><td className="px-8 py-5 text-center font-mono font-bold">{row.so_luong_ban}</td><td className="px-8 py-5 text-right font-bold text-slate-600 dark:text-slate-400 text-xs">{formatCurrency(row.doanh_thu)}</td><td className="px-8 py-5 text-right font-bold text-slate-600 dark:text-slate-400 text-xs">{formatCurrency(row.gia_von)}</td><td className="px-8 py-5 text-right font-black text-green-600">{formatCurrency(row.loi_nhuan)}</td><td className="px-8 py-5 text-center"><span className={`px-2 py-0.5 rounded text-[10px] font-black ${row.ty_suat_loi_nhuan >= 20 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{Number(row.ty_suat_loi_nhuan).toFixed(1)}%</span></td></>
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
