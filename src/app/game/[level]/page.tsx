'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Canvas from '@/components/Canvas';
import { getStudentByIdAsync, saveStudentAsync, Student } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

interface Question {
  n1: number;
  n2: number;
  result: number;
  needsCarry: boolean;
}

type GamePhase = 'intro' | 'test' | 'win' | 'lose';

const generateQuestions = (level: number): Question[] => {
  const questions: Question[] = [];
  const questionCount = 10;

  const randomInt = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  for (let i = 0; i < questionCount; i++) {
    let n1: number, n2: number;
    let result: number;

    switch (level) {
      case 1:
        // 2-digit × 1-digit, result < 100
        do {
          n1 = randomInt(10, 99);
          n2 = randomInt(2, 9);
          result = n1 * n2;
        } while (result >= 100);
        break;

      case 2:
        // 2-digit × 1-digit, result 100–300
        do {
          n1 = randomInt(10, 99);
          n2 = randomInt(2, 9);
          result = n1 * n2;
        } while (result < 100 || result > 300);
        break;

      case 3:
        // 3-digit × 1-digit
        n1 = randomInt(100, 999);
        n2 = randomInt(2, 9);
        result = n1 * n2;
        break;

      case 4:
        // 2-digit × 2-digit, result 100–1000
        do {
          n1 = randomInt(10, 99);
          n2 = randomInt(10, 99);
          result = n1 * n2;
        } while (result < 100 || result > 1000);
        break;

      default:
        n1 = randomInt(10, 99);
        n2 = randomInt(2, 9);
        result = n1 * n2;
    }

    const needsCarry = level === 3 || level === 4 ? true : (n1 % 10) * n2 >= 10;

    questions.push({
      n1,
      n2,
      result,
      needsCarry,
    });
  }

  return questions;
};

