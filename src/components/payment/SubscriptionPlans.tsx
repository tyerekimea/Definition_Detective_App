'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Crown, Zap } from 'lucide-react';
import { PaystackButton } from './PaystackButton';
import { useAuth } from '@/hooks/use-auth';

const plans = [
  {
    id: 'monthly',
    name: 'Premium Monthly',
    price: 2000, // NGN 2,000
    interval: 'month',
    features: [
      'Unlimited hints',
      'Ad-free experience',
      'Exclusive word packs',
      'Advanced statistics',
      'Custom badges',
    ],
    icon: Zap,
  },
  {
    id: 'yearly',
    name: 'Premium Yearly',
    price: 20000, // NGN 20,000
    interval: 'year',
    discount: 'Save 17%',
    features: [
      'Everything in Monthly',
      '17% discount',
      'Priority support',
      'Early access to features',
      'VIP badge',
    ],
    icon: Crown,
    popular: true,
  },
];

export function SubscriptionPlans() {
  const { user } = useAuth();

  return (
    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
      {plans.map((plan) => {
        const Icon = plan.icon;
        return (
          <Card
            key={plan.id}
            className={plan.popular ? 'border-primary border-2 relative' : ''}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium flex items-center">
                  <Crown className="h-4 w-4 mr-1" />
                  Best Value
                </span>
              </div>
            )}
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <CardTitle>{plan.name}</CardTitle>
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <CardDescription>
                {plan.discount || `Billed ${plan.interval}ly`}
              </CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">
                  ₦{plan.price.toLocaleString()}
                </span>
                <span className="text-muted-foreground">/{plan.interval}</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <PaystackButton
                amount={plan.price}
                email={user?.email || ''}
                type="subscription"
                metadata={{
                  plan: plan.id,
                  interval: plan.interval,
                }}
                className="w-full"
              >
                Subscribe Now
              </PaystackButton>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
