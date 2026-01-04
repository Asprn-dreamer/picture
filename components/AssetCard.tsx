
import React, { useState } from 'react';
import { WebAsset, AssetType } from '../types';
import { ImageResizer } from './ImageResizer';

interface AssetCardProps {
  asset: WebAsset;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

export const AssetCard: React.FC<AssetCardProps> = ({ asset, isSelected, onToggleSelect }) => {
  const isVideo = asset.type === AssetType.VIDEO;
  const [isHovered, setIsHovered] = useState(false);
  const [showResizer, setShowResizer] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(asset.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `snap-${asset.id}.${isVideo ? 'mp4' : 'jpg'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      window.open(asset.url, '_blank');
    }
  };

  return (
    <>
      <div 
        className={`masonry-item group relative overflow-hidden rounded-2xl bg-white border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
          isSelected ? 'border-blue-500 ring-4 ring-blue-50' : 'border-gray-100 shadow-sm'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onToggleSelect}
      >
        <div className="relative aspect-auto bg-gray-50">
          {isVideo ? (
            <video 
              src={asset.url} 
              className="w-full h-auto object-cover block" 
              controls={isHovered}
              muted
              loop
              playsInline
            />
          ) : (
            <img 
              src={asset.url} 
              alt="asset" 
              className="w-full h-auto object-cover block transition-transform duration-700 group-hover:scale-105" 
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=无法加载原图';
              }}
            />
          )}

          {/* Selection Box */}
          <div 
            className={`absolute top-3 left-3 z-20 w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center ${
              isSelected ? 'bg-blue-600 border-blue-600 shadow-md' : 'bg-white/40 border-white backdrop-blur-sm opacity-0 group-hover:opacity-100 hover:scale-110'
            }`}
            onClick={(e) => { e.stopPropagation(); onToggleSelect?.(); }}
          >
            {isSelected && <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
          </div>
        </div>
        
        {/* Actions Overlay */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex gap-2">
            <button onClick={handleDownload} className="p-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            </button>
            {!isVideo && (
              <button onClick={(e) => { e.stopPropagation(); setShowResizer(true); }} className="p-2 bg-white text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
              </button>
            )}
          </div>
          <span className={`px-2 py-0.5 rounded text-[9px] font-bold text-white border border-white/30 uppercase ${
            asset.type === AssetType.MAIN ? 'bg-orange-500' :
            asset.type === AssetType.VIDEO ? 'bg-indigo-600' : 'bg-gray-600'
          }`}>
            {asset.type === AssetType.MAIN ? '主图' : asset.type === AssetType.VIDEO ? '视频' : '详情'}
          </span>
        </div>
      </div>

      {showResizer && (
        <ImageResizer imageUrl={asset.url} onClose={() => setShowResizer(false)} />
      )}
    </>
  );
};
