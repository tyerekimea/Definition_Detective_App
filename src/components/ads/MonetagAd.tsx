'use client';

import Script from 'next/script';

interface MonetagAdProps {
  zoneId: string;
  type?: 'banner' | 'native' | 'interstitial';
  className?: string;
}

/**
 * Monetag Ad Component
 * 
 * Usage:
 * <MonetagAd zoneId="YOUR_ZONE_ID" />
 * 
 * Get your zone ID from Monetag dashboard
 */
export default function MonetagAd({ 
  zoneId, 
  type = 'banner',
  className = ''
}: MonetagAdProps) {
  return (
    <div className={`monetag-ad-container my-4 ${className}`}>
      <Script
        id={`monetag-${zoneId}`}
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(d,z,s){
              s.src='https://'+d+'/400/'+z;
              try{(document.body||document.documentElement).appendChild(s)}catch(e){}
            })('${process.env.NEXT_PUBLIC_MONETAG_DOMAIN || 'alwingulla.com'}','${zoneId}',document.createElement('script'))
          `
        }}
      />
      <div id={`monetag-zone-${zoneId}`} className="min-h-[100px] flex items-center justify-center" />
    </div>
  );
}
