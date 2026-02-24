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

    container.innerHTML = '';
    window.atOptions = {
      key: ADSTERRA_BANNER_KEY,
      format: 'iframe',
      height: 60,
      width: 468,
      params: {},
    };

    const script = document.createElement('script');
    script.src = ADSTERRA_BANNER_SRC;
    script.async = true;
    container.appendChild(script);

    return () => {
      container.innerHTML = '';
    };
  }, []);

  return (
    <div className="w-full border-t bg-muted/20 py-3">
      <div className="mx-auto flex w-full max-w-[468px] items-center justify-center overflow-x-auto px-4">
        <div id="adsterra-banner-ad-container" style={{ minWidth: 468, minHeight: 60 }} />
      </div>
    </div>
  );
}
