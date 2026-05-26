'use client';

import { useState, useEffect } from 'react';

const LG = 1024;

export function useBreakpoint() {
  // Start false on both server and client — avoids SSR/hydration mismatch.
  // useEffect sets the real value after hydration.
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= LG);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return {
    isDesktop,
    isMobile: !isDesktop,
  };
}
