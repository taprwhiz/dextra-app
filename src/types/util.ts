import { z } from 'zod';

export interface ToolActionResult {
  result?: string;
  message: string;
  addResultUtility?: (result: any) => void;
}

export type ToolUpdate = {
  type: string;
  toolCallId: string;
  result: string;
};

export const publicKeySchema = z
  .string()
  .regex(
    /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
    'Invalid Solana address format. Must be a base58 encoded string.',
  )
  .describe('A valid Solana wallet address. (base58 encoded)');
