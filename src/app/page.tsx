'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getStudentsAsync, createStudentAsync, deleteStudentAsync, updateStudentNameAsync, updateStudentAvatarAsync, Student, AVATARS } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [newStudentName, setNewStudentName] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [selectedAvatarId, setSelectedAvatarId] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const refreshStudents = useCallback(async () => {
    const data = await getStudentsAsync();
    if (data.length === 0) {
      setFetchError(false);
    }
    setStudents(data);
  }, []);

  useEffect(() => {
    setMounted(true);
    getStudentsAsync().then(data => {
      setStudents(data);
      setFetchError(false);
      setLoading(false);
    }).catch(() => {
      setFetchError(true);
      setLoading(false);
    });
  }, []);

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    return students.filter(s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [students, searchQuery]);

  const handleAddStudent = async () => {
    if (!newStudentName.trim()) return;
    const student = await createStudentAsync(newStudentName.trim(), selectedAvatarId);
    await refreshStudents();
    setNewStudentName('');
    setShowAddForm(false);
    if (student) setSelectedStudent(student);
    setSelectedAvatarId(Math.floor(Math.random() * AVATARS.length));
  };

  const handleDeleteStudent = async (id: string) => {
    await deleteStudentAsync(id);
    await refreshStudents();
    if (selectedStudent?.id === id) {
      setSelectedStudent(null);
    }
    setShowDeleteConfirm(null);
  };

  const handleEditStudent = async (id: string) => {
    if (!editName.trim()) return;
    const updated = await updateStudentNameAsync(id, editName.trim());
    if (updated && selectedStudent?.id === id) {
      setSelectedStudent(updated);
    }
    await refreshStudents();
    setEditingStudent(null);
    setEditName('');
  };

  const handleChangeAvatar = async (avatarId: number) => {
    if (selectedStudent) {
      const updated = await updateStudentAvatarAsync(selectedStudent.id, avatarId);
      if (updated) {
        setSelectedStudent(updated);
        await refreshStudents();
      }
    }
    setShowAvatarPicker(false);
  };

  const startEditing = (student: Student) => {
    setEditingStudent(student.id);
    setEditName(student.name);
  };

  const startGame = () => {
    if (selectedStudent) {
      router.push(`/game/${selectedStudent.currentLevel}?studentId=${selectedStudent.id}`);
    }
  };

  const getAvatar = (avatarId: number) => {
    return AVATARS[avatarId] || AVATARS[0];
  };

  if (!mounted || loading || authLoading || !user) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundImage: 'url(/homepage-background.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col" style={{ backgroundImage: 'url(/homepage-background.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>

      {/* Avatar Picker Modal */}
      {showAvatarPicker && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAvatarPicker(false)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 animate-pop" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">Avatar Seç</h3>
              <button onClick={() => setShowAvatarPicker(false)} className="p-2 hover:bg-slate-100 rounded-full cursor-pointer">
                <span className="material-symbols-outlined text-slate-500">close</span>
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {AVATARS.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => handleChangeAvatar(avatar.id)}
                  className={`relative aspect-square rounded-2xl bg-gradient-to-br ${avatar.bg} flex items-center justify-center text-4xl hover:scale-105 transition-all shadow-lg cursor-pointer ${
                    selectedStudent?.avatarId === avatar.id ? 'ring-4 ring-[#2b8cee] ring-offset-2' : ''
                  }`}
                >
                  {avatar.emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Logout Button - Hidden at 768px and below */}
      <div className="absolute top-4 right-4 z-10 hidden md:block">
        <button
          onClick={() => signOut()}
          className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm text-slate-600 font-bold rounded-xl shadow-lg hover:bg-white hover:text-red-500 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          <span className="hidden sm:inline">Çıkış</span>
        </button>
      </div>

      {/* Main Content - Panel positioned over blackboard area */}
      <main className="flex-1 flex items-start md:items-center justify-center min-h-0 pt-4 md:pt-[8%] overflow-auto">
        <div className="h-auto md:h-[72%] w-[92%] max-w-[1000px] flex flex-col md:flex-row gap-4 py-4 md:py-0">

          {/* Left Panel - Student List */}
          <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-2xl border-4 border-white/50 flex flex-col overflow-hidden w-full md:w-[45%] min-w-0 md:min-w-[280px] min-h-[300px] md:min-h-0">
            {/* Panel Header */}
            <div className="flex-shrink-0 px-4 py-3 border-b border-orange-200 flex items-center justify-between bg-gradient-to-r from-orange-400 to-amber-400">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-white text-xl">groups</span>
                <h2 className="text-base font-bold text-white">Öğrenciler</h2>
                <span className="px-2 py-0.5 bg-white/30 text-white text-xs font-bold rounded-full">
                  {students.length}
                </span>
              </div>
              <button
                onClick={() => {
                  setShowAddForm(!showAddForm);
                  setSelectedAvatarId(Math.floor(Math.random() * AVATARS.length));
                }}
                className={`flex items-center gap-2 px-3 py-1.5 font-bold rounded-lg transition-all text-sm cursor-pointer focus:outline-none ${
                  showAddForm
                    ? 'bg-slate-200 text-slate-500'
                    : 'bg-white text-orange-500 shadow-lg hover:bg-orange-50'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{showAddForm ? 'close' : 'person_add'}</span>
                <span className="hidden sm:inline">{showAddForm ? 'İptal' : 'Ekle'}</span>
              </button>
            </div>

            {/* Search Bar */}
            <div className="flex-shrink-0 px-3 py-2 border-b border-orange-100">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-orange-400 text-lg">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Öğrenci ara..."
                  className="w-full pl-9 pr-4 py-2 bg-white/80 border border-orange-200 rounded-lg text-sm font-medium text-slate-700 placeholder-slate-400 focus:border-orange-400 focus:outline-none transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                )}
              </div>
            </div>

            {/* Add Student Form */}
            {showAddForm && (
              <div className="flex-shrink-0 px-3 py-2 bg-orange-50 border-b border-orange-100">
                <div className="flex gap-2 items-center">
                  {/* Avatar Preview */}
                  <button
                    onClick={() => setSelectedAvatarId((selectedAvatarId + 1) % AVATARS.length)}
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getAvatar(selectedAvatarId).bg} flex items-center justify-center text-xl shadow-lg hover:scale-105 transition-all flex-shrink-0 cursor-pointer`}
                    title="Tıkla ve değiştir"
                  >
                    {getAvatar(selectedAvatarId).emoji}
                  </button>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddStudent()}
                      placeholder="Öğrenci adı..."
                      maxLength={40}
                      className="w-full px-3 py-2 bg-white border border-orange-200 rounded-lg text-sm font-medium text-slate-700 placeholder-slate-400 focus:border-orange-400 focus:outline-none"
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={handleAddStudent}
                    disabled={!newStudentName.trim()}
                    className="px-3 py-2 bg-orange-500 text-white font-bold rounded-lg disabled:opacity-50 hover:bg-orange-600 transition-all flex items-center cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">check</span>
                  </button>
                </div>
              </div>
            )}

            {/* Student List */}
            <div className="flex-1 overflow-y-auto p-2 min-h-0">
              {fetchError ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <span className="material-symbols-outlined text-5xl text-red-300 mb-3">cloud_off</span>
                  <h3 className="text-base font-bold text-slate-600 mb-1">Bağlantı hatası</h3>
                  <p className="text-slate-400 text-sm mb-3">Öğrenciler yüklenemedi</p>
                  <button onClick={() => refreshStudents()} className="px-3 py-1.5 bg-orange-500 text-white text-sm font-bold rounded-lg hover:bg-orange-600 cursor-pointer">
                    Tekrar Dene
                  </button>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  {students.length === 0 ? (
                    <>
                      <span className="material-symbols-outlined text-5xl text-orange-300 mb-3">school</span>
                      <h3 className="text-base font-bold text-slate-600 mb-1">Henüz öğrenci yok</h3>
                      <p className="text-slate-400 text-sm">Yukarıdaki "Ekle" butonuna tıklayın</p>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-4xl text-orange-300 mb-2">search_off</span>
                      <h3 className="text-base font-bold text-slate-600 mb-1">Sonuç bulunamadı</h3>
                      <p className="text-slate-400 text-sm">"{searchQuery}" için eşleşme yok</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filteredStudents.map((student) => {
                    const avatar = getAvatar(student.avatarId ?? 0);
                    return (
                      <div
                        key={student.id}
                        className={`relative group rounded-lg transition-all border ${
                          selectedStudent?.id === student.id
                            ? 'bg-orange-100 ring-2 ring-orange-400 border-[#ff8904]'
                            : 'bg-white/60 hover:bg-white/90 border-[#ff8904]/50'
                        }`}
                      >
                        {/* Delete Confirmation */}
                        {showDeleteConfirm === student.id && (
                          <div className="absolute inset-0 bg-white/95 backdrop-blur rounded-lg flex items-center justify-center gap-2 z-10">
                            <span className="material-symbols-outlined text-red-400">warning</span>
                            <span className="font-bold text-slate-700 text-sm">Silinsin mi?</span>
                            <button
                              onClick={() => handleDeleteStudent(student.id)}
                              className="px-2 py-1 bg-red-500 text-white font-bold rounded text-xs hover:bg-red-600 cursor-pointer"
                            >
                              Sil
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(null)}
                              className="px-2 py-1 bg-slate-200 text-slate-600 font-bold rounded text-xs hover:bg-slate-300 cursor-pointer"
                            >
                              İptal
                            </button>
                          </div>
                        )}

                        {/* Edit Mode */}
                        {editingStudent === student.id ? (
                          <div className="p-2 flex items-center gap-2">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleEditStudent(student.id);
                                if (e.key === 'Escape') { setEditingStudent(null); setEditName(''); }
                              }}
                              maxLength={40}
                              className="flex-1 px-2 py-1.5 bg-white border-2 border-orange-400 rounded text-sm font-medium text-slate-700 focus:outline-none"
                              autoFocus
                            />
                            <button onClick={() => handleEditStudent(student.id)} className="p-1 bg-orange-500 text-white rounded hover:bg-orange-600 cursor-pointer flex items-center justify-center">
                              <span className="material-symbols-outlined text-base leading-none">check</span>
                            </button>
                            <button onClick={() => { setEditingStudent(null); setEditName(''); }} className="p-1 bg-slate-200 text-slate-600 rounded hover:bg-slate-300 cursor-pointer flex items-center justify-center">
                              <span className="material-symbols-outlined text-base">close</span>
                            </button>
                          </div>
                        ) : (
                          <div className="p-2 flex items-center gap-2 cursor-pointer" onClick={() => setSelectedStudent(student)}>
                            {/* Avatar */}
                            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${avatar.bg} flex items-center justify-center text-lg shadow ${
                              selectedStudent?.id === student.id ? 'ring-2 ring-orange-400 scale-105' : ''
                            } transition-all`}>
                              {avatar.emoji}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-slate-700 text-sm truncate">{student.name}</div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs font-semibold text-orange-500">Lv.{student.currentLevel}</span>
                                <span className="text-xs text-emerald-500">✓{student.correctCount}</span>
                                <span className="text-xs text-red-400">✗{student.wrongCount}</span>
                              </div>
                            </div>

                            {/* Stars */}
                            <div className="flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-amber-400 text-base" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
                              <span className="font-bold text-amber-500 text-sm">{student.totalStars}</span>
                            </div>

                            {/* Actions */}
                            <div className={`flex items-center gap-0.5 transition-opacity ${selectedStudent?.id === student.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                              <button
                                onClick={(e) => { e.stopPropagation(); startEditing(student); }}
                                className="p-1 text-slate-400 hover:text-orange-500 hover:bg-orange-100 rounded cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-base">edit</span>
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(student.id); }}
                                className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-100 rounded cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-base">delete</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Student Detail */}
          <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-2xl border-4 border-white/50 flex flex-col overflow-hidden flex-1 min-h-[350px] md:min-h-0">
            {selectedStudent ? (
              <>
                {/* Student Header */}
                <div className={`flex-shrink-0 p-4 bg-gradient-to-br ${getAvatar(selectedStudent.avatarId ?? 0).bg} text-white relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />

                  <div className="relative flex items-center gap-4">
                    {/* Clickable Avatar */}
                    <button
                      onClick={() => setShowAvatarPicker(true)}
                      className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getAvatar(selectedStudent.avatarId ?? 0).bg} flex items-center justify-center text-3xl shadow-xl border-3 border-white/30 hover:scale-105 transition-all group cursor-pointer`}
                    >
                      {getAvatar(selectedStudent.avatarId ?? 0).emoji}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-xl flex items-center justify-center transition-all">
                        <span className="material-symbols-outlined text-white text-lg opacity-0 group-hover:opacity-100 transition-all">edit</span>
                      </div>
                    </button>
                    <div>
                      <h2 className="text-xl font-extrabold">{selectedStudent.name}</h2>
                      <p className="text-white/80 text-xs font-medium">Seviye {selectedStudent.currentLevel} Maceracısı</p>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex-shrink-0 p-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-emerald-100 rounded-lg p-2 text-center">
                      <span className="material-symbols-outlined text-emerald-500 text-xl">check_circle</span>
                      <div className="text-xl font-black text-emerald-600">{selectedStudent.correctCount}</div>
                      <div className="text-[10px] font-bold text-slate-500">Doğru</div>
                    </div>
                    <div className="bg-red-100 rounded-lg p-2 text-center">
                      <span className="material-symbols-outlined text-red-400 text-xl">cancel</span>
                      <div className="text-xl font-black text-red-500">{selectedStudent.wrongCount}</div>
                      <div className="text-[10px] font-bold text-slate-500">Yanlış</div>
                    </div>
                    <div className="bg-amber-100 rounded-lg p-2 text-center">
                      <span className="material-symbols-outlined text-amber-500 text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
                      <div className="text-xl font-black text-amber-600">{selectedStudent.totalStars}</div>
                      <div className="text-[10px] font-bold text-slate-500">Yıldız</div>
                    </div>
                  </div>
                </div>

                {/* Level Selection */}
                <div className="flex-1 px-3 pb-2 min-h-0">
                  <div className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">map</span>
                    SEVİYE SEÇ
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((level) => {
                      const isUnlocked = level <= selectedStudent.currentLevel;
                      const isCurrent = level === selectedStudent.currentLevel;
                      return (
                        <button
                          key={level}
                          onClick={() => isUnlocked && router.push(`/game/${level}?studentId=${selectedStudent.id}`)}
                          disabled={!isUnlocked}
                          className={`relative p-3 rounded-lg font-bold transition-all ${
                            isCurrent
                              ? 'bg-orange-500 text-white shadow-lg scale-105 cursor-pointer'
                              : isUnlocked
                              ? 'bg-orange-100 text-orange-600 hover:scale-105 hover:bg-orange-200 cursor-pointer'
                              : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                          }`}
                        >
                          {isUnlocked ? (
                            <span className="text-lg font-black">{level}</span>
                          ) : (
                            <span className="material-symbols-outlined text-lg">lock</span>
                          )}
                          {isCurrent && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[8px] font-black text-white shadow animate-bounce">
                              !
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Start Button */}
                <div className="flex-shrink-0 p-3 pt-1">
                  <button
                    onClick={startGame}
                    className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-base font-extrabold rounded-lg shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>OYUNA BAŞLA</span>
                    <span className="material-symbols-outlined text-xl">play_circle</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-4xl text-orange-400">school</span>
                </div>
                <h3 className="text-lg font-bold text-slate-700 mb-1">Öğrenci Seçin</h3>
                <p className="text-slate-500 text-xs">
                  Soldan bir öğrenci seçin
                </p>
                <div className="flex items-center gap-3 mt-4 text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-orange-200 rounded-full"></span>
                    Açık
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                    Aktif
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-slate-200 rounded-full"></span>
                    Kilitli
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
