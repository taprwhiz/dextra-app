'use client';

import { formatNumber } from '@/lib/format';
import { BirdeyeTrader } from '@/server/actions/birdeye';

export default function TopTrader({
  trader,
  rank,
}: {
  trader: BirdeyeTrader;
  rank: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-muted/50 p-4">
      <div className="flex items-center gap-3">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-background/50">
          <div className="flex h-full w-full items-center justify-center text-xs font-medium text-muted-foreground">
            #{rank}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <a
              href={`https://solscan.io/account/${trader.address}#portfolio`}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate font-mono text-base font-medium"
            >
              {trader.address.slice(0, 4)}...{trader.address.slice(-4)}
            </a>
            <span
              className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${
                trader.pnl >= 0
                  ? 'bg-green-500/10 text-green-500'
                  : 'bg-red-500/10 text-red-500'
              }`}
            >
              {trader.pnl >= 0 ? '+' : ''}
              {formatNumber(trader.pnl, 'percent', 2)}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
            <span>Vol: {formatNumber(trader.volume, 'currency')}</span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span>Trades: {formatNumber(trader.tradeCount, 'number')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
