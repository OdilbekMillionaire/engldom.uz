import { GoogleGenAI, Modality } from "@google/genai";
import { ModuleType, VocabEnrichmentResponse } from "../types";

// Helper to safely parse JSON from markdown code blocks if present
const cleanAndParseJSON = (text: string) => {
  try {
    let cleanText = text.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("JSON Parse Error:", e);
    throw new Error("Failed to parse AI response. Please try again.");
  }
};

const SYSTEM_INSTRUCTION = `
You are ENGLDOM, an adaptive language learning engine designed to help users prepare for proficiency exams like IELTS. Your goal is to generate high-quality, exam-standard content.

Core Principles:
1. Strict JSON Output: You must ALWAYS output valid, minified JSON.
2. Exam Standard: Content must strictly adhere to IELTS Academic standards.
`;

// Helper to build the prompt payload based on the Master Spec
const buildPrompt = (task: string, payload: any) => {
  return JSON.stringify({
    Task: task,
    Payload: payload
  }, null, 2);
};

export interface MediaInput {
    mimeType: string;
    data: string; // Base64
}

export const generateLingifyContent = async <T,>(
  module: ModuleType,
  payload: any,
  media?: MediaInput // Generalized for Audio (Speaking) or Image (Writing Task 1)
): Promise<T> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Model Selection Strategy based on Feature Requirements
  let modelName = 'gemini-3-flash-preview'; // Default
  let config: any = {
    systemInstruction: SYSTEM_INSTRUCTION,
    responseMimeType: "application/json", 
  };

  if (module === ModuleType.WRITING) {
      // Use Pro model for deep reasoning in Writing assessment
      modelName = 'gemini-3-pro-preview';
      // Writing requires intense thinking for accurate band scoring
      config = {
          ...config,
          thinkingConfig: { thinkingBudget: 32768 }, 
      };
  } else if (module === ModuleType.READING || module === ModuleType.LISTENING || module === ModuleType.VOCABULARY || module === ModuleType.GRAMMAR) {
      modelName = 'gemini-2.5-flash-lite';
  } else if (module === ModuleType.SPEAKING) {
      if (payload.mode === 'evaluation') {
          modelName = 'gemini-3-flash-preview'; 
      } else {
          modelName = 'gemini-2.5-flash-lite';
      }
  }

  let moduleSpecificInstructions = "";
  let userPromptOverride = ""; // To replace buildPrompt if we need a very specific prompt structure (like Writing)
  
  if (module === ModuleType.READING) {
    const targetWordCount = payload.wordCount || 400;
    const requestedCount = payload.newWordCount || 5;
    const targetNewWords = Math.min(10, Math.max(1, requestedCount));
    const qType = payload.questionType || 'mcq';
    const style = payload.style || 'IELTS Academic';
    let optionsSchema = '["A", "B", "C", "D"]';
    if (qType === 'tfng') optionsSchema = '["True", "False", "Not Given"]';
    if (qType === 'gap_fill') optionsSchema = 'null';
    if (qType === 'matching') optionsSchema = '["Heading I", "Heading II", "Heading III", ...]';

    moduleSpecificInstructions = `
    Output Schema (JSON):
    {
      "title": string,
      "article": string (plain text, approx ${targetWordCount} words, style: "${style}". CRITICAL: Do NOT use markdown bolding (**word**) or italics (*word*) or headers (#). The text must be CLEAN plain text. We will highlight words programmatically.),
      "estimatedMinutes": integer,
      "newWords": [ 
        { 
            "word": string, 
            "pos": string, 
            "meaning": string, 
            "example": string,
            "synonyms": [string],
            "wordFormation": string (e.g. "Verb: ameliorate, Noun: amelioration")
        } 
      ] (Generate EXACTLY ${targetNewWords} new vocabulary words. Do not generate more than ${targetNewWords}.),
      "questions": [
        {
          "id": string (unique),
          "type": "${qType}",
          "prompt": string,
          "options": ${optionsSchema},
          "answer": string,
          "explanation": string
        }
      ] (exactly 5 items)
    }`;
  } else if (module === ModuleType.WRITING) {
      // Special Prompt Construction for "WRITIFY" logic
      const writingPrompt = `Assess the user's writing strictly according to the IELTS Band Descriptors (TR, CC, LR, GRA) for a '${payload.taskType}' task.
      User Prompt/Topic: "${payload.prompt}"
      User Writing: "${payload.essay}"
      Standard: "${payload.standard}"
      
      Requirements:
      1. Score strictly (0-9 Band).
      2. Provide specific examples from the user's text.
      3. Identify at least 3-5 specific spelling/grammar errors.
      4. Create practice tasks for the specific error types found.
      `;
      
      userPromptOverride = writingPrompt;

      moduleSpecificInstructions = `
      Output Schema (JSON):
      {
        "band_score": "string (e.g. '6.5')",
        "cefr_level": "string",
        "spelling_standard": "string",
        "overall_feedback": "string",
        "detailed_analysis": {
            "task_response": { "score": number, "strengths": [string], "weaknesses": [string] },
            "coherence_cohesion": { "score": number, "strengths": [string], "weaknesses": [string] },
            "lexical_resource": { "score": number, "strengths": [string], "weaknesses": [string] },
            "grammatical_range_accuracy": { "score": number, "strengths": [string], "weaknesses": [string] }
        },
        "mistakes_and_corrections": [
            { "original": "string", "correction": "string", "type": "string", "rule": "string" }
        ],
        "grammar_review_tasks": [
            { "error_type": "string", "rule_explanation": "string", "example_sentence": "string", "practice_task": "string", "practice_answer": "string" }
        ]
      }`;

  } else if (module === ModuleType.LISTENING) {
    const style = payload.style || 'University Lecture';
    const requestedCount = payload.newWordCount || 6;
    const targetNewWords = Math.min(10, Math.max(1, requestedCount));

    moduleSpecificInstructions = `
    Output Schema (JSON):
    {
      "title": string,
      "level": "A1"..."C2",
      "audio_script": string (min 150 chars, style: "${style}", strictly plain text, no markdown.),
      "estimatedMinutes": integer,
      "newWords": [ { "word": string, "pos": string, "meaning": string, "example": string, "synonyms": [string] } ] (exactly ${targetNewWords} words.),
      "questions": [
        {
          "id": string,
          "type": "mcq" | "gap_fill",
          "prompt": string,
          "options": ["A", "B", "C", "D"],
          "answer": string,
          "explanation": string
        }
      ] (exactly 5 items)
    }`;
  } else if (module === ModuleType.SPEAKING) {
    moduleSpecificInstructions = `
    Output Schema (JSON):
    // CASE 1: Lesson (Generation)
    {
      "type": "lesson",
      "prompts": [ { "level": "easy"|"medium"|"hard", "text": string } ] (exactly 3),
      "modelAnswers": { "short": string, "long": string },
      "rubricTemplate": { "fluency": number, "grammar": number },
      "feedbackTemplate": string
    }
    // CASE 2: Evaluation (Feedback)
    {
      "type": "evaluation",
      "scores": { "fluency": 0-9, "grammar": 0-9, "vocab": 0-9, "coherence": 0-9, "pronunciation": 0-9 },
      "feedbackPoints": [string] (5 items),
      "correctedVersion": string,
      "pronunciationFeedback": { "strengths": [string], "improvements": [string] },
      "mistakes": [ { "word": string, "error": string, "correction": string } ] (Identify up to 5 mispronounced words or phrases),
      "drills": [ { "id": string, "focus": string, "instruction": string, "practice": string } ] (5 items)
    }`;
  } else if (module === ModuleType.VOCABULARY) {
    if (payload.task === 'create_quiz') {
        moduleSpecificInstructions = `
        Output Schema (JSON):
        { "questions": [ { "id": string, "type": "mcq", "prompt": string, "options": ["A", "B", "C", "D"], "answer": string, "explanation": string } ] }
        `;
    } else {
        const types = payload.types ? payload.types.join(", ") : "Formal Academic Words";
        const inclusions = payload.inclusions ? payload.inclusions.join(", ") : "";
        const count = payload.count || 10;
        
        moduleSpecificInstructions = `
        Task: Generate a vocabulary list for topic "${payload.topic}" at CEFR Level ${payload.level}.
        Constraints: Include ${types}. ${inclusions}. Quantity: ${count}.
        Output Schema (JSON):
        {
            "topic": string,
            "words": [
                {
                    "word": string, "pos": string, "meaning": string, "example": string,
                    "etymology": string (optional), "synonyms": [string] (optional), "collocations": [string] (optional), "wordFormation": string (optional)
                }
            ]
        }`;
    }
  } else if (module === ModuleType.GRAMMAR) {
      moduleSpecificInstructions = `
      Task: Create a grammar lesson and exercises for: "${payload.topic}" at Level ${payload.level}.
      Output Schema (JSON):
      {
        "topic": string,
        "level": string,
        "lessonContent": {
            "coreRule": "string (1-2 sentence summary of the rule)",
            "detailedExplanation": "string (Detailed breakdown of when/why to use this rule, highlighting nuances. Max 3 paragraphs.)",
            "examples": [ { "context": "string", "text": "string" } ] (3 varied examples),
            "commonMistakes": [ { "error": "string (incorrect sentence)", "correction": "string (correct sentence)", "explanation": "string (why it is wrong)" } ] (2-3 items),
            "structureVariations": [ { "context": "string (e.g. Formal, Informal, Emphatic)", "text": "string", "note": "string" } ] (2 items)
        },
        "exercises": [
            {
                "id": string,
                "type": "fix_error" | "gap_fill" | "mcq",
                "question": string,
                "options": ["A", "B", "C", "D"] (only for mcq, else null),
                "answer": string,
                "explanation": string,
                "hint": "string (a subtle clue without giving the answer)"
            }
        ] (Generate exactly 5 exercises. Mix types if possible, focusing on 'fix_error' for advanced levels)
      }`;
  }

  const promptText = `
    ${userPromptOverride || buildPrompt(module, payload)}
    
    IMPORTANT: Ensure the output matches this schema exactly:
    ${moduleSpecificInstructions}
  `;

  try {
    const requestParts: any[] = [{ text: promptText }];
    
    // Add media if present (Audio or Image)
    if (media) {
      requestParts.push({
        inlineData: {
          mimeType: media.mimeType,
          data: media.data
        }
      });
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts: requestParts },
      config: config
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const parsedData = cleanAndParseJSON(text);

    // FAIL-SAFE: Programmatically strip markdown chars
    if ((module === ModuleType.READING || module === ModuleType.LISTENING)) {
        if ((parsedData as any).article) (parsedData as any).article = (parsedData as any).article.replace(/[*#]/g, '');
        if ((parsedData as any).audio_script) (parsedData as any).audio_script = (parsedData as any).audio_script.replace(/[*#]/g, '');
    }
    
    return parsedData as T;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const chatWithTutor = async (context: string, userMessage: string, history: any[] = []) => {
    if (!process.env.API_KEY) {
        throw new Error("API Key is missing.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const systemPrompt = `You are an expert IELTS tutor. The user is asking questions about their recent exercise result. 
    Context provided: ${context}.
    Answer concisely, encouragingly, and strictly related to language learning.`;

    const chat = ai.chats.create({
        model: 'gemini-3-pro-preview', // Smartest model for chat
        config: { systemInstruction: systemPrompt }
    });
    
    const result = await chat.sendMessage({ message: userMessage });
    return result.text;
};

// Vocabulary Enrichment Task
export const enrichWord = async (word: string): Promise<VocabEnrichmentResponse> => {
    if (!process.env.API_KEY) throw new Error("API Key is missing.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
    Provide detailed information for the word: "${word}".
    Output JSON Schema:
    {
        "etymology": "string (origin and history)",
        "detailedDefinition": "string (comprehensive definition)",
        "synonyms": ["string", "string", "string"] (max 5)
    }
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite', // Fast model
        contents: { parts: [{ text: prompt }] },
        config: { responseMimeType: "application/json" }
    });

    return cleanAndParseJSON(response.text as string);
};

// TTS Generation
export const generateSpeech = async (text: string, voiceName: string = 'Aoede'): Promise<string> => {
    if (!process.env.API_KEY) throw new Error("API Key is missing.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: { parts: [{ text: text }] },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: voiceName },
                },
            },
        },
    });

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioData) throw new Error("Failed to generate speech");
    
    return audioData;
};