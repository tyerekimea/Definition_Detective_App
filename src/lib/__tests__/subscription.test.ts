import {
  calculateSubscriptionEndDate,
  hasActiveSubscription,
  hasPremiumAccess,
  inferSubscriptionPlan,
  normalizeSubscriptionPlan,
  resolveSubscriptionEndDate,
} from '../subscription';

describe('subscription helpers', () => {
  describe('normalizeSubscriptionPlan', () => {
    it('normalizes plan and interval aliases', () => {
      expect(normalizeSubscriptionPlan('monthly')).toBe('monthly');
      expect(normalizeSubscriptionPlan('month')).toBe('monthly');
      expect(normalizeSubscriptionPlan('yearly')).toBe('yearly');
      expect(normalizeSubscriptionPlan('annual')).toBe('yearly');
      expect(normalizeSubscriptionPlan('annually')).toBe('yearly');
      expect(normalizeSubscriptionPlan('invalid')).toBeNull();
    });

    it('infers plan from amount when plan metadata is missing', () => {
      expect(inferSubscriptionPlan(undefined, 2000)).toBe('monthly');
      expect(inferSubscriptionPlan(undefined, 20000)).toBe('yearly');
    });
  });

  describe('calendar period calculation', () => {
    it('clamps monthly expiry to the next calendar month', () => {
      const start = new Date('2026-01-31T10:15:00.000Z');
      const end = calculateSubscriptionEndDate(start, 'monthly');
      expect(end.toISOString()).toBe('2026-02-28T10:15:00.000Z');
    });

    it('clamps yearly expiry for leap-day subscriptions', () => {
      const start = new Date('2024-02-29T08:00:00.000Z');
      const end = calculateSubscriptionEndDate(start, 'yearly');
      expect(end.toISOString()).toBe('2025-02-28T08:00:00.000Z');
    });
  });

  describe('hasActiveSubscription', () => {
    it('uses explicit end date when available', () => {
      const profile = {
        subscriptionStatus: 'active',
        subscriptionPlan: 'monthly',
        subscriptionEndDate: '2026-05-01T00:00:00.000Z',
      };

      expect(hasActiveSubscription(profile, new Date('2026-04-30T23:59:59.000Z'))).toBe(true);
      expect(hasActiveSubscription(profile, new Date('2026-05-01T00:00:00.000Z'))).toBe(false);
    });

    it('derives end date from start date and plan when end date is missing', () => {
      const profile = {
        subscriptionStatus: 'active',
        subscriptionPlan: 'monthly',
        subscriptionStartDate: '2026-01-31T10:00:00.000Z',
      };

      expect(resolveSubscriptionEndDate(profile)?.toISOString()).toBe('2026-02-28T10:00:00.000Z');
      expect(hasActiveSubscription(profile, new Date('2026-02-27T12:00:00.000Z'))).toBe(true);
      expect(hasActiveSubscription(profile, new Date('2026-03-01T00:00:00.000Z'))).toBe(false);
    });

    it('supports legacy records by inferring from reference timestamp and amount', () => {
      const start = new Date('2026-01-15T00:00:00.000Z').getTime();
      const profile = {
        isPremium: true,
        subscriptionStatus: 'active',
        subscriptionReference: `DD_${start}_999999`,
        subscriptionAmount: 2000,
      };

      expect(hasActiveSubscription(profile, new Date('2026-02-10T00:00:00.000Z'))).toBe(true);
      expect(hasActiveSubscription(profile, new Date('2026-02-16T00:00:00.000Z'))).toBe(false);
    });

    it('rejects non-active statuses even with future end dates', () => {
      const profile = {
        subscriptionStatus: 'past_due',
        subscriptionPlan: 'yearly',
        subscriptionEndDate: '2026-12-31T00:00:00.000Z',
      };

      expect(hasActiveSubscription(profile, new Date('2026-01-01T00:00:00.000Z'))).toBe(false);
    });
  });

  describe('hasPremiumAccess', () => {
    it('returns false for expired subscriptions even when isPremium is still true', () => {
      const profile = {
        isPremium: true,
        subscriptionStatus: 'active',
        subscriptionPlan: 'monthly',
        subscriptionEndDate: '2026-02-01T00:00:00.000Z',
      };

      expect(hasPremiumAccess(profile, new Date('2026-03-01T00:00:00.000Z'))).toBe(false);
    });

    it('keeps admin-granted premium access', () => {
      const profile = {
        isPremium: true,
        subscriptionStatus: 'active',
        subscriptionReference: 'ADMIN_GRANT_123',
      };

      expect(hasPremiumAccess(profile)).toBe(true);
    });
  });
});
