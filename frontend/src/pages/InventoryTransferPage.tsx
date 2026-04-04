import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';

type TransferStatus = 'PENDING' | 'CONFIRMED' | 'DECLINED';

type Transfer = {
  id: string;
  ma_sp: string;
  SAN_PHAM: { TenSP: string } | { TenSP: string }[] | null;
  from_kho: string;
  to_kho: string;
  from_region: string | null;
  to_region: string | null;
  so_luong: number;
  status: TransferStatus;
  reason?: string | null;
  reason_detail?: string | null;
  sender_id: string;
  receiver_id: string;
  sender_role?: string | null;
  receiver_role?: string | null;
  from_qty_before?: number | null;
  from_qty_after?: number | null;
  to_qty_before?: number | null;
  to_qty_after?: number | null;
  created_at: string;
};

type Product = {
  MaSP: string;
  TenSP: string;
};

type SourceWarehouse = {
  ma_kho: string;
  ten_kho: string;
  khu_vuc: string;
  warehouse_type: 'stock_warehouse' | 'retail_warehouse';
};

type TransferTargetActor = {
  receiver_user_id: string;
  receiver_name: string;
  receiver_role: 'Provider' | 'Retailer';
  receiver_ma_kho: string;
  receiver_region: string;
  receiver_warehouse_type: 'stock_warehouse' | 'retail_warehouse';
};

type ProfileMapItem = {
  HoTen: string;
  role: string;
  MaKho: string;
};

const roleLabel = (role: string | null | undefined) => {
  if (role === 'Provider') return 'Supplier';
  if (role === 'Retailer') return 'Retailer';
  if (role === 'Admin') return 'Admin';
  return role || '-';
};

const warehouseTypeLabel = (type: string | null | undefined) => {
  if (type === 'stock_warehouse') return 'stock_warehouse';
  if (type === 'retail_warehouse') return 'retail_warehouse';
  return '-';
};

const productNameFromJoin = (joined: { TenSP: string } | { TenSP: string }[] | null | undefined) => {
  if (!joined) return '-';
  if (Array.isArray(joined)) return joined[0]?.TenSP || '-';
  return joined.TenSP || '-';
};

const InfoIcon = ({ text }: { text: string }) => (
  <div className="group relative inline-block ml-2">
    <span className="cursor-help text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold border border-gray-200 dark:border-gray-700">i</span>
    <div className="invisible group-hover:visible absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-50 opacity-95 transition-all">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
    </div>
  </div>
);

