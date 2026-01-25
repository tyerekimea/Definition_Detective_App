'use client';

import Script from 'next/script';

interface MonetagAdProps {
  zoneId?: string;
  type?: 'banner' | 'native' | 'interstitial';
  className?: string;
}

/**
 * Monetag Ad Component
 * 
 * Usage:
 * <MonetagAd /> // Uses default zone ID
 * <MonetagAd zoneId="10514754" /> // Custom zone ID
 * 
 * Your Monetag configuration:
 * Domain: 3nbf4.com
 * Zone ID: 10514754
 */
export default function MonetagAd({ 
  zoneId = '10514754', // Your default zone ID
  type = 'banner',
  className = ''
}: MonetagAdProps) {
  const domain = '3nbf4.com'; // Your Monetag domain

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
            })('${domain}','${zoneId}',document.createElement('script'))
          `
        }}
      />
      <div id={`monetag-zone-${zoneId}`} className="min-h-[100px] flex items-center justify-center" />
    </div>
  );
}
