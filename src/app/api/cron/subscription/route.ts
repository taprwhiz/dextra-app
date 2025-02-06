import { PaymentStatus } from '@prisma/client';

import prisma from '@/lib/prisma';
import { searchWalletAssets } from '@/lib/solana/helius';
import { canAffordSubscription, getSubPriceFloat } from '@/lib/utils';
import { transferTokenServer } from '@/server/utils';
import { SOL_MINT } from '@/types/helius/portfolio';
import { PaymentError, PaymentErrorCode } from '@/types/subscription';

export const maxDuration = 300;
export const dynamic = 'force-dynamic'; // static by default, unless reading the request

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', {
      status: 401,
    });
  }

  const now = new Date();

  // Process subscription payments that are due
  const activeSubscriptions = await prisma.subscription.findMany({
    where: {
      active: true,
      nextPaymentDate: {
        lte: now,
      },
    },
    include: {
      user: {
        include: { wallets: true },
      },
    },
  });

  console.log(
    `[cron/subscription] Fetched ${activeSubscriptions.length} subscriptions to process`,
  );

  const paymentPromises = activeSubscriptions.map(async (subscription) => {
    console.log(
      `[cron/subscription:${subscription.id}] Processing subscription`,
    );

    // First, create a new subscription payment record
    const payment = await prisma.subscriptionPayment.create({
      data: {
        subscriptionId: subscription.id,
        amount: getSubPriceFloat(),
        paymentDate: now,
        status: 'PENDING',
      },
    });

    try {
      // Validate user has valid active wallet
      const activeWallet = subscription.user?.wallets.find(
        (wallet) => wallet.active,
      );
      if (!activeWallet) {
        throw new PaymentError(
          PaymentErrorCode.BAD_WALLET,
          'User does not have an active wallet',
        );
      }

      // Check the balance of the Privy wallet
      const portfolio = await searchWalletAssets(activeWallet.publicKey);
      const hasEnoughBalance = canAffordSubscription(portfolio);
      if (!hasEnoughBalance) {
        throw new PaymentError(
          PaymentErrorCode.INSUFFICIENT_BALANCE,
          'Insufficient balance',
        );
      }

      // Initiate the transfer of funds
      const response = await transferTokenServer({
        userId: subscription.userId,
        walletId: activeWallet.id,
        receiverAddress: process.env.NEXT_PUBLIC_EAP_RECEIVE_WALLET_ADDRESS!,
        tokenAddress: SOL_MINT,
        amount: getSubPriceFloat(),
        tokenSymbol: 'SOL',
      });

      // If successful, update the subscription record and subscription payment record
      if (response?.success) {
        // Mark subscription payment as successful
        await prisma.subscriptionPayment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.SUCCESS,
            transactionHash: response.data?.signature,
          },
        });

        // Update the subscription record with the next payment date
        const nextPaymentDate = new Date(subscription.nextPaymentDate);
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            nextPaymentDate,
          },
        });
      } else if (!response?.success || !response?.data) {
        console.error(
          `[cron/subscription:${subscription.id}] Error in transferToken:`,
        );
        console.dir(response?.data, { depth: null });
        throw new PaymentError(
          PaymentErrorCode.TRANSFER_FAILED,
          'Failed to transfer funds',
        );
      }
    } catch (err: unknown) {
      let errorMessage = 'Unknown error occurred';
      let errorCode = PaymentErrorCode.UNKNOWN;
      if (err instanceof PaymentError) {
        console.error(
          `[cron/subscription:${subscription.id}] Payment error occurred: ${err.message} (code: ${err.code})`,
        );
        errorMessage = err.message;
        errorCode = err.code;
      } else if (err instanceof Error) {
        console.error(
          `[cron/subscription:${subscription.id}] Generic error occurred: ${err.message}`,
        );
        errorMessage = err.message;
        errorCode = PaymentErrorCode.EXTERNAL_ERROR;
      } else {
        console.error(
          `[cron/subscription:${subscription.id}] Unknown error occurred: ${err}`,
        );
      }

      console.log(
        `[cron/subscription:${subscription.id}] Marking subscription payment as failed`,
      );

      // Mark the subscription as inactive and update the subscription payment status
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          active: false,
        },
      });

      await prisma.subscriptionPayment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: 'FAILED',
          failureReason: errorMessage,
          failureCode: errorCode,
        },
      });
    }
  });

  await Promise.allSettled(paymentPromises);

  // Process subscription cancellations
  const inactiveSubscriptions = await prisma.subscription.findMany({
    where: {
      active: true,
      endDate: {
        lte: now,
      },
    },
  });

  console.log(
    `[cron/subscription] Fetched ${inactiveSubscriptions.length} subscriptions to cancel`,
  );

  const cancellationPromises = inactiveSubscriptions.map(
    async (subscription) => {
      console.log(
        `[cron/subscription:${subscription.id}] Cancelling subscription`,
      );

      // Mark the subscription as inactive
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          active: false,
        },
      });
    },
  );

  await Promise.allSettled(cancellationPromises);

  return Response.json({ success: true });
}
