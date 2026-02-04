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
 * IMPORTANT: Replace placeholder slot IDs with real ones from AdSense dashboard
 */
export default function AdManager({ location, className = '' }: AdManagerProps) {
  const adConfig: Record<AdManagerProps['location'], { slot: string; format: 'auto' | 'horizontal' | 'vertical' | 'rectangle' }> = {
    'game-over': {
      slot: '3043059051', // Replace with real Game Over Ad slot ID
      format: 'auto',
    },
    'level-complete': {
      slot: '7657091487', // Replace with real Level Complete Ad slot ID
      format: 'horizontal',
    },
    'store': {
      slot: '8058925474', // Replace with real Store Ad slot ID
      format: 'auto',
    },
    'sidebar': {
      slot: '9876543210', // Replace with real Sidebar Ad slot ID
      format: 'vertical',
    },
    'profile': {
      slot: '1122334455', // Replace with real Profile Ad slot ID
      format: 'rectangle',
    },
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
