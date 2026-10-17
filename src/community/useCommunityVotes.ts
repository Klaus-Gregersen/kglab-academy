import { useCallback, useEffect, useRef, useState } from 'react';
import { parseVotes, type VoteSnapshot } from './voting';

const endpoint = '/api/community/votes';

export function useCommunityVotes() {
  const [votes, setVotes] = useState<VoteSnapshot | null>(null);
  const [available, setAvailable] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const serial = useRef(0);
  const busy = useRef(false);
  const controller = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    if (busy.current) return;
    const current = ++serial.current;
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    setLoading(true);
    try {
      const response = await fetch(endpoint, {
        credentials: 'same-origin',
        cache: 'no-store',
        signal: request.signal,
      });
      if (!response.ok) throw new Error('Unavailable');
      const next = parseVotes(await response.json());
      if (current !== serial.current) return;
      setVotes(next);
      setAvailable(true);
      setError('');
    } catch {
      if (current !== serial.current || request.signal.aborted) return;
      setAvailable(false);
      setError('Community votes couldn’t be loaded. You can still explore and save resources.');
    } finally {
      if (current === serial.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const visible = () => {
      if (!document.hidden) void refresh();
    };
    const timer = window.setInterval(visible, 30000);
    window.addEventListener('focus', visible);
    document.addEventListener('visibilitychange', visible);
    return () => {
      ++serial.current;
      controller.current?.abort();
      clearInterval(timer);
      window.removeEventListener('focus', visible);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [refresh]);

  async function toggleVote(id: string, title: string) {
    if (!available || !votes || busy.current) return;
    busy.current = true;
    ++serial.current;
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    setPending(id);
    setLoading(false);
    setError('');
    const voted = !votes[id].voted;
    try {
      const response = await fetch(`${endpoint}/${encodeURIComponent(id)}`, {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'X-KGLAB-Vote': '1' },
        body: JSON.stringify({ voted }),
        signal: request.signal,
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(
          typeof body.error === 'string' ? body.error : 'Your vote couldn’t be saved. Try again.',
        );
      setVotes(parseVotes(body));
      setNotice(`${voted ? 'Upvoted' : 'Removed your upvote for'} ${title}.`);
    } catch (cause) {
      if (!request.signal.aborted)
        setError(
          cause instanceof Error && !(cause instanceof TypeError)
            ? cause.message
            : 'Your vote couldn’t be confirmed. Refresh votes before trying again.',
        );
      // A lost response may have reached the server. Refresh before another toggle.
      setAvailable(false);
    } finally {
      busy.current = false;
      if (!request.signal.aborted) setPending(null);
    }
  }

  return { votes, available, error, loading, pending, notice, refresh, toggleVote };
}
