import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { ThirdwebProvider } from 'thirdweb/react';
import { getClient } from '@/lib/thirdweb';

export default function App({ Component, pageProps }: AppProps) {
  const client = getClient();

  return (
    <ThirdwebProvider>
      <Component {...pageProps} />
    </ThirdwebProvider>
  );
}

