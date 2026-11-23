import { Body, Controller, Get, INestApplication, Post, UseGuards } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { IsString } from 'class-validator';
import request from 'supertest';
import { buildConfig } from '../config/configuration';
import { AccessTokenVerifier, AuthUser, extractBearerToken } from './auth/access-token.verifier';
import { AuthModule } from './auth/auth.module';
import { InternalTokenGuard, safeEqual } from './auth/internal-token.guard';
import { CurrentUser, JwtAuthGuard } from './auth/jwt-auth.guard';
import { globalProviders } from './common.providers';

const env = {
  JWT_SECRET: 'test-jwt-secret-0123456789-abcdefghij',
  INTERNAL_SERVICE_TOKEN: 'test-internal-token-0123456789',
  OTP_HMAC_SECRET: 'test-otp-secret-0123456789-abcdefghij',
};

class EchoDto { @IsString() name: string }

@Controller('t')
class TestController {
  @Get('me') @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthUser) { return user; }

  @Post('internal') @UseGuards(InternalTokenGuard)
  internal(@Body() dto: EchoDto) { return dto; }

  @Get('boom')
  boom() { throw new Error('database password leaked in stack'); }
}

describe('common: envelope, filter, guards', () => {
  let app: INestApplication;
  let jwt: JwtService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true, load: [() => buildConfig(env)] }), AuthModule],
      controllers: [TestController],
      providers: [...globalProviders],
    }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    await app.init();
    jwt = moduleRef.get(JwtService);
  });
  afterAll(() => app.close());

  const get = (path: string, token?: string) => {
    const r = request(app.getHttpServer()).get(path);
    return token ? r.set('Authorization', `Bearer ${token}`) : r;
  };

  it('bọc kết quả vào envelope', async () => {
    const res = await get('/t/me', jwt.sign({ sub: 'user-1' }));
    expect(res.body).toEqual({ success: true, code: 200, message: 'OK', data: { userId: 'user-1' } });
  });
  it('401 khi thiếu token', async () => {
    const res = await get('/t/me');
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ success: false, message: 'MISSING_ACCESS_TOKEN', data: null });
  });
  it('401 khi token ký bằng secret khác', async () => {
    const forged = new JwtService({ secret: 'another-secret-another-secret-123' }).sign({ sub: 'user-1' });
    expect((await get('/t/me', forged)).body.message).toBe('INVALID_ACCESS_TOKEN');
  });
  it('401 khi token hết hạn', async () => {
    expect((await get('/t/me', jwt.sign({ sub: 'u' }, { expiresIn: -10 }))).status).toBe(401);
  });
  it('401 khi alg=none', async () => {
    const payload = jwt.sign({ sub: 'user-1' }).split('.')[1];
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    expect((await get('/t/me', `${header}.${payload}.`)).status).toBe(401);
  });
  it('401 khi token không có sub', async () => {
    await expect(app.get(AccessTokenVerifier).verify(jwt.sign({ role: 'admin' }))).rejects.toThrow('INVALID_ACCESS_TOKEN');
  });
  it('route nội bộ: sai token 401, đúng token 201', async () => {
    const server = app.getHttpServer();
    expect((await request(server).post('/t/internal').set('X-Internal-Token', 'wrong').send({ name: 'a' })).status).toBe(401);
    const good = await request(server).post('/t/internal').set('X-Internal-Token', env.INTERNAL_SERVICE_TOKEN).send({ name: 'a' });
    expect(good.status).toBe(201);
  });
  it('field lạ / sai kiểu → 400 VALIDATION_FAILED', async () => {
    const res = await request(app.getHttpServer())
      .post('/t/internal').set('X-Internal-Token', env.INTERNAL_SERVICE_TOKEN).send({ name: 1, is_admin: true });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('VALIDATION_FAILED');
  });
  it('lỗi bất ngờ → 500 chung chung, không lộ chi tiết', async () => {
    const res = await get('/t/boom');
    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toContain('password');
  });
});

describe('helpers', () => {
  it('extractBearerToken', () => {
    expect(extractBearerToken('Bearer abc')).toBe('abc');
    expect(extractBearerToken('Basic abc')).toBeNull();
    expect(extractBearerToken(undefined)).toBeNull();
  });
  it('safeEqual', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'abcd')).toBe(false);
  });
});