'use client';

import AdSenseAd from './AdSenseAd';

interface AdManagerProps {
  location: 'game-over' | 'level-complete' | 'store' | 'sidebar' | 'profile';
  className?: string;
}

/**
 * Ad Manager Component
 * 
 * Displays Google AdSense ads at different locations
 * 
 * Usage:
 * <AdManager location="game-over" />
 * 
 * Your AdSense Client ID: ca-pub-2955575113938000
 * 
 * IMPORTANT: Replace placeholder slot IDs with real ones from AdSense dashboard
 * Go to: https://www.google.com/adsense/ → Ads → By ad unit → Create ad units
 */
export default function AdManager({ location, className = '' }: AdManagerProps) {
  // Ad configuration for different locations
  // Real AdSense ad slot IDs from your dashboard
  const adConfig = {
    'game-over': {
      slot: '3043059051', // Game Over Ad
      format: 'auto' as const
    },
    'level-complete': {
      slot: '7657091487', // Level Complete Ad
      format: 'horizontal' as const
    },
    'store': {
      slot: '7657091487', // Pricing/Store Ad
      format: 'auto' as const
    },
    'sidebar': {
      slot: '8058925474', // Sidebar Ad
      format: 'vertical' as const
    },
    'profile': {
      slot: '8058925474', // Profile Ad
      format: 'auto' as const
    }
  };

  const config = adConfig[location];

  return (
    <AdSenseAd 
      adSlot={config.slot}
      adFormat={config.format}
      className={className}
    />
  );
}
