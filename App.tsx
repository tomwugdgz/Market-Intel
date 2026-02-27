
import React, { useState, useEffect, useMemo } from 'react';
import { AgentType, MarketIntelReport, TenderReport, IntelItem, AIAnalysisReport, UserNewsAnalysis } from './types';
import { fetchMarketIntelligence, fetchTenderInfo, fetchAIAnalysis, verifyAndAnalyzeUserInput } from './services/geminiService';

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
    case 'bolt': return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
    case 'alert': return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
    case 'share': return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>;
    default: return null;
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<AgentType>(AgentType.MARKET_INTEL);
  const [intelData, setIntelData] = useState<MarketIntelReport | null>(null);
  const [tenderData, setTenderData] = useState<TenderReport | null>(null);
  const [analysisData, setAnalysisData] = useState<AIAnalysisReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Custom News Verification States
  const [userCustomInput, setUserCustomInput] = useState('');
  const [userAnalysisResult, setUserAnalysisResult] = useState<UserNewsAnalysis | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Custom Customer List States
  const [customCustomers, setCustomCustomers] = useState<string[]>(() => {
    const saved = localStorage.getItem('custom_customers');
    return saved ? JSON.parse(saved) : [];
  });
  const [newCustomer, setNewCustomer] = useState('');

  useEffect(() => {
    localStorage.setItem('custom_customers', JSON.stringify(customCustomers));
  }, [customCustomers]);

  const addCustomer = () => {
    if (newCustomer.trim() && !customCustomers.includes(newCustomer.trim())) {
      setCustomCustomers([...customCustomers, newCustomer.trim()]);
      setNewCustomer('');
    }
  };

  const removeCustomer = (name: string) => {
    setCustomCustomers(customCustomers.filter(c => c !== name));
  };

  const loadData = async (type: AgentType) => {
    setLoading(true);
    setError(null);
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
    } catch (err: any) {
      console.error(err);
      if (err?.message?.includes('429')) {
        setError("API 请求过于频繁，请等待几分钟后再刷新。");
      } else {
        setError("获取情报失败，请检查网络连接或 API Key。");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCustomVerify = async () => {
    if (!userCustomInput.trim()) return;
    setVerifying(true);
    setVerifyError(null);
    try {
      const result = await verifyAndAnalyzeUserInput(userCustomInput);
      setUserAnalysisResult(result);
    } catch (err: any) {
      console.error(err);
      if (err?.message?.includes('429')) {
        setVerifyError("验证请求过于频繁，请稍后再试。");
      } else {
        setVerifyError("验证失败，请尝试简化内容或稍后重试。");
      }
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => { loadData(activeTab); }, [activeTab]);

  const highlightKeywords = useMemo(() => {
    const keys = new Set<string>();
    if (searchTerm.length > 1) keys.add(searchTerm);
    
    // Core Keywords
    ['亲邻传媒', '单元门灯箱', '广告门', '开门App', '社区媒体'].forEach(k => keys.add(k));
    
    // User Provided Brand List
    const providedBrands = [
      '豆包', '元宝', '千问', '夸克', '广汽传祺', '华望汽车',
      '腾讯AI', '通义千问', '长隆', '融创', '南湖乐园',
      '小糊涂仙', '百年糊涂', '交酒', '知已', '汾阳王酒', '丹泉酒', '金沙回沙酒', '人民小酒', '夜郎古酒', '嘉士伯',
      '农商银行', '邮政银行', '华兴银行', '兴业银行', '民生银行', '微众银行',
      '如祺出行', '长安汽车', '柳汽', '赛力斯', '广州本田', '风行汽车', '一汽大众', '东风汽车', '岚图汽车', '广物汽贸', '比亚迪', '蔚来汽车',
      '马应龙', '昆药集团', '三诺集团', '中兴药业', '广药', '天士力集团', '盘龙云海', '亚宝集团', '潘高寿药业', '三金药业', '奇正药业', '桂龙药业', '幸福药业', '双飞人', '香雪制药', '健元药业', '康芝药业', '康恩贝', '桂林三金', '大参林', '养生堂', '罗浮山药业', '德良方药业', '安利', '京东念慈庵', '扬子江药业', '海露', '同溢堂', '冯了胜药业', '滇虹药业', '仁和药业', '无限极', '京果海狗丸', '艾贴', '葵花药业',
      '美的电器', '火星燃气', '九阳电器', '有色', '格兰仕', '江门金羚', '康佳集团', 'SKG按摩仪', 'Ulike脱毛仪', '科龙', '海尔', '万家乐', '创维', '奥马冰箱', '容声冰箱', '云米科技', '德尔玛电器', '罗技', '盼盼晾衣架', '阿诗丹顿', '喜蜜电动牙刷', '松下空调', '韩派电器',
      '屈臣氏', '怡宝', '景田', '仙之宝', '黑人牙膏', '宝洁', '冷酸灵', '珍妮诗', '合生元', '好易康', '浪奇', '嘉顿', '蔬果园', '葡口食品', '风行乳业', '金龙鱼', '徐福记', '凯普诺凯', '佳贝艾特', 'ABC日用品', '吨吨杯', '维达集团', '洁柔纸业', '澳雪', '雪完美', '银鹭', '盼盼食品', '锦华食品', '鹰唛花生油', '海天酱油', '华美月饼', '加加酱油', '李锦记', '达利食品', '国宝桥米', '统一', '天地一号', '百岁山', '夏良田', '鼎湖山', '宝矿力', '环亚集团', '卡姿兰', '完美日记', '晨光乳业', 'C+面膜', '丸美股份', '高露洁', '达利园', '厨邦', '晨冠乳业', '菌小宝',
      '中国移动', '中国联通', '广电广视', '南方电网', '荣耀手机', 'VIVO手机',
      '悦汇城', '城光荟', '万菱汇', '维多利广场', '东方宝泰', '时尚天河', '五月花',
      '新生植发', '倍生植发', '青逸植发',
      '沃格定制', '卡诺亚家居', '尚品集配', '宜家家私', '圣诞装修',
      '乐凯撒', '尊宝披萨', '马永记', '东园', '美心集团', '岭南集团', '袁记', '蒙自源', '元气寿司', '遇见小面', '粤向群', '松苑',
      '好佰年口腔', '熊星口腔', '文豪口腔', '广大口腔', '美云口腔', '柏德口腔', '德伦口腔',
      '卓悦教育', '京师教育', '英孚教育', '学而思', '卓越教育',
      '南湖乐园', '森林海',
      '稳健集团', '国联水产', '香港快运', '太粮集团', '省省运满满', '高德扫街', '新加坡航空', '马来西亚旅游局'
    ];
    providedBrands.forEach(b => keys.add(b));

    // Custom Customers
    customCustomers.forEach(c => keys.add(c));

    if (analysisData) {
      analysisData.opportunities.forEach(o => {
        o.mediaMix.split(/[+,/ ]/).filter(s => s.trim().length > 1).forEach(s => keys.add(s.trim()));
      });
    }
    return Array.from(keys);
  }, [searchTerm, analysisData, customCustomers]);

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

  const getTimestamp = () => {
    const now = new Date();
    return now.getFullYear().toString() + (now.getMonth()+1).toString().padStart(2,'0') + now.getDate().toString().padStart(2,'0') + now.getHours().toString().padStart(2,'0') + now.getMinutes().toString().padStart(2,'0') + now.getSeconds().toString().padStart(2,'0');
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

  const handleShare = async (item: IntelItem) => {
    const shareData = {
      title: item.title,
      text: `【${item.brand}】${item.summary}`,
      url: item.link
    };
    
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareData.title}\n${shareData.url}`);
        alert('情报链接已成功复制到剪贴板！');
      } catch (err) {
        console.error('Copy failed:', err);
      }
    }
  };

  const exportReportToMD = (data: AIAnalysisReport | undefined, titlePrefix: string) => {
    if (!data) return;
    const ts = getTimestamp();
    let md = `# ${titlePrefix} - Tom 策略分析\n日期: ${new Date().toLocaleString()}\n\n## 总体洞察\n${data.overallInsight}\n\n## 推荐机会\n`;
    data.opportunities.sort((a,b)=>b.score-a.score).forEach((o, i) => {
      md += `\n### ${i+1}. ${o.subject} (评分: ${o.score})\n- 切合点: ${o.synergy}\n- 组合: ${o.mediaMix}\n- 策略: ${o.strategy}\n- 理由: ${o.reason}\n`;
    });
    md += `\n---\n联系专家 Tom: ${data.contactInfo}`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${ts}_${titlePrefix}.md`;
    link.click();
  };

  const exportMarketIntelToMD = () => {
    if (!intelData) return;
    const ts = getTimestamp();
    let md = `# 华南市场情报\n导出日期: ${new Date().toLocaleString()}\n\n`;
    intelData.items.forEach((item, i) => {
      md += `### ${i + 1}. ${item.title}\n`;
      md += `- **品牌**: ${item.brand}\n`;
      md += `- **日期**: ${item.date}\n`;
      md += `- **类别**: ${item.category}\n`;
      md += `- **摘要**: ${item.summary}\n`;
      md += `- **来源**: ${item.source}\n`;
      md += `- **链接**: ${item.link}\n\n`;
    });
    const blob = new Blob([md], { type: 'text/markdown' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `news${ts}.md`;
    link.click();
  };

  const exportTenderInfoToMD = () => {
    if (!tenderData) return;
    const ts = getTimestamp();
    let md = `# 户外招标情报\n导出日期: ${new Date().toLocaleString()}\n\n`;
    tenderData.tenders.forEach((tender, i) => {
      md += `### ${i + 1}. ${tender.subject}\n`;
      md += `- **类型**: ${tender.type}\n`;
      md += `- **形式**: ${tender.form}\n`;
      md += `- **核心需求**: ${tender.coreNeeds}\n`;
      md += `- **截止日期**: ${tender.deadline}\n`;
      md += `- **来源**: ${tender.source}\n`;
      md += `- **链接**: ${tender.link}\n\n`;
    });
    const blob = new Blob([md], { type: 'text/markdown' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ooh${ts}.md`;
    link.click();
  };

  const groupedIntel: Record<string, IntelItem[]> = (intelData?.items || []).reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, IntelItem[]>);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-900">
      <aside className="w-full md:w-72 bg-slate-900 text-white md:h-screen sticky top-0 z-50 p-6 flex flex-col shadow-2xl">
        <div className="flex items-center gap-3 mb-12">
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-600/30"><Icon name="map" className="w-6 h-6" /></div>
          <div>
            <h1 className="font-black text-xl tracking-tighter">Market Agent</h1>
            <p className="text-[10px] text-blue-400 font-bold tracking-widest uppercase opacity-70">Strategic Expert</p>
          </div>
        </div>
        <nav className="space-y-3 flex-1">
          {[
            { id: AgentType.MARKET_INTEL, label: '华南市场情报', icon: 'intel' },
            { id: AgentType.TENDER_INFO, label: '户外招标情报', icon: 'tender' },
            { id: AgentType.AI_ANALYSIS, label: 'AI 分析报告', icon: 'ai' },
            { id: AgentType.BUDGET_OVERVIEW, label: '2026 预算大盘', icon: 'bolt' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as AgentType)} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === tab.id ? 'bg-blue-600 shadow-xl' : 'hover:bg-slate-800 text-slate-400'}`}>
              <Icon name={tab.icon} className={`w-5 h-5 ${activeTab === tab.id ? 'text-white' : 'text-slate-500'}`} /><span className="font-bold text-sm">{tab.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-6 md:p-12 max-w-7xl mx-auto w-full">
        <header className="flex flex-col xl:flex-row xl:items-center justify-between mb-12 gap-6">
          <div className="flex-1">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">
              {activeTab === AgentType.MARKET_INTEL && '华南地区·市场动态'}
              {activeTab === AgentType.TENDER_INFO && '核心广告招标情报'}
              {activeTab === AgentType.AI_ANALYSIS && 'Tom 的 AI 深度策略报告'}
              {activeTab === AgentType.BUDGET_OVERVIEW && '2026 户外广告投放费用大盘点'}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-black text-[10px] uppercase">Verified Report</span>
              <p className="text-slate-500 text-sm font-medium">推荐: 亲邻传媒社区媒体全周期触达</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative">
              <Icon name="search" className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="全局高亮匹配..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 transition-all w-64 shadow-sm" />
            </div>
            {activeTab === AgentType.MARKET_INTEL && intelData && (
              <button onClick={exportMarketIntelToMD} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 rounded-2xl font-black shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"><Icon name="download" className="w-4 h-4" />导出 MD</button>
            )}
            {activeTab === AgentType.TENDER_INFO && tenderData && (
              <button onClick={exportTenderInfoToMD} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 rounded-2xl font-black shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"><Icon name="download" className="w-4 h-4" />导出 MD</button>
            )}
            {activeTab === AgentType.AI_ANALYSIS && analysisData && (
              <button onClick={() => exportReportToMD(analysisData, "AI_Report")} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 rounded-2xl font-black shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"><Icon name="download" className="w-4 h-4" />导出 MD</button>
            )}
            {activeTab !== AgentType.BUDGET_OVERVIEW && (
              <button onClick={() => loadData(activeTab)} disabled={loading} className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl font-black shadow-xl disabled:opacity-50 transition-all">
                <Icon name="refresh" className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />{loading ? '同步中...' : '同步情报'}
              </button>
            )}
          </div>
        </header>

        {error && (
          <div className="mb-10 p-6 bg-red-50 border border-red-100 rounded-3xl flex items-center gap-4 text-red-800 animate-in fade-in duration-500">
            <Icon name="alert" className="w-6 h-6 shrink-0" />
            <div>
              <p className="font-black">数据获取异常</p>
              <p className="text-sm opacity-80">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
            <div className="w-16 h-16 border-8 border-blue-500/20 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-slate-500 font-bold animate-pulse">专家 Tom 正在为您进行大数据对标分析...</p>
          </div>
        ) : (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {activeTab === AgentType.BUDGET_OVERVIEW && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
                <div className="bg-slate-900 p-12 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-blue-600/5"></div>
                  <div className="relative z-10">
                    <h3 className="text-4xl font-black mb-6 tracking-tighter">2026 行业预算洞察</h3>
                    <p className="text-blue-100 text-xl font-bold leading-relaxed opacity-90">
                      2026年是全球化深水区，品牌将通过户外广告建立高端形象。市场进入“心智争夺”存量竞争阶段，户外广告成为建立信任的核心阵地。
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[
                    {
                      title: "科技与机器人",
                      desc: "品牌价值的“高地占领”",
                      items: [
                        { name: "华为", budget: "15-18亿" },
                        { name: "小米", budget: "10-12亿" },
                        { name: "字节跳动", budget: "8-10亿" },
                        { name: "腾讯", budget: "6-8亿" },
                        { name: "宇树科技", budget: "3-5亿" },
                        { name: "优必选", budget: "3-5亿" },
                        { name: "大疆", budget: "3-5亿" }
                      ],
                      insight: "2026年是全球化深水区，品牌将通过户外广告建立高端形象，预计新能源汽车全年投放额将突破150亿元。"
                    },
                    {
                      title: "新能源汽车",
                      desc: "心智争夺的“持久战”",
                      items: [
                        { name: "比亚迪", budget: "15-20亿" },
                        { name: "蔚来", budget: "8-10亿" },
                        { name: "理想", budget: "8-10亿" },
                        { name: "问界", budget: "6-8亿" },
                        { name: "特斯拉", budget: "8-10亿" },
                        { name: "吉利", budget: "8-10亿" }
                      ],
                      insight: "市场进入“心智争夺”存量竞争阶段，户外广告成为建立信任的核心阵地。"
                    },
                    {
                      title: "互联网平台",
                      desc: "线上流量的线下“收割机”",
                      items: [
                        { name: "淘宝", budget: "10-12亿" },
                        { name: "京东", budget: "8-10亿" },
                        { name: "美团", budget: "10-12亿" },
                        { name: "抖音", budget: "8-10亿" },
                        { name: "拼多多", budget: "8-10亿" }
                      ],
                      insight: "投放从“品牌曝光”转向“效果引流”，户外广告必须可追踪、可转化。"
                    },
                    {
                      title: "酒类品牌",
                      desc: "高端宴席的“心智霸主”",
                      items: [
                        { name: "茅台", budget: "12-15亿" },
                        { name: "五粮液", budget: "10-12亿" },
                        { name: "国窖1573", budget: "6-8亿" },
                        { name: "汾酒", budget: "5-7亿" },
                        { name: "洋河", budget: "5-7亿" }
                      ],
                      insight: "围绕“高端宴席”和“节日送礼”两大场景，抢占送礼心智。"
                    },
                    {
                      title: "食品饮料与家电",
                      desc: "年货消费的“刚需双雄”",
                      items: [
                        { name: "海尔", budget: "8-10亿" },
                        { name: "美的", budget: "8-10亿" },
                        { name: "格力", budget: "5-7亿" },
                        { name: "可口可乐", budget: "8-10亿" },
                        { name: "蒙牛", budget: "6-8亿" },
                        { name: "伊利", budget: "6-8亿" }
                      ],
                      insight: "投放逻辑高度一致——离交易越近越好，节前饱和攻击是关键。"
                    },
                    {
                      title: "文旅行业",
                      desc: "春节出游的“流量捕手”",
                      items: [
                        { name: "携程", budget: "6-8亿" },
                        { name: "迪士尼", budget: "5-7亿" },
                        { name: "长隆", budget: "3-5亿" },
                        { name: "华住", budget: "4-6亿" },
                        { name: "南航", budget: "4-6亿" }
                      ],
                      insight: "出游已成新民俗，投放从“季节性”向“全年性”转变。"
                    }
                  ].map((sec, idx) => (
                    <div key={idx} className="bg-white border-2 border-slate-100 p-10 rounded-[3rem] shadow-sm hover:shadow-xl transition-all group">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h4 className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">{sec.title}</h4>
                          <p className="text-sm font-bold text-slate-400">{sec.desc}</p>
                        </div>
                        <Icon name="bolt" className="w-6 h-6 text-blue-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="space-y-4 mb-8">
                        {sec.items.map((item, i) => (
                          <div key={i} className="flex justify-between items-center border-b border-slate-50 pb-2">
                            <span className="font-bold text-slate-700">{highlightText(item.name)}</span>
                            <span className="font-black text-blue-600 tabular-nums">{item.budget}</span>
                          </div>
                        ))}
                      </div>
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <p className="text-xs font-bold text-slate-500 leading-relaxed italic">“ {sec.insight} ”</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === AgentType.AI_ANALYSIS && (
              <div className="space-y-12">
                {/* Precision Execution Mode Panel */}
                <section className="bg-white border-2 border-slate-200 rounded-[2.5rem] p-8 md:p-12 shadow-xl overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-6">
                    <div className="bg-slate-900 px-4 py-1.5 rounded-full border border-slate-700">
                      <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">精密执行模式 · Tom Agent</span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                    <Icon name="bolt" className="w-7 h-7 text-blue-600" />
                    情报真实性/时效性验证
                  </h3>
                  <div className="space-y-6">
                    <textarea 
                      placeholder="请在此输入市场消息（例如：某品牌计划在华南投放广告）。Tom 专家将立即核实该信息的真实性，并判断其是否为 40 天内的最新消息。若属实，将为您深度输出亲邻传媒投放策略报告。"
                      className="w-full h-44 p-8 bg-slate-50 border-2 border-slate-100 rounded-[2rem] text-slate-700 font-semibold focus:outline-none focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 transition-all resize-none shadow-inner text-lg"
                      value={userCustomInput}
                      onChange={(e) => setUserCustomInput(e.target.value)}
                    />
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-slate-400 font-bold">验证逻辑：真实性溯源 + 40天时效锁 + 亲邻传媒产品适配</p>
                      <button 
                        onClick={handleCustomVerify}
                        disabled={verifying || !userCustomInput.trim()}
                        className="flex items-center gap-4 bg-blue-600 hover:bg-blue-700 text-white px-12 py-5 rounded-2xl font-black shadow-2xl transition-all disabled:opacity-30 active:scale-95 group"
                      >
                        <Icon name="ai" className={`w-6 h-6 ${verifying ? 'animate-pulse' : 'group-hover:rotate-12 transition-transform'}`} />
                        {verifying ? '精密验证中...' : '提交验证并分析'}
                      </button>
                    </div>
                  </div>

                  {verifyError && (
                    <div className="mt-8 p-6 bg-red-50 border border-red-100 rounded-2xl text-red-800 text-sm font-bold flex items-center gap-3 animate-in slide-in-from-top-2">
                      <Icon name="alert" className="w-5 h-5 shrink-0" />
                      {verifyError}
                    </div>
                  )}

                  {userAnalysisResult && !verifying && (
                    <div className="mt-12 animate-in slide-in-from-top-6 fade-in duration-500">
                      <div className={`p-10 rounded-[2.5rem] border-2 mb-10 relative overflow-hidden ${
                        userAnalysisResult.status === 'REAL' ? 'bg-emerald-50 border-emerald-100 text-emerald-900' :
                        userAnalysisResult.status === 'FAKE' ? 'bg-red-50 border-red-100 text-red-900' :
                        'bg-orange-50 border-orange-100 text-orange-900'
                      }`}>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-8 relative z-10">
                          <div className="flex flex-wrap items-center gap-4">
                            <div className={`px-8 py-3 rounded-full font-black text-sm uppercase tracking-widest shadow-lg ${
                              userAnalysisResult.status === 'REAL' ? 'bg-emerald-600 text-white' :
                              userAnalysisResult.status === 'FAKE' ? 'bg-red-600 text-white' :
                              'bg-orange-600 text-white'
                            }`}>
                              {userAnalysisResult.status === 'REAL' && '✅ 核实为真'}
                              {userAnalysisResult.status === 'FAKE' && '❌ 识别为虚假/幻觉'}
                              {userAnalysisResult.status === 'OLD' && '⏳ 识别为旧闻 (超过40天)'}
                            </div>
                            <span className="text-xs font-black opacity-50 uppercase tracking-widest">检测日期: {userAnalysisResult.verifiedDate || '未注明日期的情报'}</span>
                          </div>
                          {userAnalysisResult.status === 'REAL' && userAnalysisResult.analysis && (
                            <button 
                              onClick={() => exportReportToMD(userAnalysisResult.analysis, "Precision_Verify_Report")}
                              className="bg-white text-slate-900 px-6 py-3 rounded-2xl text-xs font-black shadow-xl flex items-center gap-2 hover:bg-slate-50 transition-all active:scale-95"
                            >
                              <Icon name="download" className="w-4 h-4" /> 导出精准报告
                            </button>
                          )}
                        </div>
                        <div className="space-y-4 relative z-10">
                          <h4 className="text-sm font-black uppercase tracking-widest opacity-60">验证理由</h4>
                          <p className="text-2xl font-black leading-tight tracking-tight">{userAnalysisResult.reason}</p>
                        </div>
                      </div>

                      {userAnalysisResult.status === 'REAL' && userAnalysisResult.analysis && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                          <div className="bg-slate-900 p-12 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                             <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] -mr-32 -mt-32 rounded-full"></div>
                             <h4 className="text-2xl font-black mb-6 flex items-center gap-4 relative z-10">
                               <Icon name="ai" className="w-8 h-8 text-blue-500" />
                               Tom 深度策略建议
                             </h4>
                             <p className="text-blue-100 text-lg font-bold leading-relaxed opacity-90 relative z-10">{userAnalysisResult.analysis.overallInsight}</p>
                          </div>
                          <div className="grid grid-cols-1 gap-8">
                            {userAnalysisResult.analysis.opportunities.map((o, idx) => (
                              <div key={idx} className="bg-white border-2 border-slate-100 p-12 rounded-[3rem] flex flex-col lg:flex-row gap-12 hover:border-blue-300 transition-all shadow-sm hover:shadow-2xl group">
                                <div className="lg:w-48 flex flex-col items-center justify-center border-r border-slate-200 px-6 shrink-0 group-hover:border-blue-200 transition-colors">
                                   <div className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">策略评分</div>
                                   <div className={`text-6xl font-black transition-transform group-hover:scale-110 ${o.score > 90 ? 'text-red-600' : 'text-blue-700'}`}>{o.score}</div>
                                </div>
                                <div className="flex-1 space-y-8">
                                  <h5 className="text-3xl font-black text-slate-900 leading-tight">{o.subject}</h5>
                                  <div className="grid md:grid-cols-2 gap-10">
                                    <div className="space-y-3">
                                      <span className="font-black text-blue-600 text-[10px] uppercase tracking-widest block">媒体切合点</span>
                                      <p className="font-bold text-slate-700 text-lg leading-relaxed">{o.synergy}</p>
                                    </div>
                                    <div className="space-y-3">
                                      <span className="font-black text-emerald-600 text-[10px] uppercase tracking-widest block">精准执行策略</span>
                                      <p className="font-bold text-slate-700 text-lg leading-relaxed">{o.strategy}</p>
                                    </div>
                                  </div>
                                  <div className="bg-blue-50/50 p-8 rounded-3xl border border-blue-100/50">
                                     <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest block mb-2">Tom's Recommendation</span>
                                     <p className="font-bold text-slate-600 italic leading-relaxed">“ {o.reason} ”</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </section>

                <div className="h-0.5 bg-slate-200 rounded-full opacity-30 mx-12"></div>

                {analysisData && (
                  <div className="space-y-10">
                    <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-12 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                      <div className="absolute inset-0 bg-blue-600/5"></div>
                      <div className="relative z-10"><h3 className="text-4xl font-black mb-6 tracking-tighter">情报库大盘洞察</h3><p className="text-blue-100 text-2xl font-black leading-snug opacity-95 max-w-5xl">{highlightText(analysisData.overallInsight)}</p></div>
                    </div>
                    <div className="grid grid-cols-1 gap-10">
                      {analysisData.opportunities.sort((a,b)=>b.score-a.score).map((opt, i) => (
                        <div key={i} className="bg-white border-2 border-slate-50 rounded-[3rem] p-12 shadow-sm hover:shadow-3xl transition-all duration-500 group flex flex-col lg:flex-row gap-12 relative overflow-hidden">
                          <div className="lg:w-56 flex flex-col items-center justify-center border-r border-slate-100 group-hover:bg-blue-50/30 transition-colors shrink-0">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">深度契合度</span>
                            <div className={`text-7xl font-black tracking-tighter transition-all group-hover:scale-110 ${opt.score > 90 ? 'text-red-500' : 'text-blue-600'}`}>{opt.score}</div>
                          </div>
                          <div className="flex-1 space-y-8">
                            <h4 className="text-3xl font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">{highlightText(opt.subject)}</h4>
                            <div className="grid md:grid-cols-2 gap-10 text-lg">
                              <div className="space-y-3"><h5 className="font-black text-slate-400 text-xs uppercase tracking-widest">投放切合点</h5><p className="text-slate-700 font-bold leading-relaxed">{highlightText(opt.synergy)}</p></div>
                              <div className="space-y-3"><h5 className="font-black text-slate-400 text-xs uppercase tracking-widest">媒体组合及占比</h5><p className="text-slate-700 font-bold leading-relaxed">{highlightText(opt.strategy)}</p></div>
                            </div>
                            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 relative group-hover:bg-blue-50 transition-colors">
                               <div className="absolute -top-3 left-8 bg-white px-4 py-1 border border-slate-100 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">Expert Tom</div>
                               <p className="text-slate-600 font-bold leading-relaxed italic">" {highlightText(opt.reason)} "</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === AgentType.MARKET_INTEL && (
              <div className="mb-12 bg-white border-2 border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                    <Icon name="intel" className="w-6 h-6 text-blue-600" />
                    自定义客户名单管理
                  </h3>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">共 {customCustomers.length} 位客户</span>
                </div>
                <div className="flex gap-4 mb-6">
                  <input 
                    type="text" 
                    placeholder="输入新客户名称..." 
                    value={newCustomer}
                    onChange={(e) => setNewCustomer(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCustomer()}
                    className="flex-1 px-6 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 transition-all shadow-inner"
                  />
                  <button 
                    onClick={addCustomer}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl font-black shadow-lg transition-all active:scale-95"
                  >
                    添加客户
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {customCustomers.length === 0 ? (
                    <p className="text-slate-400 text-sm italic py-4">暂无自定义客户，添加后将在情报中自动高亮显示。</p>
                  ) : (
                    customCustomers.map(customer => (
                      <div key={customer} className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl border border-blue-100 group animate-in zoom-in duration-300">
                        <span className="font-bold text-sm">{customer}</span>
                        <button 
                          onClick={() => removeCustomer(customer)}
                          className="text-blue-300 hover:text-red-500 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === AgentType.MARKET_INTEL && Object.entries(groupedIntel).map(([cat, items]) => (
              <section key={cat} className="space-y-8 animate-in fade-in duration-700">
                <div className="flex items-center gap-4"><div className="h-10 w-2.5 bg-blue-600 rounded-full shadow-lg shadow-blue-600/20"></div><h3 className="text-3xl font-black text-slate-800 tracking-tight">{cat}</h3></div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                  {items.map((item, idx) => (
                    <div key={idx} className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-3xl transition-all duration-500 group relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-bl-[4rem] -mr-16 -mt-16 group-hover:bg-blue-100 transition-colors"></div>
                      <div className="flex justify-between mb-6 items-center relative z-10">
                        <span className="bg-blue-50 text-blue-700 text-[10px] font-black px-5 py-2 rounded-2xl uppercase tracking-widest border border-blue-100">{item.brand}</span>
                        <span className="text-[10px] text-slate-400 font-black tracking-widest uppercase opacity-60">{item.date}</span>
                      </div>
                      <h4 className="text-2xl font-black text-slate-900 mb-5 group-hover:text-blue-600 transition-colors leading-tight relative z-10">{highlightText(item.title)}</h4>
                      <p className="text-slate-600 text-base font-bold mb-10 leading-relaxed opacity-80 relative z-10">{highlightText(item.summary)}</p>
                      <div className="flex items-center justify-between pt-8 border-t border-slate-50 relative z-10">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic opacity-40">Source: {item.source}</span>
                        <div className="flex items-center gap-3">
                          <button onClick={() => handleShare(item)} className="bg-slate-100 text-slate-600 hover:bg-slate-200 p-3 rounded-2xl transition-all active:scale-90" title="分享情报">
                            <Icon name="share" className="w-5 h-5" />
                          </button>
                          <a href={item.link} target="_blank" rel="noopener noreferrer" className="bg-slate-900 text-white text-[10px] font-black px-7 py-3 rounded-2xl flex items-center gap-3 hover:bg-blue-600 shadow-xl transition-all active:scale-95">阅读报告 <Icon name="external" className="w-4 h-4" /></a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            {activeTab === AgentType.TENDER_INFO && (
              <div className="space-y-12 animate-in fade-in duration-700">
                <div className="flex items-center gap-4 mb-8"><div className="h-10 w-2.5 bg-indigo-600 rounded-full shadow-lg shadow-indigo-600/20"></div><h3 className="text-3xl font-black text-slate-800 tracking-tight">行业公开招标情报</h3></div>
                {tenderData?.tenders?.map((tender, i) => (
                  <div key={i} className="bg-white border-2 border-slate-50 p-10 md:p-14 rounded-[3.5rem] shadow-sm hover:border-indigo-300 transition-all duration-500 group flex flex-col lg:flex-row justify-between gap-12">
                    <div className="flex-1 space-y-6">
                      <div className="flex gap-3"><span className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-4 py-1.5 rounded-full border border-indigo-100 tracking-widest">{tender.type}</span><span className="bg-slate-50 text-slate-400 text-[10px] font-black px-4 py-1.5 rounded-full border border-slate-100 tracking-widest">{tender.form}</span></div>
                      <h4 className="text-3xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-[1.15] tracking-tight">{highlightText(tender.subject)}</h4>
                      <div className="space-y-2">
                        <p className="text-lg font-bold text-slate-600 leading-relaxed italic opacity-80">{highlightText(tender.coreNeeds)}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] opacity-50 flex items-center gap-2"><Icon name="map" className="w-3 h-3" />情报平台: {tender.source}</p>
                      </div>
                    </div>
                    <div className="lg:w-72 flex flex-col justify-between items-end gap-10">
                      <div className="text-right w-full">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 opacity-60">投标截止窗口</p>
                        <p className="text-4xl font-mono font-black text-red-500 bg-red-50/50 border border-red-100/50 px-8 py-4 rounded-[2rem] shadow-sm tabular-nums">{tender.deadline}</p>
                      </div>
                      <div className="flex gap-4 w-full">
                        <button onClick={() => addToCalendar(tender.subject, tender.deadline)} className="flex-1 bg-slate-100 hover:bg-indigo-600 hover:text-white px-6 py-4 rounded-2xl text-[10px] font-black transition-all flex items-center justify-center gap-3 shadow-sm active:scale-95"><Icon name="calendar" className="w-5 h-5" />加入日历</button>
                        <a href={tender.link} target="_blank" rel="noopener noreferrer" className="flex-1 bg-slate-900 text-white px-6 py-4 rounded-2xl text-[10px] font-black flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all shadow-2xl shadow-slate-900/20 active:scale-95">查看详述 <Icon name="external" className="w-5 h-5" /></a>
                      </div>
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
