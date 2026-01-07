'use client';

import { SubscriptionPlans } from '@/components/payment/SubscriptionPlans';
import { HintPacks } from '@/components/payment/HintPacks';

export default function SubscribePage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Upgrade to Premium</h1>
        <p className="text-xl text-muted-foreground">
          Unlock unlimited hints and remove ads
        </p>
      </div>

      <SubscriptionPlans />

      <div className="mt-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Need More Hints?</h2>
          <p className="text-muted-foreground">
            Purchase hint packs without a subscription
          </p>
        </div>
        <HintPacks />
      </div>

      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>🔒 Secure payment processing by Paystack</p>
        <p className="mt-2">💯 Cancel anytime. No questions asked.</p>
      </div>
    </div>
  );
}
