// Minimal SSE response parser for fetch-streamed responses.
// Yields parsed { event, data } objects.
//
// Usage:
//   const res = await fetch(url, { method: 'POST', body, headers });
//   for await (const event of readSSE(res)) {
//     if (event.event === 'delta') ...
//   }

export async function* readSSE(response) {
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  if (!response.body) throw new Error('Response has no body');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE events are separated by a blank line (\n\n).
      let sep;
      while ((sep = buffer.indexOf('\n\n')) !== -1) {
        const raw = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);
        const evt = parseEvent(raw);
        if (evt) yield evt;
      }
    }
    // Flush any trailing event.
    const evt = parseEvent(buffer);
    if (evt) yield evt;
  } finally {
    try { reader.releaseLock(); } catch { /* swallow */ }
  }
}

function parseEvent(raw) {
  if (!raw) return null;
  const lines = raw.split('\n');
  let event = 'message';
  let dataLines = [];
  for (const line of lines) {
    if (!line || line.startsWith(':')) continue; // comments / empty
    if (line.startsWith('event:')) event = line.slice(6).trim();
    else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
  }
  if (dataLines.length === 0) return null;
  const data = dataLines.join('\n');
  try {
    return { event, data: JSON.parse(data) };
  } catch {
    return { event, data: { raw: data } };
  }
}
