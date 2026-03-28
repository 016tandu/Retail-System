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
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [warehouses, setWarehouses] = useState<{MaKho: string, TenKho: string}[]>([]);

  useEffect(() => {
    const fetchWarehouses = async () => {
      const { data, error: fetchError } = await supabase.from('KHO').select('MaKho, TenKho');
      if (fetchError) {
        console.error('Error fetching warehouses:', fetchError);
      } else if (data && data.length > 0) {
        setWarehouses(data);
        setMaKho(data[0].MaKho); // Tự động chọn kho đầu tiên
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
      else setMessage(t('login.success_msg'));
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
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full max-w-md mx-auto">
      <div className="w-full p-8 bg-white rounded-xl shadow-xl border border-gray-100">
        <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-2">
          {isRegistering ? t('login.register_title') : t('login.title')}
        </h2>
        <p className="text-center text-gray-500 mb-8">
          {isRegistering ? t('login.register_subtitle') : t('login.subtitle')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{t('login.full_name')}</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center mb-1">
                    <label className="block text-sm font-semibold text-gray-700">Chức vụ</label>
                    <div className="group relative ml-2">
                      <span className="cursor-help text-gray-400 bg-gray-100 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">i</span>
                      <div className="invisible group-hover:visible absolute left-full ml-2 top-0 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-50 opacity-95 transition-all">
                        <p className="font-bold mb-1 border-b border-gray-700 pb-1">Giải thích vai trò:</p>
                        <ul className="space-y-1 mt-1">
                          <li><b className="text-indigo-400">Admin:</b> Toàn quyền hệ thống.</li>
                          <li><b className="text-indigo-400">Provider:</b> Nhập hàng từ nhà cung cấp, gửi hàng cho chi nhánh.</li>
                          <li><b className="text-indigo-400">Retailer:</b> Bán hàng (Hóa đơn), nhận hàng từ kho tổng.</li>
                          <li><b className="text-indigo-400">Staff:</b> Xem thông tin và báo cáo cơ bản.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="Staff">Nhân viên</option>
                    <option value="Provider">Nhà cung cấp (Kho tổng)</option>
                    <option value="Retailer">Quản lý chi nhánh</option>
                    <option value="Admin">Quản trị viên</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Kho làm việc</label>
                  <select
                    value={maKho}
                    onChange={(e) => setMaKho(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
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
            <label className="block text-sm font-semibold text-gray-700 mb-1">{t('login.email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="name@company.com"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{t('login.password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
              {t('common.error', { message: error })}
            </div>
          )}
          
          {message && (
            <div className="p-3 bg-green-50 border-l-4 border-green-500 text-green-700 text-sm">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-lg hover:shadow-indigo-200 transition-all disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? t('login.processing') : isRegistering ? t('login.register_btn') : t('login.login_btn')}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-gray-600">
            {isRegistering ? t('login.has_account') : t('login.no_account')}
            <button
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError(null);
                setMessage(null);
              }}
              className="ml-2 text-indigo-600 font-bold hover:underline"
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
