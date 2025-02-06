import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export const Confirmation = ({
  message,
  result,
  toolCallId,
  addResultUtility,
}: {
  message: string;
  result: string | undefined;
  toolCallId: string;
  addResultUtility: (result: string) => void;
}) => {
  return (
    <div className={message ? 'mt-2 w-full' : 'mt-2'}>
      <div className={message ? 'w-full rounded-lg bg-muted/40 px-3 py-2' : ''}>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div
            className={cn(
              'h-1.5 w-1.5 rounded-full ring-2',
              message
                ? 'bg-emerald-500 ring-emerald-500/20'
                : 'animate-pulse bg-amber-500 ring-amber-500/20',
            )}
          />
          <span className="truncate text-xs font-medium text-foreground/90">
            ⚠️ Confirmation
          </span>
          <span className="ml-auto font-mono text-[10px] text-muted-foreground/70">
            {toolCallId.slice(0, 9)}
          </span>
        </div>
      </div>
      <div className="mt-2 sm:px-4">
        {!message && (
          <div className="mt-px px-3">
            <div className="h-20 animate-pulse rounded-lg bg-muted/40" />
          </div>
        )}
        {message && (
          <Card className="flex flex-col gap-3 bg-card p-6">
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">{message}</p>
            </div>

            <div className="flex justify-end space-x-2">
              {result === 'deny' && (
                <Button variant="destructive" size="sm" disabled>
                  Denied
                </Button>
              )}
              {result === 'confirm' && (
                <Button variant="secondary" size="sm" disabled>
                  Confirmed
                </Button>
              )}
              {!result && addResultUtility && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    addResultUtility('deny');
                  }}
                >
                  Deny
                </Button>
              )}
              {!result && addResultUtility && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    addResultUtility('confirm');
                  }}
                >
                  Confirm
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
