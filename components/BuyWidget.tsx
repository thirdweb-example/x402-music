import { BuyWidget as ThirdwebBuyWidget } from 'thirdweb/react';
import { defineChain } from 'thirdweb/chains';
import { getClient } from '@/lib/thirdweb';

interface BuyWidgetProps {
  amount: string;
  onClose?: () => void;
}

export default function BuyWidgetComponent({ amount, onClose }: BuyWidgetProps) {
  const client = getClient();
  const arbitrumMainnet = defineChain(42161);
  const usdcAddress = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'; // USDC on Arbitrum

  // Calculate minimum amount with a small buffer (add 20% for gas and buffer)
  const minAmount = (parseFloat(amount) * 1.2).toFixed(2);

  return (
    <div className="bg-black border border-white/10 rounded-sm p-3 relative">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Add Funds</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="w-5 h-5 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-sm transition-colors text-xs leading-none border border-white/10"
            aria-label="Close"
          >
            ✕
          </button>
        )}
      </div>
      <p className="text-xs text-white/50 mb-3 leading-tight">
        Need ${amount} USDC. Buy ${minAmount} to cover fees.
      </p>
      <div className="max-h-[350px] overflow-hidden rounded-sm border border-white/10">
        <div className="scale-[0.75] origin-top-left" style={{ width: '133.33%', height: '133.33%' }}>
          <ThirdwebBuyWidget
            client={client}
            currency="USD"
            chain={arbitrumMainnet}
            amount={minAmount}
            tokenAddress={usdcAddress}
          />
        </div>
      </div>
    </div>
  );
}

