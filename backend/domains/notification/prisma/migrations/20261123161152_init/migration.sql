-- CreateEnum
CREATE TYPE "MailTemplate" AS ENUM ('INVITATION', 'OTP');

-- CreateEnum
CREATE TYPE "MailStatus" AS ENUM ('SENT', 'FAILED');

-- CreateTable
CREATE TABLE "notifications" (
    "notification_id" UUID NOT NULL,
    "event_id" VARCHAR(64) NOT NULL,
    "type" VARCHAR(64) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "body" VARCHAR(2000) NOT NULL,
    "project_id" VARCHAR(64),
    "channel_id" VARCHAR(64),
    "actor_user_id" VARCHAR(64),
    "payload" JSONB,
    "occurred_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("notification_id")
);

-- CreateTable
CREATE TABLE "notification_recipients" (
    "notification_id" UUID NOT NULL,
    "user_id" VARCHAR(64) NOT NULL,
    "read_at" TIMESTAMPTZ(3),

    CONSTRAINT "notification_recipients_pkey" PRIMARY KEY ("notification_id","user_id")
);

-- CreateTable
CREATE TABLE "mail_logs" (
    "mail_id" UUID NOT NULL,
    "recipient_email" VARCHAR(254) NOT NULL,
    "template" "MailTemplate" NOT NULL,
    "status" "MailStatus" NOT NULL,
    "error" VARCHAR(500),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mail_logs_pkey" PRIMARY KEY ("mail_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notifications_event_id_key" ON "notifications"("event_id");

-- CreateIndex
CREATE INDEX "notifications_project_id_idx" ON "notifications"("project_id");

-- CreateIndex
CREATE INDEX "notification_recipients_user_id_read_at_idx" ON "notification_recipients"("user_id", "read_at");

-- CreateIndex
CREATE INDEX "mail_logs_recipient_email_created_at_idx" ON "mail_logs"("recipient_email", "created_at");

-- AddForeignKey
ALTER TABLE "notification_recipients" ADD CONSTRAINT "notification_recipients_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("notification_id") ON DELETE CASCADE ON UPDATE CASCADE;
