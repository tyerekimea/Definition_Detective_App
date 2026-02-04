'use client';

import { useEffect, useRef } from 'react';

interface AdSenseAdProps {
  adSlot: string;
  adFormat?: 'auto' | 'rectangle' | 'vertical' | 'horizontal';
  fullWidthResponsive?: boolean;
  className?: string;
}

/**
 * Google AdSense Ad Component
 *
 * Usage:
 * <AdSenseAd adSlot="1234567890" />
 *
 * Note: Ensure AdSense script is added in layout.tsx
 */
export default function AdSenseAd({
  adSlot,
  adFormat = 'auto',
  fullWidthResponsive = true,
  className = '',
}: AdSenseAdProps) {
  const adRef = useRef<HTMLModElement | null>(null);
  const pushedRef = useRef(false);
  const lastKeyRef = useRef<string | null>(null);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const currentKey = `${adSlot}-${adFormat}-${fullWidthResponsive ? '1' : '0'}`;
        if (lastKeyRef.current !== currentKey) {
          lastKeyRef.current = currentKey;
          pushedRef.current = false;
        }

        const adEl = adRef.current;
        if (!adEl) {
          return;
        }

        const status = adEl.getAttribute('data-adsbygoogle-status');
        const adStatus = adEl.getAttribute('data-ad-status');
        const hasIframe = adEl.querySelector('iframe') !== null;

        if (pushedRef.current || status === 'done' || adStatus === 'filled' || hasIframe) {
          pushedRef.current = true;
          return;
        }

        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushedRef.current = true;
      }
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, [adSlot, adFormat, fullWidthResponsive]);

  return (
    <div className={`adsense-container my-4 ${className}`}>
      <ins
        ref={adRef}
        key={`${adSlot}-${adFormat}-${fullWidthResponsive ? '1' : '0'}`}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-2955575113938000"
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive.toString()}
      />
    </div>
  );
}
