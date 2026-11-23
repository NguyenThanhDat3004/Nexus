import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import type { AppConfig } from '../../config/configuration';
import { AccessTokenVerifier } from './access-token.verifier';
import { InternalTokenGuard } from './internal-token.guard';
import { JwtAuthGuard } from './jwt-auth.guard';


@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => ({ secret: config.get('jwt', { infer: true }).secret }),
    }),
  ],
  providers: [AccessTokenVerifier, JwtAuthGuard, InternalTokenGuard],
  exports: [AccessTokenVerifier, JwtAuthGuard, InternalTokenGuard],
})
export class AuthModule {}