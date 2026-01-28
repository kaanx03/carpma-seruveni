'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError('E-posta veya şifre hatalı');
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

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4" style={{ backgroundImage: 'url(/homepage-background.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="bg-white/80 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-2xl border-4 border-white/50 p-5 sm:p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl sm:rounded-2xl mx-auto flex items-center justify-center mb-3 sm:mb-4 shadow-lg">
            <span className="text-3xl sm:text-4xl">🎓</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800">Çarpma Serüveni</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Öğretmen Girişi</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-600 mb-1">E-posta</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-orange-400 text-lg sm:text-xl">
                mail
              </span>
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
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-orange-400 text-lg sm:text-xl">
                lock
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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
                <span className="text-sm sm:text-base">Giriş yapılıyor...</span>
              </>
            ) : (
              <>
                <span>Giriş Yap</span>
                <span className="material-symbols-outlined text-lg sm:text-xl">login</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
