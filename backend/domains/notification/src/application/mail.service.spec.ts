import { BadGatewayException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { escapeHtml } from '../infrastructure/mail/templates';
import { MailService } from './mail.service';

const invitation = { inviter_name: 'Linh', project_name: 'Aurora Pay', invite_link: 'http://localhost:5173/invite/abc', expires_at: '2026-11-29T00:00:00Z' };

describe('MailService', () => {
  const sender = { send: jest.fn() };
  const logs = { record: jest.fn().mockResolvedValue(undefined) };
  const config = { get: () => ['http://localhost:5173'] } as unknown as ConfigService;
  const service = new MailService(sender as never, logs as never, config as never);

  beforeEach(() => jest.clearAllMocks());

  it('gửi mail mời và ghi log SENT', async () => {
    sender.send.mockResolvedValue(undefined);
    await service.sendInvitation('a@x.com', invitation);
    expect(sender.send).toHaveBeenCalledWith(expect.objectContaining({ to: 'a@x.com', subject: expect.stringContaining('Aurora Pay') }));
    expect(logs.record).toHaveBeenCalledWith(expect.objectContaining({ status: 'SENT', template: 'INVITATION' }));
  });

  it('escape HTML trong tên dự án', async () => {
    sender.send.mockResolvedValue(undefined);
    await service.sendInvitation('a@x.com', { ...invitation, project_name: '<script>alert(1)</script>' });
    expect(sender.send.mock.calls[0][0].html).not.toContain('<script>');
  });

  it('chặn link ngoài domain FE (chống phishing)', async () => {
    await expect(service.sendInvitation('a@x.com', { ...invitation, invite_link: 'https://evil.example/login' })).rejects.toBeInstanceOf(BadRequestException);
    expect(sender.send).not.toHaveBeenCalled();
  });

  it('SMTP lỗi → 502 và ghi log FAILED', async () => {
    sender.send.mockRejectedValue(new Error('ECONNREFUSED'));
    await expect(service.sendOtp('a@x.com', '123456', 60)).rejects.toBeInstanceOf(BadGatewayException);
    expect(logs.record).toHaveBeenCalledWith(expect.objectContaining({ status: 'FAILED', template: 'OTP' }));
  });

  it('escapeHtml', () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;');
  });
});