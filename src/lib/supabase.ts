import { createClient } from '@supabase/supabase-js';

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Student {
  id: string;
  name: string;
  currentLevel: number;
  correctCount: number;
  wrongCount: number;
  totalStars: number;
  avatarId: number;
  user_id?: string;
  created_at?: string;
}

// Avatar listesi - doğa temasına uygun renkler
export const AVATARS = [
  { id: 0, emoji: '🐰', bg: 'from-amber-500 to-amber-600', name: 'Tavşan' },
  { id: 1, emoji: '🦊', bg: 'from-orange-500 to-amber-600', name: 'Tilki' },
  { id: 2, emoji: '🐼', bg: 'from-stone-500 to-stone-600', name: 'Panda' },
  { id: 3, emoji: '🦁', bg: 'from-yellow-500 to-amber-500', name: 'Aslan' },
  { id: 4, emoji: '🐸', bg: 'from-green-500 to-emerald-600', name: 'Kurbağa' },
  { id: 5, emoji: '🦄', bg: 'from-teal-500 to-emerald-600', name: 'Unicorn' },
  { id: 6, emoji: '🐯', bg: 'from-amber-600 to-orange-600', name: 'Kaplan' },
  { id: 7, emoji: '🐨', bg: 'from-stone-400 to-stone-500', name: 'Koala' },
  { id: 8, emoji: '🦋', bg: 'from-teal-400 to-cyan-500', name: 'Kelebek' },
  { id: 9, emoji: '🐢', bg: 'from-emerald-500 to-green-600', name: 'Kaplumbağa' },
  { id: 10, emoji: '🦉', bg: 'from-amber-700 to-yellow-800', name: 'Baykuş' },
  { id: 11, emoji: '🐙', bg: 'from-teal-600 to-emerald-700', name: 'Ahtapot' },
  { id: 12, emoji: '🦜', bg: 'from-lime-500 to-green-600', name: 'Papağan' },
  { id: 13, emoji: '🐳', bg: 'from-cyan-500 to-teal-600', name: 'Balina' },
  { id: 14, emoji: '🦝', bg: 'from-stone-500 to-stone-600', name: 'Rakun' },
  { id: 15, emoji: '🐲', bg: 'from-green-600 to-emerald-700', name: 'Ejderha' },
];

// Supabase fonksiyonları (async)
export const getStudentsAsync = async (): Promise<Student[]> => {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching students:', error);
    return [];
  }

  return data || [];
};

export const saveStudentAsync = async (student: Student): Promise<Student | null> => {
  // Mevcut kullanıcının ID'sini al
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.error('No authenticated user for saving student');
    return null;
  }

  const { data, error } = await supabase
    .from('students')
    .upsert({
      id: student.id,
      name: student.name,
      currentLevel: student.currentLevel,
      correctCount: student.correctCount,
      wrongCount: student.wrongCount,
      totalStars: student.totalStars,
      avatarId: student.avatarId,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving student:', error);
    return null;
  }

  return data;
};

export const createStudentAsync = async (name: string, avatarId?: number): Promise<Student | null> => {
  // Mevcut kullanıcının ID'sini al
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.error('No authenticated user');
    return null;
  }

  const newStudent = {
    id: crypto.randomUUID(),
    name,
    currentLevel: 1,
    correctCount: 0,
    wrongCount: 0,
    totalStars: 0,
    avatarId: avatarId ?? Math.floor(Math.random() * AVATARS.length),
    user_id: user.id,
  };

  const { data, error } = await supabase
    .from('students')
    .insert(newStudent)
    .select()
    .single();

  if (error) {
    console.error('Error creating student:', error);
    return null;
  }

  return data;
};

export const updateStudentAvatarAsync = async (id: string, avatarId: number): Promise<Student | null> => {
  const { data, error } = await supabase
    .from('students')
    .update({ avatarId })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating avatar:', error);
    return null;
  }

  return data;
};

export const deleteStudentAsync = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting student:', error);
    return false;
  }

  return true;
};

export const updateStudentNameAsync = async (id: string, newName: string): Promise<Student | null> => {
  const { data, error } = await supabase
    .from('students')
    .update({ name: newName })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating name:', error);
    return null;
  }

  return data;
};

export const getStudentByIdAsync = async (id: string): Promise<Student | null> => {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching student:', error);
    return null;
  }

  return data;
};

// Eski senkron fonksiyonlar (geriye uyumluluk için - artık kullanılmıyor)
export const getStudents = (): Student[] => {
  console.warn('getStudents is deprecated, use getStudentsAsync instead');
  return [];
};

export const saveStudent = (student: Student): void => {
  console.warn('saveStudent is deprecated, use saveStudentAsync instead');
  saveStudentAsync(student);
};

export const createStudent = (name: string, avatarId?: number): Student => {
  console.warn('createStudent is deprecated, use createStudentAsync instead');
  const student: Student = {
    id: crypto.randomUUID(),
    name,
    currentLevel: 1,
    correctCount: 0,
    wrongCount: 0,
    totalStars: 0,
    avatarId: avatarId ?? Math.floor(Math.random() * AVATARS.length),
  };
  createStudentAsync(name, avatarId);
  return student;
};

export const updateStudentAvatar = (id: string, avatarId: number): Student | undefined => {
  console.warn('updateStudentAvatar is deprecated, use updateStudentAvatarAsync instead');
  updateStudentAvatarAsync(id, avatarId);
  return undefined;
};

export const deleteStudent = (id: string): void => {
  console.warn('deleteStudent is deprecated, use deleteStudentAsync instead');
  deleteStudentAsync(id);
};

export const updateStudentName = (id: string, newName: string): Student | undefined => {
  console.warn('updateStudentName is deprecated, use updateStudentNameAsync instead');
  updateStudentNameAsync(id, newName);
  return undefined;
};
