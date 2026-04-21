import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';

type EmployeeRole = 'Admin' | 'Provider' | 'Retailer' | 'Staff';

type Employee = {
  MaNV: string;
  HoTen: string;
  role: EmployeeRole;
  MaKho: string;
  TrangThai: string;
};

type MyProfile = {
  MaNV: string;
  HoTen: string;
  role: EmployeeRole;
  MaKho: string;
  TrangThai: string;
};

type ConfirmModalState = {
  title: string;
  message: string;
  confirmText?: string;
  type?: 'danger' | 'info';
  onConfirm: () => void;
};

const PENDING_RESIGN_STATUS = 'PendingResign';

const InfoIcon = ({ text }: { text: string }) => (
  <div className="group relative inline-block ml-2">
    <span className="cursor-help text-gray-400 bg-gray-100 dark:bg-slate-800 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold border border-gray-200 dark:border-gray-700">
      i
    </span>
    <div className="invisible group-hover:visible absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-50 opacity-95 transition-all">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
    </div>
  </div>
);

const ConfirmModal = ({
  modal,
  onCancel,
}: {
  modal: ConfirmModalState | null;
  onCancel: () => void;
}) => {
  if (!modal) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        <h3 className={`text-xl font-black uppercase tracking-tight mb-2 ${modal.type === 'danger' ? 'text-red-600' : 'text-indigo-600'}`}>
          {modal.title}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 font-medium leading-relaxed">{modal.message}</p>
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 font-bold uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-all"
          >
            Huy bo
          </button>
          <button
            onClick={modal.onConfirm}
            className={`flex-1 py-3 rounded-xl text-white font-black uppercase text-[10px] tracking-widest shadow-lg transition-all active:scale-95 ${
              modal.type === 'danger'
                ? 'bg-red-600 hover:bg-red-700 shadow-red-200 dark:shadow-none'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 dark:shadow-none'
            }`}
          >
            {modal.confirmText || 'Xac nhan'}
          </button>
        </div>
      </div>
    </div>
  );
};

const PromotionRoleModal = ({
  employee,
  selectedRole,
  onRoleChange,
  onCancel,
  onConfirm,
}: {
  employee: Employee | null;
  selectedRole: 'Retailer' | 'Provider' | 'Admin';
  onRoleChange: (role: 'Retailer' | 'Provider' | 'Admin') => void;
  onCancel: () => void;
  onConfirm: () => void;
}) => {
  if (!employee) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        <h3 className="text-xl font-black uppercase tracking-tight text-indigo-600 mb-2">Chon cap thang chuc</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 font-medium leading-relaxed">
          Chon role moi cho <span className="font-black text-gray-800 dark:text-white">{employee.HoTen}</span>.
        </p>

        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Role muc tieu</label>
        <select
          value={selectedRole}
          onChange={(e) => onRoleChange(e.target.value as 'Retailer' | 'Provider' | 'Admin')}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold dark:text-white mb-6"
        >
          <option value="Retailer">Retailer</option>
          <option value="Provider">Provider</option>
          <option value="Admin">Admin</option>
        </select>

        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 font-bold uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-all"
          >
            Huy bo
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl text-white font-black uppercase text-[10px] tracking-widest shadow-lg transition-all active:scale-95 bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 dark:shadow-none"
          >
            Xac nhan thang cap
          </button>
        </div>
      </div>
    </div>
  );
};

const statusBadgeClass = (status: string) => {
  if (status === 'Active') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  if (status === 'Resigned') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  if (status === PENDING_RESIGN_STATUS) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
  return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
};

