-- ========================================================
-- Nexus Project - Local Database Initialization Script
-- Chạy script này trên PostgreSQL (pgAdmin / DBeaver / psql)
-- để tạo các database độc lập cho từng Bounded Context.
-- ========================================================

-- 1. Database cho Identity & Access Context (Spring Boot - Đạt)
CREATE DATABASE identity;

-- 2. Database cho Workspace & Project Context (Spring Boot - Huy)
CREATE DATABASE workspace;

-- 3. Database cho Collaboration & Messaging Context (NestJS - Phúc)
CREATE DATABASE collaboration;

-- 4. Database cho Notification Context (NestJS - Phúc)
-- Bảng do Prisma Migrate tạo: cd backend/domains/notification && npx prisma migrate deploy
CREATE DATABASE notification;

-- các flyway sẽ chạy riêng trong từng service, vui lòng khai báo cho đúng