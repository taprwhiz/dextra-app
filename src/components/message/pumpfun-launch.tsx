'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';

import { Check, Copy, ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TokenMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  showName: boolean;
  createdOn: string;
}

interface LaunchResultProps {
  signature: string;
  mint: string;
  metadataUri: string;
}

function truncate(str: string, length = 4) {
  if (!str) return '';
  const start = str.slice(0, length);
  const end = str.slice(-length);
  return `${start}...${end}`;
}

interface DetailItemProps {
  label: string;
  value: string;
  truncateLength?: number;
  link?: string;
  showExternalLink?: boolean;
}

function DetailItem({
  label,
  value,
  truncateLength = 4,
  link,
  showExternalLink = true,
}: DetailItemProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border bg-card/50 p-3">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-muted-foreground">{label}</div>
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-fit cursor-help font-mono text-sm">
                {truncate(value, truncateLength)}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[300px] break-all">
              <p className="font-mono">{value}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8"
                onClick={() => copyToClipboard(value)}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{copied ? 'Copied!' : 'Copy'}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {showExternalLink && link && (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8"
                  onClick={() => window.open(link, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}

function TruncatedDescription({ description }: { description: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxLength = 80;

  if (description.length <= maxLength) {
    return <p className="text-sm text-muted-foreground">{description}</p>;
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        {isExpanded ? description : `${description.slice(0, maxLength)}...`}
      </p>
      <Button
        variant="ghost"
        size="sm"
        className="h-auto p-0 text-xs font-medium text-muted-foreground hover:text-foreground"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? 'Show less' : 'Show more'}
      </Button>
    </div>
  );
}

export function LaunchResult({
  signature,
  mint,
  metadataUri,
}: LaunchResultProps) {
  const [metadata, setMetadata] = useState<TokenMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetadata() {
      try {
        const response = await fetch(metadataUri);
        if (!response.ok) throw new Error('Failed to fetch metadata');
        const data = await response.json();
        setMetadata(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load token metadata',
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchMetadata();
  }, [metadataUri]);

  if (error) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-destructive">
            Failed to Load Token Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{error}</p>
          <div className="mt-4 space-y-3">
            <DetailItem
              label="Transaction Hash"
              value={signature}
              truncateLength={6}
              link={`https://solscan.io/tx/${signature}`}
            />
            <DetailItem
              label="Token Contract"
              value={mint}
              truncateLength={6}
              link={`https://pump.fun/mint/${mint}`}
            />
            <DetailItem
              label="Metadata URI"
              value={metadataUri}
              truncateLength={12}
              link={metadataUri}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2 text-2xl">
          Token Created Successfully!
          <span>🚀</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6">
        {isLoading ? (
          <div className="space-y-4">
            <div className="flex gap-4">
              <Skeleton className="h-24 w-24 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-[200px]" />
                <Skeleton className="h-4 w-[160px]" />
                <Skeleton className="h-4 w-[100px]" />
              </div>
            </div>
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        ) : metadata ? (
          <div className="grid gap-6">
            <div className="flex flex-col gap-6 sm:flex-row">
              {metadata.image && (
                <div className="relative aspect-square h-24 w-24 shrink-0 overflow-hidden rounded-lg border bg-muted">
                  <Image
                    src={metadata.image}
                    alt={metadata.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">{metadata.name}</h2>
                  <div className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    ${metadata.symbol}
                  </div>
                </div>
                {metadata.description && (
                  <TruncatedDescription description={metadata.description} />
                )}
                {metadata.createdOn && (
                  <p className="text-xs text-muted-foreground">
                    Created on {metadata.createdOn}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <DetailItem
                label="Transaction Hash"
                value={signature}
                truncateLength={6}
                link={`https://solscan.io/tx/${signature}`}
              />
              <DetailItem
                label="Token Contract"
                value={mint}
                truncateLength={6}
                link={`https://pump.fun/mint/${mint}`}
              />
              <DetailItem
                label="Metadata URI"
                value={metadataUri}
                truncateLength={12}
                link={metadataUri}
              />
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
