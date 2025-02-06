'use client';

import { useState } from 'react';

import { PaymentStatus, SubscriptionPayment } from '@prisma/client';
import { ChevronDown, ExternalLink } from 'lucide-react';
import useSWR from 'swr';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { searchWalletAssets } from '@/lib/solana/helius';
import {
  canAffordSubscription,
  cn,
  formatDate,
  getSubPriceFloat,
} from '@/lib/utils';
import { EmbeddedWallet } from '@/types/db';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../ui/collapsible';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

interface SubscriptionSectionProps {
  isSubscribed: boolean;
  nextPaymentDate?: Date | null;
  endDate?: Date | null;
  wallet: EmbeddedWallet;
  paymentHistory?: SubscriptionPayment[];
  onSubscribe: () => Promise<void>;
  onUnsubscribe: () => Promise<void>;
  onReactivate: () => Promise<void>;
}

export function SubscriptionSection({
  isSubscribed,
  nextPaymentDate,
  endDate,
  wallet,
  paymentHistory,
  onSubscribe,
  onUnsubscribe,
  onReactivate,
}: SubscriptionSectionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const {
    data: walletPortfolio,
    isLoading: isWalletPortfolioLoading,
    mutate: mutateWalletPortfolio,
  } = useSWR(
    ['wallet-portfolio', wallet.publicKey],
    () => searchWalletAssets(wallet.publicKey),
    { refreshInterval: 30000 },
  );

  const hasEnoughBalance = canAffordSubscription(walletPortfolio);

  const handleSubscriptionAction = async () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmAction = async () => {
    setIsLoading(true);
    try {
      if (isSubscribed && !endDate) {
        // User is subscribed with no end date, they want to cancel
        await onUnsubscribe();
      } else if (isSubscribed && endDate) {
        // User is subscribed with an end date, they want to reactivate
        await onReactivate();
      } else if (!isSubscribed) {
        // User is not subscribed, they want to subscribe
        await onSubscribe();
      }
    } catch (error) {
      console.error('Subscription action failed:', error);
    } finally {
      setIsLoading(false);
      setShowConfirmDialog(false);
    }
  };

  const subscriptionPrice = getSubPriceFloat();

  enum SubscriptionAction {
    SUBSCRIBE = 'Subscribe',
    CANCEL = 'Cancel',
    REACTIVATE = 'Reactivate',
  }
  const subscriptionAction =
    isSubscribed && endDate
      ? SubscriptionAction.REACTIVATE
      : isSubscribed
        ? SubscriptionAction.CANCEL
        : SubscriptionAction.SUBSCRIBE;

  const getDialogHeader = (action: SubscriptionAction): string => {
    switch (action) {
      case SubscriptionAction.CANCEL:
        return 'Cancel Subscription';
      case SubscriptionAction.SUBSCRIBE:
        return 'Confirm Subscription';
      case SubscriptionAction.REACTIVATE:
        return 'Confirm Reactivation';
      default:
        const _exhaustiveCheck: never = action;
        throw new Error('Unhandled subscription action: ' + action);
    }
  };

  const getConfirmationButtonText = (action: SubscriptionAction): string => {
    switch (action) {
      case SubscriptionAction.CANCEL:
        return 'Cancel Subscription';
      case SubscriptionAction.SUBSCRIBE:
        return 'Subscribe';
      case SubscriptionAction.REACTIVATE:
        return 'Reactivate';
      default:
        const _exhaustiveCheck: never = action;
        throw new Error('Unhandled subscription action: ' + action);
    }
  };

  return (
    <>
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {getDialogHeader(subscriptionAction)}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {!isSubscribed ? (
                <>
                  You are about to subscribe to Dextra for {subscriptionPrice}{' '}
                  SOL per month.
                  <br />
                  The SOL balance of the address{' '}
                  <b>
                    {wallet.publicKey.slice(0, 4)}...
                    {wallet.publicKey.slice(-4)}
                  </b>{' '}
                  will be debited monthly, starting today.
                  <br />
                  <br />
                  Please confirm to proceed.
                </>
              ) : isSubscribed && endDate ? (
                <>
                  Are you sure you want to reactivate your subscription?
                  <br />
                  Your subscription will be continued and the next payment will
                  be deducted on <b>{nextPaymentDate?.toLocaleDateString()}</b>
                </>
              ) : (
                <>
                  Are you sure you want to cancel your subscription?
                  <br />
                  Your subscription will remain active until{' '}
                  <b>{nextPaymentDate?.toLocaleDateString()}</b>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              disabled={isLoading}
              className={cn(
                isSubscribed && 'bg-destructive hover:bg-destructive/90',
              )}
            >
              {isLoading
                ? 'Processing...'
                : getConfirmationButtonText(subscriptionAction)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground">
          Subscription Management
        </h2>
        <Card className="bg-sidebar">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">
                  Subscription Status
                </Label>
                <div className="mt-1 flex h-8 items-center">
                  <span
                    className={cn(
                      'text-sm font-medium',
                      isSubscribed ? 'text-green-500' : 'text-muted-foreground',
                    )}
                  >
                    {isSubscribed ? 'Active' : 'Inactive'}
                  </span>
                  {isSubscribed && endDate && (
                    <span className="text-sm text-muted-foreground">
                      &nbsp;ends - {endDate.toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {isSubscribed && nextPaymentDate && (
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Next Payment
                  </Label>
                  <div className="mt-1 flex h-8 items-center">
                    <span className="text-sm">
                      {formatDate(nextPaymentDate)} - {subscriptionPrice} SOL
                    </span>
                  </div>
                </div>
              )}

              <div>
                <Label className="text-xs text-muted-foreground">
                  Monthly Subscription
                </Label>
                <div className="mt-1 flex h-8 items-center justify-between">
                  <span className="text-sm">
                    {subscriptionPrice} SOL per month
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSubscriptionAction}
                    disabled={isLoading || (!isSubscribed && !hasEnoughBalance)}
                    className={cn(
                      'min-w-[100px] text-xs',
                      isSubscribed &&
                        'hover:bg-destructive hover:text-destructive-foreground',
                    )}
                  >
                    {isLoading
                      ? 'Processing...'
                      : getConfirmationButtonText(subscriptionAction)}
                  </Button>
                </div>
                {!isSubscribed && !hasEnoughBalance && (
                  <p className="mt-2 text-xs text-destructive">
                    Insufficient balance. Please fund your wallet with at least{' '}
                    {subscriptionPrice} SOL to subscribe.
                  </p>
                )}
              </div>

              {paymentHistory && paymentHistory.length > 0 && (
                <Collapsible
                  open={isHistoryOpen}
                  onOpenChange={setIsHistoryOpen}
                >
                  <CollapsibleTrigger className="flex w-full items-center justify-between">
                    <h2 className="text-sm font-medium text-muted-foreground">
                      Payment History
                    </h2>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 transition-transform',
                        isHistoryOpen && 'rotate-180',
                      )}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-4">
                    <Card className="bg-sidebar">
                      <CardContent className="pt-6">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Details</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paymentHistory.map((payment) => (
                              <TableRow key={payment.id}>
                                <TableCell>
                                  {formatDate(payment.paymentDate)}
                                </TableCell>
                                <TableCell>
                                  {payment.amount.toString()} SOL
                                </TableCell>
                                <TableCell>
                                  <span
                                    className={cn(
                                      'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
                                      {
                                        'bg-green-50 text-green-700':
                                          payment.status ===
                                          PaymentStatus.SUCCESS,
                                        'bg-red-50 text-red-700':
                                          payment.status ===
                                          PaymentStatus.FAILED,
                                        'bg-yellow-50 text-yellow-700':
                                          payment.status ===
                                          PaymentStatus.PENDING,
                                      },
                                    )}
                                  >
                                    {payment.status.charAt(0).toUpperCase() +
                                      payment.status.slice(1)}
                                  </span>
                                </TableCell>
                                {payment.status === PaymentStatus.FAILED && (
                                  <TableCell>
                                    {payment.failureReason || ''}
                                  </TableCell>
                                )}
                                {payment.status === PaymentStatus.PENDING && (
                                  <TableCell>Pending</TableCell>
                                )}
                                {payment.status === PaymentStatus.SUCCESS && (
                                  <TableCell>
                                    <a
                                      href={`https://solscan.io/tx/${payment.transactionHash}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center rounded-md font-medium underline hover:text-primary"
                                    >
                                      View on Solscan
                                      <ExternalLink className="ml-1 inline-block h-3 w-3" />
                                    </a>
                                  </TableCell>
                                )}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
