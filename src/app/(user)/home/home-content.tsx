'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { SavedPrompt } from '@prisma/client';
import { Attachment, JSONValue } from 'ai';
import { useChat } from 'ai/react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

import ChatInterface from '@/app/(user)/chat/[id]/chat-interface';
import { AppSidebarConversations } from '@/components/dashboard/app-sidebar-conversations';
import { SavedPromptsMenu } from '@/components/saved-prompts-menu';
import BlurFade from '@/components/ui/blur-fade';
import TypingAnimation from '@/components/ui/typing-animation';
import { useConversations } from '@/hooks/use-conversations';
import { useUser } from '@/hooks/use-user';
import { useWalletPortfolio } from '@/hooks/use-wallet-portfolio';
import { EVENTS } from '@/lib/events';
import { SolanaUtils } from '@/lib/solana';
import {
  IS_SUBSCRIPTION_ENABLED,
  IS_TRIAL_ENABLED,
  cn,
  getSubPriceFloat,
  getTrialTokensFloat,
} from '@/lib/utils';
import { checkEAPTransaction } from '@/server/actions/eap';
import {
  getSavedPrompts,
  setSavedPromptLastUsedAt,
} from '@/server/actions/saved-prompt';

import { IntegrationsGrid } from './components/integrations-grid';
import { ConversationInput } from './conversation-input';
import { getRandomSuggestions } from './data/suggestions';
import { SuggestionCard } from './suggestion-card';

const EAP_PRICE = 1.0;
const RECEIVE_WALLET_ADDRESS =
  process.env.NEXT_PUBLIC_EAP_RECEIVE_WALLET_ADDRESS!;

const EAP_BENEFITS = [
  'Support platform growth',
  'Early access to features',
  'Unlimited AI interactions',
  'Join early governance and decisions',
];

interface SectionTitleProps {
  children: React.ReactNode;
}

function SectionTitle({ children }: SectionTitleProps) {
  return (
    <h2 className="mb-2 px-1 text-sm font-medium text-muted-foreground/80">
      {children}
    </h2>
  );
}

