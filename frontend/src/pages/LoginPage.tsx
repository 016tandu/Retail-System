import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';

const LoginPage = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Staff');
  const [maKho, setMaKho] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [warehouses, setWarehouses] = useState<{MaKho: string, TenKho: string}[]>([]);

  useEffect(() => {
    const fetchWarehouses = async () => {
      const { data, error: fetchError } = await supabase.from('KHO').select('MaKho, TenKho');
      if (fetchError) {
        console.error('Error fetching warehouses:', fetchError);
      } else if (data && data.length > 0) {
        setWarehouses(data);
        setMaKho(data[0].MaKho);
      }
    };
    fetchWarehouses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (isRegistering) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
            ma_kho: maKho
          },
        },
      });
      if (error) setError(error.message);
      else setMessage({type: 'success', text: t('login.success_msg')});
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-md mx-auto">
      <div className="w-full p-10 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-indigo-50 dark:border-slate-800 transition-all duration-500">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl text-white text-3xl mb-4 shadow-xl shadow-indigo-200 dark:shadow-none">
            <i className="fas fa-store"></i>
          </div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
            {isRegistering ? t('login.register_title') : t('login.title')}
          </h2>
          <p className="text-gray-500 dark:text-slate-400 text-sm font-medium mt-2 italic">
            {isRegistering ? t('login.register_subtitle') : t('login.subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {isRegistering && (
            <>
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 mb-2 tracking-widest leading-none">Họ và Tên</label>
                <div className="relative group">
                  <i className="fas fa-user absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors"></i>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-slate-950 border border-transparent focus:border-indigo-500 dark:focus:border-indigo-500 rounded-2xl outline-none dark:text-white font-bold transition-all shadow-inner"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center mb-2">
                    <label className="block text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-widest leading-none">Chức vụ</label>
                    <div className="group relative ml-2">
                      <i className="fas fa-circle-info cursor-help text-indigo-400 text-xs"></i>
                      <div className="invisible group-hover:visible absolute left-full ml-3 top-0 w-64 p-4 bg-slate-950 text-white text-[10px] rounded-2xl shadow-2xl z-50 border border-slate-800 backdrop-blur-md opacity-98 transition-all">
                        <p className="font-black text-indigo-400 mb-2 border-b border-slate-800 pb-2 uppercase italic tracking-tighter">Phân cấp vai trò:</p>
                        <ul className="space-y-2">
                          <li><b className="text-white">Admin:</b> Quản lý Provider & Retailer.</li>
                          <li><b className="text-white">Provider:</b> Quản lý kho & vận chuyển hàng.</li>
                          <li><b className="text-white">Retailer:</b> Quản lý Staff & bán hàng tại kho.</li>
                          <li><b className="text-white">Staff:</b> Bán hàng & xem báo cáo cơ bản.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-slate-950 border border-transparent focus:border-indigo-500 rounded-2xl outline-none dark:text-white font-bold transition-all shadow-inner"
                  >
                    <option value="Staff">Nhân viên</option>
                    <option value="Provider">Nhà cung cấp</option>
                    <option value="Retailer">Quản lý chi nhánh</option>
                    <option value="Admin">Quản trị viên</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 mb-2 tracking-widest leading-none">Kho làm việc</label>
                  <select
                    value={maKho}
                    onChange={(e) => setMaKho(e.target.value)}
                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-slate-950 border border-transparent focus:border-indigo-500 rounded-2xl outline-none dark:text-white font-bold transition-all shadow-inner"
                  >
                    {warehouses.map(w => (
                      <option key={w.MaKho} value={w.MaKho}>{w.TenKho}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}
          
          <div>
            <label className="block text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 mb-2 tracking-widest leading-none">Email</label>
            <div className="relative group">
              <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors"></i>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-slate-950 border border-transparent focus:border-indigo-500 rounded-2xl outline-none dark:text-white font-bold transition-all shadow-inner"
                placeholder="name@company.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 mb-2 tracking-widest leading-none">Mật khẩu</label>
            <div className="relative group">
              <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors"></i>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-12 pr-12 py-3.5 bg-gray-50 dark:bg-slate-950 border border-transparent focus:border-indigo-500 rounded-2xl outline-none dark:text-white font-bold transition-all shadow-inner font-mono"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-500 transition-colors"
              >
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 text-[10px] font-black uppercase tracking-widest rounded-r-xl">
              <i className="fas fa-triangle-exclamation mr-2"></i> {error}
            </div>
          )}
          
          {message && (
            <div className={`p-4 border-l-4 rounded-r-xl text-[10px] font-black uppercase tracking-widest ${message.type === 'success' ? 'bg-green-50 dark:bg-green-950/20 border-green-500 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-950/20 border-red-500 text-red-700 dark:text-red-400'}`}>
              <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'} mr-2`}></i>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-200 dark:shadow-none transition-all active:scale-95 uppercase tracking-widest text-xs mt-4 flex items-center justify-center"
          >
            {loading ? <i className="fas fa-circle-notch fa-spin mr-2"></i> : null}
            {isRegistering ? t('login.register_btn') : t('login.login_btn')}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-indigo-50 dark:border-slate-800 text-center">
          <p className="text-gray-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">
            {isRegistering ? t('login.has_account') : t('login.no_account')}
            <button
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError(null);
                setMessage(null);
              }}
              className="ml-2 text-indigo-600 dark:text-indigo-400 font-black hover:underline"
            >
              {isRegistering ? t('login.login_now') : t('login.register_now')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
