import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient.ts';

// Define a type for the report results
type RevenueReport = {
  khu_vuc: string;
  so_don_hang: number;
  doanh_thu: number;
};
type InventoryReport = {
  ma_kho: string;
  ten_kho: string;
  khu_vuc: string;
  so_luong_ton: number;
};
type TopSellingReport = {
    masp: string;
    tensp: string;
    total_sold: number;
};

// Helper to get today's date in YYYY-MM-DD format
const getToday = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export default function ReportsPage() {
  const { t } = useTranslation();
  // State for Revenue Report
  const [revenueReportData, setRevenueReportData] = useState<RevenueReport[]>([]);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [revenueError, setRevenueError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState(getToday());
  const [region, setRegion] = useState('ALL');

  // State for Inventory Report
  const [inventoryReportData, setInventoryReportData] = useState<InventoryReport[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [productId, setProductId] = useState('SP001');

  // State for Top Selling Report
  const [topSellingReportData, setTopSellingReportData] = useState<TopSellingReport[]>([]);
  const [topSellingLoading, setTopSellingLoading] = useState(false);
  const [topSellingError, setTopSellingError] = useState<string | null>(null);
  const [limit, setLimit] = useState(5);


  const generateRevenueReport = async () => {
    try {
      setRevenueLoading(true);
      setRevenueError(null);
      setRevenueReportData([]);
      const { data, error } = await supabase.rpc('doanh_thu_vung', {
        start_date: startDate,
        end_date: endDate,
        region_code: region,
      });
      if (error) throw error;
      setRevenueReportData(data || []);
    } catch (err: any) {
      setRevenueError(err.message);
    } finally {
      setRevenueLoading(false);
    }
  };

  const generateInventoryReport = async () => {
    if (!productId) {
        setInventoryError("Product ID is required.");
        return;
    }
    try {
      setInventoryLoading(true);
      setInventoryError(null);
      setInventoryReportData([]);
      const { data, error } = await supabase.rpc('ton_kho_toan_quoc', { p_masp: productId });
      if (error) throw error;
      setInventoryReportData(data || []);
    } catch (err: any) {
      setInventoryError(err.message);
    } finally {
      setInventoryLoading(false);
    }
  };

  const generateTopSellingReport = async () => {
    try {
      setTopSellingLoading(true);
      setTopSellingError(null);
      setTopSellingReportData([]);
      const { data, error } = await supabase.rpc('top_selling_products', { p_limit: limit });
      if (error) throw error;
      setTopSellingReportData(data || []);
    } catch (err: any) {
      setTopSellingError(err.message);
    } finally {
        setTopSellingLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Revenue Report Section */}
      <div className="p-4 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">{t('reports.revenue_region')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">{t('common.start_date')}</label>
            <input type="date" id="start-date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
          <div>
            <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">{t('common.end_date')}</label>
            <input type="date" id="end-date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
          <div>
            <label htmlFor="region" className="block text-sm font-medium text-gray-700">{t('reports.region')}</label>
            <select id="region" value={region} onChange={(e) => setRegion(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
              <option value="ALL">{t('common.all')}</option>
              <option value="MN">{t('reports.south')}</option>
              <option value="MB">{t('reports.north')}</option>
              <option value="MT">{t('reports.central')}</option>
            </select>
          </div>
          <button onClick={generateRevenueReport} disabled={revenueLoading} className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 disabled:bg-gray-400">
            {revenueLoading ? t('reports.generating') : t('common.generate')}
          </button>
        </div>
        {revenueError && <p className="text-center text-red-500 mt-4">{t('common.error', { message: revenueError })}</p>}
        {revenueReportData.length > 0 && (
          <div className="mt-6 overflow-x-auto relative shadow-md sm:rounded-lg">
            {/* Revenue Table */}
          </div>
        )}
      </div>

      {/* Inventory Report Section */}
      <div className="p-4 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">{t('reports.inventory_nationwide')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-3">
                <label htmlFor="product-id" className="block text-sm font-medium text-gray-700">{t('products.code')} (e.g., SP001)</label>
                <input type="text" id="product-id" value={productId} onChange={(e) => setProductId(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
            </div>
            <button onClick={generateInventoryReport} disabled={inventoryLoading} className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 disabled:bg-gray-400">
                {inventoryLoading ? t('reports.searching') : t('common.search')}
            </button>
        </div>
        {inventoryError && <p className="text-center text-red-500 mt-4">{t('common.error', { message: inventoryError })}</p>}
        {inventoryReportData.length > 0 && (
          <div className="mt-6 overflow-x-auto relative shadow-md sm:rounded-lg">
            {/* Inventory Table */}
          </div>
        )}
      </div>

      {/* Top Selling Products Report Section */}
      <div className="p-4 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">{t('reports.top_sellers')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-3">
                <label htmlFor="limit" className="block text-sm font-medium text-gray-700">{t('invoice.quantity')}</label>
                <input type="number" id="limit" value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
            </div>
            <button onClick={generateTopSellingReport} disabled={topSellingLoading} className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 disabled:bg-gray-400">
                {topSellingLoading ? t('reports.generating') : t('common.generate')}
            </button>
        </div>
        {topSellingError && <p className="text-center text-red-500 mt-4">{t('common.error', { message: topSellingError })}</p>}
        {topSellingReportData.length > 0 && (
          <div className="mt-6 overflow-x-auto relative shadow-md sm:rounded-lg">
            <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        <th scope="col" className="py-3 px-6">{t('products.code')}</th>
                        <th scope="col" className="py-3 px-6">{t('reports.product_name')}</th>
                        <th scope="col" className="py-3 px-6">{t('reports.sold_quantity')}</th>
                    </tr>
                </thead>
                <tbody>
                    {topSellingReportData.map((row) => (
                        <tr key={row.masp} className="bg-white border-b hover:bg-gray-50">
                            <td className="py-4 px-6">{row.masp}</td>
                            <td className="py-4 px-6">{row.tensp}</td>
                            <td className="py-4 px-6">{row.total_sold}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
