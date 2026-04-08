'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useToast } from '@/hooks/use-toast';
import { buildApiUrl } from '@/lib/api-url';

interface PaystackButtonProps {
  amount: number; // in NGN
  email: string;
  type: 'subscription' | 'hint_pack';
  metadata?: any;
  onSuccess?: () => void;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function PaystackButton({
  amount,
  email,
  type,
  metadata = {},
  onSuccess,
  onClose,
  children,
  className,
}: PaystackButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [PaystackHook, setPaystackHook] = useState<any>(null);

  // Load Paystack hook only on client side
  useEffect(() => {
    import('react-paystack').then((module) => {
      setPaystackHook(() => module.usePaystackPayment);
    });
  }, []);

  const config = {
    reference: `DD_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
    email,
    amount: amount * 100, // Convert to kobo
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
    metadata: {
      userId: user?.uid,
      type,
      ...metadata,
    },
  };

  const verifyPaymentWithRetry = async (reference: string, retries = 3): Promise<boolean> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const token = await user?.getIdToken();
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'x-user-id': user?.uid || '',
        };

        // Add auth token if available
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(
          buildApiUrl(`/api/paystack/verify?reference=${encodeURIComponent(reference)}`),
          {
            headers,
          }
        );

        const contentType = response.headers.get('content-type') || '';
        const rawBody = await response.text();
        let result: any = {};

        if (rawBody) {
          if (contentType.includes('application/json')) {
            try {
              result = JSON.parse(rawBody);
            } catch (parseError) {
              console.error('Failed to parse JSON verify response:', parseError, rawBody.slice(0, 200));
              throw new Error('Payment verification returned malformed JSON response.');
            }
          } else {
            console.error('Non-JSON verify response:', {
              status: response.status,
              contentType,
              body: rawBody.slice(0, 200),
            });
            if (response.status === 404 || rawBody.includes('<!DOCTYPE')) {
              throw new Error(
                'Payment API is unavailable on this deployment. Please redeploy the web app without static export and try again.'
              );
            }
            throw new Error('Payment verification returned an unexpected response format.');
          }
        }

        if (response.ok && result.success) {
          console.log('Payment verified successfully:', result);
          return true;
        } else if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        } else {
          throw new Error(result.error || `Verification failed: ${response.status}`);
        }
      } catch (error: any) {
        console.error(`Payment verification attempt ${attempt}/${retries} failed:`, error);
        
        if (attempt === retries) {
          // Last attempt failed
          throw error;
        }

        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    return false;
  };

  const handleSuccess = async (reference: any) => {
    setLoading(true);
    setError(null);

    try {
      const refCode = reference.reference;
      console.log('Payment successful on Paystack. Reference:', refCode);

      // Verify payment with backend with retries
      const verified = await verifyPaymentWithRetry(refCode);

      if (verified) {
        onSuccess?.();
        toast({
          title: 'Success!',
          description: 'Your payment has been processed successfully.',
          variant: 'default',
        });
        // Small delay to ensure toast is visible
        setTimeout(() => {
          router.push('/payment/success?reference=' + refCode);
        }, 1000);
      } else {
        throw new Error('Failed to verify payment');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Payment verification failed. Please contact support.';
      console.error('Payment verification error:', errorMessage);
      setError(errorMessage);
      
      toast({
        title: 'Verification Failed',
        description: errorMessage,
        variant: 'destructive',
      });

      // Redirect to failed page after a delay
      setTimeout(() => {
        router.push('/payment/failed');
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose?.();
  };

  const initializePayment = PaystackHook ? PaystackHook(config) : null;

  const handleClick = () => {
    if (!user) {
      router.push('/login?redirect=/subscribe');
      return;
    }

    if (!initializePayment) {
      const msg = 'Payment system is loading. Please wait...';
      setError(msg);
      console.error(msg);
      return;
    }

    setError(null);
    initializePayment({
      onSuccess: handleSuccess,
      onClose: handleClose,
    });
  };

  return (
    <div className="w-full">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      <Button
        onClick={handleClick}
        disabled={loading || !PaystackHook}
        className={className}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : !PaystackHook ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : (
          children
        )}
      </Button>
    </div>
  );
}
