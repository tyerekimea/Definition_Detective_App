'use client';

import { useEffect } from 'react';

const ADSTERRA_SOCIAL_BAR_SRC =
  'https://pl28782229.profitablecpmratenetwork.com/1c/41/28/1c4128aa095d1c5bc5c19d7522c67c67.js';
const ADSTERRA_SOCIAL_BAR_SCRIPT_ID = 'adsterra-social-bar-script';

export default function AdsterraBannerAd() {
  useEffect(() => {
    const existingScript = document.getElementById(ADSTERRA_SOCIAL_BAR_SCRIPT_ID);
    if (existingScript) return;

    const script = document.createElement('script');
    script.id = ADSTERRA_SOCIAL_BAR_SCRIPT_ID;
    script.src = ADSTERRA_SOCIAL_BAR_SRC;
    script.async = true;
    document.body.appendChild(script);

    return () => {
      const mountedScript = document.getElementById(ADSTERRA_SOCIAL_BAR_SCRIPT_ID);
      if (mountedScript) {
        mountedScript.remove();
      }
    };
  }, []);

  return null;
}
