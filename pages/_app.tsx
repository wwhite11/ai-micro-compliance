import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { SessionProvider } from 'next-auth/react';
import { useEffect } from 'react';

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  useEffect(() => {
    console.log('Session in _app:', session);
  }, [session]);
  
  return (
    <SessionProvider session={session} refetchInterval={0}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}
