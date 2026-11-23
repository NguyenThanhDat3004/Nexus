import { Module } from '@nestjs/common';
import { LocalPinVerificationService } from './pin-verification.service';
import { PIN_VERIFICATION_SERVICE } from './pin-verification.interface';

@Module({
  providers: [
    {
      provide: PIN_VERIFICATION_SERVICE,
      useClass: LocalPinVerificationService,
    },
    LocalPinVerificationService,
  ],
  exports: [PIN_VERIFICATION_SERVICE, LocalPinVerificationService],
})
export class PinModule {}
