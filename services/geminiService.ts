
import { GoogleGenAI, Type } from "@google/genai";
import { ExtractionResult } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async extractAssetsFromHtml(html: string): Promise<ExtractionResult> {
    const cleanHtml = html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<path[^>]*>[\s\S]*?<\/path>/gi, '')
      .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '');

    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `你是一个专业的电商素材抓取专家。请从 HTML 源码中提取商品视觉素材。

关键任务：获取【无水印、最高清】的原图链接。
1. **去水印技巧**：
   - 淘宝/天猫/1688 的图片链接常包含类似 '_400x400.jpg'、'_Q75.jpg'、'.webp' 或 '_!!.jpg' 的后缀。这些后缀通常带有水印或被压缩。
   - **必须操作**：移除 URL 末尾所有以 '_' 开头的参数部分，还原为最原始的 .jpg 或 .png 结尾。
   - 示例：将 '//img.alicdn.com/imgextra/i1/220/O1CN01_400x400.jpg_Q75.jpg' 转化为 'https://img.alicdn.com/imgextra/i1/220/O1CN01.jpg'。
2. **提取范围**：
   - 主图：通常在 gallery, image-view 区域。
   - 详情图：检查 <script> 里的 JSON 数据（如 window.__INITIAL_DATA__），那里通常有高清图数组。
   - 视频：寻找 mp4 结尾的链接。

HTML 源码片段：
${cleanHtml.substring(0, 50000)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            mainImages: { type: Type.ARRAY, items: { type: Type.STRING } },
            detailImages: { type: Type.ARRAY, items: { type: Type.STRING } },
            videos: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["title", "mainImages", "detailImages", "videos"]
        },
      },
    });

    try {
      const result = JSON.parse(response.text.trim()) as ExtractionResult;
      
      const sanitize = (urls: string[]) => 
        [...new Set(urls)]
          .map(url => {
            let clean = url.startsWith('//') ? `https:${url}` : url;
            // 深度清理后缀：移除所有以 _ 开头的混淆/尺寸/水印后缀
            // 例如 .jpg_400x400.jpg -> .jpg
            clean = clean.split('.jpg_')[0].split('.png_')[0].split('.jpeg_')[0];
            if (clean.includes('.jpg')) clean = clean.split('.jpg')[0] + '.jpg';
            if (clean.includes('.png')) clean = clean.split('.png')[0] + '.png';
            return clean;
          })
          .filter(url => url.startsWith('http') && !url.includes('logo') && !url.includes('icon'));

      return {
        title: result.title || "未命名商品",
        mainImages: sanitize(result.mainImages),
        detailImages: sanitize(result.detailImages),
        videos: sanitize(result.videos)
      };
    } catch (e) {
      console.error("Gemini Parse Error:", e);
      throw new Error("AI 解析失败。请尝试仅复制商品主图或详情区域的 HTML 代码。");
    }
  }
}

export const geminiService = new GeminiService();
