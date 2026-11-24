export function escapeHtml(value: string): string {
  const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return value.replace(/[&<>"']/g, (c) => map[c]);
}

const oneLine = (v: string) => v.replace(/[\r\n]+/g, ' ').trim(); // chống chèn header qua subject

export interface InvitationMail { inviter_name: string; project_name: string; invite_link: string; expires_at: string }

export function invitationTemplate(input: InvitationMail) {
  const inviter = escapeHtml(input.inviter_name);
  const project = escapeHtml(input.project_name);
  const link = escapeHtml(input.invite_link);
  const expires = new Date(input.expires_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  return {
    subject: oneLine(`${input.inviter_name} mời bạn tham gia dự án ${input.project_name} trên Nexus`),
    html: `<p>Xin chào,</p>
<p><strong>${inviter}</strong> mời bạn tham gia dự án <strong>${project}</strong> trên Nexus.</p>
<p><a href="${link}">Chấp nhận lời mời</a></p>
<p>Lời mời hết hạn lúc ${escapeHtml(expires)}. Nếu bạn không mong đợi email này, hãy bỏ qua.</p>`,
    text: `${input.inviter_name} mời bạn tham gia dự án ${input.project_name} trên Nexus.\nChấp nhận: ${input.invite_link}\nHết hạn: ${expires}`,
  };
}

export function otpTemplate(code: string, ttlSeconds: number) {
  return {
    subject: 'Mã xác thực Nexus',
    html: `<p>Mã xác thực của bạn là:</p><p style="font-size:24px;letter-spacing:4px"><strong>${escapeHtml(code)}</strong></p>
<p>Mã có hiệu lực trong ${ttlSeconds} giây. KHÔNG chia sẻ mã này cho bất kỳ ai, kể cả nhân viên Nexus.</p>`,
    text: `Mã xác thực Nexus: ${code}\nHiệu lực ${ttlSeconds} giây. Không chia sẻ mã này cho bất kỳ ai.`,
  };
}