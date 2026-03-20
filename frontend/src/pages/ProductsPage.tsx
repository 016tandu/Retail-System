import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient.ts';

// Define a type for our product data
type Product = {
  MaSP: string;
  TenSP: string;
  DonViTinh: string;
  GiaNiemYet: number;
};

export default function ProductsPage() {
  const { t, i18n } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('SAN_PHAM')
          .select('*');

        if (error) {
          throw error;
        }

        setProducts(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return <p className="text-center text-gray-500">{t('common.loading')}</p>;
  }

  if (error) {
    return <p className="text-center text-red-500">{t('common.error', { message: error })}</p>;
  }

  if (products.length === 0) {
    return <p className="text-center text-gray-500">{t('common.no_data')}</p>;
  }

  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
  const currency = i18n.language === 'vi' ? 'VND' : 'USD';

  return (
    <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
            <th scope="col" className="py-3 px-6">{t('products.code')}</th>
            <th scope="col" className="py-3 px-6">{t('products.name')}</th>
            <th scope="col" className="py-3 px-6">{t('products.unit')}</th>
            <th scope="col" className="py-3 px-6">{t('products.price')}</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.MaSP} className="bg-white border-b hover:bg-gray-50">
              <th scope="row" className="py-4 px-6 font-medium text-gray-900 whitespace-nowrap">
                {product.MaSP}
              </th>
              <td className="py-4 px-6">{product.TenSP}</td>
              <td className="py-4 px-6">{product.DonViTinh}</td>
              <td className="py-4 px-6">{new Intl.NumberFormat(locale, { style: 'currency', currency: currency }).format(product.GiaNiemYet)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
