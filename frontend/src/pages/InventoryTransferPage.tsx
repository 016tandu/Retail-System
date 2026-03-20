import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';

type Transfer = {
  id: string;
  ma_sp: string;
  SAN_PHAM: { TenSP: string };
  from_kho: string;
  to_kho: string;
  so_luong: number;
  status: 'PENDING' | 'CONFIRMED' | 'DECLINED';
  reason?: string;
  reason_detail?: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
};

type Employee = {
  MaNV: string;
  HoTen: string;
  user_id: string;
};

export default function InventoryTransferPage() {
  const { i18n } = useTranslation();
  const [role, setRole] = useState('');
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [products, setProducts] = useState<{MaSP: string, TenSP: string}[]>([]);
  const [retailers, setRetailers] = useState<Employee[]>([]);
  const [warehouses, setWarehouses] = useState<{MaKho: string, TenKho: string}[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // New Transfer State
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedRetailer, setSelectedRetailer] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Decline State
  const [declineId, setDeclineId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState('DAMAGED');
  const [declineDetail, setDeclineDetail] = useState('');

  useEffect(() => {
    fetchData();
  }, [i18n.language]);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const userRole = user.user_metadata?.role;
    setRole(userRole);

    // Fetch Transfers
    const { data: transData } = await supabase
      .from('STOCK_TRANSFER')
      .select('*, SAN_PHAM(TenSP)')
      .order('created_at', { ascending: false });
    setTransfers(transData || []);

    if (userRole === 'Provider' || userRole === 'Admin') {
      // Fetch Products
      const { data: prodData } = await supabase.from('SAN_PHAM').select('MaSP, TenSP');
      setProducts(prodData || []);

      // Fetch Retailers
      const { data: retData } = await supabase.from('NHAN_VIEN').select('MaNV, HoTen, user_id').eq('role', 'Retailer');
      setRetailers(retData || []);

      // Fetch Warehouses
      const { data: whData } = await supabase.from('KHO').select('MaKho, TenKho');
      setWarehouses(whData || []);
    }
    setLoading(false);
  };

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc('initiate_transfer', {
        p_ma_sp: selectedProduct,
        p_to_kho: selectedWarehouse,
        p_so_luong: quantity,
        p_receiver_id: selectedRetailer
      });
      if (error) throw error;
      alert('Đã gửi yêu cầu chuyển kho!');
      fetchData();
      setSelectedProduct('');
      setSelectedRetailer('');
      setSelectedWarehouse('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRespond = async (id: string, action: 'CONFIRMED' | 'DECLINED') => {
    if (action === 'DECLINED' && !declineId) {
      setDeclineId(id);
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.rpc('respond_to_transfer', {
        p_transfer_id: id,
        p_action: action,
        p_reason: action === 'DECLINED' ? declineReason : null,
        p_detail: action === 'DECLINED' ? declineDetail : null
      });
      if (error) throw error;
      alert(action === 'CONFIRMED' ? 'Đã xác nhận nhập kho!' : 'Đã từ chối yêu cầu.');
      setDeclineId(null);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-10">Đang tải...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <h2 className="text-3xl font-bold text-gray-900">Quản Lý Chuyển Kho</h2>

      {/* Provider View: Initiate Transfer */}
      {(role === 'Provider' || role === 'Admin') && (
        <div className="p-6 bg-white rounded-xl shadow-md border border-gray-100">
          <h3 className="text-xl font-bold mb-6">Gửi Yêu Cầu Chuyển Kho</h3>
          <form onSubmit={handleInitiate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sản phẩm</label>
              <select 
                value={selectedProduct} 
                onChange={e => setSelectedProduct(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">-- Chọn SP --</option>
                {products.map(p => <option key={p.MaSP} value={p.MaSP}>{p.TenSP}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Đến Kho & Người nhận</label>
              <select 
                value={selectedRetailer} 
                onChange={e => {
                   setSelectedRetailer(e.target.value);
                }}
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">-- Chọn Người nhận --</option>
                {retailers.map(r => <option key={r.user_id} value={r.user_id}>{r.HoTen}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kho nhận</label>
              <select 
                value={selectedWarehouse} 
                onChange={e => setSelectedWarehouse(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">-- Chọn Kho --</option>
                {warehouses.map(w => <option key={w.MaKho} value={w.MaKho}>{w.TenKho}</option>)}
              </select>
            </div>
            <div className="flex space-x-2">
              <div className="w-24">
                <label className="block text-sm font-medium text-gray-700 mb-1">S.Lượng</label>
                <input 
                  type="number" 
                  min="1" 
                  value={quantity} 
                  onChange={e => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <button 
                type="submit" 
                disabled={submitting}
                className="flex-1 bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Gửi đi
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List of Transfers */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <h3 className="text-xl font-bold p-6 border-b">Lịch sử & Yêu cầu chuyển kho</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-600">
              <tr>
                <th className="px-6 py-4">Sản phẩm</th>
                <th className="px-6 py-4">Từ {'->'} Đến</th>
                <th className="px-6 py-4">Số lượng</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transfers.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500 italic">Không có yêu cầu nào.</td></tr>
              ) : (
                transfers.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{t.SAN_PHAM.TenSP}</div>
                      <div className="text-xs text-gray-500">{new Date(t.created_at).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="font-medium">{t.from_kho}</span> → <span className="font-medium">{t.to_kho}</span>
                    </td>
                    <td className="px-6 py-4 font-bold">{t.so_luong}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        t.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        t.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {t.status}
                      </span>
                      {t.status === 'DECLINED' && (
                        <div className="text-xs text-red-500 mt-1 italic">Lý do: {t.reason}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {t.status === 'PENDING' && role === 'Retailer' && (
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleRespond(t.id, 'CONFIRMED')}
                            disabled={submitting}
                            className="bg-green-600 text-white text-xs font-bold py-1 px-3 rounded hover:bg-green-700"
                          >
                            Xác nhận
                          </button>
                          <button 
                            onClick={() => handleRespond(t.id, 'DECLINED')}
                            disabled={submitting}
                            className="bg-red-600 text-white text-xs font-bold py-1 px-3 rounded hover:bg-red-700"
                          >
                            Từ chối
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Decline Dialog */}
      {declineId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-red-600">Lý do từ chối</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Loại lý do</label>
                <select 
                  value={declineReason} 
                  onChange={e => setDeclineReason(e.target.value)}
                  className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="DAMAGED">Hàng bị hư hỏng</option>
                  <option value="INCORRECT_QUANTITY">Sai số lượng</option>
                  <option value="WRONG_PRODUCT">Sai sản phẩm</option>
                  <option value="OTHER">Lý do khác</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Chi tiết</label>
                <textarea 
                  value={declineDetail} 
                  onChange={e => setDeclineDetail(e.target.value)}
                  className="w-full border rounded-lg p-2 h-24 outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Mô tả cụ thể lý do từ chối..."
                />
              </div>
              <div className="flex space-x-3">
                <button 
                  onClick={() => setDeclineId(null)}
                  className="flex-1 border py-2 rounded-lg font-bold hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button 
                  onClick={() => handleRespond(declineId, 'DECLINED')}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold hover:bg-red-700"
                >
                  Gửi từ chối
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
