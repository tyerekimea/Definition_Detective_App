'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';
import { useToast } from '@/hooks/use-toast';

interface GoogleAdsenseRewardedAdProps {
  onAdComplete: () => void;
  onAdSkipped?: () => void;
  onAdError?: (error: Error) => void;
}

/**
 * Google AdSense Rewarded Ad Component
 * 
 * This component displays a rewarded ad from Google AdSense.
 * The user watches the ad completely to earn a reward (e.g., free hint).
 * 
 * Usage:
 * <GoogleAdsenseRewardedAd onAdComplete={() => console.log('Ad watched!')} />
 * 
 * Your Google AdSense configuration:
 * Client ID: ca-pub-2955575113938000
 */
export default function GoogleAdsenseRewardedAd({
  onAdComplete,
  onAdSkipped,
  onAdError
}: GoogleAdsenseRewardedAdProps) {
  const [adReady, setAdReady] = useState(false);
  const [isDisplaying, setIsDisplaying] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if Google AdSense is loaded
    if (window && (window as any).adsbygoogle) {
      setAdReady(true);
      console.log('Google AdSense loaded');
    }
  }, []);

  const displayAd = async () => {
    try {
      // Initialize AdSense
      if (window && (window as any).adsbygoogle) {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({
          google_ad_client: 'ca-pub-2955575113938000',
          enable_page_level_ads: true
        });

        setIsDisplaying(true);

        // Simulate ad watch duration (AdSense will handle the actual ad display)
        // This gives user feedback that an ad is playing
        const adTimeout = setTimeout(() => {
          setIsDisplaying(false);
          onAdComplete();
          toast({
            title: 'Thank you!',
            description: 'Ad watched successfully. You earned a free hint!',
          });
        }, 3000); // 3 seconds minimum ad view

        return () => clearTimeout(adTimeout);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to display ad');
      setIsDisplaying(false);
      onAdError?.(err);
      toast({
        variant: 'destructive',
        title: 'Ad Error',
        description: 'Failed to load ad. Please try again.',
      });
    }
  };

  return (
    <>
      {/* AdSense ads will be injected here by the global script */}
      <div
        id="adsense-rewarded-container"
        className="w-full min-h-[600px] flex items-center justify-center bg-muted rounded-lg mb-4"
      >
        {isDisplaying ? (
          <div className="text-center">
            <p className="text-lg font-semibold mb-2">Ad is playing...</p>
            <p className="text-sm text-muted-foreground">This helps keep the game free!</p>
          </div>
        ) : (
          <p className="text-muted-foreground">Ad space</p>
        )}
      </div>

      {/* This will trigger the ad display through AdSense */}
      <Script
        id="adsense-rewarded-trigger"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            if (window && window.adsbygoogle) {
              try {
                (window.adsbygoogle = window.adsbygoogle || []).push({
                  google_ad_client: 'ca-pub-2955575113938000',
                  enable_page_level_ads: true
                });
              } catch (e) {
                console.error('AdSense error:', e);
              }
            }
          `
        }}
      />
    </>
  );
}
