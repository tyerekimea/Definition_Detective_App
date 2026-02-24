'use client';

import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface GoogleAdsenseRewardedAdProps {
  onAdComplete: () => void;
  onAdSkipped?: () => void;
  onAdError?: (error: Error) => void;
}

/**
 * Rewarded ad component using Adsterra smartlink.
 *
 * Flow:
 * 1) User clicks the button to open the ad in a new tab.
 * 2) A short countdown runs in-app.
 * 3) Reward callback is triggered for a free hint.
 */
const ADSTERRA_SMARTLINK_URL =
  'https://www.effectivegatecpm.com/t2j8zvfv?key=0baa3f00e4455ea59b1f7c352917a1e1';
const REWARD_COUNTDOWN_SECONDS = 10;

export default function GoogleAdsenseRewardedAd({
  onAdComplete,
  onAdSkipped,
  onAdError
}: GoogleAdsenseRewardedAdProps) {
  const [isDisplaying, setIsDisplaying] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(REWARD_COUNTDOWN_SECONDS);
  const { toast } = useToast();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startRewardCountdown = () => {
    setIsDisplaying(true);
    setSecondsLeft(REWARD_COUNTDOWN_SECONDS);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setIsDisplaying(false);
          onAdComplete();
          toast({
            title: 'Thank you!',
            description: 'Ad completed. You earned a free hint!',
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const displayAd = () => {
    try {
      const adWindow = window.open(ADSTERRA_SMARTLINK_URL, '_blank', 'noopener,noreferrer');
      if (!adWindow) {
        throw new Error('Popup blocked. Enable popups and try again.');
      }
      startRewardCountdown();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to open ad link');
      setIsDisplaying(false);
      onAdError?.(err);
      toast({
        variant: 'destructive',
        title: 'Ad Error',
        description: err.message || 'Failed to open ad link. Please try again.',
      });
    }
  };

  const skipAd = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsDisplaying(false);
    onAdSkipped?.();
  };

  return (
    <>
      <div
        id="adsterra-rewarded-container"
        className="w-full min-h-[260px] flex items-center justify-center bg-muted rounded-lg mb-4 p-6"
      >
        {isDisplaying ? (
          <div className="text-center space-y-3">
            <p className="text-lg font-semibold">Complete Ad Timer</p>
            <p className="text-sm text-muted-foreground">
              Keep the sponsor tab open briefly, then your hint unlocks automatically.
            </p>
            <p className="text-3xl font-bold">{secondsLeft}s</p>
            <button
              type="button"
              onClick={skipAd}
              className="text-sm underline text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="text-center space-y-3">
            <p className="text-lg font-semibold">Watch Ad for Free Hint</p>
            <p className="text-sm text-muted-foreground">
              Tap below to open our sponsor link and unlock one free hint.
            </p>
            <button
              type="button"
              onClick={displayAd}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Open Ad Link
            </button>
          </div>
        )}
      </div>
    </>
  );
}
