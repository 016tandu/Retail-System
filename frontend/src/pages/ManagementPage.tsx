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

export default function ManagementPage() {
  const { t } = useTranslation();
  const [myProfile, setMyProfile] = useState<{role: string, MaKho: string} | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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
      .single();

    if (profile) {
      setMyProfile(profile);
      fetchSubordinates(profile.role, profile.MaKho);
    }
  };

  const fetchSubordinates = async (role: string, maKho: string) => {
    let query = supabase.from('NHAN_VIEN').select('*');

    if (role === 'Admin') {
      // Admin quản lý Provider và Retailer
      query = query.in('role', ['Provider', 'Retailer']);
    } else if (role === 'Retailer') {
      // Retailer quản lý Staff trong cùng kho
      query = query.eq('role', 'Staff').eq('MaKho', maKho);
    } else {
      setEmployees([]);
      setLoading(false);
      return;
    }

    const { data } = await query.order('role', { ascending: true });
    setEmployees(data || []);
    setLoading(false);
  };

  const handleAction = async (maNV: string, newRole: string, newStatus: string) => {
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc('manage_employee', {
        p_target_ma_nv: maNV,
        p_new_role: newRole,
        p_new_trang_thai: newStatus
      });

      if (error) throw error;
      alert('Cập nhật nhân viên thành công!');
      if (myProfile) fetchSubordinates(myProfile.role, myProfile.MaKho);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-10 dark:text-gray-400 italic">{t('common.loading')}</div>;
  if (!myProfile || (myProfile.role !== 'Admin' && myProfile.role !== 'Retailer')) {
    return <div className="text-center py-10 text-orange-500 font-bold">Bạn không có quyền truy cập trang quản lý nhân sự.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center border-b dark:border-slate-800 pb-6">
        <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Quản Lý Nhân Sự</h2>
        <InfoIcon text={`Mô hình thác nước: Bạn đang là ${myProfile.role}. ${myProfile.role === 'Admin' ? 'Bạn quản lý các cấp trung gian.' : 'Bạn quản lý nhân viên tại kho ' + myProfile.MaKho + '.'}`} />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-slate-950 text-[10px] uppercase font-black text-gray-500 dark:text-gray-400 tracking-[0.2em]">
              <tr>
                <th className="px-8 py-5">Nhân viên</th>
                <th className="px-8 py-5">Chức vụ</th>
                <th className="px-8 py-5">Kho</th>
                <th className="px-8 py-5">Trạng thái</th>
                <th className="px-8 py-5 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {employees.length === 0 ? (
                <tr><td colSpan={5} className="px-8 py-16 text-center text-gray-400 dark:text-gray-500 italic font-medium">Không có nhân viên cấp dưới trực tiếp.</td></tr>
              ) : (
                employees.map(emp => (
                  <tr key={emp.MaNV} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="font-bold text-gray-900 dark:text-white">{emp.HoTen}</div>
                      <div className="text-[10px] text-gray-400 font-mono uppercase font-bold">{emp.MaNV}</div>
                    </td>
                    <td className="px-8 py-5 text-sm">
                      <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase">
                        {emp.role}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{emp.MaKho}</td>
                    <td className="px-8 py-5">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                        emp.TrangThai === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {emp.TrangThai}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right space-x-2">
                      {emp.TrangThai === 'Active' ? (
                        <button 
                          onClick={() => handleAction(emp.MaNV, emp.role, 'Resigned')}
                          disabled={submitting}
                          className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-[10px] font-black py-1.5 px-4 rounded-lg uppercase tracking-tighter hover:bg-red-600 hover:text-white transition-all border border-red-100 dark:border-red-900/30"
                        >
                          Cho nghỉ việc
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleAction(emp.MaNV, emp.role, 'Active')}
                          disabled={submitting}
                          className="bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 text-[10px] font-black py-1.5 px-4 rounded-lg uppercase tracking-tighter hover:bg-green-600 hover:text-white transition-all border border-green-100 dark:border-green-900/30"
                        >
                          Khôi phục
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
