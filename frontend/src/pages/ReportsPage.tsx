import { useState } from 'react';
import { supabase } from '../supabaseClient.ts';

// Define a type for the report result
type RevenueReport = {
  khu_vuc: string;
  so_don_hang: number;
  doanh_thu: number;
};

// Helper to get today's date in YYYY-MM-DD format
const getToday = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export default function ReportsPage() {
  const [reportData, setReportData] = useState<RevenueReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState(getToday());
  const [region, setRegion] = useState('ALL');

  const generateReport = async () => {
    try {
      setLoading(true);
      setError(null);
      setReportData([]);

      const { data, error } = await supabase.rpc('doanh_thu_vung', {
        start_date: startDate,
        end_date: endDate,
        region_code: region,
      });

      if (error) {
        throw error;
      }

      setReportData(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderResult = () => {
    if (loading) {
      return <p className="text-center text-gray-500 mt-4">Generating report...</p>;
    }

    if (error) {
      return <p className="text-center text-red-500 mt-4">Error: {error}</p>;
    }
    
    if (reportData.length === 0) {
        return <p className="text-center text-gray-500 mt-4">No data for the selected criteria. Click "Generate Report" to start.</p>;
    }

    return (
        <div className="mt-6 overflow-x-auto relative shadow-md sm:rounded-lg">
            <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        <th scope="col" className="py-3 px-6">Khu Vực</th>
                        <th scope="col" className="py-3 px-6">Số Đơn Hàng</th>
                        <th scope="col" className="py-3 px-6">Tổng Doanh Thu</th>
                    </tr>
                </thead>
                <tbody>
                    {reportData.map((row) => (
                        <tr key={row.khu_vuc} className="bg-white border-b hover:bg-gray-50">
                            <td className="py-4 px-6">{row.khu_vuc}</td>
                            <td className="py-4 px-6">{row.so_don_hang}</td>
                            <td className="py-4 px-6">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(row.doanh_thu)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Báo Cáo Doanh Thu Theo Khu Vực</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">Start Date</label>
          <input type="date" id="start-date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">End Date</label>
          <input type="date" id="end-date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="region" className="block text-sm font-medium text-gray-700">Region</label>
          <select id="region" value={region} onChange={(e) => setRegion(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
            <option value="ALL">All</option>
            <option value="MN">Miền Nam</option>
            <option value="MB">Miền Bắc</option>
            <option value="MT">Miền Trung</option>
          </select>
        </div>
        <button onClick={generateReport} disabled={loading} className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 disabled:bg-gray-400">
          Generate Report
        </button>
      </div>

      {renderResult()}
    </div>
  );
}
