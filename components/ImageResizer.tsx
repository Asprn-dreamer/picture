
import React, { useState, useEffect, useRef } from 'react';

interface ImageResizerProps {
  imageUrl: string;
  onClose: () => void;
}

export const ImageResizer: React.FC<ImageResizerProps> = ({ imageUrl, onClose }) => {
  const [originalSize, setOriginalSize] = useState({ width: 0, height: 0 });
  const [newSize, setNewSize] = useState({ width: 0, height: 0 });
  const [aspectRatio, setAspectRatio] = useState(1);
  const [exportFormat, setExportFormat] = useState<'png' | 'jpg'>('png');
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setOriginalSize({ width: img.width, height: img.height });
      setNewSize({ width: img.width, height: img.height });
      setAspectRatio(img.width / img.height);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const handleWidthChange = (val: number) => {
    setNewSize({
      width: val,
      height: Math.round(val / aspectRatio)
    });
  };

  const handleHeightChange = (val: number) => {
    setNewSize({
      width: Math.round(val * aspectRatio),
      height: val
    });
  };

  const applyScale = (factor: number) => {
    handleWidthChange(Math.round(originalSize.width * factor));
  };

  const handleDownload = () => {
    setIsProcessing(true);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = newSize.width;
      canvas.height = newSize.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // 如果是 JPG，先填充白色背景以防透明部分变黑
        if (exportFormat === 'jpg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0, newSize.width, newSize.height);
        
        const mimeType = exportFormat === 'png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, 0.9);
        const link = document.createElement('a');
        link.download = `snap-${Date.now()}.${exportFormat}`;
        link.href = dataUrl;
        link.click();
      }
      setIsProcessing(false);
      onClose();
    };
    img.src = imageUrl;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100 scale-in-center transition-transform">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">调整与导出设置</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-center bg-gray-50 rounded-2xl p-4 overflow-hidden h-40">
            <img src={imageUrl} alt="preview" className="max-w-full max-h-full object-contain shadow-sm rounded border border-white" />
          </div>

          {/* 格式选择 */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">导出格式</label>
            <div className="flex p-1 bg-gray-100 rounded-xl">
              <button 
                onClick={() => setExportFormat('png')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${exportFormat === 'png' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
              >
                PNG
              </button>
              <button 
                onClick={() => setExportFormat('jpg')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${exportFormat === 'jpg' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
              >
                JPG
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">宽度 (px)</label>
              <input 
                type="number" 
                value={newSize.width} 
                onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-lg font-mono"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">高度 (px)</label>
              <input 
                type="number" 
                value={newSize.height} 
                onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-lg font-mono"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map(factor => (
              <button 
                key={factor}
                onClick={() => applyScale(factor)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  (newSize.width / originalSize.width).toFixed(2) === factor.toFixed(2) 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
              >
                {factor === 1 ? '原始尺寸' : `${factor * 100}%`}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 bg-gray-50 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
          >
            取消
          </button>
          <button 
            onClick={handleDownload}
            disabled={isProcessing}
            className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
          >
            {isProcessing ? '处理中...' : '转换并下载'}
          </button>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
