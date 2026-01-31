import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient.ts';

// Define a type for our supplier data
type Supplier = {
  MaNCC: string;
  TenNCC: string;
  DiaChi: string;
  SDT: string;
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('NHA_CUNG_CAP')
          .select('*');

        if (error) {
          throw error;
        }

        setSuppliers(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, []);

  if (loading) {
    return <p className="text-center text-gray-500">Loading suppliers...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500">Error: {error}</p>;
  }

  if (suppliers.length === 0) {
    return <p className="text-center text-gray-500">No suppliers found.</p>;
  }

  return (
    <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
            <th scope="col" className="py-3 px-6">Mã NCC</th>
            <th scope="col" className="py-3 px-6">Tên Nhà Cung Cấp</th>
            <th scope="col" className="py-3 px-6">Địa Chỉ</th>
            <th scope="col" className="py-3 px-6">Số Điện Thoại</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((supplier) => (
            <tr key={supplier.MaNCC} className="bg-white border-b hover:bg-gray-50">
              <th scope="row" className="py-4 px-6 font-medium text-gray-900 whitespace-nowrap">
                {supplier.MaNCC}
              </th>
              <td className="py-4 px-6">{supplier.TenNCC}</td>
              <td className="py-4 px-6">{supplier.DiaChi}</td>
              <td className="py-4 px-6">{supplier.SDT}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
