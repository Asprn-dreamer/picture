
import React, { useState, useRef } from 'react';
import { WebAsset } from '../types';

interface BatchImageResizerProps {
  assets: WebAsset[];
  onClose: () => void;
}

export const BatchImageResizer: React.FC<BatchImageResizerProps> = ({ assets, onClose }) => {
  const [mode, setMode] = useState<'SCALE' | 'WIDTH'>('SCALE');
  const [scale, setScale] = useState(1);
  const [targetWidth, setTargetWidth] = useState(750);
  const [exportFormat, setExportFormat] = useState<'png' | 'jpg'>('png');
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const processAndDownload = async () => {
    setIsProcessing(true);
    setProgress(0);

    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      try {
        await new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            const canvas = canvasRef.current;
            if (!canvas) return resolve(null);
            
            let w, h;
            if (mode === 'SCALE') {
              w = Math.round(img.width * scale);
              h = Math.round(img.height * scale);
            } else {
              const ratio = img.width / img.height;
              w = targetWidth;
              h = Math.round(targetWidth / ratio);
            }

            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              if (exportFormat === 'jpg') {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, w, h);
              }
              ctx.drawImage(img, 0, 0, w, h);
              
              const mimeType = exportFormat === 'png' ? 'image/png' : 'image/jpeg';
              const dataUrl = canvas.toDataURL(mimeType, 0.9);
              const link = document.createElement('a');
              link.download = `batch-jjbo-${i}.${exportFormat}`;
              link.href = dataUrl;
              link.click();
            }
            resolve(null);
          };
          img.onerror = () => resolve(null);
          img.src = asset.url;
        });
        setProgress(Math.round(((i + 1) / assets.length) * 100));
        await new Promise(r => setTimeout(r, 450));
      } catch (e) {
        console.error(e);
      }
    }

    setIsProcessing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="text-xl font-bold text-gray-900">批量导出设置</h3>
            <p className="text-xs text-gray-400 mt-1">已选择 {assets.length} 张待处理素材</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-8 space-y-8">
          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-700">统一导出格式</label>
            <div className="flex p-1 bg-gray-100 rounded-2xl">
              <button 
                onClick={() => setExportFormat('png')}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${exportFormat === 'png' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
              >
                PNG (无损)
              </button>
              <button 
                onClick={() => setExportFormat('jpg')}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${exportFormat === 'jpg' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
              >
                JPG (压缩)
              </button>
            </div>
          </div>

          <div className="flex p-1 bg-gray-100 rounded-2xl">
            <button 
              onClick={() => setMode('SCALE')}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${mode === 'SCALE' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
            >
              按百分比缩放
            </button>
            <button 
              onClick={() => setMode('WIDTH')}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${mode === 'WIDTH' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
            >
              统一固定宽度
            </button>
          </div>

          <div className="space-y-6">
            {mode === 'SCALE' ? (
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="text-sm font-bold text-gray-700">缩放比例: {Math.round(scale * 100)}%</label>
                  <div className="flex gap-2">
                    {[0.5, 0.75, 1, 1.5, 2].map(f => (
                      <button key={f} onClick={() => setScale(f)} className={`px-3 py-1 text-[10px] font-bold rounded-lg border ${scale === f ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white text-gray-400 border-gray-100'}`}>
                        {f === 1 ? '原尺寸' : `${f*100}%`}
                      </button>
                    ))}
                  </div>
                </div>
                <input 
                  type="range" min="0.1" max="3" step="0.1" 
                  value={scale} onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-700">统一宽度 (px)</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="number" value={targetWidth} 
                    onChange={(e) => setTargetWidth(parseInt(e.target.value) || 0)}
                    className="flex-1 px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-xl font-mono font-bold"
                  />
                  <span className="text-gray-400 text-xs">高度自动比例适配</span>
                </div>
              </div>
            )}
          </div>

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-blue-600">
                <span>正在处理...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 flex gap-4">
          <button 
            onClick={onClose}
            className="px-8 py-4 text-gray-500 font-bold hover:bg-gray-200 rounded-2xl transition-all"
          >
            取消
          </button>
          <button 
            onClick={processAndDownload}
            disabled={isProcessing}
            className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {isProcessing ? '正在处理...' : (
              <><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>确认处理并导出</>
            )}
          </button>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
