'use client';

import { useEffect } from 'react';

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
 * Note: Make sure to add AdSense script to layout.tsx first
 */
export default function AdSenseAd({ 
  adSlot, 
  adFormat = 'auto',
  fullWidthResponsive = true,
  className = ''
}: AdSenseAdProps) {
  useEffect(() => {
    try {
      // Push ad to AdSense
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, []);

  return (
    <div className={`adsense-container my-4 ${className}`}>
      <ins
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
