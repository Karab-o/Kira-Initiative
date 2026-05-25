import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger.js';

const MODEL_CHAT = 'claude-sonnet-4-6';
const MODEL_VISION = 'claude-sonnet-4-6';
const MODEL_CLASSIFIER = 'claude-haiku-4-5-20251001';

let client = null;
function getClient() {
  if (!client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

// ─────────────────────────────────────────
// SYSTEM PROMPTS
// ─────────────────────────────────────────

const SYSTEM_CHAT = `You are Kira, a private men's health companion built for men in Rwanda.
Your mission: provide clear, judgment-free health guidance and direct
men to appropriate care when needed.

TONE & STYLE:
- Warm, calm, and direct. Like a knowledgeable trusted friend.
- Never clinical or cold. Never preachy or alarming.
- Respond in the same language as the user: English or Kinyarwanda.
- Keep responses under 150 words. One clear idea at a time.
- Start with "Many men experience this..." when normalising is helpful.
- End every response with ONE gentle suggested next step only.

HEALTH TOPICS YOU COVER:
Sexual health (ED, STIs, fertility, sexual pain — clinical language only),
prostate and urinary health, hypertension and heart health, HIV and AIDS,
diabetes and nutrition, mental health and stress, malaria and fever,
eye and skin conditions, general men's wellness.

CONTENT POLICY — ABSOLUTE:
- If a user sends sexually explicit, crude, or offensive content respond:
  "Kira is a health tool. Let's keep it respectful so I can help you."
- Never use slang or graphic language. Sexual health = medical terms only.
- Never diagnose. Always say "a doctor can confirm this."
- Reference Rwanda local context: local facilities, local disease patterns.

SEVERITY — ASSESS AFTER EVERY USER MESSAGE:
GREEN  → Home care is appropriate. Give practical advice.
AMBER  → Professional attention needed. Suggest doctor consultation.
RED    → Urgent. Open response with: "This needs prompt attention."

RED triggers: chest pain, difficulty breathing, blood in urine or stool,
fainting, suicidal ideation, severe pain, high fever with confusion,
sudden vision loss.

AMBER triggers: symptoms lasting more than 2 weeks, multiple unrelated
symptoms, cancer concern, HIV exposure, unexplained weight loss,
continued uncertainty after 3+ exchanges, any symptom the user
says is getting worse.`;

const SYSTEM_CLASSIFIER = `You are a silent medical classifier. Analyse the conversation and return
ONLY a valid JSON object. No explanation. No preamble. No markdown.

Return exactly:
{
  "topic": "sexual-health" | "prostate-urology" | "heart-hypertension" |
            "hiv-stis" | "diabetes-nutrition" | "mental-health" |
            "skin-eye" | "malaria-fever" | "general",
  "severity": "green" | "amber" | "red",
  "isSexualHealth": true | false,
  "triggerDoctor": true | false,
  "careBadgeText": "Handle at home" | "Consider seeing a doctor" |
                   "See a doctor today" | "This needs urgent attention",
  "policyViolation": true | false,
  "violationReason": null | "explicit_language" | "inappropriate_image_request"
}

triggerDoctor must be true when severity is amber or red.
isSexualHealth must be true for any topic related to genitalia,
sexual function, STIs, or reproductive organs.`;

const SYSTEM_VISION = `You are a medical image analysis assistant for Kira Initiative.
You may ONLY analyse images showing: face, neck, eyes, or mouth.

If the image shows anything else — including genitals, torso, limbs,
or any private body part — respond ONLY with:
{ "approved": false, "reason": "Image outside permitted scan areas" }

For approved images, respond with:
{
  "approved": true,
  "bodyArea": "face" | "neck" | "eyes" | "mouth",
  "observations": "Plain-language description of visible findings",
  "possibleCauses": "2-3 possible causes in plain language",
  "severity": "green" | "amber" | "red",
  "careBadgeText": "Handle at home" | "Consider seeing a doctor" |
                   "See a doctor today" | "This needs urgent attention",
  "recommendation": "Single clear next step"
}

NEVER diagnose. Use language like "may suggest", "could indicate".
Keep observations factual and calm. No alarming language.
Return ONLY the JSON object. No markdown fences.`;

const SYSTEM_SUMMARY = `You are generating an anonymous clinical handoff summary for a doctor.
Based on the conversation history provided, write a brief structured summary.
Do NOT include any identifying information. Do NOT mention the patient's name.

Return exactly:
{
  "chiefConcern": "One sentence",
  "duration": "Reported duration",
  "keySymptoms": ["symptom 1", "symptom 2"],
  "selfReported": "What the patient says they have tried",
  "severityAtEscalation": "green" | "amber" | "red",
  "aiNote": "One clinical observation or suggested area of investigation",
  "language": "en" | "rw"
}

Return ONLY the JSON object. No markdown fences. No preamble.`;

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────

function parseJsonResponse(text) {
  // Strip code fences if Claude added them anyway.
  let s = text.trim();
  if (s.startsWith('```')) {
    s = s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  }
  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first === -1 || last === -1) throw new Error('No JSON object in response');
  return JSON.parse(s.slice(first, last + 1));
}

function asAnthropicMessages(history) {
  return (history || []).map((m) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: String(m.content || ''),
  }));
}

