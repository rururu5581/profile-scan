// -----------------------------------------------------------------------------
// 【重要】これが、Googleの最新のSDK（@google/generative-ai）の正しい使い方です。
// -----------------------------------------------------------------------------
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { ResumeAnalysis } from '../types';
import { GEMINI_PROMPT_SYSTEM_INSTRUCTION, GEMINI_MODEL_NAME } from '../constants';

// -----------------------------------------------------------------------------
// Viteの環境変数を正しく読み込みます。
// -----------------------------------------------------------------------------
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// APIキーが存在しない場合は、ここで処理を停止させます。
if (!apiKey) {
  throw new Error("APIキーが設定されていません。Vercelの環境変数に VITE_GEMINI_API_KEY を設定してください。");
}

// -----------------------------------------------------------------------------
// GoogleのAIクライアントを、正しいクラス名で初期化します。
// -----------------------------------------------------------------------------
const genAI = new GoogleGenerativeAI(apiKey);

// 安全設定（不適切なコンテンツをブロックするための設定）
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

const model = genAI.getGenerativeModel({ 
  model: GEMINI_MODEL_NAME,
  safetySettings,
});


// -----------------------------------------------------------------------------
// メインの分析関数です。
// -----------------------------------------------------------------------------
export const analyzeResume = async (resumeText: string): Promise<ResumeAnalysis> => {
  if (!resumeText.trim()) {
    throw new Error("職務経歴書のテキストは空にできません。");
  }

  const fullPrompt = `${GEMINI_PROMPT_SYSTEM_INSTRUCTION}\n\n# 職務経歴書テキスト\n${resumeText}`;

  try {
    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const text = response.text();
    
    let jsonStr = text.trim();
    
    // AIの応答にありがちなMarkdownのコードブロック（```json ... ```）を削除します。
    const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[1]) {
      jsonStr = match[1].trim();
    }

    // JSONとして解析を試みます。
    try {
      const parsedData = JSON.parse(jsonStr) as ResumeAnalysis;
      // ここに、返ってきたデータの簡単な検証を追加しても良いでしょう。
      return parsedData;
    } catch (parseError) {
      console.error("AIからのJSON応答の解析に失敗しました:", parseError, "生の応答テキスト:", jsonStr);
      throw new Error(`AIが有効なJSONとして解析できないデータを返しました。`);
    }

  } catch (error) {
    console.error("Gemini APIの呼び出しエラー:", error);
    if (error instanceof Error) {
         throw new Error(`AIによる職務経歴書の分析に失敗しました: ${error.message}`);
    }
    throw new Error("AIサービスとの通信中に不明なエラーが発生しました。");
  }
};