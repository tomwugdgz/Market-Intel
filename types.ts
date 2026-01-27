
export enum AgentType {
  MARKET_INTEL = 'MARKET_INTEL',
  TENDER_INFO = 'TENDER_INFO',
  AI_ANALYSIS = 'AI_ANALYSIS'
}

export interface IntelItem {
  title: string;
  brand: string;
  date: string;
  summary: string;
  source: string;
  link: string;
  category: string;
}

export interface TenderItem {
  subject: string;
  coreNeeds: string;
  type: string;
  form: string;
  deadline: string;
  source: string;
  link: string;
}

export interface BrandDynamic {
  brandName: string;
  dynamicType: string;
  description: string;
  source: string;
  link: string;
}

export interface MarketIntelReport {
  items: IntelItem[];
}

export interface TenderReport {
  tenders: TenderItem[];
  dynamics: BrandDynamic[];
}

export interface AnalysisOpportunity {
  subject: string; 
  score: number;   
  synergy: string; 
  strategy: string; 
  mediaMix: string; 
  reason: string;   
}

export interface AIAnalysisReport {
  overallInsight: string;
  opportunities: AnalysisOpportunity[];
  contactInfo: string;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}
