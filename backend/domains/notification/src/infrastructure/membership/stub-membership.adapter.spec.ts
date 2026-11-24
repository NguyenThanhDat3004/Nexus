import { Logger } from '@nestjs/common';
import { StubMembershipAdapter } from './stub-membership.adapter';

describe('StubMembershipAdapter (fail-closed)', () => {
  const original = process.env.NODE_ENV;
  beforeAll(() => jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined));
  afterEach(() => (process.env.NODE_ENV = original));
  afterAll(() => jest.restoreAllMocks());

  it.each([
    ['development', true],
    ['test', true],
    ['production', false],
    ['staging', false],
    [undefined, false], // quên đặt NODE_ENV → vẫn từ chối
  ])('NODE_ENV=%s → cho phép = %s', async (env, expected) => {
    if (env === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = env;
    expect(await new StubMembershipAdapter().canAccessChannel('u1', 'c1')).toBe(expected);
  });
});
