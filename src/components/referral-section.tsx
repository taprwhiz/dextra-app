'use client';

import { useState } from 'react';

import {
  Form,
  FormControl,
  FormField,
  FormLabel,
  FormMessage,
  FormSubmit,
} from '@radix-ui/react-form';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface ReferralSectionProps {
  referralCode?: string | null;
  referringUserId?: string | null;
  handleUpdateReferralCode: (referralCode: string) => Promise<void>;
}

export function ReferralSection({
  referralCode,
  referringUserId,
  handleUpdateReferralCode,
}: ReferralSectionProps) {
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.target as HTMLFormElement);
    const referralCode = formData.get('referralCode')?.toString();

    if (!referralCode) {
      setIsSubmitting(false);
      return;
    }

    try {
      await handleUpdateReferralCode(referralCode);
    } catch (error) {
      console.error('Error submitting referral code:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateCode = (value: string) => {
    return /^[a-zA-Z0-9]{8}$/.test(value) ? false : true;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    } finally {
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-medium text-muted-foreground">
        Referral Program
      </h2>

      <Card className="bg-sidebar">
        <CardContent className="space-y-6 pt-6">
          {referralCode && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={`https://dextra.guru/?ref=${referralCode}`}
                  className="flex-1 bg-background/50 font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="min-w-[100px] text-xs"
                  onClick={() => {
                    copyToClipboard(`https://dextra.guru/?ref=${referralCode}`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>
          )}

          {!referringUserId && (
            <Form onSubmit={handleSubmit}>
              <FormField name="referral">
                <div className="mb-2 flex justify-between">
                  <FormLabel className="text-sm">Enter Referral Code</FormLabel>
                  <div className="space-x-2">
                    <FormMessage
                      match="valueMissing"
                      className="text-sm text-warning"
                    >
                      Please enter a code
                    </FormMessage>
                    <FormMessage
                      match={validateCode}
                      className="text-sm text-warning"
                    >
                      Please enter a valid code
                    </FormMessage>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FormControl asChild>
                    <Input
                      type="text"
                      name="referralCode"
                      placeholder="Enter referral code"
                      className="flex-1 bg-background/50"
                      required
                    />
                  </FormControl>
                  <FormSubmit asChild>
                    <Button
                      disabled={isSubmitting}
                      variant="outline"
                      size="sm"
                      className="min-w-[100px] text-xs"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit'}
                    </Button>
                  </FormSubmit>
                </div>
              </FormField>
            </Form>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
