import { create } from 'zustand';

// IMPORTANT: anonymous session state lives in memory only.
// No localStorage, no sessionStorage, no cookies. Closing the tab ends the session.

export const useSessionStore = create((set, get) => ({
  sessionId: null,
  sessionToken: null,
  messages: [],
  currentTopic: null,
  isSexualHealth: true, // always true — Kira is a sexual health platform
  severityLevel: 'green',
  language: 'en',
  isTyping: false,
  consultationId: null,
  escalation: null,
  patientIdentity: null,
  hasOnboarded: false,

  startSession: (session) => set({
    sessionId: session.id,
    sessionToken: session.sessionToken,
    language: session.language || 'en',
    severityLevel: session.severityLevel || 'green',
    isSexualHealth: true,
    messages: [],
    escalation: null,
    consultationId: null,
  }),

  endSession: () => set({
    sessionId: null,
    sessionToken: null,
    messages: [],
    currentTopic: null,
    isSexualHealth: true,
    severityLevel: 'green',
    consultationId: null,
    escalation: null,
    patientIdentity: null,
  }),

  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setMessages: (messages) => set({ messages }),
  setTyping: (isTyping) => set({ isTyping }),

  // Streaming helpers — used by useSession when consuming the SSE response.
  appendToMessage: (id, text) => set((s) => ({
    messages: s.messages.map((m) => m.id === id ? { ...m, content: (m.content || '') + text } : m),
  })),
  updateMessage: (id, patch) => set((s) => ({
    messages: s.messages.map((m) => m.id === id ? { ...m, ...patch } : m),
  })),

  applyClassifier: (c) => set((s) => ({
    currentTopic: c.topic ?? s.currentTopic,
    severityLevel: c.severity ?? s.severityLevel,
    isSexualHealth: true, // always true on this platform
  })),

  setEscalation: (escalation) => set({ escalation }),
  setConsultation: (consultationId) => set({ consultationId }),
  setPatientIdentity: (id) => set({ patientIdentity: id }),
  setLanguage: (language) => set({ language }),
  setOnboarded: () => set({ hasOnboarded: true }),
}));
