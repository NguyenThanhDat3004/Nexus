export interface PinVerificationService {
  verifyPin(userId: string, pin: string): Promise<boolean>;
}

export const PIN_VERIFICATION_SERVICE = 'PIN_VERIFICATION_SERVICE';
