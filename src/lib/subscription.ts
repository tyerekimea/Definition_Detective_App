export type SubscriptionPlan = 'monthly' | 'yearly';

type SubscriptionLike = {
  isPremium?: boolean | null;
  subscriptionStatus?: string | null;
  subscriptionPlan?: string | null;
  subscriptionAmount?: number | string | null;
  subscriptionReference?: string | null;
  subscriptionStartDate?: unknown;
  subscriptionEndDate?: unknown;
};

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'expiring']);

export function parseDateLike(value: unknown): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (typeof value === 'object' && value && 'toDate' in value) {
    const maybeTimestamp = value as { toDate?: () => Date };
    if (typeof maybeTimestamp.toDate === 'function') {
      const parsed = maybeTimestamp.toDate();
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
  }

  return null;
}

export function normalizeSubscriptionPlan(value: unknown): SubscriptionPlan | null {
  if (typeof value !== 'string') return null;

  const normalized = value.trim().toLowerCase();
  if (normalized === 'monthly' || normalized === 'month') {
    return 'monthly';
  }
  if (
    normalized === 'yearly' ||
    normalized === 'year' ||
    normalized === 'annual' ||
    normalized === 'annually'
  ) {
    return 'yearly';
  }

  return null;
}

function parseAmount(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function inferSubscriptionPlanFromAmount(value: unknown): SubscriptionPlan | null {
  const amount = parseAmount(value);
  if (amount == null) return null;

  return amount >= 10000 ? 'yearly' : 'monthly';
}

export function inferSubscriptionPlan(
  planOrInterval: unknown,
  amount?: unknown
): SubscriptionPlan | null {
  return normalizeSubscriptionPlan(planOrInterval) ?? inferSubscriptionPlanFromAmount(amount);
}

function parseStartDateFromReference(reference: unknown): Date | null {
  if (typeof reference !== 'string') return null;

  const match = reference.match(/^[A-Z]+_(\d{10,17})(?:_|$)/i);
  if (!match) return null;

  const timestamp = Number(match[1]);
  if (!Number.isFinite(timestamp) || timestamp <= 0) return null;

  const parsed = new Date(timestamp);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function addCalendarMonthsUtc(baseDate: Date, months: number): Date {
  const year = baseDate.getUTCFullYear();
  const month = baseDate.getUTCMonth() + months;
  const day = baseDate.getUTCDate();
  const hours = baseDate.getUTCHours();
  const minutes = baseDate.getUTCMinutes();
  const seconds = baseDate.getUTCSeconds();
  const milliseconds = baseDate.getUTCMilliseconds();

  const lastDayOfTargetMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const clampedDay = Math.min(day, lastDayOfTargetMonth);

  return new Date(Date.UTC(year, month, clampedDay, hours, minutes, seconds, milliseconds));
}

function addCalendarYearsUtc(baseDate: Date, years: number): Date {
  const year = baseDate.getUTCFullYear() + years;
  const month = baseDate.getUTCMonth();
  const day = baseDate.getUTCDate();
  const hours = baseDate.getUTCHours();
  const minutes = baseDate.getUTCMinutes();
  const seconds = baseDate.getUTCSeconds();
  const milliseconds = baseDate.getUTCMilliseconds();

  const lastDayOfTargetMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const clampedDay = Math.min(day, lastDayOfTargetMonth);

  return new Date(Date.UTC(year, month, clampedDay, hours, minutes, seconds, milliseconds));
}

export function calculateSubscriptionEndDate(
  startDate: Date,
  plan: SubscriptionPlan
): Date {
  return plan === 'monthly'
    ? addCalendarMonthsUtc(startDate, 1)
    : addCalendarYearsUtc(startDate, 1);
}

export function resolveSubscriptionEndDate(profile?: SubscriptionLike | null): Date | null {
  if (!profile) return null;

  const explicitEndDate = parseDateLike(profile.subscriptionEndDate);
  if (explicitEndDate) {
    return explicitEndDate;
  }

  const startDate =
    parseDateLike(profile.subscriptionStartDate) ??
    parseStartDateFromReference(profile.subscriptionReference);
  const plan = inferSubscriptionPlan(profile.subscriptionPlan, profile.subscriptionAmount);

  if (!startDate || !plan) {
    return null;
  }

  return calculateSubscriptionEndDate(startDate, plan);
}

export function hasActiveSubscription(profile?: SubscriptionLike | null, now: Date = new Date()): boolean {
  if (!profile) return false;

  const hasSubscriptionData =
    profile.subscriptionStatus != null ||
    profile.subscriptionPlan != null ||
    profile.subscriptionAmount != null ||
    profile.subscriptionStartDate != null ||
    profile.subscriptionEndDate != null ||
    profile.subscriptionReference != null;

  if (!hasSubscriptionData) {
    return false;
  }

  const normalizedStatus =
    typeof profile.subscriptionStatus === 'string'
      ? profile.subscriptionStatus.trim().toLowerCase()
      : null;

  if (normalizedStatus && !ACTIVE_SUBSCRIPTION_STATUSES.has(normalizedStatus)) {
    return false;
  }

  const endDate = resolveSubscriptionEndDate(profile);
  if (!endDate) {
    return false;
  }

  return endDate.getTime() > now.getTime();
}

export function hasPremiumAccess(profile?: SubscriptionLike | null, now: Date = new Date()): boolean {
  if (!profile) return false;

  if (hasActiveSubscription(profile, now)) {
    return true;
  }

  const hasAdminGrantReference =
    typeof profile.subscriptionReference === 'string' &&
    profile.subscriptionReference.startsWith('ADMIN_GRANT_');

  const hasNoSubscriptionData =
    profile.subscriptionStatus == null &&
    profile.subscriptionPlan == null &&
    profile.subscriptionAmount == null &&
    profile.subscriptionStartDate == null &&
    profile.subscriptionEndDate == null &&
    profile.subscriptionReference == null;

  return Boolean(profile.isPremium) && (hasAdminGrantReference || hasNoSubscriptionData);
}
