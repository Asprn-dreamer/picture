
import React, { useState, useMemo } from 'react';
import { AssetType, WebAsset } from './types';
import { AssetCard } from './components/AssetCard';
import { geminiService } from './services/geminiService';
import { BatchImageResizer } from './components/BatchImageResizer';

const App: React.FC = () => {
  const [htmlContent, setHtmlContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<WebAsset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AssetType | 'ALL'>('ALL');
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBatchResizer, setShowBatchResizer] = useState(false);

  const filteredResults = useMemo(() => 
    activeTab === 'ALL' ? results : results.filter(r => r.type === activeTab),
    [results, activeTab]
  );

  const selectedAssets = useMemo(() => 
    results.filter(r => selectedIds.has(r.id) && r.type !== AssetType.VIDEO),
    [results, selectedIds]
  );

  const processHtml = async (html: string) => {
    if (!html.trim() || html.length < 50) return;
    setLoading(true);
    setError(null);
    try {
      const data = await geminiService.extractAssetsFromHtml(html);
      const combined: WebAsset[] = [
        ...data.mainImages.map((src, i) => ({ id: `main-${i}-${Date.now()}`, url: src, type: AssetType.MAIN })),
        ...data.detailImages.map((src, i) => ({ id: `detail-${i}-${Date.now()}`, url: src, type: AssetType.DETAIL })),
        ...data.videos.map((src, i) => ({ id: `video-${i}-${Date.now()}`, url: src, type: AssetType.VIDEO })),
      ];
      if (combined.length === 0) {
        throw new Error("未能识别到高清无水印资源。");
      }
      setResults(combined);
      setHtmlContent('');
      setSelectedIds(new Set());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAll = () => {
    const allIds = filteredResults.map(r => r.id);
    setSelectedIds(new Set(allIds));
  };

  const deselectAll = () => setSelectedIds(new Set());

  const downloadAll = () => {
    const target = selectedIds.size > 0 
      ? results.filter(r => selectedIds.has(r.id)) 
      : filteredResults;

    if (target.length === 0) return;
    if (target.length > 20 && !window.confirm(`即将下载 ${target.length} 个文件，是否继续？`)) return;
    
    target.forEach((asset, index) => {
      setTimeout(() => window.open(asset.url, '_blank'), index * 350);
    });
  };

  const clearAll = () => {
    setResults([]);
    setError(null);
    setSelectedIds(new Set());
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
      <header className="text-center mb-10">
        <h1 className="text-4xl font-black text-gray-900 mb-3 tracking-tight flex items-center justify-center gap-3">
          <span className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-2.5 rounded-2xl shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </span>
          JJBo扒图助手 <span className="text-blue-600">Pro</span>
        </h1>
        <p className="text-gray-500 max-w-xl mx-auto font-medium">无水印原图抓取、批量尺寸调整、一键导出。</p>
      </header>

      <section className="mb-10 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 relative">
          <div className="absolute -top-3 left-6 z-10 bg-white px-2 text-xs font-bold text-blue-600 border border-blue-100 rounded uppercase tracking-wider">粘贴 HTML 源码</div>
          <textarea 
            placeholder="粘贴源码后，AI 将自动识别无水印原图..."
            className="w-full h-64 p-6 rounded-3xl border-2 border-dashed border-gray-200 bg-white shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all font-mono text-sm resize-none"
            value={htmlContent}
            onPaste={(e) => { const text = e.clipboardData.getData('text'); processHtml(text); }}
            onChange={(e) => setHtmlContent(e.target.value)}
          />
          {loading && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center rounded-3xl z-10">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-blue-700 font-bold animate-pulse">正在深度清理图片水印...</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-3xl text-white shadow-xl shadow-blue-100">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" /></svg>
              更新公告
            </h3>
            <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              <div className="border-l-2 border-white/40 pl-3">
                <p className="text-[10px] font-black opacity-70">V1.4 (Current)</p>
                <p className="text-xs font-medium">更名为“JJBo扒图助手”，支持 JPG/PNG 导出格式选择。</p>
              </div>
              <div className="border-l-2 border-white/20 pl-3 opacity-80">
                <p className="text-[10px] font-black opacity-50">V1.3</p>
                <p className="text-xs">支持批量图片调整，详情页适配能力增强。</p>
              </div>
              <div className="border-l-2 border-white/20 pl-3 opacity-60">
                <p className="text-[10px] font-black opacity-50">V1.2</p>
                <p className="text-xs">集成 AI 智能去水印，淘宝/1688 原图一键直连。</p>
              </div>
              <div className="border-l-2 border-white/20 pl-3 opacity-40">
                <p className="text-[10px] font-black opacity-50">V1.0</p>
                <p className="text-xs">JJBo扒图助手基础版发布。</p>
              </div>
            </div>
          </div>
          {results.length > 0 && (
            <button onClick={clearAll} className="w-full py-4 border-2 border-gray-200 text-gray-400 font-bold rounded-2xl hover:bg-gray-50 transition-colors">清空并继续</button>
          )}
        </div>
      </section>

      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl text-sm font-semibold flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
          {error}
        </div>
      )}

      {results.length > 0 && (
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 glass p-3 rounded-2xl border border-white/50 shadow-xl sticky top-4 z-40">
            <div className="flex items-center gap-3">
              <div className="flex bg-gray-100 p-1 rounded-xl">
                {(['ALL', AssetType.VIDEO, AssetType.MAIN, AssetType.DETAIL] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>
                    {tab === 'ALL' ? '全部' : tab === AssetType.VIDEO ? '视频' : tab === AssetType.MAIN ? '主图' : '详情'}
                  </button>
                ))}
              </div>
              <div className="h-6 w-px bg-gray-200"></div>
              <button 
                onClick={selectedIds.size === filteredResults.length ? deselectAll : selectAll} 
                className="text-xs font-bold text-blue-600 px-2"
              >
                {selectedIds.size > 0 ? `取消所选 (${selectedIds.size})` : '全选当前'}
              </button>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => setShowBatchResizer(true)}
                disabled={selectedAssets.length === 0}
                className="px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg disabled:opacity-30 text-xs flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                批量调整尺寸
              </button>
              <button onClick={downloadAll} className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg text-xs flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                下载 ({selectedIds.size > 0 ? selectedIds.size : filteredResults.length})
              </button>
            </div>
          </div>

          <div className="grid-masonry px-1">
            {filteredResults.map((asset) => (
              <AssetCard 
                key={asset.id} 
                asset={asset} 
                isSelected={selectedIds.has(asset.id)}
                onToggleSelect={() => toggleSelect(asset.id)}
              />
            ))}
          </div>
        </section>
      )}

      <footer className="mt-20 pt-10 border-t border-gray-100 text-center opacity-30">
        <p className="text-[10px] uppercase font-black tracking-widest text-gray-600">JJBo扒图助手 Professional • Powered by Gemini AI</p>
      </footer>

      {showBatchResizer && (
        <BatchImageResizer assets={selectedAssets} onClose={() => setShowBatchResizer(false)} />
      )}
    </div>
  );
};

export default App;
