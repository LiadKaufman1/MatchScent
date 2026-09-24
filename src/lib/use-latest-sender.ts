'use client';

import { useCallback, useRef } from 'react';

// For votes and toggles: the screen is updated at once by the caller, and this sends the visitor's
// LATEST choice for each key to the server, one request at a time per key. So the buttons never
// wait for the server, and five quick clicks become one or two saves (always ending on the last one).
export function useLatestSender() {
  const wanted = useRef(new Map<string, unknown>());
  const busy = useRef(new Set<string>());

  return useCallback(<T,>(key: string, value: T, save: (v: T) => Promise<{ success: boolean }>, onFail?: () => void) => {
    wanted.current.set(key, value);
    if (busy.current.has(key)) return;
    busy.current.add(key);
    (async () => {
      let sent: unknown = Symbol('nothing yet');
      try {
        for (;;) {
          const v = wanted.current.get(key) as T;
          if (Object.is(v, sent)) break;
          sent = v;
          try {
            const result = await save(v);
            if (!result.success) onFail?.();
          } catch {
            onFail?.();
          }
        }
      } finally {
        busy.current.delete(key);
      }
    })();
  }, []);
}
