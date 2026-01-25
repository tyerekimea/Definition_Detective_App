'use client';

import { useState, useEffect } from 'react';
import AdSenseAd from './AdSenseAd';
import MonetagAd from './MonetagAd';

interface AdManagerProps {
  location: 'game-over' | 'level-complete' | 'store' | 'sidebar' | 'profile';
  className?: string;
}

/**
 * Ad Manager Component
 * 
 * Automatically switches between AdSense and Monetag based on availability
 * 
 * Usage:
 * <AdManager location="game-over" />
 */
export default function AdManager({ location, className = '' }: AdManagerProps) {
  const [adNetwork, setAdNetwork] = useState<'adsense' | 'monetag'>('adsense');

  // Ad configuration for different locations
  const adConfig = {
    'game-over': {
      adsense: { slot: '1234567890', format: 'auto' as const },
      monetag: { zoneId: '7654321' }
    },
    'level-complete': {
      adsense: { slot: '0987654321', format: 'horizontal' as const },
      monetag: { zoneId: '1234567' }
    },
    'store': {
      adsense: { slot: '1122334455', format: 'auto' as const },
      monetag: { zoneId: '5544332' }
    },
    'sidebar': {
      adsense: { slot: '5544332211', format: 'vertical' as const },
      monetag: { zoneId: '1122334' }
    },
    'profile': {
      adsense: { slot: '6677889900', format: 'auto' as const },
      monetag: { zoneId: '9988776' }
    }
  };

  const config = adConfig[location];

  // Check if AdSense is available
  useEffect(() => {
    const checkAdSense = () => {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        setAdNetwork('adsense');
      } else {
        // Fallback to Monetag if AdSense not loaded
        setAdNetwork('monetag');
      }
    };

    // Check after a short delay to allow AdSense script to load
    const timer = setTimeout(checkAdSense, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Render based on selected network
  if (adNetwork === 'adsense' && process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID) {
    return (
      <AdSenseAd 
        adSlot={config.adsense.slot}
        adFormat={config.adsense.format}
        className={className}
      />
    );
  }

  // Fallback to Monetag
  if (process.env.NEXT_PUBLIC_MONETAG_ENABLED === 'true') {
    return (
      <MonetagAd 
        zoneId={config.monetag.zoneId}
        className={className}
      />
    );
  }

  // No ads configured
  return null;
}