export default function ManagementPage() {
  const { t } = useTranslation();
  const [myProfile, setMyProfile] = useState<MyProfile | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState | null>(null);
  const [promotionModalEmployee, setPromotionModalEmployee] = useState<Employee | null>(null);
  const [selectedPromotionRole, setSelectedPromotionRole] = useState<'Retailer' | 'Provider' | 'Admin'>('Retailer');

  const canManageSubordinates = myProfile?.role === 'Admin' || myProfile?.role === 'Retailer';
  const canRequestDeactivate = myProfile?.role !== 'Admin';

  useEffect(() => {
    void fetchInitialData();
  }, []);

  const closeModals = () => {
    setConfirmModal(null);
    setPromotionModalEmployee(null);
  };

  const fetchInitialData = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMyProfile(null);
      setEmployees([]);
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('NHAN_VIEN')
      .select('MaNV, HoTen, role, MaKho, TrangThai')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError) {
      alert(profileError.message);
      setMyProfile(null);
      setEmployees([]);
      setLoading(false);
      return;
    }

    if (!profile) {
      setMyProfile(null);
      setEmployees([]);
      setLoading(false);
      return;
    }

    const typedProfile: MyProfile = {
      MaNV: profile.MaNV as string,
      HoTen: profile.HoTen as string,
      role: profile.role as EmployeeRole,
      MaKho: profile.MaKho as string,
      TrangThai: profile.TrangThai as string,
    };
    setMyProfile(typedProfile);

    let query = supabase.from('NHAN_VIEN').select('*');
    if (typedProfile.role === 'Admin') {
      query = query.in('role', ['Provider', 'Retailer', 'Staff']);
    } else if (typedProfile.role === 'Retailer') {
      query = query.eq('role', 'Staff').eq('MaKho', typedProfile.MaKho);
    } else {
      setEmployees([]);
      setLoading(false);
      return;
    }

    const { data: subordinateRows, error: subordinateError } = await query
      .order('TrangThai', { ascending: true })
      .order('role', { ascending: true })
      .order('HoTen', { ascending: true });

    if (subordinateError) {
      alert(subordinateError.message);
      setEmployees([]);
      setLoading(false);
      return;
    }

    setEmployees((subordinateRows || []) as Employee[]);
    setLoading(false);
  };

  const refreshData = async () => {
    await fetchInitialData();
  };

  const handleHierarchyAction = async (
    maNV: string,
    action: 'PROMOTE' | 'DEMOTE',
    targetRole: EmployeeRole | null = null
  ) => {
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc('hierarchy_control', {
        p_target_ma_nv: maNV,
        p_action: action,
        p_target_role: targetRole,
      });
      if (error) throw error;
      await refreshData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert(message);
    } finally {
      setSubmitting(false);
      closeModals();
    }
  };

  const handleStatusAction = async (maNV: string, currentRole: EmployeeRole, newStatus: 'Active' | 'Resigned') => {
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc('manage_employee', {
        p_target_ma_nv: maNV,
        p_new_role: currentRole,
        p_new_trang_thai: newStatus,
      });
      if (error) throw error;
      await refreshData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert(message);
    } finally {
      setSubmitting(false);
      closeModals();
    }
  };

  const handleSelfRequestDeactivate = async () => {
    if (!myProfile) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('NHAN_VIEN')
        .update({ TrangThai: PENDING_RESIGN_STATUS })
        .eq('MaNV', myProfile.MaNV);
      if (error) throw error;
      await refreshData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelSelfRequest = async () => {
    if (!myProfile) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('NHAN_VIEN')
        .update({ TrangThai: 'Active' })
        .eq('MaNV', myProfile.MaNV);
      if (error) throw error;
      await refreshData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  const openStaffPromotionModal = (employee: Employee) => {
    setSelectedPromotionRole('Retailer');
    setPromotionModalEmployee(employee);
  };

  const pendingRequests = useMemo(
    () => employees.filter((employee) => employee.TrangThai === PENDING_RESIGN_STATUS),
    [employees]
  );

  if (loading) {
    return <div className="text-center py-10 dark:text-gray-400 italic font-black animate-pulse">{t('common.loading')}</div>;
  }

  if (!myProfile) {
    return (
      <div className="max-w-2xl mx-auto mt-20 p-10 bg-orange-50 dark:bg-orange-950/20 border-2 border-orange-200 dark:border-orange-900 rounded-3xl text-center">
        <i className="fas fa-triangle-exclamation text-4xl text-orange-500 mb-4"></i>
        <h2 className="text-xl font-black text-orange-700 dark:text-orange-400 uppercase tracking-tight">Khong tim thay profile</h2>
        <p className="text-orange-600 dark:text-orange-500/70 font-medium mt-2">Tai khoan hien tai chua duoc dong bo NHAN_VIEN.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b dark:border-slate-800 pb-6 gap-4">
        <div>
          <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic flex items-center">
            Dieu Phoi Nhan Su
            <InfoIcon text="Cap tren co the sa thai cap duoi truc tiep. Cap duoi muon deactivate can gui notice trong section Pending / Yeu cau tu cap duoi." />
          </h2>
          <p className="text-gray-500 dark:text-slate-400 font-bold mt-1 uppercase tracking-widest text-[10px]">Human Resources Management</p>
        </div>
        <div className="px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-300 text-[10px] font-black uppercase tracking-widest">
          {myProfile.HoTen} | {myProfile.role} | {myProfile.MaKho}
        </div>
      </div>

      {submitting && (
        <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/30 text-sm font-bold">
          Dang xu ly thao tac nhan su...
        </div>
      )}

      {canRequestDeactivate && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight text-slate-800 dark:text-slate-100">Yeu cau deactivate ca nhan</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Gui notice toi cap tren gan nhat de duoc duyet nghi viec.</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusBadgeClass(myProfile.TrangThai)}`}>
              {myProfile.TrangThai}
            </span>
          </div>

          <div className="mt-4 flex gap-2">
            {myProfile.TrangThai === 'Active' && (
              <button
                onClick={() =>
                  setConfirmModal({
                    title: 'Gui notice deactivate',
                    message: 'Yeu cau se duoc dua vao section Pending cua cap tren. Ban van o trang thai Active cho toi khi duoc duyet.',
                    confirmText: 'Gui notice',
                    type: 'info',
                    onConfirm: () => void handleSelfRequestDeactivate(),
                  })
                }
                className="px-4 py-2 bg-amber-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-amber-700 transition-all"
              >
                Gui Notice
              </button>
            )}

            {myProfile.TrangThai === PENDING_RESIGN_STATUS && (
              <button
                onClick={() =>
                  setConfirmModal({
                    title: 'Huy notice',
                    message: 'Ban chac chan muon huy yeu cau deactivate?',
                    confirmText: 'Huy yeu cau',
                    type: 'danger',
                    onConfirm: () => void handleCancelSelfRequest(),
                  })
                }
                className="px-4 py-2 bg-slate-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-all"
              >
                Huy Notice
              </button>
            )}
          </div>
        </div>
      )}

      {canManageSubordinates && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <h3 className="text-xl font-black uppercase tracking-tight text-slate-800 dark:text-slate-100">Pending / Yeu cau tu cap duoi</h3>
            <span className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 text-amber-600 dark:text-amber-300 text-[10px] font-black uppercase tracking-widest">
              {pendingRequests.length} Yeu Cau
            </span>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 text-sm font-medium border border-slate-100 dark:border-slate-800">
              Khong co yeu cau deactivate nao dang cho duyet.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((employee) => (
                <div
                  key={`pending-${employee.MaNV}`}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-950/15"
                >
                  <div>
                    <div className="font-black text-slate-800 dark:text-slate-100">{employee.HoTen}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {employee.MaNV} | {employee.role} | {employee.MaKho}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setConfirmModal({
                          title: 'Duyet deactivate',
                          message: `Xac nhan sa thai ${employee.HoTen}?`,
                          confirmText: 'Duyet',
                          type: 'danger',
                          onConfirm: () => void handleStatusAction(employee.MaNV, employee.role, 'Resigned'),
                        })
                      }
                      className="px-3 py-2 rounded-xl bg-red-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all"
                    >
                      Duyet
                    </button>
                    <button
                      onClick={() =>
                        setConfirmModal({
                          title: 'Tu choi deactivate',
                          message: `Tu choi yeu cau deactivate cua ${employee.HoTen} va chuyen ve Active?`,
                          confirmText: 'Tu choi',
                          type: 'info',
                          onConfirm: () => void handleStatusAction(employee.MaNV, employee.role, 'Active'),
                        })
                      }
                      className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all"
                    >
                      Tu choi
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {canManageSubordinates ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-slate-950 text-[10px] uppercase font-black text-gray-500 dark:text-slate-500 tracking-[0.2em] border-b dark:border-slate-800">
                <tr>
                  <th className="px-8 py-6">Nhan su</th>
                  <th className="px-8 py-6">Vai tro</th>
                  <th className="px-8 py-6">Kho</th>
                  <th className="px-8 py-6">Trang thai</th>
                  <th className="px-8 py-6 text-right">Thao tac</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-16 text-center text-gray-400 italic font-medium">
                      Khong co nhan su thuoc quyen quan ly truc tiep.
                    </td>
                  </tr>
                ) : (
                  employees.map((employee) => (
                    <tr key={employee.MaNV} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-8 py-5">
                        <div className="font-black text-gray-900 dark:text-white uppercase tracking-tight">{employee.HoTen}</div>
                        <div className="text-[10px] text-gray-400 font-mono font-bold">{employee.MaNV}</div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-800">
                          {employee.role}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest italic">{employee.MaKho}</td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${statusBadgeClass(employee.TrangThai)}`}>
                          {employee.TrangThai}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right space-x-2">
                        {myProfile.role === 'Admin' && employee.role === 'Staff' && (
                          <button
                            onClick={() => openStaffPromotionModal(employee)}
                            className="p-2.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100 dark:border-indigo-900/30 shadow-sm"
                            title="Thang cap Staff voi role lua chon"
                          >
                            <i className="fas fa-user-plus"></i>
                          </button>
                        )}

                        {myProfile.role === 'Admin' && (employee.role === 'Retailer' || employee.role === 'Provider') && (
                          <>
                            <button
                              onClick={() =>
                                setConfirmModal({
                                  title: 'Thang cap len Admin',
                                  message: `Thang cap ${employee.HoTen} len Admin?`,
                                  confirmText: 'Thang cap',
                                  type: 'info',
                                  onConfirm: () => void handleHierarchyAction(employee.MaNV, 'PROMOTE', 'Admin'),
                                })
                              }
                              className="p-2.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100 dark:border-indigo-900/30 shadow-sm"
                              title="Thang cap len Admin"
                            >
                              <i className="fas fa-arrow-up"></i>
                            </button>
                            <button
                              onClick={() =>
                                setConfirmModal({
                                  title: 'Giang cap ve Staff',
                                  message: `Giang cap ${employee.HoTen} xuong Staff?`,
                                  confirmText: 'Giang cap',
                                  type: 'danger',
                                  onConfirm: () => void handleHierarchyAction(employee.MaNV, 'DEMOTE', null),
                                })
                              }
                              className="p-2.5 bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 rounded-xl hover:bg-orange-600 hover:text-white transition-all border border-orange-100 dark:border-orange-900/30 shadow-sm"
                              title="Giang cap xuong Staff"
                            >
                              <i className="fas fa-arrow-down"></i>
                            </button>
                          </>
                        )}

                        {employee.TrangThai === 'Active' && (
                          <button
                            onClick={() =>
                              setConfirmModal({
                                title: 'Sa thai cap duoi',
                                message: `Ban chac chan muon sa thai ${employee.HoTen}?`,
                                confirmText: 'Sa thai',
                                type: 'danger',
                                onConfirm: () => void handleStatusAction(employee.MaNV, employee.role, 'Resigned'),
                              })
                            }
                            className="p-2.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-all border border-red-100 dark:border-red-900/30 shadow-sm"
                            title="Sa thai"
                          >
                            <i className="fas fa-user-slash"></i>
                          </button>
                        )}

                        {employee.TrangThai === 'Resigned' && (
                          <button
                            onClick={() =>
                              setConfirmModal({
                                title: 'Kich hoat lai',
                                message: `Khoi phuc trang thai Active cho ${employee.HoTen}?`,
                                confirmText: 'Khoi phuc',
                                type: 'info',
                                onConfirm: () => void handleStatusAction(employee.MaNV, employee.role, 'Active'),
                              })
                            }
                            className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 dark:border-emerald-900/30 shadow-sm"
                            title="Khoi phuc Active"
                          >
                            <i className="fas fa-rotate-left"></i>
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
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 p-6">
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
            Role hien tai khong co quyen dieu phoi nhan su, ban chi co the gui notice deactivate cho cap tren.
          </p>
        </div>
      )}

      <PromotionRoleModal
        employee={promotionModalEmployee}
        selectedRole={selectedPromotionRole}
        onRoleChange={setSelectedPromotionRole}
        onCancel={closeModals}
        onConfirm={() => {
          if (!promotionModalEmployee) return;
          void handleHierarchyAction(promotionModalEmployee.MaNV, 'PROMOTE', selectedPromotionRole);
        }}
      />

      <ConfirmModal modal={confirmModal} onCancel={closeModals} />
    </div>
  );
}

