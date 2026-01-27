
import React, { useState, useEffect, useMemo } from 'react';
import { AgentType, MarketIntelReport, TenderReport, GroundingChunk, IntelItem, AIAnalysisReport } from './types';
import { fetchMarketIntelligence, fetchTenderInfo, fetchAIAnalysis } from './services/geminiService';

const Icon = ({ name, className = "" }: { name: string, className?: string }) => {
  switch (name) {
    case 'intel': return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2zM14 4v4h4" /></svg>;
    case 'tender': return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
    case 'ai': return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
    case 'refresh': return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
    case 'external': return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>;
    case 'download': return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
    case 'calendar': return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
    case 'search': return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
    default: return null;
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<AgentType>(AgentType.MARKET_INTEL);
  const [intelData, setIntelData] = useState<MarketIntelReport | null>(null);
  const [tenderData, setTenderData] = useState<TenderReport | null>(null);
  const [analysisData, setAnalysisData] = useState<AIAnalysisReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async (type: AgentType) => {
    setLoading(true);
    try {
      if (type === AgentType.MARKET_INTEL) {
        const { report } = await fetchMarketIntelligence();
        setIntelData(report);
      } else if (type === AgentType.TENDER_INFO) {
        const { report } = await fetchTenderInfo();
        setTenderData(report);
      } else if (type === AgentType.AI_ANALYSIS) {
        let currentIntel = intelData || (await fetchMarketIntelligence()).report;
        let currentTender = tenderData || (await fetchTenderInfo()).report;
        if (!intelData) setIntelData(currentIntel);
        if (!tenderData) setTenderData(currentTender);
        const report = await fetchAIAnalysis(currentIntel, currentTender);
        setAnalysisData(report);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(activeTab); }, [activeTab]);

  const highlightKeywords = useMemo(() => {
    const keys = new Set<string>();
    if (searchTerm.length > 1) keys.add(searchTerm);
    ['亲邻传媒', '单元门灯箱', '广告门', '开门App', '社区媒体'].forEach(k => keys.add(k));
    if (analysisData) {
      analysisData.opportunities.forEach(o => {
        o.mediaMix.split(/[+,/ ]/).filter(s => s.trim().length > 1).forEach(s => keys.add(s.trim()));
      });
    }
    return Array.from(keys);
  }, [searchTerm, analysisData]);

  const highlightText = (text: string) => {
    if (!text) return null;
    const sanitizedText = text.replace(/华语传媒/g, '亲邻传媒');
    if (highlightKeywords.length === 0) return <span>{sanitizedText}</span>;
    const pattern = new RegExp(`(${highlightKeywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    const parts = sanitizedText.split(pattern);
    return (
      <>
        {parts.map((part, i) => 
          highlightKeywords.some(k => k.toLowerCase() === part.toLowerCase()) 
            ? <mark key={i} className="bg-yellow-200 text-slate-900 rounded px-0.5 font-bold">{part}</mark> 
            : part
        )}
      </>
    );
  };

  const addToCalendar = (subject: string, deadline: string) => {
    const cleanDate = deadline.replace(/[年月]/g, '-').replace(/日/g, '');
    const match = cleanDate.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/) || cleanDate.match(/(\d{1,2})[-/](\d{1,2})/);
    let eventDate = new Date();
    if (match) {
      if (match.length === 4) eventDate = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
      else eventDate = new Date(new Date().getFullYear(), parseInt(match[1]) - 1, parseInt(match[2]));
    }
    eventDate.setHours(23, 59, 0);
    const dateStr = eventDate.toISOString().replace(/-|:|\.\d+/g, '');
    const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:【截止】${subject}\nDTSTART:${dateStr}\nDTEND:${dateStr}\nDESCRIPTION:招标截止提醒。专家Tom建议及时跟进。\nEND:VEVENT\nEND:VCALENDAR`;
    const blob = new Blob([ics], { type: 'text/calendar' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Tender_${Date.now()}.ics`;
    link.click();
  };

  const exportMD = () => {
    if (!analysisData) return;
    const now = new Date();
    const ts = now.getFullYear().toString() + (now.getMonth()+1).toString().padStart(2,'0') + now.getDate().toString().padStart(2,'0') + now.getHours().toString().padStart(2,'0') + now.getMinutes().toString().padStart(2,'0') + now.getSeconds().toString().padStart(2,'0');
    let md = `# Tom 的户外广告策略分析\n日期: ${now.toLocaleString()}\n\n## 总体洞察\n${analysisData.overallInsight}\n\n## 推荐机会\n`;
    analysisData.opportunities.sort((a,b)=>b.score-a.score).forEach((o, i) => {
      md += `\n### ${i+1}. ${o.subject} (评分: ${o.score})\n- 切合点: ${o.synergy}\n- 组合: ${o.mediaMix}\n- 策略: ${o.strategy}\n- 理由: ${o.reason}\n`;
    });
    md += `\n---\n联系专家 Tom: ${analysisData.contactInfo}`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${ts}.md`;
    link.click();
  };

  const groupedIntel: Record<string, IntelItem[]> = (intelData?.items || []).reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, IntelItem[]>);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      <aside className="w-full md:w-72 bg-slate-900 text-white md:h-screen sticky top-0 z-50 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-12">
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-600/20"><Icon name="map" className="w-6 h-6" /></div>
          <h1 className="font-black text-xl tracking-tighter">Market Agent</h1>
        </div>
        <nav className="space-y-3 flex-1">
          {[
            { id: AgentType.MARKET_INTEL, label: '华南市场情报', icon: 'intel' },
            { id: AgentType.TENDER_INFO, label: '户外招标情报', icon: 'tender' },
            { id: AgentType.AI_ANALYSIS, label: 'AI 分析报告', icon: 'ai' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as AgentType)} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === tab.id ? 'bg-blue-600 shadow-xl' : 'hover:bg-slate-800 text-slate-400'}`}>
              <Icon name={tab.icon} className="w-5 h-5" /><span className="font-bold text-sm">{tab.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-6 md:p-12 max-w-7xl mx-auto w-full">
        <header className="flex flex-col xl:flex-row xl:items-center justify-between mb-12 gap-6">
          <div className="flex-1">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">
              {activeTab === AgentType.MARKET_INTEL && '华南地区·市场情报'}
              {activeTab === AgentType.TENDER_INFO && '核心广告招标情报'}
              {activeTab === AgentType.AI_ANALYSIS && 'Tom 的 AI 深度策略报告'}
            </h2>
            <p className="text-slate-500 font-medium">重点推荐: 亲邻传媒社区媒体全触达</p>
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative">
              <Icon name="search" className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="实时高亮关键词..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 transition-all w-64 shadow-sm" />
            </div>
            {activeTab === AgentType.AI_ANALYSIS && analysisData && (
              <button onClick={exportMD} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 rounded-2xl font-black shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"><Icon name="download" className="w-4 h-4" />导出 MD</button>
            )}
            <button onClick={() => loadData(activeTab)} disabled={loading} className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl font-black shadow-xl disabled:opacity-50 transition-all">
              <Icon name="refresh" className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />{loading ? '分析中...' : '同步情报'}
            </button>
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
            <div className="w-16 h-16 border-8 border-blue-500/20 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-slate-500 font-bold animate-pulse">专家 Tom 正在为您进行大数据对标分析...</p>
          </div>
        ) : (
          <div className="space-y-12 animate-in fade-in duration-700">
            {activeTab === AgentType.AI_ANALYSIS && analysisData && (
              <div className="space-y-8">
                <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                  <div className="relative z-10"><h3 className="text-3xl font-black mb-4">核心策略洞察</h3><p className="text-blue-100 text-xl font-medium opacity-90">{highlightText(analysisData.overallInsight)}</p></div>
                </div>
                <div className="grid grid-cols-1 gap-8">
                  {analysisData.opportunities.sort((a,b)=>b.score-a.score).map((opt, i) => (
                    <div key={i} className="bg-white border border-slate-100 rounded-[2rem] p-10 shadow-sm hover:shadow-2xl transition-all group flex flex-col lg:flex-row gap-10">
                      <div className="lg:w-48 flex flex-col items-center justify-center border-r border-slate-50">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">匹配分</span>
                        <div className={`text-6xl font-black ${opt.score > 90 ? 'text-red-500' : 'text-blue-600'}`}>{opt.score}</div>
                      </div>
                      <div className="flex-1 space-y-6">
                        <h4 className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">{highlightText(opt.subject)}</h4>
                        <div className="grid md:grid-cols-2 gap-8 text-sm">
                          <div className="space-y-2"><h5 className="font-bold text-slate-400">切合点</h5><p className="text-slate-600 font-bold leading-relaxed">{highlightText(opt.synergy)}</p></div>
                          <div className="space-y-2"><h5 className="font-bold text-slate-400">专家策略</h5><p className="text-slate-600 font-bold leading-relaxed">{highlightText(opt.strategy)}</p></div>
                        </div>
                        <div className="bg-blue-50 p-6 rounded-2xl text-sm italic text-slate-600 font-bold leading-relaxed border border-blue-100">" {highlightText(opt.reason)} "</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === AgentType.MARKET_INTEL && Object.entries(groupedIntel).map(([cat, items]) => (
              <section key={cat} className="space-y-6">
                <div className="flex items-center gap-3"><div className="h-8 w-1.5 bg-blue-600 rounded-full"></div><h3 className="text-2xl font-black text-slate-800">{cat}</h3></div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {items.map((item, idx) => (
                    <div key={idx} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                      <div className="flex justify-between mb-4"><span className="bg-blue-50 text-blue-700 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider">{item.brand}</span><span className="text-xs text-slate-400 font-bold">{item.date}</span></div>
                      <h4 className="text-xl font-black text-slate-900 mb-4 group-hover:text-blue-600 transition-colors">{highlightText(item.title)}</h4>
                      <p className="text-slate-600 text-sm font-bold mb-8 leading-relaxed opacity-80">{highlightText(item.summary)}</p>
                      <div className="flex items-center justify-between pt-6 border-t border-slate-50"><span className="text-[10px] font-black text-slate-400 italic">源: {item.source}</span><a href={item.link} target="_blank" className="bg-slate-900 text-white text-xs font-black px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-blue-600 transition-all">原文 <Icon name="external" className="w-4 h-4" /></a></div>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            {activeTab === AgentType.TENDER_INFO && (
              <div className="space-y-8">
                <div className="flex items-center gap-3 mb-4"><div className="h-8 w-1.5 bg-indigo-600 rounded-full"></div><h3 className="text-2xl font-black text-slate-800">最新广告招标信息</h3></div>
                {tenderData?.tenders?.map((tender, i) => (
                  <div key={i} className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm hover:border-indigo-300 transition-all group flex flex-col lg:flex-row justify-between gap-10">
                    <div className="flex-1 space-y-4">
                      <div className="flex gap-2"><span className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-3 py-1 rounded-full">{tender.type}</span><span className="bg-slate-100 text-slate-500 text-[10px] font-black px-3 py-1 rounded-full">{tender.form}</span></div>
                      <h4 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{highlightText(tender.subject)}</h4>
                      <p className="text-sm font-bold text-slate-600 italic">需求: {highlightText(tender.coreNeeds)}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">源: {tender.source}</p>
                    </div>
                    <div className="lg:w-64 flex flex-col justify-between items-end gap-6">
                      <div className="text-right"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">截止日期</p><p className="text-2xl font-black text-red-500 bg-red-50 px-5 py-2 rounded-2xl">{tender.deadline}</p></div>
                      <div className="flex gap-2 w-full"><button onClick={() => addToCalendar(tender.subject, tender.deadline)} className="flex-1 bg-slate-100 hover:bg-indigo-600 hover:text-white px-5 py-3.5 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2"><Icon name="calendar" className="w-4 h-4" />存日历</button><a href={tender.link} target="_blank" className="flex-1 bg-slate-900 text-white px-5 py-3.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-lg">详情 <Icon name="external" className="w-4 h-4" /></a></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
