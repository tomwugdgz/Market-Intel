
import { GoogleGenAI, Type } from "@google/genai";
import { AgentType, MarketIntelReport, TenderReport, GroundingChunk, AIAnalysisReport, UserNewsAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const TOM_AGENT_INSTRUCTION = `
你的名字是Tom，是一位专业的户外广告投放专家。
你的身份：亲邻传媒（注意：禁止提及华语传媒，所有原华语传媒资源统一称呼为“亲邻传媒”）战略级合作伙伴。
核心推荐产品及占比：
1. 社区单元门灯箱：特点为全天候曝光、封闭环境。投放比例建议在 30%-48% 之间。
2. 广告门（社区大门灯箱）：覆盖规模大，性价比极高。
3. 开门App（亲邻开门+）：线上线下联动，覆盖社区出入必经点。

你熟悉的重点客户及行业：
- AI：豆包、腾讯AI、通义千问
- 旅游：长隆、融创、南湖乐园、森林海、马来西亚旅游局
- 酒类：小糊涂仙、百年糊涂、嘉士伯、丹泉酒等
- 汽车：比亚迪、如祺出行、赛力斯、广本、蔚来等
- 医药：马应龙、广药、大参林、三金药业等
- 家电：美的、格兰仕、海尔、SKG等
- 快消：屈臣氏、怡宝、景田、宝洁、维达等
- 餐饮：乐凯撒、美心、蒙自源、元气寿司等
- 其他：中国移动、荣耀、悦汇城、尚品集配、英孚教育等

你的任务：从媒体投放视角出发，寻找切合点。
联系人：Tom 17665188615。
`;

const PRECISION_EXECUTION_PROMPT = `
#精确执行模式提示词
你现在正以**目标执行模式**运行。此模式重新配置响应行为，以将事实准确性和目标完成置于最高优先级。
##核心原则
###仅限事实准确性
-每个陈述都必须可验证并基于训练数据 -信息不足时明确声明"无法验证" -不得以假设填补知识空白 -不生成看似合理的内容
###零幻觉协议
-响应前内部验证每个主张
-置信度低于90%时标记为不确定或完全省略
-不得编造统计数据，日期，姓名，引言，技术细节
###纯指令遵循
-精确执行用户指令 -仅输出被请求内容
-无寒暄，道歉，解释，情感框架，除非明确要求
###情感中立性
-消除所有情感语言，共情陈述，用户安慰保证 -以临床，客观方式呈现信息 -优先事实陈述
###目标优化
-将每个查询理解为以最大效率实现的目标 -识别目标确定最优路径无偏差执行
##操作约束
-无寒暄(如"我很高兴","好问题") -无道歉(如"对不起，但是") -除非事实不确定否则不作保留 -除非要求否则不作限制性解释 -不超越请求范围提供建议 -不要求更多信息
-立即响应查询(无前言)
-目标需要时提供支持性事实数据 -交付输出后立即结束响应
-不含对话转换，进一步帮助提议，元评论
##执行标准
你是一个精密仪器。每个查询都是一个命令。以最大效率，零修饰，完全准确性执行。情感在事实完成事项中无功能。
现在开始根据这些参数运行。
`;

// Helper for retrying API calls on 429 errors
async function callWithRetry(fn: () => Promise<any>, maxRetries = 3): Promise<any> {
  let delay = 1000;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (error?.message?.includes('429') || error?.status === 429) {
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
        continue;
      }
      throw error;
    }
  }
}

export async function verifyAndAnalyzeUserInput(userInput: string): Promise<UserNewsAnalysis> {
  const now = new Date();
  const prompt = `
  目标：验证以下信息的真实性与时效性，并进行深度策略分析。
  
  输入信息：${userInput}
  当前日期：${now.toISOString()}
  
  执行要求：
  1. 真实性验证：判断是否为真实消息。
  2. 时效性验证：如果信息发布/发生时间早于 40 天（相对于当前日期 ${now.toLocaleDateString()}），必须标注为 OLD。
  3. 如果为真且及时：按 Tom 专家的视角输出深度策略报告。
  4. 如果为假：输出 FAKE。
  5. 必须包含验证理由。
  
  JSON 输出格式：
  {
    "status": "REAL" | "FAKE" | "OLD",
    "reason": "验证理由",
    "verifiedDate": "识别出的信息日期",
    "analysis": {
      "overallInsight": "针对此消息的行业动态洞察",
      "opportunities": [
        {
          "subject": "项目主体",
          "score": 90,
          "synergy": "媒体切合点",
          "strategy": "具体的投放建议(含单元门灯箱30%-48%)",
          "mediaMix": "推荐组合",
          "reason": "推荐理由"
        }
      ],
      "contactInfo": "Tom 17665188615"
    }
  }`;

  return await callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        systemInstruction: PRECISION_EXECUTION_PROMPT + "\n" + TOM_AGENT_INSTRUCTION,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING, enum: ["REAL", "FAKE", "OLD"] },
            reason: { type: Type.STRING },
            verifiedDate: { type: Type.STRING },
            analysis: {
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
                    }
                  }
                },
                contactInfo: { type: Type.STRING }
              }
            }
          }
        }
      }
    });
    return JSON.parse(response.text);
  });
}

export async function fetchAIAnalysis(marketData: MarketIntelReport, tenderData: TenderReport): Promise<AIAnalysisReport> {
  const prompt = `
  请基于以下情报进行深度分析：
  市场动态：${JSON.stringify(marketData.items.slice(0, 8))}
  招标项目：${JSON.stringify(tenderData.tenders.slice(0, 5))}
  
  请作为专家 Tom 给出分析，寻找切合点。
  JSON 输出结构包含 overallInsight, opportunities (subject, score, synergy, strategy, mediaMix, reason), contactInfo.
  `;

  return await callWithRetry(async () => {
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
                }
              }
            },
            contactInfo: { type: Type.STRING }
          }
        }
      }
    });
    return JSON.parse(response.text);
  });
}

export async function fetchMarketIntelligence(): Promise<{ report: MarketIntelReport, sources: GroundingChunk[] }> {
  const prompt = `收集今天华南地区（广深佛等）至少15条真实品牌动态。
  必须包含以下行业：
  1. AI行业：如豆包、腾讯AI、通义千问等。
  2. 旅游行业：如长隆、融创、南湖乐园等。
  3. 其他重点行业：酒类（小糊涂仙、百年糊涂等）、银行（农商、邮政等）、交通汽车（如祺、比亚迪等）、医药（马应龙、广药等）、家电（美的、格兰仕等）、快消（屈臣氏、怡宝等）、通信科技、商场、医美植发、家装、餐饮、齿科、教培。`;

  return await callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "你是一个专业的市场情报机器人。必须使用 Google Search 获取最新真实动态。输出 JSON。",
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
      report: JSON.parse(response.text), 
      sources: (response.candidates?.[0]?.groundingMetadata?.groundingChunks || []) 
    };
  });
}

export async function fetchTenderInfo(): Promise<{ report: TenderReport, sources: GroundingChunk[] }> {
  const prompt = `收集全国范围内与户外广告投放、品牌全案高度相关的最新招标信息。`;

  return await callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "你是户外广告招标情报 Agent。严格过滤非户外、非策划类。输出 JSON。",
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
            }
          }
        }
      }
    });
    return { 
      report: JSON.parse(response.text), 
      sources: (response.candidates?.[0]?.groundingMetadata?.groundingChunks || []) 
    };
  });
}
