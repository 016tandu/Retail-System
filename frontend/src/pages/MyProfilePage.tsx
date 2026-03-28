import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';

type Profile = {
  MaNV: string;
  HoTen: string;
  NgaySinh: string;
  role: string;
  MaKho: string;
  TrangThai: string;
};

export default function MyProfilePage() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('NHAN_VIEN')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!error) setProfile(data);
    setLoading(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setUpdating(true);
    setMessage(null);

    const { error } = await supabase.rpc('update_my_profile', {
      p_ho_ten: profile.HoTen,
      p_ngay_sinh: profile.NgaySinh
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Cập nhật hồ sơ thành công!' });
    }
    setUpdating(false);
  };

  if (loading) return <div className="text-center py-10 dark:text-gray-400 italic">{t('common.loading')}</div>;
  if (!profile) return <div className="text-center py-10 text-red-500">{t('common.error', { message: 'Không tìm thấy hồ sơ' })}</div>;

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800">
      <div className="flex items-center mb-8 border-b dark:border-slate-800 pb-6">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg shadow-indigo-200 dark:shadow-none">
          <i className="fas fa-user-circle"></i>
        </div>
        <div className="ml-4">
          <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Hồ Sơ Cá Nhân</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium italic">Quản lý và cập nhật thông tin định danh của bạn</p>
        </div>
      </div>

      <form onSubmit={handleUpdate} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-black uppercase text-gray-400 mb-2 tracking-widest">Mã Nhân Viên</label>
            <div className="px-4 py-3 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-gray-500 font-mono font-bold">
              {profile.MaNV}
            </div>
          </div>
          <div>
            <label className="block text-xs font-black uppercase text-gray-400 mb-2 tracking-widest">Chức vụ</label>
            <div className="px-4 py-3 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl">
              <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-black uppercase tracking-widest">
                {profile.role}
              </span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-black uppercase text-gray-400 mb-2 tracking-widest">Họ và Tên</label>
          <div className="relative">
            <i className="fas fa-id-card absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              value={profile.HoTen}
              onChange={e => setProfile({ ...profile, HoTen: e.target.value })}
              required
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white font-bold transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-black uppercase text-gray-400 mb-2 tracking-widest">Ngày Sinh</label>
          <div className="relative">
            <i className="fas fa-calendar-alt absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              type="date"
              value={profile.NgaySinh}
              onChange={e => setProfile({ ...profile, NgaySinh: e.target.value })}
              required
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white font-bold transition-all"
            />
          </div>
        </div>

        <div className="pt-4">
          <label className="block text-xs font-black uppercase text-gray-400 mb-2 tracking-widest">Kho làm việc</label>
          <div className="px-4 py-3 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-gray-700 dark:text-gray-300 font-bold flex items-center">
            <i className="fas fa-warehouse mr-3 text-indigo-500"></i>
            {profile.MaKho}
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-xl text-sm font-bold flex items-center ${message.type === 'success' ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400'}`}>
            <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'} mr-3`}></i>
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={updating}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-xl shadow-indigo-200 dark:shadow-none transition-all active:scale-95 uppercase tracking-widest text-xs flex items-center justify-center"
        >
          {updating ? <i className="fas fa-circle-notch fa-spin mr-2"></i> : <i className="fas fa-save mr-2"></i>}
          Lưu thay đổi hồ sơ
        </button>
      </form>
    </div>
  );
}
