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
  // TODO: Replace these placeholder slot IDs with real ones from your AdSense dashboard
  const adConfig = {
    'game-over': {
      slot: '1234567890', // REPLACE WITH REAL SLOT ID
      format: 'auto' as const
    },
    'level-complete': {
      slot: '0987654321', // REPLACE WITH REAL SLOT ID
      format: 'horizontal' as const
    },
    'store': {
      slot: '1122334455', // REPLACE WITH REAL SLOT ID
      format: 'auto' as const
    },
    'sidebar': {
      slot: '5544332211', // REPLACE WITH REAL SLOT ID
      format: 'vertical' as const
    },
    'profile': {
      slot: '6677889900', // REPLACE WITH REAL SLOT ID
      format: 'auto' as const
    }
  };

  const config = adConfig[location];

  // Temporarily disable ads until real slot IDs are added
  // This prevents 400 errors from placeholder IDs
  const isPlaceholder = config.slot.match(/^[0-9]{10}$/);
  
  if (isPlaceholder) {
    // Show placeholder message instead of broken ad
    return (
      <div className={`ad-placeholder my-4 p-4 border-2 border-dashed border-muted rounded-lg text-center ${className}`}>
        <p className="text-sm text-muted-foreground">
          Ad space - Create ad units in AdSense dashboard
        </p>
      </div>
    );
  }

  return (
    <AdSenseAd 
      adSlot={config.slot}
      adFormat={config.format}
      className={className}
    />
  );
}
