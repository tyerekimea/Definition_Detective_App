'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    atOptions?: {
      key: string;
      format: 'iframe';
      height: number;
      width: number;
      params: Record<string, string>;
    };
  }
}

const ADSTERRA_BANNER_KEY = 'a11b4fd46462b1eb8ba03d78e8e103ba';
const ADSTERRA_BANNER_SRC = `https://www.highperformanceformat.com/${ADSTERRA_BANNER_KEY}/invoke.js`;

export default function AdsterraBannerAd() {
  useEffect(() => {
    const container = document.getElementById('adsterra-banner-ad-container');
    if (!container) return;

    const isMobile = window.matchMedia('(max-width: 640px)').matches;
    const adWidth = isMobile ? 320 : 468;
    const adHeight = isMobile ? 50 : 60;

    container.innerHTML = '';
    window.atOptions = {
      key: ADSTERRA_BANNER_KEY,
      format: 'iframe',
      height: adHeight,
      width: adWidth,
      params: {},
    };
    container.style.minWidth = `${adWidth}px`;
    container.style.minHeight = `${adHeight}px`;

    const script = document.createElement('script');
    script.src = ADSTERRA_BANNER_SRC;
    script.async = true;
    container.appendChild(script);

    return () => {
      container.innerHTML = '';
    };
  }, []);

  return (
    <div className="w-full shrink-0 border-t bg-muted/20 py-2 sm:py-3">
      <div className="mx-auto flex w-full items-center justify-center px-2 sm:px-4">
        <div id="adsterra-banner-ad-container" />
      </div>
    </div>
  );
}
