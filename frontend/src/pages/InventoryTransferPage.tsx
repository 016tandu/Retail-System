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

const InfoIcon = ({ text }: { text: string }) => (
  <div className="group relative inline-block ml-2">
    <span className="cursor-help text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold border border-gray-200 dark:border-gray-700">i</span>
    <div className="invisible group-hover:visible absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-50 opacity-95 transition-all">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
    </div>
  </div>
);

export default function InventoryTransferPage() {
  const { i18n } = useTranslation();
  const [role, setRole] = useState('');
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [products, setProducts] = useState<{MaSP: string, TenSP: string}[]>([]);
  const [retailers, setRetailers] = useState<Employee[]>([]);
  const [warehouses, setWarehouses] = useState<{MaKho: string, TenKho: string}[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedRetailer, setSelectedRetailer] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [quantity, setQuantity] = useState(1);

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

    const { data: transData } = await supabase
      .from('STOCK_TRANSFER')
      .select('*, SAN_PHAM(TenSP)')
      .order('created_at', { ascending: false });
    setTransfers(transData || []);

    if (userRole === 'Provider' || userRole === 'Admin') {
      const { data: prodData } = await supabase.from('SAN_PHAM').select('MaSP, TenSP');
      setProducts(prodData || []);

      const { data: retData } = await supabase.from('NHAN_VIEN').select('MaNV, HoTen, user_id').eq('role', 'Retailer');
      setRetailers(retData || []);

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

  if (loading) return <div className="text-center py-10 dark:text-gray-400 italic font-bold animate-pulse">Đang tải dữ liệu chuyển kho...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center">
        <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Quản Lý Chuyển Kho</h2>
        <InfoIcon text="Quy trình chuyển hàng giữa các kho. Provider khởi tạo, Retailer tại kho nhận phải xác nhận thì tồn kho mới chính thức được chuyển đi." />
      </div>

      {(role === 'Provider' || role === 'Admin') && (
        <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
          <div className="flex items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide">Khởi tạo yêu cầu</h3>
            <InfoIcon text="Chọn sản phẩm và kho đích. Bạn cần chỉ định chính xác người quản lý chi nhánh sẽ nhận lô hàng này." />
          </div>
          
          <form onSubmit={handleInitiate} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div>
              <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-tighter text-[10px]">Sản phẩm</label>
              <select 
                value={selectedProduct} 
                onChange={e => setSelectedProduct(e.target.value)}
                required
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
              >
                <option value="">-- Chọn sản phẩm --</option>
                {products.map(p => <option key={p.MaSP} value={p.MaSP}>{p.TenSP}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-tighter text-[10px]">Người nhận (Retailer)</label>
              <select 
                value={selectedRetailer} 
                onChange={e => setSelectedRetailer(e.target.value)}
                required
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
              >
                <option value="">-- Chọn người nhận --</option>
                {retailers.map(r => <option key={r.user_id} value={r.user_id}>{r.HoTen}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-tighter text-[10px]">Kho nhận hàng</label>
              <select 
                value={selectedWarehouse} 
                onChange={e => setSelectedWarehouse(e.target.value)}
                required
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
              >
                <option value="">-- Chọn kho nhận --</option>
                {warehouses.map(w => <option key={w.MaKho} value={w.MaKho}>{w.TenKho}</option>)}
              </select>
            </div>
            <div className="flex space-x-3">
              <div className="w-24">
                <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-tighter text-[10px]">Số lượng</label>
                <input 
                  type="number" 
                  min="1" 
                  value={quantity} 
                  onChange={e => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white font-mono"
                />
              </div>
              <button 
                type="submit" 
                disabled={submitting}
                className="flex-1 bg-indigo-600 text-white font-black py-2 px-4 rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 uppercase text-[10px] tracking-widest"
              >
                Gửi yêu cầu
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center p-6 border-b dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide">Lịch sử giao dịch</h3>
          <InfoIcon text="Theo dõi trạng thái của các yêu cầu chuyển kho. Bạn chỉ có thể xác nhận các yêu cầu đang ở trạng thái PENDING nếu bạn là người nhận." />
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-900 text-[10px] uppercase font-black text-gray-500 dark:text-gray-400 tracking-[0.2em]">
              <tr>
                <th className="px-8 py-5 text-center">Thời gian</th>
                <th className="px-8 py-5">Sản phẩm</th>
                <th className="px-8 py-5">Lộ trình (Từ {'->'} Đến)</th>
                <th className="px-8 py-5 text-center">S.Lượng</th>
                <th className="px-8 py-5">Trạng thái</th>
                <th className="px-8 py-5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {transfers.length === 0 ? (
                <tr><td colSpan={6} className="px-8 py-16 text-center text-gray-400 dark:text-gray-500 italic">Không có yêu cầu nào được tìm thấy.</td></tr>
              ) : (
                transfers.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                    <td className="px-8 py-5 text-center whitespace-nowrap">
                      <div className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                        {new Date(t.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono">{new Date(t.created_at).toLocaleTimeString()}</div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="font-bold text-gray-900 dark:text-white leading-tight">{t.SAN_PHAM.TenSP}</div>
                      <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{t.ma_sp}</div>
                    </td>
                    <td className="px-8 py-5 text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded font-mono text-[10px] font-bold dark:text-gray-300">{t.from_kho}</span>
                        <span className="text-indigo-400">→</span>
                        <span className="bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400">{t.to_kho}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center font-black text-gray-900 dark:text-white font-mono">{t.so_luong}</td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className={`inline-flex w-fit px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                          t.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                          t.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {t.status}
                        </span>
                        {t.status === 'DECLINED' && (
                          <div className="text-[10px] text-red-500 mt-1 font-bold italic group relative cursor-help">
                            Lý do: {t.reason}
                            <div className="invisible group-hover:visible absolute top-full left-0 w-48 p-2 bg-gray-900 text-white rounded text-[9px] z-50">
                              {t.reason_detail || 'Không có mô tả chi tiết.'}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      {t.status === 'PENDING' && role === 'Retailer' && (
                        <div className="flex justify-end space-x-2">
                          <button 
                            onClick={() => handleRespond(t.id, 'CONFIRMED')}
                            disabled={submitting}
                            className="bg-green-600 text-white text-[9px] font-black py-1.5 px-3 rounded uppercase tracking-tighter hover:bg-green-700 active:scale-95 transition-all"
                          >
                            Nhận hàng
                          </button>
                          <button 
                            onClick={() => handleRespond(t.id, 'DECLINED')}
                            disabled={submitting}
                            className="bg-red-600 text-white text-[9px] font-black py-1.5 px-3 rounded uppercase tracking-tighter hover:bg-red-700 active:scale-95 transition-all"
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

      {declineId && (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 w-full max-w-md shadow-2xl border border-red-100 dark:border-red-950">
            <h3 className="text-xl font-black mb-2 text-red-600 uppercase tracking-tight">Từ chối nhận hàng</h3>
            <p className="text-gray-500 dark:text-gray-400 text-xs mb-6">Vui lòng cung cấp lý do chính xác để kho tổng có thể kiểm tra lại.</p>
            
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2">Loại lý do</label>
                <select 
                  value={declineReason} 
                  onChange={e => setDeclineReason(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-red-500 dark:text-white text-sm font-bold"
                >
                  <option value="DAMAGED">Hàng bị hư hỏng</option>
                  <option value="INCORRECT_QUANTITY">Sai số lượng</option>
                  <option value="WRONG_PRODUCT">Sai sản phẩm</option>
                  <option value="OTHER">Lý do khác</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2">Chi tiết (Không bắt buộc)</label>
                <textarea 
                  value={declineDetail} 
                  onChange={e => setDeclineDetail(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 h-32 outline-none focus:ring-2 focus:ring-red-500 dark:text-white text-sm placeholder:text-gray-400"
                  placeholder="Mô tả cụ thể tình trạng hàng hóa..."
                />
              </div>
              <div className="flex space-x-3 pt-2">
                <button 
                  onClick={() => setDeclineId(null)}
                  className="flex-1 bg-gray-100 dark:bg-gray-700 py-3 rounded-xl font-black text-gray-600 dark:text-gray-300 hover:bg-gray-200 uppercase text-[10px] tracking-widest transition-all"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={() => handleRespond(declineId, 'DECLINED')}
                  className="flex-1 bg-red-600 text-white py-3 rounded-xl font-black hover:bg-red-700 shadow-lg shadow-red-200 dark:shadow-none uppercase text-[10px] tracking-widest transition-all active:scale-95"
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
