import { ConnectButton } from 'thirdweb/react';
import { createWallet, inAppWallet } from 'thirdweb/wallets';
import { getClient, getNetwork } from '@/lib/thirdweb';

const wallets = [
  inAppWallet(),
  createWallet('io.metamask'),
  createWallet('com.coinbase.wallet'),
  createWallet('me.rainbow'),
];

export default function WalletConnect() {
  const client = getClient();

  return (
    <ConnectButton
      client={client}
      wallets={wallets}
      connectButton={{
        label: 'Connect Wallet',
      }}
      connectModal={{
        size: 'wide',
      }}
      chain={getNetwork()}
    />
  );
}

