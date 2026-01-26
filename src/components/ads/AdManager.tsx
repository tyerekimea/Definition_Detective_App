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
 */
export default function AdManager({ location, className = '' }: AdManagerProps) {
  // Ad configuration for different locations
  const adConfig = {
    'game-over': {
      slot: '1234567890',
      format: 'auto' as const
    },
    'level-complete': {
      slot: '0987654321',
      format: 'horizontal' as const
    },
    'store': {
      slot: '1122334455',
      format: 'auto' as const
    },
    'sidebar': {
      slot: '5544332211',
      format: 'vertical' as const
    },
    'profile': {
      slot: '6677889900',
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
