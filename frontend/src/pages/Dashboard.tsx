import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';

type DashboardData = {
  total_sales: number;
  order_count: number;
  total_stock: number;
  pending_transfers: number;
  top_products: { TenSP: string, total_qty: number }[];
};

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const { data: metrics, error } = await supabase.rpc('get_dashboard_metrics');
        if (error) throw error;
        setData(metrics);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
      style: 'currency',
      currency: i18n.language === 'vi' ? 'VND' : 'USD',
    }).format(value);
  };

  if (loading) return <div className="text-center py-10">{t('common.loading')}</div>;
  if (error) return <div className="text-center py-10 text-red-500">{t('common.error', { message: error })}</div>;
  if (!data) return null;

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-900">{t('dashboard.title')}</h2>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-indigo-500">
          <p className="text-sm font-medium text-gray-500 uppercase">{t('dashboard.today_revenue')}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(data.total_sales)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
          <p className="text-sm font-medium text-gray-500 uppercase">{t('dashboard.today_orders')}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{data.order_count}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
          <p className="text-sm font-medium text-gray-500 uppercase">{t('dashboard.total_stock')}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{data.total_stock}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-yellow-500">
          <p className="text-sm font-medium text-gray-500 uppercase">{t('dashboard.pending_transfers')}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{data.pending_transfers}</p>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-800">{t('dashboard.top_products')}</h3>
        </div>
        <div className="p-0">
          {data.top_products.length === 0 ? (
            <p className="p-6 text-gray-500 italic">{t('dashboard.no_sales_today')}</p>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs font-bold text-gray-600 uppercase">
                <tr>
                  <th className="px-6 py-4">{t('reports.product_name')}</th>
                  <th className="px-6 py-4 text-center">{t('reports.sold_quantity')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.top_products.map((p, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{p.TenSP}</td>
                    <td className="px-6 py-4 text-center font-bold text-indigo-600">{p.total_qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
