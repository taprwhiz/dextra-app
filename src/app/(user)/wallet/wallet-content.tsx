'use client';

import { startTransition, useOptimistic } from 'react';
import { useState } from 'react';

import { useRouter } from 'next/navigation';

import {
  Discord,
  OAuthTokens,
  Twitter,
  User,
  WalletWithMetadata,
  useOAuthTokens,
  usePrivy,
} from '@privy-io/react-auth';
import { useSolanaWallets } from '@privy-io/react-auth/solana';
import { HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { mutate } from 'swr';

import { WalletCard } from '@/components/dashboard/wallet-card';
import { ReferralSection } from '@/components/referral-section';
import { SubscriptionSection } from '@/components/subscription/subscription-section';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CopyableText } from '@/components/ui/copyable-text';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useUser } from '@/hooks/use-user';
import { useEmbeddedWallets } from '@/hooks/use-wallets';
import { IS_SUBSCRIPTION_ENABLED, cn } from '@/lib/utils';
import {
  formatPrivyId,
  formatUserCreationDate,
  formatWalletAddress,
  truncate,
} from '@/lib/utils/format';
import { getUserID, grantDiscordRole } from '@/lib/utils/grant-discord-role';
import {
  reactivateUser,
  subscribeUser,
  unsubscribeUser,
} from '@/server/actions/subscription';
import { type UserUpdateData, updateUser } from '@/server/actions/user';
import { EmbeddedWallet } from '@/types/db';

import { LoadingStateSkeleton } from './loading-skeleton';

