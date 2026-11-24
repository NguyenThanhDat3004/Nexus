export interface OutgoingMail { to: string; subject: string; html: string; text: string }

export abstract class MailSender {
  abstract send(mail: OutgoingMail): Promise<void>;
}

export type MailTemplateName = 'INVITATION' | 'OTP';

export abstract class MailLogRepository {
  abstract record(entry: { recipient_email: string; template: MailTemplateName; status: 'SENT' | 'FAILED'; error?: string }): Promise<void>;
}