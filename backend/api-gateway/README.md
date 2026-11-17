# API Gateway (NestJS)

- **Port mặc định:** `8000`
- **Công nghệ:** Node.js / NestJS
- **Vai trò:**
  - Cửa ngõ duy nhất đón nhận request từ Frontend (Web & Mobile).
  - Điều phối và ánh xạ đường dẫn (Path-based Routing):
    - `/api/v1/auth/*` ➔ chuyển tiếp về `identity-access` (Port 8081).
    - `/api/v1/workspaces/*` ➔ chuyển tiếp về `workspace-management` (Port 8082).
    - `/api/v1/chat/*` & `/socket.io` ➔ chuyển tiếp về `collaboration-messaging` (Port 3001).
    - `/api/v1/notifications/*` ➔ chuyển tiếp về `notification` (Port 3002).
    - `/api/v1/integrations/*` ➔ chuyển tiếp về `external-integration` (Port 3003).
  - Xử lý CORS tập trung, tránh lỗi preflight.
  - Rate Limiting & Edge Bot Filtering (kết hợp Cloudflare).
  - Xác thực Token cơ bản (Pre-validation) trước khi đưa vào các Domain nội bộ.
