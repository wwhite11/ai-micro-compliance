import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { PLANS } from '@/lib/plans';
import { isAdminUser } from '@/lib/adminUsers';
import RequireAuth from '@/components/RequireAuth';
import UploadForm from '@/components/UploadForm';
import ResultsView from '@/components/ResultsView';

interface Subscription {
  plan: string;
  status: string;
  priceId: string;
  currentPeriodEnd: string;
  docsPerMonth: number;
}

interface Usage {
  documentCount: number;
  month: number;
  year: number;
}

interface RecommendedClause {
  name: string;
  reason: string;
  draft: string;
  link?: string;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  console.log('[Dashboard] status:', status, 'session:', session);
  const router = useRouter();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  
  // Results state
  const [contractType, setContractType] = useState('');
  const [issues, setIssues] = useState<string[]>([]);
  const [recommendedClauses, setRecommendedClauses] = useState<RecommendedClause[]>([]);
  const [improvedText, setImprovedText] = useState('');
  const [reminder, setReminder] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/signin?callbackUrl=/dashboard');
    }
    if (status === 'authenticated' && session?.user?.email) {
      fetchSubscription();
      fetchUsage();
    }
  }, [status, session, router]);

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/subscription');
      const data = await response.json();
      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/usage');
      const data = await response.json();
      setUsage(data);
    } catch (error) {
      console.error('Error fetching usage:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckCompliance = async (content: string) => {
    if (!content.trim()) {
      alert('Please enter contract text to check');
      return;
    }

    setChecking(true);
    try {
      // First, increment usage
      const usageResponse = await fetch('/api/usage', {
        method: 'POST',
      });

      if (!usageResponse.ok) {
        const error = await usageResponse.json();
        if (error.error === 'Document limit reached') {
          alert('You have reached your document limit for this month. Please upgrade your plan.');
          return;
        }
        throw new Error(error.error);
      }

      // Then check compliance with Auto-Detect document type
      const response = await fetch('/api/checkCompliance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: content, docType: 'Auto-Detect' }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Compliance API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(`Failed to check compliance: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Compliance API response:', data);
      
      // Set the results from the API response
      setContractType(data.contractType || '');
      setIssues(data.issues || []);
      setRecommendedClauses(data.recommendedClauses || []);
      setImprovedText(data.improvedText || '');
      setReminder(data.reminder || '');
      setHasChecked(true);
      
      await fetchUsage(); // Refresh usage after successful check
    } catch (error) {
      console.error('Error checking compliance:', error);
      alert('Error checking compliance. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const handleUpgrade = () => {
    router.push('/pricing');
  };

  const getPlanName = (plan: string) => {
    return PLANS[plan as keyof typeof PLANS]?.name || 'Free';
  };

  const getUsagePercentage = () => {
    if (!subscription || !usage) return 0;
    const limit = subscription.docsPerMonth;
    if (limit === -1) return 0; // Unlimited
    return (usage.documentCount / limit) * 100;
  };

  return (
    <RequireAuth>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-black">AI Micro-Compliance</h1>
              </div>
              <div className="flex items-center space-x-4">
                {session?.user?.email && (
                  <span className="text-sm text-gray-600">
                    {session.user.email.split('@')[0]}
                  </span>
                )}
                {isAdminUser(session?.user?.email) && (
                  <a
                    href="/admin/review"
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
                  >
                    Admin Review
                  </a>
                )}
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Subscription Info */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900">Subscription</h3>
                  {loading ? (
                    <p className="mt-2 text-sm text-gray-500">Loading...</p>
                  ) : (
                    <div className="mt-4">
                      <p className="text-sm text-gray-500">
                        Current Plan: {getPlanName(subscription?.plan || 'free')}
                      </p>
                      {subscription?.status === 'active' && (
                        <p className="text-sm text-gray-500">
                          Renews: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                        </p>
                      )}
                      <button
                        onClick={handleUpgrade}
                        className="mt-4 w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                      >
                        {subscription?.status === 'active' ? 'Upgrade Plan' : 'Subscribe'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Usage Info */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900">Usage</h3>
                  {loading ? (
                    <p className="mt-2 text-sm text-gray-500">Loading...</p>
                  ) : (
                    <div className="mt-4">
                      <p className="text-sm text-gray-500">
                        Documents this month: {usage?.documentCount || 0}
                        {subscription?.docsPerMonth !== -1 && (
                          <span> / {subscription?.docsPerMonth || 0}</span>
                        )}
                      </p>
                      {subscription?.docsPerMonth !== -1 && (
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={{ width: `${getUsagePercentage()}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Contract Checker */}
              <div className="lg:col-span-3 bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-6">Smart Contract Checker</h3>
                  
                  {/* Upload Form */}
                  <div className="mb-8">
                    <UploadForm 
                      onCheck={handleCheckCompliance}
                      checking={checking}
                    />
                  </div>

                  {/* Results - Only Rendered After Check */}
                  {hasChecked && (
                    <div className="border-t pt-8">
                      <ResultsView
                        contractType={contractType}
                        issues={issues}
                        recommendedClauses={recommendedClauses}
                        improvedText={improvedText}
                        reminder={reminder}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </RequireAuth>
  );
} 