export function HomeContent() {
  const pathname = usePathname();
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [isFetchingSavedPrompts, setIsFetchingSavedPrompts] =
    useState<boolean>(true);
  const suggestions = useMemo(() => getRandomSuggestions(4), []);
  const [showChat, setShowChat] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatId, setChatId] = useState(() => uuidv4());
  const { user, isLoading: isUserLoading } = useUser();
  const [verifyingTx, setVerifyingTx] = useState<string | null>(null);
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const MAX_VERIFICATION_ATTEMPTS = 20;

  const { conversations, refreshConversations } = useConversations(user?.id);

  const resetChat = useCallback(() => {
    setShowChat(false);
    setChatId(uuidv4());
  }, []);

  useEffect(() => {
    async function fetchSavedPrompts() {
      try {
        const res = await getSavedPrompts();
        const savedPrompts = res?.data?.data || [];

        setSavedPrompts(savedPrompts);
      } catch (err) {
        console.error(err);
      }
      setIsFetchingSavedPrompts(false);
    }
    fetchSavedPrompts();
  }, []);

  const { messages, input, handleSubmit, setInput } = useChat({
    id: chatId,
    initialMessages: [],
    body: { id: chatId },
    onFinish: () => {
      // Only refresh if we have a new conversation that's not in the list
      if (chatId && !conversations?.find((conv) => conv.id === chatId)) {
        refreshConversations().then(() => {
          // Dispatch event to mark conversation as read
          window.dispatchEvent(new CustomEvent(EVENTS.CONVERSATION_READ));
        });
      }
    },
    experimental_prepareRequestBody: ({ messages }) => {
      return {
        message: messages[messages.length - 1],
        id: chatId,
      } as unknown as JSONValue;
    },
  });

  // Verification effect
  useEffect(() => {
    if (!verifyingTx) return;

    const verify = async () => {
      try {
        const response = await checkEAPTransaction({ txHash: verifyingTx });
        if (response?.data?.success) {
          toast.success('EAP Purchase Successful', {
            description:
              'Your Early Access Program purchase has been verified. Please refresh the page.',
          });
          setVerifyingTx(null);
          return;
        }

        // Continue verification if not reached max attempts
        if (verificationAttempts < MAX_VERIFICATION_ATTEMPTS) {
          setVerificationAttempts((prev) => prev + 1);
        } else {
          // Max attempts reached, show manual verification message
          toast.error('Verification Timeout', {
            description:
              'Please visit the FAQ page to manually verify your transaction.',
          });
          setVerifyingTx(null);
        }
      } catch (error) {
        console.error('Verification error:', error);
        // Continue verification if not reached max attempts
        if (verificationAttempts < MAX_VERIFICATION_ATTEMPTS) {
          setVerificationAttempts((prev) => prev + 1);
        }
      }
    };

    const timer = setTimeout(verify, 3000);
    return () => clearTimeout(timer);
  }, [verifyingTx, verificationAttempts]);

  const handleSend = async (value: string, attachments: Attachment[]) => {
    const NON_TRIAL_PERMISSION =
      !user?.earlyAccess && !user?.subscription?.active;
    const TRIAL_PERMISSION =
      !user?.earlyAccess && !user?.subscription?.active && !meetsTokenBalance;

    // If user is not in EAP or no active subscription, don't allow sending messages
    if (!IS_TRIAL_ENABLED && NON_TRIAL_PERMISSION) {
      return;
    }

    // If user is in trial mode, check if they meet the minimum token balance
    if (IS_TRIAL_ENABLED && TRIAL_PERMISSION) {
      return;
    }

    if (!value.trim() && (!attachments || attachments.length === 0)) {
      return;
    }

    // Create a synthetic event for handleSubmit
    const fakeEvent = {
      preventDefault: () => {},
      type: 'submit',
    } as React.FormEvent;

    // Submit the message
    await handleSubmit(fakeEvent, {
      data: value,
      experimental_attachments: attachments,
    });

    // Update UI state and URL
    setShowChat(true);
    window.history.replaceState(null, '', `/chat/${chatId}`);
  };

  const handlePurchase = async () => {
    if (!user) return;
    setIsProcessing(true);
    setVerificationAttempts(0);

    try {
      const tx = await SolanaUtils.sendTransferWithMemo({
        to: RECEIVE_WALLET_ADDRESS,
        amount: EAP_PRICE,
        memo: `{
                    "type": "EAP_PURCHASE",
                    "user_id": "${user.id}"
                }`,
      });

      if (tx) {
        setVerifyingTx(tx);
        toast.success('Transaction Sent', {
          description: 'Transaction has been sent. Verifying your purchase...',
        });
      } else {
        toast.error('Transaction Failed', {
          description: 'Failed to send the transaction. Please try again.',
        });
      }
    } catch (error) {
      console.error('Transaction error:', error);

      let errorMessage = 'Failed to send the transaction. Please try again.';

      if (error instanceof Error) {
        const errorString = error.toString();
        if (
          errorString.includes('TransactionExpiredBlockheightExceededError')
        ) {
          toast.error('Transaction Timeout', {
            description: (
              <>
                <span className="font-semibold">
                  Transaction might have been sent successfully.
                </span>
                <br />
                If SOL was deducted from your wallet, please visit the FAQ page
                and input your transaction hash for manual verification.
              </>
            ),
          });
          return;
        }
        errorMessage = error.message;
      }

      toast.error('Transaction Failed', {
        description: errorMessage,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset chat when pathname changes to /home
  useEffect(() => {
    if (pathname === '/home') {
      resetChat();
    }
  }, [pathname, resetChat]);

  // 监听浏览器的前进后退
  useEffect(() => {
    const handlePopState = () => {
      if (location.pathname === '/home') {
        resetChat();
      } else if (location.pathname === `/chat/${chatId}`) {
        setShowChat(true);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [chatId, resetChat]);

  const filteredPrompts = input.startsWith('/')
    ? savedPrompts.filter((savedPrompt) =>
        savedPrompt.title.toLowerCase().includes(input.slice(1).toLowerCase()),
      )
    : savedPrompts;

  function handlePromptMenuClick(subtitle: string) {
    setInput(subtitle);
  }

  async function updatePromptLastUsedAt(id: string) {
    try {
      const res = await setSavedPromptLastUsedAt({ id });
      if (!res?.data?.data) {
        throw new Error();
      }

      const { lastUsedAt } = res.data.data;

      setSavedPrompts((old) =>
        old.map((prompt) =>
          prompt.id !== id ? prompt : { ...prompt, lastUsedAt },
        ),
      );
    } catch (error) {
      console.error('Failed to update -lastUsedAt- for prompt:', { error });
    }
  }
  const hasEAP = true;

  const shouldCheckPortfolio =
    IS_TRIAL_ENABLED && !hasEAP && !user?.subscription?.active;

  const { data: portfolio, isLoading: isPortfolioLoading } =
    useWalletPortfolio();

  // Check if user meets the minimum token balance
  const meetsTokenBalance = useMemo(() => {
    if (!portfolio || !portfolio.tokens) return false;

    // Find the NEUR token
    const neurToken = portfolio.tokens.find(
      (token) => token.mint === process.env.NEXT_PUBLIC_NEUR_MINT,
    );

    // Check the balance
    const balance = neurToken?.balance || 0;

    const trialMinBalance = getTrialTokensFloat();

    return trialMinBalance && balance >= trialMinBalance;
  }, [portfolio]);

  // Handle loading states
  if (isUserLoading || (shouldCheckPortfolio && isPortfolioLoading)) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const RENDER_TRIAL_BANNER =
    IS_TRIAL_ENABLED &&
    !hasEAP &&
    !user?.subscription?.active &&
    !meetsTokenBalance;
  const USER_HAS_TRIAL =
    IS_TRIAL_ENABLED &&
    !hasEAP &&
    !user?.subscription?.active &&
    meetsTokenBalance;
  const RENDER_SUB_BANNER =
    !hasEAP &&
    !user?.subscription?.active &&
    !RENDER_TRIAL_BANNER &&
    !USER_HAS_TRIAL;
  const RENDER_EAP_BANNER =
    !IS_SUBSCRIPTION_ENABLED &&
    !hasEAP &&
    !RENDER_TRIAL_BANNER &&
    !USER_HAS_TRIAL;

  const USER_HAS_ACCESS =
    hasEAP || user?.subscription?.active || USER_HAS_TRIAL;

  const mainContent = (
    <div
      className={cn(
        'mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-6',
        !USER_HAS_ACCESS ? 'h-screen py-0' : 'py-12',
      )}
    >
      <BlurFade delay={0.2}>
        <TypingAnimation
          className="h1"
          duration={50}
          text="I'm Dextra, How can I assist you?"
        />
      </BlurFade>

      <div className="mx-auto w-full max-w-4xl space-y-8">
        {USER_HAS_ACCESS && (
          <div className="space-y-8">
            <BlurFade delay={0.2}>
              <div className="section_suggestions_top space-y-2">
                <h3>Suggestions</h3>
                <div className="grid grid-cols-2 gap-4">
                  {suggestions.map((suggestion, index) => (
                    <SuggestionCard
                      key={suggestion.title}
                      {...suggestion}
                      delay={0.3 + index * 0.1}
                      onSelect={setInput}
                    />
                  ))}
                </div>
              </div>
            </BlurFade>

            {!isFetchingSavedPrompts && savedPrompts.length !== 0 && (
              <BlurFade delay={0.3}>
                <div className="section_suggestions_top space-y-2">
                  <h3>Saved Prompts</h3>
                  {isFetchingSavedPrompts ? (
                    <div className="flex w-full items-center justify-center pt-20">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {savedPrompts
                        .slice(0, Math.min(4, savedPrompts.length))
                        .map((savedPrompt, index) => (
                          <SuggestionCard
                            id={savedPrompt.id}
                            useSubtitle={true}
                            title={savedPrompt.title}
                            subtitle={savedPrompt.content}
                            key={savedPrompt.id}
                            delay={0.3 + index * 0.1}
                            onSelect={setInput}
                          />
                        ))}
                    </div>
                  )}
                </div>
              </BlurFade>
            )}

            <BlurFade delay={0.4}>
              <div className="section_suggestions_bottom space-y-2">
                <h3>Abilities</h3>
                <IntegrationsGrid />
              </div>
            </BlurFade>
          </div>
        )}
        <BlurFade delay={0.1}>
          <ConversationInput
            value={input}
            onChange={setInput}
            onSubmit={handleSend}
            savedPrompts={savedPrompts}
            setSavedPrompts={setSavedPrompts}
          />
          <SavedPromptsMenu
            input={input}
            isFetchingSavedPrompts={false}
            savedPrompts={savedPrompts}
            filteredPrompts={filteredPrompts}
            onPromptClick={handlePromptMenuClick}
            updatePromptLastUsedAt={updatePromptLastUsedAt}
            onHomeScreen={true}
          />
        </BlurFade>
      </div>
    </div>
  );

  const chatHistory = (
    <div className="block_memories w-64 p-6">
      <div className="title_history">Chat History</div>
      <div className="history_separator" />
      <AppSidebarConversations />
      {/* <div className="block_history_preview">
        <div className="history_preview">Solana trending coins</div>
      </div> */}
      <div className="block_logo_footer">
        <img
          src="/images/logo_footer.svg"
          loading="lazy"
          alt="Dextra"
          className="logo_footer"
        />
      </div>
      <Link href="/" className="close w-button" />
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <div className="relative h-screen flex-1 p-6">
        {!showChat && (
          <div
            className={cn(
              'absolute inset-0 overflow-y-auto overflow-x-hidden transition-opacity duration-300 ',
              showChat ? 'pointer-events-none opacity-0' : 'opacity-100',
            )}
          >
            {mainContent}
          </div>
        )}
        {showChat && (
          <div
            className={cn(
              'absolute inset-0 transition-opacity duration-300',
              showChat ? 'opacity-100' : 'pointer-events-none opacity-0',
            )}
          >
            <ChatInterface id={chatId} initialMessages={messages} />
          </div>
        )}
      </div>
      {chatHistory}
    </div>
  );
}