export function WalletContent() {
  const router = useRouter();
  const { ready } = usePrivy();
  const [isUpdatingReferralCode, setIsUpdatingReferralCode] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  const {
    isLoading: isUserLoading,
    user,
    linkTwitter,
    unlinkTwitter,
    linkEmail,
    unlinkEmail,
    linkDiscord,
    unlinkDiscord,
    linkWallet,
    unlinkWallet,
  } = useUser();

  const [optimisticUser, updateOptimisticUser] = useOptimistic(
    {
      degenMode: user?.degenMode || false,
    },
    (state, update: UserUpdateData) => ({
      ...state,
      ...update,
    }),
  );

  const {
    data: embeddedWallets = [],
    error: walletsError,
    isLoading: isWalletsLoading,
    mutate: mutateWallets,
  } = useEmbeddedWallets();

  const { createWallet: createSolanaWallet } = useSolanaWallets();

  const { reauthorize } = useOAuthTokens({
    onOAuthTokenGrant: (tokens: OAuthTokens, { user }: { user: User }) => {
      // Grant Discord role
      handleGrantDiscordRole(tokens.accessToken);
    },
  });

  const handleSubscribe = async () => {
    if (!privyUser?.wallet?.address) return;

    try {
      setIsSubscribing(true);
      const response = await subscribeUser();

      if (response?.data?.success) {
        toast.success('Subscribed successfully');
      } else if (response?.data?.error) {
        toast.error('Failed to subscribe', {
          description: response.data.error,
        });
      }
    } catch (error) {
      toast.error('Failed to subscribe', {
        description: 'Could not subscribe due to an unknown error',
      });
    } finally {
      setIsSubscribing(false);
      handleUpdateUser({});
    }
  };

  const handleReactivate = async () => {
    if (!privyUser?.wallet?.address) return;

    try {
      setIsSubscribing(true);
      const response = await reactivateUser();

      if (response?.data?.success) {
        toast.success('Reactivated subscription');
      } else if (response?.data?.error) {
        toast.error('Failed to reactivate subscription', {
          description: response.data.error,
        });
      }
    } catch (error) {
      toast.error('Failed to reactivate subscription', {
        description: 'Could not subscribe due to an unknown error',
      });
    } finally {
      setIsSubscribing(false);
      handleUpdateUser({});
    }
  };

  const handleUnsubscribe = async () => {
    if (!privyUser?.wallet?.address) return;

    try {
      setIsSubscribing(true);
      const response = await unsubscribeUser();

      if (response?.data?.success) {
        toast.success('Unsubscribed successfully');
      } else if (response?.data?.error) {
        toast.error('Failed to unsubscribe', {
          description: response.data.error,
        });
      }
    } catch (error) {
      toast.error('Failed to unsubscribe', {
        description: 'Could not unsubscribe due to an unknown error',
      });
    } finally {
      setIsSubscribing(false);
      handleUpdateUser({});
    }
  };

  const handleUpdateReferralCode = async (referralCode: string) => {
    try {
      const result = await handleUpdateUser({
        referralCode,
      });

      if (result.success) {
        toast.success('Referral code updated');
      } else {
        toast.error(result.error || 'Failed to update referral code');
      }
    } catch (err) {
      toast.error('Failed to update referral code');
    }
  };

  if (isUserLoading || isWalletsLoading || !user) {
    return <LoadingStateSkeleton />;
  }
  if (walletsError) {
    return (
      <div className="p-4 text-sm text-red-500">
        Failed to load wallets: {walletsError.message}
      </div>
    );
  }

  const privyUser = user.privyUser;
  const userData = {
    privyId: privyUser?.id,
    twitter: privyUser?.twitter as Twitter | undefined,
    email: privyUser?.email?.address,
    phone: privyUser?.phone?.number,
    walletAddress: privyUser?.wallet?.address,
    createdAt: formatUserCreationDate(user?.createdAt?.toString()),
    discord: privyUser?.discord as Discord | undefined,
  };

  const privyWallets = embeddedWallets.filter(
    (w: EmbeddedWallet) => w.walletSource === 'PRIVY' && w.chain === 'SOLANA',
  );
  const legacyWallets = embeddedWallets.filter(
    (w: EmbeddedWallet) => w.walletSource === 'CUSTOM' && w.chain === 'SOLANA',
  );

  const activeWallet = embeddedWallets.find((w) => w.active);

  const allUserLinkedAccounts = privyUser?.linkedAccounts || [];
  const linkedSolanaWallet = allUserLinkedAccounts.find(
    (acct): acct is WalletWithMetadata =>
      acct.type === 'wallet' &&
      acct.walletClientType !== 'privy' &&
      acct.chainType === 'solana',
  );

  const avatarLabel = userData.walletAddress
    ? userData.walletAddress.substring(0, 2).toUpperCase()
    : '?';

  async function handleGrantDiscordRole(accessToken: string) {
    try {
      const discordUserId = await getUserID(accessToken);
      await grantDiscordRole(discordUserId);
    } catch (error) {
      throw new Error(`Failed to grant Discord role: ${error}`);
    }
  }

  const allWalletAddresses = [
    ...(linkedSolanaWallet ? [linkedSolanaWallet.address] : []),
    ...privyWallets.map((w) => w.publicKey),
    ...legacyWallets.map((w) => w.publicKey),
  ];

  const handleUpdateUser = async (data: UserUpdateData) => {
    startTransition(() => {
      updateOptimisticUser(data);
    });

    const result = await updateUser(data);
    if (result.success) {
      await mutate(`user-${userData.privyId}`);
    }

    return result;
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-12">
      <div className="w-full px-8">
        <div className="max-w-3xl space-y-6">
          {/* Privy Embedded Wallet Section */}
          <section className="space-y-4">
            <h2 className="text-sm font-medium text-muted-foreground">
              Privy Embedded Wallets
            </h2>
            {privyWallets.length > 0
              ? privyWallets.map((wallet) => (
                  <WalletCard
                    key={wallet.id}
                    wallet={wallet}
                    mutateWallets={mutateWallets}
                    allWalletAddresses={allWalletAddresses}
                  />
                ))
              : ready && (
                  <Card className="bg-sidebar">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div>
                              <p className="text-sm font-medium">Public Key</p>
                              <p className="text-xs text-muted-foreground">
                                None created yet
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              createSolanaWallet().then(() => mutateWallets())
                            }
                            className={cn('min-w-[100px] text-xs')}
                          >
                            Create
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
          </section>

          {/* Legacy Embedded Wallet Section */}
          <section className="space-y-4">
            <h2 className="text-sm font-medium text-muted-foreground">
              Legacy Embedded Wallet
            </h2>
            {legacyWallets.map((wallet: EmbeddedWallet) => (
              <WalletCard
                key={wallet.id}
                wallet={wallet}
                mutateWallets={mutateWallets}
                allWalletAddresses={allWalletAddresses}
              />
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
