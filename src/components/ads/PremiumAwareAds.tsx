'use client';

import Script from 'next/script';
import { doc } from 'firebase/firestore';
import AdsterraBannerAd from '@/components/ads/AdsterraBannerAd';
import { useAuth } from '@/hooks/use-auth';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import type { UserProfile } from '@/lib/firebase-types';
import { hasPremiumAccess } from '@/lib/subscription';

const ADSENSE_AUTO_ADS_SRC =
  'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2955575113938000';

export default function PremiumAwareAds() {
  const { user, loading: authLoading } = useAuth();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(
    () => (user ? doc(firestore, 'userProfiles', user.uid) : null),
    [firestore, user]
  );
  const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);

  const isPremium = hasPremiumAccess(userProfile);

  // Avoid showing ads to premium users while auth/profile state is still loading.
  if (authLoading || (user && profileLoading)) {
    return null;
  }

  if (isPremium) {
    return null;
  }

  return (
    <>
      <Script async src={ADSENSE_AUTO_ADS_SRC} crossOrigin="anonymous" strategy="afterInteractive" />
      <AdsterraBannerAd />
    </>
  );
}
