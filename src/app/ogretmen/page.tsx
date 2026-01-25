'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStudentsAsync, Student } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

export default function TeacherPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Auth kontrolü
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/giris');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const loadStudents = async () => {
      const data = await getStudentsAsync();
      setStudents(data);
    };

    if (user) {
      loadStudents();
      // Her 5 saniyede güncelle
      const interval = setInterval(loadStudents, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const startGame = (student: Student, level: number) => {
    router.push(`/oyun/${level}?studentId=${student.id}`);
  };

  const levelNames = ['Onluk & Birlik', 'Büyük Sayılar', 'Üç Basamaklılar', 'Zeka Soruları'];

  return (
    <main className="min-h-screen p-6 bg-gradient-to-br from-blue-50 to-white">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black gradient-text">Öğretmen Paneli</h1>
            <p className="text-slate-500 font-bold mt-1">Öğrenci seç ve oyuna başla</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:border-blue-300 transition-all"
          >
            ← Ana Sayfa
          </button>
        </div>

        {/* Öğrenci Listesi */}
        {students.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-xl border-4 border-slate-100">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-black text-slate-700 mb-2">Henüz Öğrenci Yok</h2>
            <p className="text-slate-500 font-medium mb-6">
              Öğrenciler ana sayfadan isimlerini girerek kayıt olabilirler.
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-8 py-4 bg-gradient-to-r from-blue-400 to-blue-600 text-white font-black rounded-xl shadow-lg"
            >
              İlk Öğrenciyi Ekle
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {students.map((student) => (
              <div
                key={student.id}
                className={`bg-white rounded-3xl p-6 shadow-xl border-4 transition-all cursor-pointer card-hover ${
                  selectedStudent?.id === student.id
                    ? 'border-blue-500 ring-4 ring-blue-200'
                    : 'border-slate-100 hover:border-blue-300'
                }`}
                onClick={() => setSelectedStudent(student)}
              >
                {/* Avatar */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-black shadow-lg">
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800">{student.name}</h3>
                    <p className="text-sm text-blue-500 font-bold">
                      Seviye {student.currentLevel} - {levelNames[student.currentLevel - 1] || 'Tamamlandı'}
                    </p>
                  </div>
                </div>

                {/* İstatistikler */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-green-50 rounded-xl p-3 text-center">
                    <div className="text-2xl font-black text-green-600">{student.correctCount}</div>
                    <div className="text-xs font-bold text-green-500">Doğru</div>
                  </div>
                  <div className="bg-red-50 rounded-xl p-3 text-center">
                    <div className="text-2xl font-black text-red-500">{student.wrongCount}</div>
                    <div className="text-xs font-bold text-red-400">Yanlış</div>
                  </div>
                  <div className="bg-yellow-50 rounded-xl p-3 text-center">
                    <div className="text-2xl font-black text-yellow-600">{student.totalStars}</div>
                    <div className="text-xs font-bold text-yellow-500">Yıldız</div>
                  </div>
                </div>

                {/* Seviye Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm font-bold text-slate-500 mb-1">
                    <span>İlerleme</span>
                    <span>{Math.min(student.currentLevel, 4)} / 4 Bölüm</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all"
                      style={{ width: `${(Math.min(student.currentLevel, 4) / 4) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Bölüm Seçimi */}
                {selectedStudent?.id === student.id && (
                  <div className="border-t-2 border-slate-100 pt-4 mt-4 animate-pop">
                    <p className="text-sm font-bold text-slate-500 mb-3">Bölüm Seç:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[1, 2, 3, 4].map((level) => {
                        const unlocked = level <= student.currentLevel;
                        return (
                          <button
                            key={level}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (unlocked) startGame(student, level);
                            }}
                            disabled={!unlocked}
                            className={`py-3 rounded-xl font-bold text-sm transition-all ${
                              unlocked
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            {unlocked ? `${level}. Bölüm` : '🔒'}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Toplam İstatistikler */}
        {students.length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-3xl p-6 text-white">
            <h2 className="text-xl font-black mb-4">📊 Sınıf İstatistikleri</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/20 backdrop-blur rounded-2xl p-4 text-center">
                <div className="text-3xl font-black">{students.length}</div>
                <div className="text-sm font-bold opacity-80">Toplam Öğrenci</div>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-2xl p-4 text-center">
                <div className="text-3xl font-black">
                  {students.reduce((sum, s) => sum + s.correctCount, 0)}
                </div>
                <div className="text-sm font-bold opacity-80">Toplam Doğru</div>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-2xl p-4 text-center">
                <div className="text-3xl font-black">
                  {students.reduce((sum, s) => sum + s.wrongCount, 0)}
                </div>
                <div className="text-sm font-bold opacity-80">Toplam Yanlış</div>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-2xl p-4 text-center">
                <div className="text-3xl font-black">
                  {students.reduce((sum, s) => sum + s.totalStars, 0)}
                </div>
                <div className="text-sm font-bold opacity-80">Toplam Yıldız ⭐</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
