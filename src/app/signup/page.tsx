'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

export default function SignupPage() {
  const router = useRouter();
  const { user, loading, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır');
      return;
    }

    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return;
    }

    setIsLoading(true);
    const { error, needsConfirmation } = await signUp(email, password);

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('already registered') || msg.includes('already exists')) {
        setError('Bu e-posta zaten kayıtlı. Giriş yapmayı dene.');
      } else if (msg.includes('signups not allowed') || msg.includes('not allowed')) {
        setError('Kayıt şu an kapalı. Supabase → Authentication → Providers → Email → "Allow new users" seçeneğini aç.');
      } else if (msg.includes('rate limit') || msg.includes('429')) {
        setError('E-posta limiti aşıldı. Supabase → Authentication → Providers → Email → "Confirm email" seçeneğini kapat.');
      } else {
        setError(`Kayıt başarısız: ${error.message}`);
      }
      setIsLoading(false);
    } else if (needsConfirmation) {
      setSuccess(true);
      setIsLoading(false);
    } else {
      router.push('/');
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundImage: 'url(/homepage-background.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4" style={{ backgroundImage: 'url(/homepage-background.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="bg-white/80 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-2xl border-4 border-white/50 p-5 sm:p-8 w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl sm:rounded-2xl mx-auto flex items-center justify-center mb-3 sm:mb-4 shadow-lg">
            <span className="text-3xl sm:text-4xl">🎓</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800">Çarpma Serüveni</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Öğretmen Kaydı</p>
        </div>

        {success ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-green-500 text-4xl">mark_email_read</span>
            </div>
            <h2 className="text-lg font-extrabold text-slate-800">E-postanı Kontrol Et!</h2>
            <p className="text-slate-500 text-sm">
              <span className="font-bold text-slate-700">{email}</span> adresine bir onay bağlantısı gönderdik. Bağlantıya tıkladıktan sonra giriş yapabilirsin.
            </p>
            <Link
              href="/login"
              className="block w-full py-2.5 sm:py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all text-center text-sm sm:text-base"
            >
              Giriş Yap
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-600 mb-1">E-posta</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-orange-400 text-lg sm:text-xl">mail</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@email.com"
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white border-2 border-orange-200 rounded-lg sm:rounded-xl text-slate-700 placeholder-slate-400 focus:border-orange-400 focus:outline-none transition-all text-sm sm:text-base"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-600 mb-1">Şifre</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-orange-400 text-lg sm:text-xl">lock</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="En az 6 karakter"
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white border-2 border-orange-200 rounded-lg sm:rounded-xl text-slate-700 placeholder-slate-400 focus:border-orange-400 focus:outline-none transition-all text-sm sm:text-base"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-600 mb-1">Şifre Tekrar</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-orange-400 text-lg sm:text-xl">lock_reset</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Şifreni tekrar gir"
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white border-2 border-orange-200 rounded-lg sm:rounded-xl text-slate-700 placeholder-slate-400 focus:border-orange-400 focus:outline-none transition-all text-sm sm:text-base"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-2.5 sm:p-3 bg-red-100 border border-red-200 rounded-lg sm:rounded-xl flex items-center gap-2 text-red-600 text-xs sm:text-sm">
                <span className="material-symbols-outlined text-base sm:text-lg">error</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm sm:text-base"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Kayıt olunuyor...</span>
                </>
              ) : (
                <>
                  <span>Kayıt Ol</span>
                  <span className="material-symbols-outlined text-lg sm:text-xl">person_add</span>
                </>
              )}
            </button>

            <p className="text-center text-xs sm:text-sm text-slate-500 pt-1">
              Zaten hesabın var mı?{' '}
              <Link href="/login" className="font-bold text-orange-500 hover:text-orange-600 transition-colors">
                Giriş Yap
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
