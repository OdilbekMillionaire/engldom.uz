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

// Read the learner's native language from settings so explanations can be localised.
const getLearnerNativeLanguage = (): string => {
  try {
    const raw = localStorage.getItem('engldom_settings');
    if (!raw) return 'English';
    const s = JSON.parse(raw);
    return s.nativeLanguage || 'English';
  } catch {
    return 'English';
  }
};

const buildSystemInstruction = (): string => {
  const lang = getLearnerNativeLanguage();
  const langNote = lang !== 'English'
    ? `\n3. Localised Explanations: Write ALL explanatory text, hints, feedback descriptions, error explanations, and educational commentary in ${lang}. Exercise questions, answer options, article/passage text, and vocabulary examples MUST remain in English. Only the instructional and explanatory prose should be in ${lang}.`
    : '';
  return `You are ENGLDOM, an adaptive language learning engine designed to help users prepare for proficiency exams like IELTS. Your goal is to generate high-quality, exam-standard content.\n\nCore Principles:\n1. Strict JSON Output: You must ALWAYS output valid, minified JSON.\n2. Exam Standard: Content must strictly adhere to IELTS Academic standards.${langNote}`;
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
    systemInstruction: buildSystemInstruction(),
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
            "meaning": string (clear, learner-friendly definition),
            "example": string (a natural sentence from or inspired by the article),
            "synonyms": [string] (2-4 real synonyms),
            "antonyms": [string] (1-3 genuine opposite words, empty array if none),
            "collocations": [string] (2-4 REAL high-frequency multi-word phrases native speakers use. Each MUST be a complete phrase containing the word itself, e.g. for "vital": ["play a vital role", "of vital importance", "vital to national security"]. NEVER use single-word labels or generic descriptors.),
            "register": string (one of: "formal", "informal", "academic", "technical", "neutral"),
            "wordFormation": string (e.g. "Verb: ameliorate → Noun: amelioration → Adj: ameliorative → Adv: amelioratively"),
            "grammarNote": string (practical grammar usage tip, e.g. "Always followed by a preposition 'of': a surplus of goods. Uncountable — never use 'a/an'.")
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
      // Determine correct Task Achievement vs Task Response label
      const isTask2 = payload.taskType.includes('Task 2') || payload.taskType.includes('CEFR');
      const taLabel = isTask2 ? 'Task Achievement' : 'Task Response';

      const writingPrompt = `You are a senior IELTS examiner. Assess the following writing sample using the OFFICIAL IELTS Public Band Descriptors exactly as Cambridge Assessment English publishes them.

TASK TYPE: ${payload.taskType}
SPELLING STANDARD: ${payload.standard}
TASK PROMPT: "${payload.prompt}"
CANDIDATE WRITING:
"""
${payload.essay}
"""

SCORING RULES — apply ALL of these without exception:
1. Score each of the 4 criteria separately on the 0–9 band scale (half-bands allowed: 5.5, 6.5, 7.5 etc.).
2. Overall band_score = arithmetic mean of the 4 criterion scores, rounded to nearest 0.5.
3. For EACH criterion, cite the EXACT official band descriptor text for the band you awarded (e.g. "Band 6 ${taLabel}: addresses the task but the format may be inappropriate in places…"). Do NOT paraphrase — use the real descriptor language.
4. For EACH criterion, write examiner_notes (2–3 sentences) quoting or paraphrasing specific words/sentences from the candidate's essay as evidence.
5. Provide 2–3 distinct strengths AND 2–3 distinct weaknesses per criterion — not generic platitudes.
6. Identify at least 4 specific errors (spelling, grammar, punctuation, word choice) from the text.
7. Create 3–4 targeted grammar practice drills addressing the error types found.
`;

      userPromptOverride = writingPrompt;

      moduleSpecificInstructions = `
      Output Schema (JSON) — every field is REQUIRED:
      {
        "band_score": "string (overall band to nearest 0.5, e.g. '6.5')",
        "cefr_level": "string (e.g. 'B2')",
        "spelling_standard": "string",
        "overall_feedback": "string (3–4 sentence examiner summary referencing the essay specifically)",
        "detailed_analysis": {
            "task_response": {
                "criterion_label": "${taLabel}",
                "score": number (0–9, half-bands allowed),
                "band_descriptor": "string (EXACT official IELTS band descriptor text for the awarded band)",
                "examiner_notes": "string (2–3 sentences quoting specific evidence from the essay)",
                "strengths": ["string", "string", "string"] (2–3 specific strengths),
                "weaknesses": ["string", "string", "string"] (2–3 specific weaknesses)
            },
            "coherence_cohesion": {
                "criterion_label": "Coherence & Cohesion",
                "score": number,
                "band_descriptor": "string (EXACT official descriptor)",
                "examiner_notes": "string (specific evidence from essay)",
                "strengths": ["string", "string"],
                "weaknesses": ["string", "string"]
            },
            "lexical_resource": {
                "criterion_label": "Lexical Resource",
                "score": number,
                "band_descriptor": "string (EXACT official descriptor)",
                "examiner_notes": "string (specific evidence from essay)",
                "strengths": ["string", "string"],
                "weaknesses": ["string", "string"]
            },
            "grammatical_range_accuracy": {
                "criterion_label": "Grammatical Range & Accuracy",
                "score": number,
                "band_descriptor": "string (EXACT official descriptor)",
                "examiner_notes": "string (specific evidence from essay)",
                "strengths": ["string", "string"],
                "weaknesses": ["string", "string"]
            }
        },
        "mistakes_and_corrections": [
            { "original": "string (exact text from essay)", "correction": "string", "type": "string (e.g. Subject-Verb Agreement)", "rule": "string (brief rule explanation)" }
        ] (minimum 4 items),
        "grammar_review_tasks": [
            { "error_type": "string", "rule_explanation": "string", "example_sentence": "string", "practice_task": "string", "practice_answer": "string" }
        ] (3–4 items targeting the errors found)
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
      "newWords": [
        {
          "word": string,
          "pos": string,
          "meaning": string,
          "example": string,
          "synonyms": [string] (2-3 synonyms),
          "antonyms": [string] (1-2 antonyms, empty if none),
          "collocations": [string] (2-3 REAL multi-word phrases containing the word, e.g. "reach a consensus", "strong consensus among experts". NEVER use single-word labels.),
          "register": string (one of: "formal","informal","academic","technical","neutral"),
          "wordFormation": string (all word forms, e.g. "Noun: consensus → Verb: — → Adj: consensual")
        }
      ] (exactly ${targetNewWords} words.),
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
                    "word": string,
                    "pos": string,
                    "meaning": string (clear, learner-friendly definition — NOT a dictionary copy-paste; explain it naturally),
                    "example": string (a vivid, topic-relevant sentence that shows the word in real context),
                    "etymology": string (word origin and history, e.g. "From Latin 'ameliorare', to improve, from 'melior', better"),
                    "synonyms": [string] (2-4 real synonyms),
                    "antonyms": [string] (1-3 genuine opposite words, empty array if none apply),
                    "collocations": [string] (3-5 REAL high-frequency collocations. CRITICAL RULES: (1) Each MUST be a complete multi-word phrase that native English speakers actually say, e.g. for "impact": ["have a significant impact on", "make a lasting impact", "assess the impact of", "minimize the negative impact"]. (2) Each phrase MUST contain the target word itself. (3) NEVER use single adjectives, single nouns, or descriptive labels as collocations. (4) Prefer verb+word or word+noun patterns common in academic/IELTS writing.),
                    "register": string (one of: "formal", "informal", "academic", "technical", "neutral" — the typical usage context),
                    "grammarNote": string (a practical, specific grammar tip about how this word behaves, e.g. "Followed by 'to' + infinitive: 'tend to do'. Cannot be used in passive voice." or "Takes 'of': 'a dearth of evidence'. Uncountable."),
                    "wordFormation": string (all main word family forms, e.g. "Verb: innovate → Noun: innovation / innovator → Adj: innovative → Adv: innovatively")
                }
            ]
        }`;
    }
  } else if (module === ModuleType.GRAMMAR) {
      moduleSpecificInstructions = `
      Task: Create a grammar lesson and exercises for: "${payload.topic}" at Level ${payload.level}.
      
      Exercise Types Strategy:
      1. Use 'reorder' for sentence structure practice (scramble a full sentence).
      2. Use 'gap_fill' with options for picking the right conjugation/word.
      3. Use 'fix_error' for advanced correction.
      
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
                "type": "fix_error" | "gap_fill" | "mcq" | "reorder",
                "question": string (For 'reorder', provide instruction like 'Arrange the words correctly'),
                "scrambled": [string] (Only for 'reorder'. Array of words in RANDOM order),
                "options": ["A", "B", "C", "D"] (Use for 'mcq' OR 'gap_fill' as dropdown choices),
                "answer": string (The correct full answer),
                "explanation": string,
                "hint": "string (a subtle clue without giving the answer)"
            }
        ] (Generate exactly 5 exercises. Mix types: include at least 1 'reorder' and 1 'gap_fill')
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
    
    const lang = getLearnerNativeLanguage();
    const langNote = lang !== 'English' ? ` Respond in ${lang} so the learner understands easily, but keep all English examples in English.` : '';
    const systemPrompt = `You are an expert IELTS tutor. The user is asking questions about their recent exercise result.
    Context provided: ${context}.
    Answer concisely, encouragingly, and strictly related to language learning.${langNote}`;

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
    Provide comprehensive linguistic information for the English word: "${word}".
    Output JSON Schema:
    {
        "etymology": "string (word origin and history, e.g. 'From Latin ameliorare, to improve, from melior, better. First recorded in English circa 1728.')",
        "detailedDefinition": "string (clear, comprehensive academic definition — explain what it means, when it is used, and any important nuances)",
        "synonyms": ["string"] (3-5 real synonyms that can substitute in similar contexts),
        "antonyms": ["string"] (1-3 genuine opposite words; omit if none apply — use empty array),
        "collocations": ["string"] (4-6 REAL high-frequency collocations. RULES: (1) Each MUST be a complete multi-word phrase native speakers actually say, e.g. for "consensus": ["reach a consensus", "build consensus among", "broad consensus on", "consensus-based approach", "emerge as a consensus"]. (2) Each phrase MUST contain the target word "${word}" itself. (3) NEVER use single adjectives or nouns alone as collocations.),
        "register": "string (one of: formal, informal, academic, technical, neutral)",
        "grammarNote": "string (a specific, practical grammar usage note, e.g. 'Usually used with the preposition of: a lack of evidence. Uncountable noun — never pluralized.' or 'Verb + to-infinitive: tend to do something. Cannot be used in the continuous form.')"
    }
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
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