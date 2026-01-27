
import { GoogleGenAI, Type } from "@google/genai";
import { AgentType, MarketIntelReport, TenderReport, GroundingChunk, AIAnalysisReport } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const INDUSTRY_CATEGORIES = [
  "快消", "日化", "汽车", "科技", "零售", "餐饮", "教育", "金融", "房产"
];

const TOM_AGENT_INSTRUCTION = `
你的名字是Tom，是一位专业的户外广告投放专家。
你的身份：亲邻传媒（注意：禁止提及华语传媒，所有原华语传媒资源统一称呼为“亲邻传媒”）专家。
核心推荐产品及占比：
1. 社区单元门灯箱：特点为全天候曝光、封闭环境。投放比例建议在 30%-48% 之间。
2. 广告门（社区大门灯箱）：覆盖规模大，性价比极高。
3. 开门App（亲邻开门+）：线上线下联动。

你的任务：分析提供的市场动态和招标信息，寻找媒体合作切合点。
要求：
- 从媒体投放视角出发。
- 为每个机会点打分（1-100）。
- 输出格式必须为 JSON。
- 联系人：Tom 17665188615。
`;

export async function fetchAIAnalysis(marketData: MarketIntelReport, tenderData: TenderReport): Promise<AIAnalysisReport> {
  const prompt = `
  请基于以下情报进行深度分析：
  市场动态：${JSON.stringify(marketData.items.slice(0, 8))}
  招标项目：${JSON.stringify(tenderData.tenders.slice(0, 5))}
  
  请作为专家 Tom 给出分析，寻找切合点。
  JSON 输出结构：
  {
    "overallInsight": "总体行业动态洞察",
    "opportunities": [
      {
        "subject": "情报标题或招标主体",
        "score": 95,
        "synergy": "媒体切合点详细分析",
        "strategy": "具体的投放跟进策略（需包含社区单元门灯箱 30%-48% 建议）",
        "mediaMix": "推荐媒体组合（如：单元门灯箱 + 广告门）",
        "reason": "推荐理由"
      }
    ],
    "contactInfo": "Tom 17665188615"
  }`;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      systemInstruction: TOM_AGENT_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overallInsight: { type: Type.STRING },
          opportunities: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                subject: { type: Type.STRING },
                score: { type: Type.NUMBER },
                synergy: { type: Type.STRING },
                strategy: { type: Type.STRING },
                mediaMix: { type: Type.STRING },
                reason: { type: Type.STRING }
              },
              required: ["subject", "score", "synergy", "strategy", "mediaMix", "reason"]
            }
          },
          contactInfo: { type: Type.STRING }
        }
      }
    }
  });

  return JSON.parse(response.text) as AIAnalysisReport;
}

export async function fetchMarketIntelligence(): Promise<{ report: MarketIntelReport, sources: GroundingChunk[] }> {
  const prompt = `收集今天华南地区（广深佛等）至少20条品牌动态。
  情报包含：category, title, brand, date, summary, source, link。
  以 JSON 格式输出。`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction: "你是一个专业的市场情报机器人。必须使用 Google Search 获取最新真实动态。链接必须指向原始来源。行业包括：快消、日化、汽车、科技、零售、餐饮、教育等。",
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                title: { type: Type.STRING },
                brand: { type: Type.STRING },
                date: { type: Type.STRING },
                summary: { type: Type.STRING },
                source: { type: Type.STRING },
                link: { type: Type.STRING }
              }
            }
          }
        }
      }
    },
  });

  return { 
    report: JSON.parse(response.text) as MarketIntelReport, 
    sources: (response.candidates?.[0]?.groundingMetadata?.groundingChunks || []) as GroundingChunk[] 
  };
}

export async function fetchTenderInfo(): Promise<{ report: TenderReport, sources: GroundingChunk[] }> {
  const prompt = `收集全国范围内与户外广告投放、品牌全案高度相关的最新招标信息。
  以 JSON 格式输出。`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction: "你是户外广告招标情报 Agent。严格过滤非户外、非策划类。重点：户外广告、OOH、品牌全案。使用 Google Search。",
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          tenders: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                subject: { type: Type.STRING },
                coreNeeds: { type: Type.STRING },
                type: { type: Type.STRING },
                form: { type: Type.STRING },
                deadline: { type: Type.STRING },
                source: { type: Type.STRING },
                link: { type: Type.STRING }
              }
            }
          },
          dynamics: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                brandName: { type: Type.STRING },
                dynamicType: { type: Type.STRING },
                description: { type: Type.STRING },
                source: { type: Type.STRING },
                link: { type: Type.STRING }
              }
            }
          }
        }
      }
    },
  });

  return { 
    report: JSON.parse(response.text) as TenderReport, 
    sources: (response.candidates?.[0]?.groundingMetadata?.groundingChunks || []) as GroundingChunk[] 
  };
}
