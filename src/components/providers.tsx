
"use client";

import type { FC, ReactNode } from "react";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/hooks/use-auth';
import { SoundProvider } from "@/hooks/use-sound";
import { ThemeProvider } from "@/hooks/use-theme";
import { FirebaseClientProvider } from "@/firebase/client-provider";

interface ProvidersProps {
  children: ReactNode;
}

const Providers: FC<ProvidersProps> = ({ children }) => {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // In development, disable service worker and clear old caches so stale
    // offline bundles do not mask server-side code/logging changes.
    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) =>
          Promise.all(registrations.map((registration) => registration.unregister()))
        )
        .catch((err) => console.warn('Service worker unregister failed:', err));

      if ('caches' in window) {
        caches
          .keys()
          .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
          .catch((err) => console.warn('Cache cleanup failed:', err));
      }

      return;
    }

    // register service worker (best-effort)
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => console.warn('Service worker registration failed:', err));
    });
  }, []);
  return (
    <FirebaseClientProvider>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <AuthProvider>
          <SoundProvider>
            {children}
            <Toaster />
          </SoundProvider>
        </AuthProvider>
      </ThemeProvider>
    </FirebaseClientProvider>
  );
};

export default Providers;
