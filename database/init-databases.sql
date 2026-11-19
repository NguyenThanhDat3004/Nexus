-- ========================================================
-- Nexus Project - Local Database Initialization Script
-- Chạy script này trên PostgreSQL (pgAdmin / DBeaver / psql)
-- để tạo các database độc lập cho từng Bounded Context.
-- ========================================================

-- 1. Database cho Identity & Access Context (Spring Boot - Đạt)
CREATE DATABASE identify_access;

-- 2. Database cho Workspace & Project Context (Spring Boot - Huy)
CREATE DATABASE workspace;

-- 3. Database cho Collaboration & Messaging Context (NestJS - Phúc)
CREATE DATABASE collaboration;

-- các flyway sẽ chạy riêng trong từng service, vui lòng khai báo cho đúng