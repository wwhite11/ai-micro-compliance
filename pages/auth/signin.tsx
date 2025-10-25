import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

export default function SignIn() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const { callbackUrl } = router.query;

  useEffect(() => {
    console.log('SignIn page - Session status:', status);
    console.log('SignIn page - Session:', session);
    console.log('SignIn page - Callback URL:', callbackUrl);

    if (status === 'authenticated' && session) {
      // If we have a valid callback URL, use it (allow both absolute and relative URLs)
      if (
        typeof callbackUrl === 'string' &&
        (callbackUrl.startsWith('http://localhost:3000') || callbackUrl.startsWith('/'))
      ) {
        console.log('Authenticated, redirecting to callback URL:', callbackUrl);
        router.replace(callbackUrl);
      } else {
        // Otherwise, go to pricing page
        console.log('Authenticated, redirecting to pricing page');
        router.replace('/pricing');
      }
    }
  }, [status, session, callbackUrl, router]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await signIn('google', { 
        callbackUrl: typeof callbackUrl === 'string' && callbackUrl ? callbackUrl : '/dashboard',
        redirect: true
      });
      
      if (result?.error) {
        console.error('Sign in error:', result.error);
      }
    } catch (error) {
      console.error('Sign in error:', error);
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

  if (status === 'authenticated') {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <a href="/" className="font-medium text-indigo-600 hover:text-indigo-500">
            go back to home
          </a>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign in with Google'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 