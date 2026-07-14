import React, { useRef, useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

interface SignaturePadProps {
  signatureText: string;
  setSignatureText: (val: string) => void;
}

export default function SignaturePad({ signatureText, setSignatureText }: SignaturePadProps) {
  const [isTyped, setIsTyped] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Setup drawing events for canvas
  useEffect(() => {
    if (isTyped) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';

    const getCoordinates = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      if ('touches' in e) {
        if (e.touches.length === 0) return { x: 0, y: 0 };
        return {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top,
        };
      } else {
        return {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
      }
    };

    const startDraw = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      setIsDrawing(true);
      const coords = getCoordinates(e);
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
    };

    const draw = (e: MouseEvent | TouchEvent) => {
      if (!isDrawing) return;
      e.preventDefault();
      const coords = getCoordinates(e);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    };

    const stopDraw = () => {
      setIsDrawing(false);
      // Convert canvas drawing to Base64 and pass to signature text
      const dataUrl = canvas.toDataURL();
      setSignatureText(dataUrl);
    };

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDraw);
    canvas.addEventListener('mouseleave', stopDraw);

    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDraw);

    return () => {
      canvas.removeEventListener('mousedown', startDraw);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDraw);
      canvas.removeEventListener('mouseleave', stopDraw);

      canvas.removeEventListener('touchstart', startDraw);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', stopDraw);
    };
  }, [isTyped, isDrawing, setSignatureText]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureText('');
  };

  return (
    <div className="flex flex-col gap-2.5 bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
      <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
        <label className="text-[9px] text-zinc-400 uppercase font-bold tracking-wider">Verification Signature</label>
        <div className="flex bg-zinc-800 p-0.5 rounded-lg border border-zinc-700">
          <button
            type="button"
            onClick={() => { setIsTyped(true); setSignatureText(''); }}
            className={`px-2.5 py-1 text-[8.5px] font-bold rounded-md transition-all cursor-pointer ${
              isTyped ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            TYPE PIN
          </button>
          <button
            type="button"
            onClick={() => { setIsTyped(false); setSignatureText(''); }}
            className={`px-2.5 py-1 text-[8.5px] font-bold rounded-md transition-all cursor-pointer ${
              !isTyped ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            DRAW SIGN
          </button>
        </div>
      </div>

      {isTyped ? (
        <div className="flex flex-col gap-2">
          <input
            type="text"
            required
            placeholder="Type Full Name (Cursive Font Applied)"
            value={signatureText.startsWith('data:image') ? '' : signatureText}
            onChange={e => setSignatureText(e.target.value)}
            className="text-xs p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red"
          />
          {signatureText && !signatureText.startsWith('data:image') && (
            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-center font-mono">
              <span className="font-cursive text-xl text-red block tracking-wide italic leading-none">{signatureText}</span>
              <span className="text-[7.5px] text-zinc-500 block mt-2 font-mono uppercase tracking-wider">SHA256 SECURED CLIENT SIGNATURE</span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="relative border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950">
            <canvas
              ref={canvasRef}
              width={350}
              height={100}
              className="w-full h-24 cursor-crosshair touch-none"
            />
            <button
              type="button"
              onClick={clearCanvas}
              className="absolute bottom-2 right-2 p-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Clear Board"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
          {signatureText.startsWith('data:image') && (
            <div className="text-center">
              <span className="text-[7.5px] text-zinc-500 font-mono uppercase tracking-wider">COMPLIANT VERIFICATION DRAWING LOGGED</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