export default function InventoryTransferPage() {
  const [currentUserId, setCurrentUserId] = useState('');
  const [role, setRole] = useState('');
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sourceWarehouses, setSourceWarehouses] = useState<SourceWarehouse[]>([]);
  const [targetActors, setTargetActors] = useState<TransferTargetActor[]>([]);
  const [profileMap, setProfileMap] = useState<Record<string, ProfileMapItem>>({});

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedSourceWarehouse, setSelectedSourceWarehouse] = useState('');
  const [selectedTargetActor, setSelectedTargetActor] = useState('');
  const [quantity, setQuantity] = useState(1);

  const [declineId, setDeclineId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState('DAMAGED');
  const [declineDetail, setDeclineDetail] = useState('');

  const selectedSource = useMemo(
    () => sourceWarehouses.find((s) => s.ma_kho === selectedSourceWarehouse) || null,
    [sourceWarehouses, selectedSourceWarehouse]
  );

  const selectedTarget = useMemo(
    () => targetActors.find((t) => t.receiver_user_id === selectedTargetActor) || null,
    [targetActors, selectedTargetActor]
  );

  const canInitiate = role === 'Provider' || role === 'Admin';

  useEffect(() => {
    void fetchData();
  }, []);

  useEffect(() => {
    if (!selectedSourceWarehouse || !canInitiate) {
      setTargetActors([]);
      setSelectedTargetActor('');
      return;
    }
    void fetchTargetActors(selectedSourceWarehouse);
  }, [selectedSourceWarehouse, canInitiate]);

  const fetchProfilesForTransfers = async (rows: Transfer[]) => {
    const userIds = new Set<string>();
    for (const t of rows) {
      if (t.sender_id) userIds.add(t.sender_id);
      if (t.receiver_id) userIds.add(t.receiver_id);
    }

    if (userIds.size === 0) {
      setProfileMap({});
      return;
    }

    const { data } = await supabase
      .from('NHAN_VIEN')
      .select('user_id, HoTen, role, MaKho')
      .in('user_id', Array.from(userIds));

    const map: Record<string, ProfileMapItem> = {};
    (data || []).forEach((item: any) => {
      if (item.user_id) {
        map[item.user_id] = {
          HoTen: item.HoTen || 'Unknown',
          role: item.role || '-',
          MaKho: item.MaKho || '-',
        };
      }
    });
    setProfileMap(map);
  };

  const fetchData = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    setCurrentUserId(user.id);

    const { data: myProfile } = await supabase
      .from('NHAN_VIEN')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    const currentRole = myProfile?.role || user.user_metadata?.role || '';
    setRole(currentRole);

    const { data: transData } = await supabase
      .from('STOCK_TRANSFER')
      .select('id, ma_sp, from_kho, to_kho, from_region, to_region, so_luong, status, reason, reason_detail, sender_id, receiver_id, sender_role, receiver_role, from_qty_before, from_qty_after, to_qty_before, to_qty_after, created_at, SAN_PHAM(TenSP)')
      .order('created_at', { ascending: false });

    const transferRows = (transData || []) as unknown as Transfer[];
    setTransfers(transferRows);
    await fetchProfilesForTransfers(transferRows);

    if (currentRole === 'Provider' || currentRole === 'Admin') {
      const { data: prodData } = await supabase.from('SAN_PHAM').select('MaSP, TenSP').order('MaSP');
      setProducts((prodData || []) as Product[]);

      const { data: sourceData, error: sourceError } = await supabase.rpc('get_my_source_warehouses');
      if (sourceError) {
        alert(sourceError.message);
        setSourceWarehouses([]);
      } else {
        const sourceRows = (sourceData || []) as SourceWarehouse[];
        setSourceWarehouses(sourceRows);
        if (sourceRows.length > 0) {
          setSelectedSourceWarehouse((prev) => prev || sourceRows[0].ma_kho);
        }
      }
    } else {
      setSourceWarehouses([]);
      setTargetActors([]);
      setSelectedSourceWarehouse('');
      setSelectedTargetActor('');
    }

    setLoading(false);
  };

  const fetchTargetActors = async (fromKho: string) => {
    const { data, error } = await supabase.rpc('get_transfer_target_actors', { p_from_kho: fromKho });
    if (error) {
      setTargetActors([]);
      setSelectedTargetActor('');
      alert(error.message);
      return;
    }

    const rows = (data || []) as TransferTargetActor[];
    setTargetActors(rows);

    if (!rows.some((r) => r.receiver_user_id === selectedTargetActor)) {
      setSelectedTargetActor(rows[0]?.receiver_user_id || '');
    }
  };

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTarget) {
      alert('Vui lòng chọn actor nhận hàng hợp lệ.');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc('initiate_transfer', {
        p_ma_sp: selectedProduct,
        p_from_kho: selectedSourceWarehouse,
        p_to_kho: selectedTarget.receiver_ma_kho,
        p_so_luong: quantity,
        p_receiver_id: selectedTarget.receiver_user_id,
      });
      if (error) throw error;
      alert('Đã gửi yêu cầu chuyển kho.');
      setSelectedProduct('');
      setSelectedTargetActor('');
      setQuantity(1);
      await fetchData();
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
        p_detail: action === 'DECLINED' ? declineDetail : null,
      });
      if (error) throw error;
      alert(action === 'CONFIRMED' ? 'Đã xác nhận nhận hàng.' : 'Đã từ chối yêu cầu.');
      setDeclineId(null);
      setDeclineReason('DAMAGED');
      setDeclineDetail('');
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-10 dark:text-gray-400 italic font-bold animate-pulse">Đang tải dữ liệu chuyển kho...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center">
        <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Quản Lý Chuyển Kho</h2>
        <InfoIcon text="Supplier chỉ chuyển từ stock_warehouse tới actor đích (Provider hoặc Retailer). Actor đích sẽ xử lý pending: accept/decline." />
      </div>

      {canInitiate && (
        <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
          <div className="flex items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide">Khởi tạo yêu cầu</h3>
            <InfoIcon text="Chọn kho nguồn bạn quản lý, chọn actor đích. Kho đích sẽ tự động lấy theo kho mà actor đích đang quản lý." />
          </div>

          <form onSubmit={handleInitiate} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
            <div className="md:col-span-3">
              <label className="block text-[10px] font-black text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-widest">Sản phẩm</label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                required
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
              >
                <option value="">-- Chọn sản phẩm --</option>
                {products.map((p) => (
                  <option key={p.MaSP} value={p.MaSP}>
                    {p.TenSP} ({p.MaSP})
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="block text-[10px] font-black text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-widest">Kho nguồn (Supplier quản lý)</label>
              <select
                value={selectedSourceWarehouse}
                onChange={(e) => setSelectedSourceWarehouse(e.target.value)}
                required
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
              >
                <option value="">-- Chọn kho nguồn --</option>
                {sourceWarehouses.map((s) => (
                  <option key={s.ma_kho} value={s.ma_kho}>
                    {s.ten_kho} ({s.ma_kho}) - {s.khu_vuc}
                  </option>
                ))}
              </select>
              {selectedSource && (
                <div className="mt-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                  {selectedSource.khu_vuc} • {warehouseTypeLabel(selectedSource.warehouse_type)}
                </div>
              )}
            </div>

            <div className="md:col-span-3">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest">Actor nhan (Provider/Retailer)</label>
                {selectedTarget && (
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-300">
                    Khu vuc: {selectedTarget.receiver_region}
                  </span>
                )}
              </div>
              <select
                value={selectedTargetActor}
                onChange={(e) => setSelectedTargetActor(e.target.value)}
                required
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
              >
                <option value="">-- Chọn actor nhận --</option>
                {targetActors.map((a) => (
                  <option key={a.receiver_user_id} value={a.receiver_user_id}>
                    {a.receiver_name} [{a.receiver_role}] - {a.receiver_region}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-widest">Kho đích (Auto)</label>
              <input
                type="text"
                value={selectedTarget ? `${selectedTarget.receiver_ma_kho} (${selectedTarget.receiver_region})` : ''}
                readOnly
                className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg outline-none dark:text-white font-mono text-xs"
              />
              {selectedTarget && (
                <div className="mt-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                  {roleLabel(selectedTarget.receiver_role)} • {warehouseTypeLabel(selectedTarget.receiver_warehouse_type)}
                </div>
              )}
            </div>

            <div className="md:col-span-1">
              <label className="block text-[10px] font-black text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-widest">S.Lượng</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white font-mono"
              />
            </div>

            <div className="md:col-span-12 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="bg-indigo-600 text-white font-black py-2 px-5 rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 uppercase text-[10px] tracking-widest"
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
          <InfoIcon text="Provider và Retailer đều có thể là actor nhận. Actor nhận đúng `receiver_id` mới được Accept/Decline yêu cầu pending." />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-900 text-[10px] uppercase font-black text-gray-500 dark:text-gray-400 tracking-[0.2em]">
              <tr>
                <th className="px-6 py-4 text-center">Thời gian</th>
                <th className="px-6 py-4">Sản phẩm</th>
                <th className="px-6 py-4">Actor (Gửi {'->'} Nhận)</th>
                <th className="px-6 py-4">Kho (Từ {'->'} Đến)</th>
                <th className="px-6 py-4 text-center">SL chuyển</th>
                <th className="px-6 py-4">Tồn kho Source (Trước {'->'} Sau)</th>
                <th className="px-6 py-4">Tồn kho Dest (Trước {'->'} Sau)</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {transfers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-8 py-16 text-center text-gray-400 dark:text-gray-500 italic">
                    Không có yêu cầu nào được tìm thấy.
                  </td>
                </tr>
              ) : (
                transfers.map((t) => {
                  const sender = profileMap[t.sender_id];
                  const receiver = profileMap[t.receiver_id];
                  const canRespond =
                    t.status === 'PENDING' &&
                    currentUserId !== '' &&
                    t.receiver_id === currentUserId &&
                    (role === 'Provider' || role === 'Retailer' || role === 'Admin');

                  return (
                    <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <div className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                          {new Date(t.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono">{new Date(t.created_at).toLocaleTimeString()}</div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 dark:text-white leading-tight">{productNameFromJoin(t.SAN_PHAM)}</div>
                        <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{t.ma_sp}</div>
                      </td>

                      <td className="px-6 py-4 text-xs">
                        <div className="font-bold dark:text-white">
                          {sender?.HoTen || 'Unknown'} ({roleLabel(t.sender_role || sender?.role)})
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">→ {receiver?.HoTen || 'Unknown'} ({roleLabel(t.receiver_role || receiver?.role)})</div>
                      </td>

                      <td className="px-6 py-4 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded font-mono text-[10px] font-bold dark:text-gray-300">{t.from_kho}</span>
                          <span className="text-indigo-400">→</span>
                          <span className="bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400">{t.to_kho}</span>
                        </div>
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                          {t.from_region || '-'} → {t.to_region || '-'}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center font-black text-gray-900 dark:text-white font-mono">{t.so_luong}</td>

                      <td className="px-6 py-4 text-xs font-mono text-gray-600 dark:text-gray-300">
                        {t.from_qty_before ?? '?'} → {t.from_qty_after ?? '?'}
                      </td>

                      <td className="px-6 py-4 text-xs font-mono text-gray-600 dark:text-gray-300">
                        {t.to_qty_before ?? '?'} → {t.to_qty_after ?? '?'}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span
                            className={`inline-flex w-fit px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                              t.status === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-700'
                                : t.status === 'CONFIRMED'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {t.status}
                          </span>
                          {t.status === 'DECLINED' && (
                            <div className="text-[10px] text-red-500 mt-1 font-bold italic group relative cursor-help">
                              Lý do: {t.reason || '-'}
                              <div className="invisible group-hover:visible absolute top-full left-0 w-52 p-2 bg-gray-900 text-white rounded text-[9px] z-50">
                                {t.reason_detail || 'Không có mô tả chi tiết.'}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        {canRespond && (
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => void handleRespond(t.id, 'CONFIRMED')}
                              disabled={submitting}
                              className="bg-green-600 text-white text-[9px] font-black py-1.5 px-3 rounded uppercase tracking-tighter hover:bg-green-700 active:scale-95 transition-all"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => void handleRespond(t.id, 'DECLINED')}
                              disabled={submitting}
                              className="bg-red-600 text-white text-[9px] font-black py-1.5 px-3 rounded uppercase tracking-tighter hover:bg-red-700 active:scale-95 transition-all"
                            >
                              Decline
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {declineId && (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 w-full max-w-md shadow-2xl border border-red-100 dark:border-red-950">
            <h3 className="text-xl font-black mb-2 text-red-600 uppercase tracking-tight">Từ chối nhận hàng</h3>
            <p className="text-gray-500 dark:text-gray-400 text-xs mb-6">Vui lòng cung cấp lý do để phía gửi xử lý lại.</p>

            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2">Loại lý do</label>
                <select
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
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
                  onChange={(e) => setDeclineDetail(e.target.value)}
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
                  onClick={() => void handleRespond(declineId, 'DECLINED')}
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



