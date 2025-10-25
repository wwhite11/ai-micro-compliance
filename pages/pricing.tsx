import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import RequireAuth from '@/components/RequireAuth';
import { PLANS } from '@/lib/plans';

export default function Pricing() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    console.log('Pricing page - Session status:', status);
    console.log('Pricing page - Session:', session);
  }, [status, session]);

  const handleSubscribe = async (planId: string) => {
    setIsLoading(true);
    try {
      if (status === 'unauthenticated') {
        console.log('User not authenticated, redirecting to sign in');
        // Use the current URL as the callback
        const currentUrl = window.location.href;
        router.push(`/auth/signin?callbackUrl=${encodeURIComponent(currentUrl)}`);
        return;
      }

      if (status === 'loading') {
        console.log('Session still loading');
        return;
      }

      // Now that we're authenticated, we can proceed with the subscription
      console.log('Processing subscription for plan:', planId, 'for user:', session?.user?.email);
      
      // TODO: Add your subscription logic here
      // For example:
      // 1. Create a Stripe checkout session
      // 2. Redirect to Stripe checkout
      // 3. Handle the subscription creation
      
      // For now, we'll just show a success message
      alert('Subscription process initiated! (This is a placeholder - implement actual subscription logic)');
      
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Failed to process subscription. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <RequireAuth>
      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Choose the plan that's right for you
            </p>
            {status === 'authenticated' && (
              <p className="mt-2 text-sm text-gray-500">
                Signed in as {session?.user?.email}
              </p>
            )}
          </div>

          <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-3">
            {/* Basic Plan */}
            <div className="border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200">
              <div className="p-6">
                <h2 className="text-lg leading-6 font-medium text-gray-900">Basic</h2>
                <p className="mt-4 text-sm text-gray-500">Perfect for getting started</p>
                <p className="mt-8">
                  <span className="text-4xl font-extrabold text-gray-900">$9</span>
                  <span className="text-base font-medium text-gray-500">/month</span>
                </p>
                <button
                  onClick={() => handleSubscribe('basic')}
                  disabled={isLoading}
                  className="mt-8 block w-full bg-indigo-600 border border-transparent rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Processing...' : status === 'authenticated' ? 'Subscribe Now' : 'Get started'}
                </button>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200">
              <div className="p-6">
                <h2 className="text-lg leading-6 font-medium text-gray-900">Pro</h2>
                <p className="mt-4 text-sm text-gray-500">For growing businesses</p>
                <p className="mt-8">
                  <span className="text-4xl font-extrabold text-gray-900">$29</span>
                  <span className="text-base font-medium text-gray-500">/month</span>
                </p>
                <button
                  onClick={() => handleSubscribe('pro')}
                  disabled={isLoading}
                  className="mt-8 block w-full bg-indigo-600 border border-transparent rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Processing...' : status === 'authenticated' ? 'Subscribe Now' : 'Get started'}
                </button>
              </div>
            </div>

            {/* Enterprise Plan */}
            <div className="border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200">
              <div className="p-6">
                <h2 className="text-lg leading-6 font-medium text-gray-900">Enterprise</h2>
                <p className="mt-4 text-sm text-gray-500">For large organizations</p>
                <p className="mt-8">
                  <span className="text-4xl font-extrabold text-gray-900">$99</span>
                  <span className="text-base font-medium text-gray-500">/month</span>
                </p>
                <button
                  onClick={() => handleSubscribe('enterprise')}
                  disabled={isLoading}
                  className="mt-8 block w-full bg-indigo-600 border border-transparent rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Processing...' : status === 'authenticated' ? 'Subscribe Now' : 'Get started'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
} 