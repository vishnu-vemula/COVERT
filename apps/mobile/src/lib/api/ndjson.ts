import { ProcessEventSchema, type ProcessEvent } from '@covert/shared';

/**
 * Incrementally parses newline-delimited JSON from a growing response body.
 * Feed it the full text received so far; it returns only new, complete events.
 * Unknown or malformed lines are skipped rather than trusted.
 */
export function createEventReader() {
  let consumed = 0;
  return (text: string, final = false): ProcessEvent[] => {
    const events: ProcessEvent[] = [];
    let newline = text.indexOf('\n', consumed);
    while (newline !== -1 || (final && consumed < text.length)) {
      const end = newline === -1 ? text.length : newline;
      const line = text.slice(consumed, end).trim();
      consumed = end + 1;
      if (line) {
        try {
          const parsed = ProcessEventSchema.safeParse(JSON.parse(line));
          if (parsed.success) events.push(parsed.data);
        } catch {
          // Ignore partial or corrupt lines.
        }
      }
      newline = text.indexOf('\n', consumed);
    }
    return events;
  };
}
