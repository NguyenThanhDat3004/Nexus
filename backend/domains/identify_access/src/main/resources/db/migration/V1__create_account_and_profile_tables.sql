-- ==============================================================================
-- NEXUS IDENTITY & ACCESS MANAGEMENT - DATABASE MIGRATION V1
-- ==============================================================================
-- Bảng: accounts (Thông tin đăng nhập & xác thực tài khoản)
-- Bảng: profiles (Thông tin cá nhân người dùng, quan hệ 1 - 1 với accounts)
-- ==============================================================================

-- Kích hoạt extension pgcrypto để hỗ trợ sinh UUID v4 tự động
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. BẢNG ACCOUNTS: Lưu thông tin tài khoản đăng nhập và bảo mật
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),                           -- Mật khẩu băm (BCrypt/Argon2), sinh ngẫu nhiên khi tạo
    auth_provider VARCHAR(50) NOT NULL DEFAULT 'LOCAL',    -- 'LOCAL', 'GOOGLE', 'SSO'
    provider_id VARCHAR(255),                             -- ID từ nhà cung cấp OAuth (Google Sub ID, SSO UID)
    role VARCHAR(50) NOT NULL DEFAULT 'USER',             -- 'USER', 'ADMIN', 'PM', 'CUSTOMER'
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',         -- 'ACTIVE', 'LOCKED', 'PENDING_VERIFICATION'
    is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,     -- Đã xác thực OTP email hay chưa
    failed_login_attempts INT NOT NULL DEFAULT 0,         -- Đếm số lần đăng nhập sai
    last_login_at TIMESTAMPTZ,                            -- Lần đăng nhập thành công gần nhất
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 2. BẢNG PROFILES: Lưu thông tin cá nhân (1 - 1 với accounts)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL UNIQUE,                      -- Khóa ngoại 1 - 1 trỏ sang accounts
    full_name VARCHAR(150),
    avatar_url TEXT,
    phone_number VARCHAR(20),
    bio TEXT,
    date_of_birth DATE,
    gender VARCHAR(20),                                   -- 'MALE', 'FEMALE', 'OTHER'
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_profiles_account
        FOREIGN KEY (account_id)
        REFERENCES accounts(id)
        ON DELETE CASCADE
);

-- ------------------------------------------------------------------------------
-- 3. CHỈ MỤC (INDEXES) TỐI ƯU TRUY VẤN
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts(email);
CREATE INDEX IF NOT EXISTS idx_accounts_auth_provider ON accounts(auth_provider, provider_id);
CREATE INDEX IF NOT EXISTS idx_profiles_account_id ON profiles(account_id);