export default function GamePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const level = Number(params.level) || 1;
  const studentId = searchParams.get('studentId');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (level < 1 || level > 4) router.push('/');
  }, [level, router]);

  const [phase, setPhase] = useState<GamePhase>('intro');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState<string[]>([]);
  const [carry, setCarry] = useState('');
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [stars, setStars] = useState<boolean[]>([]);
  const [student, setStudent] = useState<Student | null>(null);
  const [showFeedback, setShowFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [lives, setLives] = useState(5);
  const [hintLevel, setHintLevel] = useState(0); // number of hints used for the current question
  const [tutorialShown, setTutorialShown] = useState(false); // whether the tutorial has ever been shown
  const [showTutorial, setShowTutorial] = useState(false);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false); // prevents double-submission

  const playSound = useCallback((isCorrect: boolean) => {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = isCorrect ? 523.25 : 200;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.3;

    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    oscillator.stop(audioContext.currentTime + 0.3);
    oscillator.onended = () => audioContext.close();
  }, []);

  useEffect(() => {
    const loadStudent = async () => {
      if (studentId) {
        const found = await getStudentByIdAsync(studentId);
        if (found) setStudent(found);
      }
    };
    loadStudent();

    setQuestions(generateQuestions(level));
    setStars(new Array(5).fill(false));
  }, [level, studentId]);

  const currentQuestion = questions[currentIndex];
  const resultDigits = currentQuestion ? String(currentQuestion.result).split('') : [];

  const initAnswer = useCallback(() => {
    if (currentQuestion) {
      setAnswer(new Array(resultDigits.length).fill(''));
      setCarry('');
      setHintLevel(0);
      setIsAnswerChecked(false);
    }
  }, [currentQuestion, resultDigits.length]);

  const useHint = () => {
    if (!currentQuestion) return;

    // Show the tutorial the first time the hint button is pressed
    if (!tutorialShown) {
      setTutorialShown(true);
      setShowTutorial(true);
      return;
    }

    // Reveal answer digits right-to-left (ones, tens, hundreds…)
    const newHintLevel = hintLevel + 1;
    setHintLevel(newHintLevel);

    // answer[] is stored right-to-left (index 0 = ones digit)
    // resultDigits[] is stored left-to-right (index 0 = most significant digit)
    const answerIndex = newHintLevel - 1; // 0, 1, 2… (right to left)
    const digitIndex = resultDigits.length - newHintLevel; // last, second-to-last… (right to left)

    if (answerIndex >= 0 && answerIndex < resultDigits.length && digitIndex >= 0) {
      const newAnswer = [...answer];
      newAnswer[answerIndex] = resultDigits[digitIndex];
      setAnswer(newAnswer);
    }
  };

  useEffect(() => {
    initAnswer();
  }, [currentIndex, initAnswer]);

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newAnswer = [...answer];
    newAnswer[index] = value;
    setAnswer(newAnswer);

    if (value && index > 0) {
      const nextInput = document.getElementById(`digit-${index - 1}`);
      nextInput?.focus();
    }
  };

  const checkAnswer = () => {
    if (isAnswerChecked) return;
    setIsAnswerChecked(true);

    // answer[] is stored right-to-left, reverse before comparing
    const userAnswer = [...answer].reverse().join('');
    const correctAnswer = String(currentQuestion.result);

    if (userAnswer === correctAnswer) {
      playSound(true);
      setShowFeedback('correct');
      setCorrectCount(prev => prev + 1);

      const newStars = [...stars];
      const starIndex = Math.floor(currentIndex / 2);
      if (starIndex < 5) newStars[starIndex] = true;
      setStars(newStars);

      setTimeout(() => {
        setShowFeedback(null);
        if (currentIndex < questions.length - 1) {
          setCurrentIndex(prev => prev + 1);
        } else {
          finishGame(true, correctCount + 1, wrongCount);
        }
      }, 1000);
    } else {
      playSound(false);
      setShowFeedback('wrong');
      setWrongCount(prev => prev + 1);
      setLives(prev => prev - 1);

      setAnswer(new Array(resultDigits.length).fill(''));
      setCarry('');

      const currentLives = lives;

      setTimeout(() => {
        setShowFeedback(null);
        setIsAnswerChecked(false);
        if (currentLives <= 1) {
          finishGame(false, correctCount, wrongCount + 1);
        }
      }, 500);
    }
  };

  const finishGame = async (won: boolean, finalCorrect: number, finalWrong: number) => {
    if (student) {
      const updatedStudent: Student = {
        ...student,
        correctCount: student.correctCount + finalCorrect,
        wrongCount: student.wrongCount + finalWrong,
        totalStars: student.totalStars + stars.filter(Boolean).length,
        currentLevel: won ? Math.min(Math.max(student.currentLevel, level + 1), 4) : student.currentLevel,
      };
      await saveStudentAsync(updatedStudent);
      setStudent(updatedStudent);
    }
    setPhase(won ? 'win' : 'lose');
  };

  const levelTitles: Record<number, string> = {
    1: 'Onluk & Birlik',
    2: 'Büyük Sayılar',
    3: 'Üç Basamaklılar',
    4: 'Zeka Soruları',
  };

  const levelColors: Record<number, { from: string; to: string }> = {
    1: { from: '#2b8cee', to: '#0066cc' },
    2: { from: '#48d1cc', to: '#20b2aa' },
    3: { from: '#ff7e67', to: '#ff6b6b' },
    4: { from: '#9b59b6', to: '#8e44ad' },
  };

  if (authLoading || !user) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-white">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-100 to-white overflow-hidden">
      {/* Intro Screen */}
      {phase === 'intro' && (
        <div className="absolute inset-0 animate-pop">
          {/* Desktop Background */}
          <div
            className="absolute inset-0 hidden md:block"
            style={{
              backgroundImage: `url(/bolum-gorselleri/${level}.png)`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          />
          {/* Mobile/Tablet Background */}
          <div
            className="absolute inset-0 md:hidden"
            style={{
              backgroundImage: `url(/bolum-gorselleri-tablet,mobil/${level}.png)`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          />

          {/* Level Text & Button Container */}
          <div className="absolute inset-0 flex flex-col items-center justify-center md:items-start md:justify-start md:top-[20%] md:left-[8%] px-4 md:px-0">
            <div className="text-center md:text-left md:ml-[60px] md:mt-[40px]">
              {/* Level Title - Pastel/Playful style with Baloo 2 font - Only show on tablet/mobile */}
              <h1
                className="text-5xl sm:text-6xl drop-shadow-lg md:hidden uppercase tracking-wide"
                style={{
                  fontFamily: '"Baloo 2", cursive',
                  fontWeight: 800,
                  color: level === 1 ? '#ffa64a' : level === 2 ? '#f9b30b' : level === 3 ? '#ffa64a' : '#fa6858',
                  textShadow: '4px 4px 0px rgba(0,0,0,0.08), 2px 2px 0px rgba(255,255,255,0.3)',
                  letterSpacing: '0.05em'
                }}
              >
                {level}. BÖLÜM
              </h1>

              {/* Subtitle - Serious style with Nunito font - Only show on tablet/mobile */}
              <p
                className="text-xl sm:text-2xl mt-3 md:hidden"
                style={{
                  fontFamily: '"Nunito", sans-serif',
                  fontWeight: 700,
                  color: level === 1 ? '#e8914a' : level === 2 ? '#d9a00b' : level === 3 ? '#e8914a' : '#da5848',
                  letterSpacing: '0.02em'
                }}
              >
                {levelTitles[level]}
              </p>

              {/* Start Button */}
              <button
                onClick={() => setPhase('test')}
                className="mt-6 sm:mt-8 md:mt-[180px] px-10 sm:px-12 py-3 sm:py-4 text-lg sm:text-xl rounded-full shadow-2xl hover:scale-105 transition-transform"
                style={{
                  fontFamily: '"Nunito", sans-serif',
                  fontWeight: 800,
                  backgroundColor: level === 1 ? '#ffa64a' : '#ffffec',
                  color: level === 1 ? '#ffffec' : level === 2 ? '#f9b30b' : level === 3 ? '#ffa64a' : '#fa6858'
                }}
              >
                BAŞLA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Screen - Fullscreen */}
      {phase === 'test' && currentQuestion && (
        <div className="absolute inset-0 flex flex-col">
          {/* Header / HUD */}
          <header className="w-full px-3 sm:px-6 py-2 sm:py-4 flex items-center justify-between bg-white/90 backdrop-blur-md border-b border-slate-200 z-50">
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => router.push('/')}
                className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <span className="material-symbols-outlined text-xl sm:text-2xl">close</span>
              </button>
              <div className="hidden md:flex flex-col">
                <span className="text-xs font-bold uppercase tracking-wider text-[#2b8cee]">Çarpma Serüveni</span>
                <span className="text-sm font-semibold text-slate-700">{levelTitles[level]}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="flex flex-1 max-w-[140px] sm:max-w-md mx-2 sm:mx-8 flex-col gap-1">
              <div className="flex justify-between items-end px-1">
                <span className="text-[10px] sm:text-xs font-bold text-slate-500">{currentIndex + 1}/{questions.length}</span>
                <span className="text-[10px] sm:text-xs font-bold text-[#2b8cee]">{Math.round((correctCount / questions.length) * 100)}%</span>
              </div>
              <div className="h-2 sm:h-3 w-full bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2b8cee] rounded-full transition-all duration-500"
                  style={{ width: `${(correctCount / questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Lives & Score */}
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-0.5 sm:gap-1 bg-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-full shadow-sm border border-slate-100">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={`material-symbols-outlined text-sm sm:text-lg ${i < lives ? 'text-red-500' : 'text-slate-300'}`}
                    style={{ fontVariationSettings: '"FILL" 1' }}
                  >
                    favorite
                  </span>
                ))}
              </div>
              <div className="bg-[#ffcc00] text-white font-bold px-3 sm:px-5 py-1.5 sm:py-2 rounded-full shadow-sm hidden lg:block">
                Puan: {correctCount * 100}
              </div>
            </div>
          </header>

          {/* Main Game Area */}
          <main className="flex-1 flex flex-col lg:flex-row overflow-auto lg:overflow-hidden">
            {/* Left Side - Math Problem */}
            <div className="w-full lg:w-[400px] xl:w-[450px] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-b from-sky-50 to-white lg:border-r border-slate-200 shrink-0">
              {/* Stars */}
              <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-8">
                {stars.map((active, i) => (
                  <div
                    key={i}
                    className={`w-7 h-7 sm:w-10 sm:h-10 transition-all duration-500 ${
                      active ? 'text-yellow-400 scale-110' : 'text-slate-300'
                    }`}
                  >
                    <span className="material-symbols-outlined text-2xl sm:text-4xl" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
                  </div>
                ))}
              </div>

              {/* Math Card */}
              <div className={`bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl border-4 w-full max-w-xs sm:max-w-sm ${
                showFeedback === 'correct' ? 'border-[#48d1cc] bg-[#48d1cc]/5' :
                showFeedback === 'wrong' ? 'border-[#ff7e67] bg-[#ff7e67]/5 animate-shake' :
                'border-slate-200'
              } transition-all`}>

                {currentQuestion.needsCarry && (
                  <div className="flex justify-end mb-2">
                    <input
                      type="text"
                      value={carry}
                      onChange={(e) => setCarry(e.target.value.slice(-1))}
                      placeholder="?"
                      className="w-10 h-10 sm:w-12 sm:h-12 text-center text-lg sm:text-xl font-black text-pink-500 border-2 border-dashed border-pink-300 rounded-xl bg-pink-50"
                      maxLength={1}
                    />
                  </div>
                )}

                <div className="font-mono text-3xl sm:text-4xl lg:text-5xl font-black text-slate-800 text-right space-y-1 sm:space-y-2">
                  <div>{currentQuestion.n1}</div>
                  <div className="flex items-center justify-end">
                    <span className="text-[#2b8cee] mr-2 sm:mr-4">×</span>
                    {currentQuestion.n2}
                  </div>
                  <div className="h-1.5 sm:h-2 bg-slate-800 rounded-full my-2 sm:my-4" />

                  <div className="flex justify-end gap-1.5 sm:gap-2">
                    {resultDigits.map((_, i) => (
                      <input
                        key={i}
                        id={`digit-${resultDigits.length - 1 - i}`}
                        type="text"
                        inputMode="numeric"
                        value={answer[resultDigits.length - 1 - i] || ''}
                        onChange={(e) => handleDigitChange(resultDigits.length - 1 - i, e.target.value)}
                        className="w-10 h-12 sm:w-12 sm:h-14 lg:w-14 lg:h-16 text-center text-xl sm:text-2xl lg:text-3xl font-black text-[#2b8cee] border-3 sm:border-4 border-[#2b8cee]/30 rounded-xl sm:rounded-2xl bg-[#2b8cee]/5 focus:border-[#2b8cee]"
                        maxLength={1}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Check Button */}
              <button
                onClick={checkAnswer}
                disabled={answer.some(a => !a) || isAnswerChecked}
                className="mt-4 sm:mt-6 lg:mt-8 w-full max-w-xs sm:max-w-sm py-3 sm:py-4 lg:py-5 bg-gradient-to-r from-[#ff7e67] to-[#ff6b6b] text-white text-base sm:text-lg lg:text-xl font-black rounded-xl sm:rounded-2xl shadow-lg shadow-[#ff7e67]/30 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl transition-all flex items-center justify-center gap-2 sm:gap-3"
              >
                <span>KONTROL ET</span>
                <span className="material-symbols-outlined text-xl sm:text-2xl">check_circle</span>
              </button>
            </div>

            {/* Right Side - Canvas */}
            <div className="flex-1 flex flex-col bg-slate-50 min-h-[300px] sm:min-h-[350px] lg:min-h-0">
              <Canvas />
            </div>
          </main>

          {/* Tutorial Modal - fixed example: 23 × 4 = 92 */}
          {showTutorial && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-3 sm:p-4" onClick={() => setShowTutorial(false)}>
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-lg w-full p-4 sm:p-6 animate-pop max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-base sm:text-xl font-bold text-slate-800 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#2b8cee] text-xl sm:text-2xl">lightbulb</span>
                    Çarpma Nasıl Yapılır?
                  </h3>
                  <button onClick={() => setShowTutorial(false)} className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-full">
                    <span className="material-symbols-outlined text-slate-500 text-xl">close</span>
                  </button>
                </div>

                <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl sm:rounded-2xl p-3 sm:p-5 mb-3 sm:mb-4">
                  <div className="text-center mb-3 sm:mb-4">
                    <span className="text-xs sm:text-sm text-slate-500 block mb-1">Örnek:</span>
                    <span className="text-2xl sm:text-3xl font-black text-slate-800">23 × 4</span>
                  </div>

                  <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                    {/* Birler basamağı */}
                    <div className="flex items-start sm:items-center gap-2 sm:gap-3 bg-white rounded-lg sm:rounded-xl p-2 sm:p-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#48d1cc] rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm shrink-0">1</div>
                      <div>
                        <span className="font-bold text-slate-600">Birler: </span>
                        <span className="font-black text-[#2b8cee]">3 × 4 = 12</span>
                        <span className="text-pink-500 ml-1 sm:ml-2 block sm:inline">(Yaz: 2, Elde: 1)</span>
                      </div>
                    </div>

                    {/* Onlar basamağı */}
                    <div className="flex items-start sm:items-center gap-2 sm:gap-3 bg-white rounded-lg sm:rounded-xl p-2 sm:p-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#ff7e67] rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm shrink-0">2</div>
                      <div>
                        <span className="font-bold text-slate-600">Onlar: </span>
                        <span className="font-black text-[#2b8cee]">2 × 4 = 8</span>
                        <span className="text-pink-500 ml-1 sm:ml-2 block sm:inline">+ 1 (elde) = 9</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-xs sm:text-sm text-slate-500 mb-1 sm:mb-2">Sonuç:</div>
                  <div className="text-3xl sm:text-4xl font-black text-[#2b8cee]">92</div>
                </div>

                <p className="text-center text-[10px] sm:text-xs text-slate-400 mt-2 sm:mt-3">
                  İpucuna tekrar basarak cevabın basamaklarını görebilirsin!
                </p>

                <button
                  onClick={() => setShowTutorial(false)}
                  className="mt-3 sm:mt-4 w-full py-2.5 sm:py-3 bg-[#2b8cee] text-white font-bold rounded-lg sm:rounded-xl hover:bg-[#2b8cee]/90 transition-all text-sm sm:text-base"
                >
                  Anladım!
                </button>
              </div>
            </div>
          )}

          {/* Footer */}
          <footer className="w-full px-3 sm:px-6 py-2 sm:py-4 flex items-center justify-center gap-4 sm:gap-10 bg-white/90 backdrop-blur-sm border-t border-slate-200 shrink-0">
            <button
              onClick={useHint}
              disabled={tutorialShown && hintLevel >= resultDigits.length}
              className="flex items-center gap-1 sm:gap-2 text-slate-500 hover:text-[#2b8cee] transition-colors font-bold text-xs sm:text-sm disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg sm:text-xl">lightbulb</span>
              <span className="hidden sm:inline">İPUCU</span> {tutorialShown && hintLevel > 0 && `(${hintLevel}/${resultDigits.length})`}
            </button>
            <div className="h-4 w-px bg-slate-300" />
            <button
              onClick={() => {
                if (currentIndex < questions.length - 1) {
                  setWrongCount(prev => prev + 1);
                  setCurrentIndex(prev => prev + 1);
                }
              }}
              disabled={currentIndex >= questions.length - 1}
              className="flex items-center gap-1 sm:gap-2 text-slate-500 hover:text-[#2b8cee] transition-colors font-bold text-xs sm:text-sm disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-lg sm:text-xl">skip_next</span>
              <span className="hidden sm:inline">GEÇ</span>
            </button>
            <div className="h-4 w-px bg-slate-300" />
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-1 sm:gap-2 text-slate-500 hover:text-[#ff7e67] transition-colors font-bold text-xs sm:text-sm"
            >
              <span className="material-symbols-outlined text-lg sm:text-xl">exit_to_app</span>
              <span className="hidden sm:inline">ÇIKIŞ</span>
            </button>
          </footer>
        </div>
      )}

      {/* Win Screen */}
      {phase === 'win' && (
        <div className="absolute inset-0 text-white animate-pop">
          {/* Desktop Background */}
          <div
            className="absolute inset-0 hidden md:block"
            style={{
              backgroundImage: 'url(/bolum-gorselleri/win.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          />
          {/* Mobile/Tablet Background */}
          <div
            className="absolute inset-0 md:hidden"
            style={{
              backgroundImage: 'url(/bolum-gorselleri-tablet,mobil/win.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
          <div className="relative text-center w-full max-w-2xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-2 sm:mb-4">
              Tebrikler {student?.name}!
            </h1>

            <p className="text-lg sm:text-xl md:text-2xl font-bold opacity-90 mb-6 sm:mb-8 md:mb-12">
              {level}. Bölümü Tamamladın!
            </p>

            <div className="flex gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8 md:mb-12 justify-center">
              <div className="px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-6 bg-white/20 backdrop-blur rounded-2xl sm:rounded-3xl text-center">
                <div className="text-2xl sm:text-3xl md:text-5xl font-black">{correctCount}</div>
                <div className="text-xs sm:text-sm md:text-lg font-bold opacity-80 mt-1 sm:mt-2">Doğru</div>
              </div>
              <div className="px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-6 bg-white/20 backdrop-blur rounded-2xl sm:rounded-3xl text-center">
                <div className="text-2xl sm:text-3xl md:text-5xl font-black">{wrongCount}</div>
                <div className="text-xs sm:text-sm md:text-lg font-bold opacity-80 mt-1 sm:mt-2">Yanlış</div>
              </div>
              <div className="px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-6 bg-white/20 backdrop-blur rounded-2xl sm:rounded-3xl text-center">
                <div className="text-2xl sm:text-3xl md:text-5xl font-black">{stars.filter(Boolean).length}</div>
                <div className="text-xs sm:text-sm md:text-lg font-bold opacity-80 mt-1 sm:mt-2">Yıldız</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <button
                onClick={() => router.push('/')}
                className="px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 bg-white/20 backdrop-blur text-white text-base sm:text-lg md:text-xl font-black rounded-xl sm:rounded-2xl hover:bg-white/30 transition-all"
              >
                Ana Menüye Dön
              </button>
              {level < 4 && (
                <button
                  onClick={() => router.push(`/game/${level + 1}?studentId=${studentId}`)}
                  className="px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 bg-white/20 backdrop-blur text-white text-base sm:text-lg md:text-xl font-black rounded-xl sm:rounded-2xl hover:bg-white/30 transition-all"
                >
                  Sonraki Level'a Geç
                </button>
              )}
            </div>
          </div>
          </div>
        </div>
      )}

      {/* Lose Screen */}
      {phase === 'lose' && (
        <div className="absolute inset-0 text-white animate-pop">
          {/* Desktop Background */}
          <div
            className="absolute inset-0 hidden md:block"
            style={{
              backgroundImage: 'url(/bolum-gorselleri/lose.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          />
          {/* Mobile/Tablet Background */}
          <div
            className="absolute inset-0 md:hidden"
            style={{
              backgroundImage: 'url(/bolum-gorselleri-tablet,mobil/lose.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          />
          {/* Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-start pt-24 sm:pt-32 md:pt-48 px-4">
            <div className="relative text-center w-full max-w-2xl">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-2 sm:mb-4">
                İyi Denemeydi {student?.name}!
              </h1>

              <p className="text-lg sm:text-xl md:text-2xl font-bold opacity-90 mb-6 sm:mb-8 md:mb-12">
                Tekrar Denemek İster misin?
              </p>

              <div className="flex gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8 md:mb-12 justify-center">
                <div className="px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-6 bg-white/20 backdrop-blur rounded-2xl sm:rounded-3xl text-center">
                  <div className="text-2xl sm:text-3xl md:text-5xl font-black">{correctCount}</div>
                  <div className="text-xs sm:text-sm md:text-lg font-bold opacity-80 mt-1 sm:mt-2">Doğru</div>
                </div>
                <div className="px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-6 bg-white/20 backdrop-blur rounded-2xl sm:rounded-3xl text-center">
                  <div className="text-2xl sm:text-3xl md:text-5xl font-black">{wrongCount}</div>
                  <div className="text-xs sm:text-sm md:text-lg font-bold opacity-80 mt-1 sm:mt-2">Yanlış</div>
                </div>
                <div className="px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-6 bg-white/20 backdrop-blur rounded-2xl sm:rounded-3xl text-center">
                  <div className="text-2xl sm:text-3xl md:text-5xl font-black">{stars.filter(Boolean).length}</div>
                  <div className="text-xs sm:text-sm md:text-lg font-bold opacity-80 mt-1 sm:mt-2">Yıldız</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <button
                  onClick={() => {
                    setQuestions(generateQuestions(level));
                    setPhase('intro');
                    setCurrentIndex(0);
                    setCorrectCount(0);
                    setWrongCount(0);
                    setLives(5);
                    setStars(new Array(5).fill(false));
                    setAnswer([]);
                    setCarry('');
                    setIsAnswerChecked(false);
                  }}
                  className="px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 bg-white/20 backdrop-blur text-white text-base sm:text-lg md:text-xl font-black rounded-xl sm:rounded-2xl hover:bg-white/30 transition-all"
                >
                  Tekrar Dene
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 bg-white/20 backdrop-blur text-white text-base sm:text-lg md:text-xl font-black rounded-xl sm:rounded-2xl hover:bg-white/30 transition-all"
                >
                  Ana Menüye Dön
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
