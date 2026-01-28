'use client';

import { useRef, useEffect, useState } from 'react';

type Tool = 'pen' | 'eraser';

export default function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#2b8cee');
  const [brushSize, setBrushSize] = useState(4);
  const [tool, setTool] = useState<Tool>('pen');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);

        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;

        if (imageData && ctx) {
          ctx.putImageData(imageData, 0, 0);
        }
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const pos = getPos(e);

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = brushSize * 5;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.lineWidth = brushSize;
      ctx.strokeStyle = color;
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.globalCompositeOperation = 'source-over';
    }
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const colors = [
    { color: '#2b8cee', name: 'Mavi' },
    { color: '#ff7e67', name: 'Turuncu' },
    { color: '#48d1cc', name: 'Turkuaz' },
    { color: '#ffcc00', name: 'Sarı' },
    { color: '#9b59b6', name: 'Mor' },
    { color: '#2d3436', name: 'Siyah' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 sm:gap-4 px-2 sm:px-4 py-2 sm:py-3 bg-white border-b border-slate-200 flex-wrap sm:flex-nowrap">
        {/* Tools */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setTool('pen')}
            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-bold transition-all text-sm ${
              tool === 'pen'
                ? 'bg-[#2b8cee] text-white shadow-lg shadow-[#2b8cee]/30'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-lg sm:text-xl">edit</span>
            <span className="hidden md:inline">Kalem</span>
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-bold transition-all text-sm ${
              tool === 'eraser'
                ? 'bg-[#ff7e67] text-white shadow-lg shadow-[#ff7e67]/30'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-lg sm:text-xl">ink_eraser</span>
            <span className="hidden md:inline">Silgi</span>
          </button>
        </div>

        {/* Colors (only show when pen is selected) */}
        {tool === 'pen' && (
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="text-xs sm:text-sm font-bold text-slate-500 hidden lg:block">Renk:</span>
            <div className="flex gap-1 sm:gap-1.5">
              {colors.map((c, index) => (
                <button
                  key={c.color}
                  onClick={() => setColor(c.color)}
                  title={c.name}
                  className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full transition-all hover:scale-110 ${
                    color === c.color ? 'ring-2 ring-offset-1 sm:ring-offset-2 ring-slate-400 scale-110' : ''
                  } ${index >= 5 ? 'max-[468px]:hidden' : ''}`}
                  style={{ backgroundColor: c.color }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Brush Size - Hidden at 468px and below */}
        <div className="flex items-center gap-1 sm:gap-3 max-[468px]:hidden">
          <span className="text-xs sm:text-sm font-bold text-slate-500 hidden lg:block">
            {tool === 'pen' ? 'Kalınlık:' : 'Boyut:'}
          </span>
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="material-symbols-outlined text-slate-400 text-xs sm:text-sm hidden sm:block">
              {tool === 'pen' ? 'line_weight' : 'circle'}
            </span>
            <input
              type="range"
              min="2"
              max="20"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-16 sm:w-24 accent-[#2b8cee]"
            />
            <span className="text-xs sm:text-sm font-bold text-slate-500 w-5 sm:w-6">{brushSize}</span>
          </div>
        </div>

        {/* Clear Button */}
        <button
          onClick={clearCanvas}
          className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg sm:rounded-xl transition-colors text-sm"
        >
          <span className="material-symbols-outlined text-lg sm:text-xl">delete</span>
          <span className="hidden md:inline">Temizle</span>
        </button>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Grid Background */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(#e2e8f0 1px, transparent 1px),
              linear-gradient(90deg, #e2e8f0 1px, transparent 1px)
            `,
            backgroundSize: '25px 25px',
          }}
        />

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 ${
            tool === 'eraser' ? 'cursor-cell' : 'cursor-crosshair'
          } touch-none`}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {/* Tool Indicator */}
        <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-white/90 backdrop-blur rounded-full shadow-lg border border-slate-200">
          <span className="material-symbols-outlined text-base sm:text-lg" style={{ color: tool === 'pen' ? color : '#ff7e67' }}>
            {tool === 'pen' ? 'edit' : 'ink_eraser'}
          </span>
          <span className="text-xs sm:text-sm font-bold text-slate-600">
            {tool === 'pen' ? 'Kalem' : 'Silgi'}
          </span>
        </div>

        {/* Help Text */}
        <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 text-xs sm:text-sm font-medium text-slate-400 hidden sm:block">
          Çözüm için buraya yazın
        </div>
      </div>
    </div>
  );
}
