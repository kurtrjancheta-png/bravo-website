'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// This component auto-refreshes all server data every 30 seconds
// by calling router.refresh(), which re-runs server components without a full page reload.
export default function AutoRefresh({ intervalMs = 30000 }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      router.refresh();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [router, intervalMs]);

  return null; // Renders nothing, just runs the effect
}
