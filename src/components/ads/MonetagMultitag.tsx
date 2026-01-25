'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

interface MonetagMultitagProps {
  zoneId?: string;
  className?: string;
  minHeight?: string;
  containerId?: string;
}

/**
 * Monetag Multitag Ad Component
 * 
 * Supports multiple ad formats in a single zone:
 * - Banner ads
 * - Native ads
 * - Interstitial ads
 * - Pop-under ads
 * 
 * Usage:
 * <MonetagMultitag /> // Uses default zone ID
 * <MonetagMultitag zoneId="10517577" /> // Custom zone ID
 * 
 * Your Monetag configuration:
 * Domain: 5gvci.com
 * Zone ID: 10517577
 */
export default function MonetagMultitag({
  zoneId = '10517577',
  className = '',
  minHeight = 'min-h-[300px]',
  containerId = `monetag-multitag-${Date.now()}`
}: MonetagMultitagProps) {
  const domain = '5gvci.com';
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // Trigger ad refresh when component mounts
    if (scriptLoaded && window) {
      const refreshScript = document.createElement('script');
      refreshScript.innerHTML = `
        (function(d,z,s){
          s.src='https://${domain}/400/${zoneId}';
          try{(document.body||document.documentElement).appendChild(s)}catch(e){}
        })('${domain}','${zoneId}',document.createElement('script'))
      `;
      document.body.appendChild(refreshScript);
    }
  }, [scriptLoaded, zoneId, domain]);

  return (
    <div className={`monetag-multitag-container my-6 w-full ${className}`}>
      {/* Main ad container */}
      <div
        id={containerId}
        className={`monetag-multitag-zone ${minHeight} flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden`}
        data-zone-id={zoneId}
      />

      {/* Service Worker script - loads once for all multitag zones */}
      <Script
        id="monetag-multitag-service-worker"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.register('/sw.js')
                .then(reg => {
                  console.log('Monetag Multitag SW registered');
                  setScriptLoaded(true);
                })
                .catch(err => console.log('Monetag Multitag SW registration failed:', err));
            }
          `
        }}
      />

      {/* Ad loading script */}
      <Script
        id={`monetag-multitag-${zoneId}`}
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
        dangerouslySetInnerHTML={{
          __html: `
            (function(d,z,s){
              s.src='https://${domain}/400/${zoneId}';
              try{(document.body||document.documentElement).appendChild(s)}catch(e){}
            })('${domain}','${zoneId}',document.createElement('script'))
          `
        }}
      />
    </div>
  );
}
