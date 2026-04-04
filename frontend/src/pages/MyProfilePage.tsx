import { useEffect, useState } from 'react';
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

type Superior = { ho_ten: string; role: string };

type RetailerManager = {
  user_id: string;
  HoTen: string;
  MaKho: string;
  TenKho: string;
  KhuVuc: string;
  isDirect: boolean;
};

export default function MyProfilePage() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [superiors, setSuperiors] = useState<Superior[]>([]);
  const [regionalRetailers, setRegionalRetailers] = useState<RetailerManager[]>([]);
  const [staffRegion, setStaffRegion] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const today = new Date();
  const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate()).toISOString().split('T')[0];

  useEffect(() => {
    void fetchData();
  }, []);

  const fetchStaffRegionalRetailers = async (staffKho: string) => {
    const { data: myWarehouse } = await supabase
      .from('KHO')
      .select('MaKho, KhuVuc')
      .eq('MaKho', staffKho)
      .maybeSingle();

    const region = myWarehouse?.KhuVuc || '';
    setStaffRegion(region);

    if (!region) {
      setRegionalRetailers([]);
      return;
    }

    const { data: regionalWarehouseData } = await supabase
      .from('KHO')
      .select('MaKho, TenKho, KhuVuc, WarehouseType')
      .eq('KhuVuc', region)
      .eq('WarehouseType', 'retail_warehouse');

    const regionalWarehouses = regionalWarehouseData || [];
    const warehouseIds = regionalWarehouses.map((warehouse) => warehouse.MaKho);

    if (warehouseIds.length === 0) {
      setRegionalRetailers([]);
      return;
    }

    const warehouseMap = new Map<string, { TenKho: string; KhuVuc: string }>();
    regionalWarehouses.forEach((warehouse) => {
      warehouseMap.set(warehouse.MaKho, {
        TenKho: warehouse.TenKho,
        KhuVuc: warehouse.KhuVuc,
      });
    });

    const { data: retailerData } = await supabase
      .from('NHAN_VIEN')
      .select('user_id, HoTen, MaKho, TrangThai')
      .eq('role', 'Retailer')
      .eq('TrangThai', 'Active')
      .not('user_id', 'is', null)
      .in('MaKho', warehouseIds);

    const items: RetailerManager[] = (retailerData || []).map((retailer: any) => ({
      user_id: retailer.user_id,
      HoTen: retailer.HoTen || 'Unknown',
      MaKho: retailer.MaKho || '-',
      TenKho: warehouseMap.get(retailer.MaKho)?.TenKho || retailer.MaKho || '-',
      KhuVuc: warehouseMap.get(retailer.MaKho)?.KhuVuc || region,
      isDirect: retailer.MaKho === staffKho,
    }));

    items.sort((a, b) => {
      if (a.isDirect !== b.isDirect) return a.isDirect ? -1 : 1;
      return a.HoTen.localeCompare(b.HoTen);
    });

    setRegionalRetailers(items);
  };

  const fetchData = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setProfile(null);
      setSuperiors([]);
      setRegionalRetailers([]);
      setStaffRegion('');
      setLoading(false);
      return;
    }

    const { data: profData, error: profError } = await supabase
      .from('NHAN_VIEN')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profError) {
      setMessage({ type: 'error', text: profError.message });
      setProfile(null);
      setRegionalRetailers([]);
      setStaffRegion('');
    } else {
      setProfile(profData ?? null);

      if (profData?.role === 'Staff' && profData?.MaKho) {
        await fetchStaffRegionalRetailers(profData.MaKho);
      } else {
        setRegionalRetailers([]);
        setStaffRegion('');
      }
    }

    const { data: supData, error: supError } = await supabase.rpc('get_nearest_superiors', { p_user_id: user.id });
    if (supError) {
      setSuperiors([]);
      setMessage((prev) => prev ?? { type: 'error', text: supError.message });
    } else {
      setSuperiors((supData || []) as Superior[]);
    }

    setLoading(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    if (profile.NgaySinh > maxDate) {
      setMessage({ type: 'error', text: 'Nhan vien phai tu 18 tuoi tro len.' });
      return;
    }

    setUpdating(true);
    setMessage(null);

    const { error } = await supabase.rpc('update_my_profile', {
      p_ho_ten: profile.HoTen,
      p_ngay_sinh: profile.NgaySinh,
    });

    if (error) setMessage({ type: 'error', text: error.message });
    else setMessage({ type: 'success', text: 'Cap nhat ho so thanh cong!' });

    setUpdating(false);
  };

  if (loading) {
    return <div className="text-center py-10 dark:text-gray-400 italic">{t('common.loading')}</div>;
  }

  if (!profile) {
    return (
      <div className="text-center py-10 text-red-500 font-black uppercase">
        Ho so khong ton tai hoac chua duoc dong bo. Vui long lien he admin.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
      <div className="lg:col-span-2 p-8 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-gray-100 dark:border-slate-800">
        <div className="flex items-center mb-10 pb-6 border-b dark:border-slate-800">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg">
            <i className="fas fa-id-badge"></i>
          </div>
          <div className="ml-5">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Ho So Cua Toi</h2>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest leading-none mt-1">Personal Identity Management</p>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Ma dinh danh</label>
              <div className="px-4 py-3 bg-gray-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl font-mono font-bold text-slate-500 uppercase">{profile.MaNV}</div>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Trang thai</label>
              <div className={`px-4 py-3 border dark:border-slate-800 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center ${profile.TrangThai === 'Active' ? 'bg-green-50 text-green-600 dark:bg-green-950/20' : 'bg-red-50 text-red-600'}`}>
                <i className={`fas ${profile.TrangThai === 'Active' ? 'fa-circle-check' : 'fa-user-slash'} mr-2`}></i>
                {profile.TrangThai}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Ho va Ten</label>
            <input
              type="text"
              value={profile.HoTen}
              onChange={(e) => setProfile({ ...profile, HoTen: e.target.value })}
              className="w-full px-5 py-3.5 bg-gray-50 dark:bg-slate-950 border-2 border-transparent focus:border-indigo-500 rounded-xl outline-none dark:text-white font-black transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Ngay Sinh (Min 18+)</label>
            <input
              type="date"
              max={maxDate}
              value={profile.NgaySinh}
              onChange={(e) => setProfile({ ...profile, NgaySinh: e.target.value })}
              className="w-full px-5 py-3.5 bg-gray-50 dark:bg-slate-950 border-2 border-transparent focus:border-indigo-500 rounded-xl outline-none dark:text-white font-black transition-all"
            />
          </div>

          {message && (
            <div className={`p-4 rounded-xl text-xs font-black uppercase tracking-widest flex items-center ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-triangle-exclamation'} mr-3`}></i>
              {message.text}
            </div>
          )}

          <button type="submit" disabled={updating} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-200 dark:shadow-none transition-all active:scale-95 flex items-center justify-center">
            {updating ? <i className="fas fa-circle-notch fa-spin mr-2"></i> : <i className="fas fa-save mr-2"></i>}
            Luu ho so
          </button>
        </form>
      </div>

      <div className="space-y-8">
        <div className="p-8 bg-slate-950 text-white rounded-[2rem] shadow-2xl border border-slate-800">
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-indigo-400 mb-6 flex items-center italic">
            <i className="fas fa-sitemap mr-3"></i> Cap Tren Truc Tiep
          </h3>
          <div className="space-y-4">
            {superiors.length === 0 ? (
              <p className="text-[10px] text-gray-500 font-bold uppercase italic">Ban la cap quan ly cao nhat.</p>
            ) : (
              superiors.map((sup, idx) => (
                <div key={idx} className="flex items-center p-4 bg-slate-900 rounded-2xl border border-slate-800 group hover:border-indigo-500 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <i className="fas fa-user-tie"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-xs font-black uppercase tracking-tight">{sup.ho_ten}</p>
                    <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{sup.role}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {profile.role === 'Staff' && (
          <div className="p-8 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-gray-100 dark:border-slate-800">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-300 mb-4 flex items-center">
              <i className="fas fa-store mr-3 text-indigo-500"></i>
              Retailer cung khu vuc {staffRegion ? `(${staffRegion})` : ''}
            </h3>
            <p className="text-[11px] text-slate-500 mb-4 font-bold">
              Danh sach Retailer active trong khu vuc cua ban. Nhung tai kho cung MaKho duoc danh dau la quan ly truc tiep.
            </p>
            <div className="space-y-3">
              {regionalRetailers.length === 0 ? (
                <p className="text-[10px] text-gray-500 font-bold uppercase italic">Khong tim thay Retailer active trong khu vuc.</p>
              ) : (
                regionalRetailers.map((retailer) => (
                  <div key={retailer.user_id} className="p-4 rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950/40">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-black uppercase tracking-tight dark:text-white">{retailer.HoTen}</p>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded ${retailer.isDirect ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                        {retailer.isDirect ? 'Direct' : 'Same region'}
                      </span>
                    </div>
                    <div className="mt-2 text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                      {retailer.MaKho} - {retailer.TenKho}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="p-8 bg-indigo-600 text-white rounded-[2rem] shadow-2xl shadow-indigo-200 dark:shadow-none">
          <h3 className="text-xs font-black uppercase tracking-widest mb-2">Chi nhanh lam viec</h3>
          <p className="text-3xl font-black italic tracking-tighter uppercase">{profile.MaKho}</p>
          <div className="mt-6 flex items-center text-[10px] font-bold opacity-80">
            <i className="fas fa-location-dot mr-2"></i> Authorized Site Location
          </div>
        </div>
      </div>
    </div>
  );
}
