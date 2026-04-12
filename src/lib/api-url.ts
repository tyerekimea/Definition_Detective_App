const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const isNativeRuntime = (): boolean => {
  if (typeof window === 'undefined') return false;
  const maybeCapacitor = (window as typeof window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  try {
    return Boolean(maybeCapacitor?.isNativePlatform?.());
  } catch {
    return false;
  }
};

export function getApiBaseUrl(): string {
  const configuredBase =
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    '';

  if (typeof window !== 'undefined') {
    const origin = window.location?.origin;
    const native = isNativeRuntime();

    // Web should always use same-origin API routes to avoid CORS/preflight issues.
    if (!native && origin) {
      return trimTrailingSlash(origin);
    }

    // Native app/webview can use an explicit backend URL when configured.
    if (configuredBase) {
      return trimTrailingSlash(configuredBase);
    }

    if (origin) {
      return trimTrailingSlash(origin);
    }
  }

  return configuredBase ? trimTrailingSlash(configuredBase) : '';
}

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const base = getApiBaseUrl();
  return base ? `${base}${normalizedPath}` : normalizedPath;
}
