import { useState } from 'react';
import { supabase } from '../supabaseClient';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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
          },
        },
      });
      if (error) setError(error.message);
      else setMessage('Đăng ký thành công! Vui lòng kiểm tra email để xác nhận (nếu có).');
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
          {isRegistering ? 'Tạo tài khoản' : 'Chào mừng trở lại'}
        </h2>
        <p className="text-center text-gray-500 mb-8">
          {isRegistering ? 'Đăng ký để quản lý kho hàng TechStore' : 'Đăng nhập vào hệ thống quản lý'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {isRegistering && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Họ và Tên</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                placeholder="Nguyễn Văn A"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
              placeholder="admin@techstore.com"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
              {error}
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
            {loading ? 'Đang xử lý...' : isRegistering ? 'Đăng ký ngay' : 'Đăng nhập'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-gray-600">
            {isRegistering ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}
            <button
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError(null);
                setMessage(null);
              }}
              className="ml-2 text-indigo-600 font-bold hover:underline"
            >
              {isRegistering ? 'Đăng nhập' : 'Đăng ký ngay'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
