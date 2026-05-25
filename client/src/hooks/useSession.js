import { useCallback } from 'react';
import { api, apiError } from '../lib/api.js';
import { readSSE } from '../lib/sse.js';
import { useSessionStore } from '../stores/sessionStore.js';

export function useSession() {
  const store = useSessionStore();

  const create = useCallback(async (language = 'en') => {
    const { data } = await api.post('/sessions', { language });
    store.startSession(data.session);
    return data.session;
  }, [store]);

  const end = useCallback(async () => {
    const token = store.sessionToken;
    if (token) {
      try { await api.delete(`/sessions/${token}`); } catch {}
    }
    store.endSession();
  }, [store]);

  // Streaming chat. Returns a promise that resolves to the classifier meta when the stream completes.
  const sendChat = useCallback(async (message) => {
    if (!store.sessionToken) throw new Error('No active session');

    store.addMessage({ id: `local-${Date.now()}`, role: 'user', content: message });
    store.setTyping(true);

    let assistantId = null;
    let meta = null;

    try {
      const baseURL = api.defaults.baseURL || '/api';
      const response = await fetch(`${baseURL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({ sessionToken: store.sessionToken, message }),
      });

      if (!response.ok) {
        // Server returned a JSON error before any streaming (e.g. 401, 429).
        const errBody = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        throw new Error(errBody.error || `HTTP ${response.status}`);
      }

      for await (const event of readSSE(response)) {
        if (event.event === 'delta') {
          if (!assistantId) {
            assistantId = `ai-${Date.now()}`;
            store.addMessage({
              id: assistantId,
              role: 'assistant',
              content: event.data.text || '',
              streaming: true,
            });
            store.setTyping(false);
          } else {
            store.appendToMessage(assistantId, event.data.text || '');
          }
        } else if (event.event === 'meta') {
          meta = event.data;
          if (assistantId) {
            store.updateMessage(assistantId, {
              careBadge: event.data.careBadge,
              streaming: false,
            });
          }
          store.applyClassifier({
            topic: event.data.topic,
            severity: event.data.severity,
            isSexualHealth: event.data.isSexualHealth,
            scanLocked: event.data.scanLocked,
          });
        } else if (event.event === 'refusal') {
          assistantId = `ai-${Date.now()}`;
          store.addMessage({
            id: assistantId,
            role: 'assistant',
            content: event.data.text,
            careBadge: event.data.careBadge || 'green',
          });
          store.setTyping(false);
          meta = {
            ...event.data,
            careBadge: event.data.careBadge || 'green',
            triggerDoctor: false,
            violation: true,
          };
        } else if (event.event === 'error') {
          throw new Error(event.data.message || 'AI stream error');
        } else if (event.event === 'done') {
          break;
        }
      }

      return meta;
    } catch (err) {
      if (assistantId) {
        store.updateMessage(assistantId, { streaming: false });
      } else {
        store.addMessage({
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: apiError(err),
          careBadge: 'green',
          isError: true,
        });
      }
      throw err;
    } finally {
      store.setTyping(false);
    }
  }, [store]);

  return {
    ...store,
    create,
    end,
    sendChat,
  };
}
