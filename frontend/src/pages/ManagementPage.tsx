import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';

type Employee = {
  MaNV: string;
  HoTen: string;
  role: string;
  MaKho: string;
  TrangThai: string;
};

const InfoIcon = ({ text }: { text: string }) => (
  <div className="group relative inline-block ml-2">
    <span className="cursor-help text-gray-400 bg-gray-100 dark:bg-slate-800 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold border border-gray-200 dark:border-gray-700">i</span>
    <div className="invisible group-hover:visible absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-50 opacity-95 transition-all">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
    </div>
  </div>
);

const Modal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Xác nhận", type = "danger" }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        <h3 className={`text-xl font-black uppercase tracking-tight mb-2 ${type === 'danger' ? 'text-red-600' : 'text-indigo-600'}`}>{title}</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 font-medium leading-relaxed">{message}</p>
        <div className="flex space-x-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 font-bold uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-all">Hủy bỏ</button>
          <button onClick={onConfirm} className={`flex-1 py-3 rounded-xl text-white font-black uppercase text-[10px] tracking-widest shadow-lg transition-all active:scale-95 ${type === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-200 dark:shadow-none' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 dark:shadow-none'}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function ManagementPage() {
  const { t } = useTranslation();
  const [myProfile, setMyProfile] = useState<{role: string, MaKho: string} | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modal states
  const [modal, setModal] = useState<{isOpen: boolean, data: any} | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('NHAN_VIEN')
      .select('role, MaKho')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profile) {
      setMyProfile(profile);
      fetchSubordinates(profile.role, profile.MaKho);
    }
  };

  const fetchSubordinates = async (role: string, maKho: string) => {
    let query = supabase.from('NHAN_VIEN').select('*');
    if (role === 'Admin') query = query.in('role', ['Provider', 'Retailer']);
    else if (role === 'Retailer') query = query.eq('role', 'Staff').eq('MaKho', maKho);
    else { setEmployees([]); setLoading(false); return; }

    const { data } = await query.order('role', { ascending: true });
    setEmployees(data || []);
    setLoading(false);
  };

  const handleHierarchyAction = async (maNV: string, action: 'PROMOTE' | 'DEMOTE') => {
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc('hierarchy_control', { p_target_ma_nv: maNV, p_action: action });
      if (error) throw error;
      if (myProfile) fetchSubordinates(myProfile.role, myProfile.MaKho);
    } catch (err: any) { alert(err.message); }
    finally { setSubmitting(false); setModal(null); }
  };

  const handleStatusAction = async (maNV: string, newRole: string, newStatus: string) => {
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc('manage_employee', { p_target_ma_nv: maNV, p_new_role: newRole, p_new_trang_thai: newStatus });
      if (error) throw error;
      if (myProfile) fetchSubordinates(myProfile.role, myProfile.MaKho);
    } catch (err: any) { alert(err.message); }
    finally { setSubmitting(false); setModal(null); }
  };

  if (loading) return <div className="text-center py-10 dark:text-gray-400 italic font-black animate-pulse">{t('common.loading')}</div>;
  if (!myProfile || (myProfile.role !== 'Admin' && myProfile.role !== 'Retailer')) {
    return <div className="max-w-2xl mx-auto mt-20 p-10 bg-orange-50 dark:bg-orange-950/20 border-2 border-orange-200 dark:border-orange-900 rounded-3xl text-center">
      <i className="fas fa-shield-halved text-4xl text-orange-500 mb-4"></i>
      <h2 className="text-xl font-black text-orange-700 dark:text-orange-400 uppercase tracking-tight">Truy cập bị từ chối</h2>
      <p className="text-orange-600 dark:text-orange-500/70 font-medium mt-2">Chỉ cấp quản trị và quản lý chi nhánh mới có quyền điều phối nhân sự.</p>
    </div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b dark:border-slate-800 pb-6">
        <div>
          <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic flex items-center">
            Điều Phối Nhân Sự
            <InfoIcon text={`Mô hình thác nước: Bạn là ${myProfile.role}. Bạn có quyền quản lý trực tiếp cấp bậc tiếp theo trong sơ đồ tổ chức.`} />
          </h2>
          <p className="text-gray-500 dark:text-slate-400 font-bold mt-1 uppercase tracking-widest text-[10px]">Human Resources Management</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-slate-950 text-[10px] uppercase font-black text-gray-500 dark:text-slate-500 tracking-[0.2em] border-b dark:border-slate-800">
              <tr>
                <th className="px-8 py-6">Nhân sự</th>
                <th className="px-8 py-6">Vị trí hiện tại</th>
                <th className="px-8 py-6">Kho</th>
                <th className="px-8 py-6">Trạng thái</th>
                <th className="px-8 py-6 text-right">Điều phối bậc cao</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {employees.length === 0 ? (
                <tr><td colSpan={5} className="px-8 py-20 text-center text-gray-400 italic font-medium italic">Không có nhân sự thuộc quyền quản lý trực tiếp.</td></tr>
              ) : (
                employees.map(emp => (
                  <tr key={emp.MaNV} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="font-black text-gray-900 dark:text-white uppercase tracking-tight">{emp.HoTen}</div>
                      <div className="text-[10px] text-gray-400 font-mono font-bold">{emp.MaNV}</div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-800">
                        {emp.role}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest italic">{emp.MaKho}</td>
                    <td className="px-8 py-6">
                      <button 
                        onClick={() => setModal({
                          isOpen: true, 
                          data: { 
                            title: emp.TrangThai === 'Active' ? 'Xác nhận thôi việc' : 'Xác nhận khôi phục',
                            message: `Bạn có chắc muốn thay đổi trạng thái của ${emp.HoTen} sang ${emp.TrangThai === 'Active' ? 'RESIGNED' : 'ACTIVE'}?`,
                            onConfirm: () => handleStatusAction(emp.MaNV, emp.role, emp.TrangThai === 'Active' ? 'Resigned' : 'Active'),
                            type: emp.TrangThai === 'Active' ? 'danger' : 'info'
                          }
                        })}
                        className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all hover:scale-110 ${
                        emp.TrangThai === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {emp.TrangThai}
                      </button>
                    </td>
                    <td className="px-8 py-6 text-right space-x-2">
                      {myProfile.role === 'Admin' && (
                        <>
                          {emp.role === 'Retailer' ? (
                            <button 
                              onClick={() => setModal({
                                isOpen: true,
                                data: {
                                  title: 'Thăng cấp quản lý',
                                  message: `Thăng cấp ${emp.HoTen} lên vị trí Nhà cung cấp (Provider)? Nhân sự này sẽ có quyền sửa cấu hình kho.`,
                                  onConfirm: () => handleHierarchyAction(emp.MaNV, 'PROMOTE'),
                                  confirmText: 'Xác nhận thăng cấp',
                                  type: 'info'
                                }
                              })}
                              className="p-2.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100 dark:border-indigo-900/30 shadow-sm"
                              title="Thăng cấp lên Provider"
                            >
                              <i className="fas fa-arrow-up"></i>
                            </button>
                          ) : (
                            <button 
                              onClick={() => setModal({
                                isOpen: true,
                                data: {
                                  title: 'Giáng cấp quản lý',
                                  message: `Giáng cấp ${emp.HoTen} xuống vị trí Quản lý chi nhánh (Retailer)? Nhân sự này sẽ mất quyền sửa cấu hình kho.`,
                                  onConfirm: () => handleHierarchyAction(emp.MaNV, 'DEMOTE'),
                                  confirmText: 'Xác nhận giáng cấp',
                                  type: 'danger'
                                }
                              })}
                              className="p-2.5 bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 rounded-xl hover:bg-orange-600 hover:text-white transition-all border border-orange-100 dark:border-orange-900/30 shadow-sm"
                              title="Giáng cấp xuống Retailer"
                            >
                              <i className="fas fa-arrow-down"></i>
                            </button>
                          )}
                        </>
                      )}
                      
                      {myProfile.role === 'Retailer' && emp.role === 'Staff' && (
                        <span className="text-[10px] font-black text-gray-300 dark:text-gray-700 uppercase italic tracking-widest">Đang trực thuộc</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={modal?.isOpen} 
        title={modal?.data?.title}
        message={modal?.data?.message}
        confirmText={modal?.data?.confirmText}
        type={modal?.data?.type}
        onConfirm={modal?.data?.onConfirm}
        onCancel={() => setModal(null)}
      />
    </div>
  );
}
