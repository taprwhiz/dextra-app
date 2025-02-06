'use client';

import React from 'react';

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { formatChartPrice } from '@/lib/format';
import { TIMEFRAME } from '@/types/chart';

interface PriceChartProps {
  data: {
    time: number;
    value: number;
  }[];
  timeFrame: TIMEFRAME;
  tokenInfo: {
    symbol: string;
    address: string;
  };
}

function formatDate(time: number, timeFrame: TIMEFRAME) {
  switch (timeFrame) {
    case TIMEFRAME.DAYS:
      return new Date(time).toLocaleDateString(undefined, {
        month: 'short',
        day: '2-digit',
      });
    case TIMEFRAME.HOURS:
      return new Date(time).toLocaleTimeString();
    default:
      return new Date(time).toLocaleDateString(undefined, {
        month: 'short',
        day: '2-digit',
      });
  }
}

function shortenAddress(addr: string) {
  if (addr.length <= 10) return addr;
  return addr.slice(0, 4) + '...' + addr.slice(-4);
}

export default function PriceChart({
  data,
  timeFrame,
  tokenInfo: { symbol, address },
}: PriceChartProps) {
  const transformedData = data.map((point) => ({
    date: formatDate(point.time, timeFrame),
    price: point.value,
  }));

  return (
    <Card>
      <CardHeader className="border-b py-5">
        <div className="grid flex-1 gap-1">
          <CardTitle>{symbol} Price</CardTitle>
          <CardDescription>
            Contract Address:
            <span className="hidden sm:inline"> {address}</span>
            <span className="inline sm:hidden"> {shortenAddress(address)}</span>
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={{
            price: {
              label: 'Price',
              color: 'hsl(var(--chart-1))',
            },
          }}
        >
          <LineChart data={transformedData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={true}
              axisLine={true}
              tickMargin={8}
            />
            <YAxis
              domain={[
                (dataMin: number) => dataMin * 0.95,
                (dataMax: number) => dataMax * 1.05,
              ]}
              tickFormatter={(val) => formatChartPrice(val)}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => {
                    return formatChartPrice(Number(value));
                  }}
                />
              }
            />
            <Line
              dataKey="price"
              strokeWidth={2}
              type="monotone"
              dot={false}
              activeDot={{ r: 4 }}
              stroke="hsl(var(--chart-1))"
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