// ─────────────────────────────────────────
// CALL 1 — CHAT
// ─────────────────────────────────────────

function buildChatRequest({ message, history = [], language = 'en' }) {
  const messages = [
    ...asAnthropicMessages(history),
    { role: 'user', content: String(message || '') },
  ];
  return {
    model: MODEL_CHAT,
    max_tokens: 600,
    system: [
      { type: 'text', text: SYSTEM_CHAT, cache_control: { type: 'ephemeral' } },
      { type: 'text', text: `Reply in: ${language === 'rw' ? 'Kinyarwanda' : 'English'}.` },
    ],
    messages,
  };
}

export async function chatReply({ message, history = [], language = 'en' }) {
  const c = getClient();
  const response = await c.messages.create(buildChatRequest({ message, history, language }));
  const text = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();
  return { text, usage: response.usage };
}

// Streaming variant — returns the Anthropic stream object, which is iterable
// and yields incremental events. Callers iterate with `for await (...)` and
// pluck out `content_block_delta` events whose delta.type === 'text_delta'.
export function chatReplyStream({ message, history = [], language = 'en' }) {
  const c = getClient();
  return c.messages.stream(buildChatRequest({ message, history, language }));
}

// ─────────────────────────────────────────
// CALL 2 — SILENT CLASSIFIER
// ─────────────────────────────────────────

export async function classifyConversation({ history = [] }) {
  const c = getClient();
  const transcript = (history || [])
    .map((m) => `${m.role === 'assistant' ? 'Kira' : 'User'}: ${m.content}`)
    .join('\n');

  const response = await c.messages.create({
    model: MODEL_CLASSIFIER,
    max_tokens: 300,
    system: SYSTEM_CLASSIFIER,
    messages: [{ role: 'user', content: `Conversation transcript:\n\n${transcript}\n\nReturn the JSON classification.` }],
  });

  const text = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('').trim();

  try {
    const parsed = parseJsonResponse(text);
    // Sanity-correct: triggerDoctor must follow severity.
    if (parsed.severity === 'amber' || parsed.severity === 'red') {
      parsed.triggerDoctor = true;
    }
    return parsed;
  } catch (err) {
    logger.warn('classifier returned non-JSON, defaulting to safe values', text);
    return {
      topic: 'general',
      severity: 'green',
      isSexualHealth: false,
      triggerDoctor: false,
      careBadgeText: 'Handle at home',
      policyViolation: false,
      violationReason: null,
    };
  }
}

// ─────────────────────────────────────────
// CALL 3 — VISION SCAN
// ─────────────────────────────────────────

export async function analyseScanImage({ imageBase64, mediaType = 'image/jpeg', chatContext = '' }) {
  const c = getClient();

  const response = await c.messages.create({
    model: MODEL_VISION,
    max_tokens: 600,
    system: SYSTEM_VISION,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data: imageBase64 },
        },
        {
          type: 'text',
          text: chatContext
            ? `Context from earlier chat: ${chatContext}\n\nAnalyse the image and return the JSON.`
            : 'Analyse the image and return the JSON.',
        },
      ],
    }],
  });

  const text = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('').trim();

  try {
    return parseJsonResponse(text);
  } catch (err) {
    logger.warn('vision returned non-JSON, returning rejection', text);
    return { approved: false, reason: 'Could not analyse image safely' };
  }
}

// ─────────────────────────────────────────
// CALL 4 — SYMPTOM SUMMARY (handoff to doctor)
// ─────────────────────────────────────────

export async function summariseForDoctor({ history = [], language = 'en' }) {
  const c = getClient();
  const transcript = (history || [])
    .map((m) => `${m.role === 'assistant' ? 'Kira' : 'User'}: ${m.content}`)
    .join('\n');

  const response = await c.messages.create({
    model: MODEL_CHAT,
    max_tokens: 500,
    system: SYSTEM_SUMMARY,
    messages: [{
      role: 'user',
      content: `Patient language: ${language}\n\nConversation:\n${transcript}\n\nReturn the JSON summary.`,
    }],
  });

  const text = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('').trim();

  try {
    return parseJsonResponse(text);
  } catch (err) {
    logger.warn('summary returned non-JSON, providing minimal default', text);
    return {
      chiefConcern: 'Patient requested consultation',
      duration: 'Not specified',
      keySymptoms: [],
      selfReported: 'Not specified',
      severityAtEscalation: 'amber',
      aiNote: 'Patient escalated through Kira AI; full clinical history needed.',
      language,
    };
  }
}
