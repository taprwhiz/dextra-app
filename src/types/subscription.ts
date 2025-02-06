export class PaymentError extends Error {
  constructor(
    public code: number,
    message: string,
  ) {
    super(message);
    this.name = 'NeurPaymentError';
  }
}

export enum PaymentErrorCode {
  UNKNOWN = 0,
  EXTERNAL_ERROR = 1,
  BAD_WALLET = 2,
  INSUFFICIENT_BALANCE = 3,
  TRANSFER_FAILED = 4,
}
