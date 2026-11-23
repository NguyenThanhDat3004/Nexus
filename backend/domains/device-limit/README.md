# Nexus Device Limit Service

Dịch vụ quản lý giới hạn thiết bị đăng nhập cho hệ thống Nexus (NestJS 10.4, Redis, cổng 3004).

## 1. Mục tiêu & Quy tắc giới hạn
- Mỗi tài khoản tối đa **3 thiết bị** thuộc 3 loại khác nhau:
  - Tối đa 1 Mobile
  - Tối đa 1 Desktop
  - Tối đa 1 Tablet (bao gồm iPad)
- Session được lưu trữ trên **Redis** với idle timeout **10 phút** (TTL 600 giây, trượt theo mỗi request).
- Cùng một thiết bị (trùng `deviceFingerprint`) đăng nhập lại thì làm mới session cũ, không tính vượt slot.
- Khi slot đã đầy và phát hiện thiết bị mới: trả về HTTP 409 Conflict kèm danh sách thiết bị cùng loại để user xác thực PIN và xóa thiết bị cũ.

## 2. API Endpoints
- `GET /health`: Health check (trạng thái service và kết nối Redis).
- `POST /users/:userId/device-limit/check`: Kiểm tra slot thiết bị lúc login.
  - Body: `{ deviceClass: 'mobile' | 'desktop' | 'tablet', deviceFingerprint: string }`
  - Trả về: `200 { allowed: true, existingSessionId? }` hoặc `409 { allowed: false, devices: [...] }`.
- `POST /users/:userId/sessions`: Tạo hoặc làm mới session (gọi bởi Identity sau khi login).
  - Body: `{ deviceClass, deviceFingerprint, deviceLabel, ip, existingSessionId? }`
  - Trả về: `201 { sessionId }` (mới) hoặc `200 { sessionId }` (làm mới).
- `GET /users/:userId/devices`: Lấy danh sách thiết bị đang hoạt động.
- `DELETE /users/:userId/devices/:sessionId`: Xóa session thiết bị kèm mã PIN.
  - Body: `{ pin: string }`
  - Trả về: `200` khi thành công, `401` nếu sai PIN, `404` nếu không tìm thấy hoặc không thuộc user.

## 3. Cài đặt & Chạy
```bash
# Cài đặt dependencies
npm install

# Cấu hình môi trường (.env từ .env.example)
cp .env.example .env

# Chạy dev server
npm run start:dev

# Chạy unit & integration tests
npm test

# Build production
npm run build
```
