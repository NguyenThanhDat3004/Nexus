# Domain: Notification & Realtime Dispatcher

- **Port nội bộ:** `3002`
- **Công nghệ:** Node.js 22+ / NestJS 11 / PostgreSQL (Prisma 6) / Redis (ioredis) / Socket.IO / SSE / Nodemailer
- **Phụ trách chính:** Phúc

## Nghiệp vụ sở hữu (Domain Capabilities):
1. **Thông báo trong ứng dụng (In-app Notifications):**
   - Nhận event từ các service khác (Workspace, Collaboration...) qua API nội bộ, lưu DB và đẩy realtime tới người nhận.
   - Chống trùng: cùng `event_id` gửi lại (retry) không tạo thông báo mới.
  - Danh sách thông báo phân trang theo offset (`page`, `limit`), đếm số chưa đọc, đánh dấu đã đọc từng cái hoặc tất cả.     - Trạng thái đã đọc lưu riêng cho từng người nhận.
2. **Realtime (Project Notifications & Channel Events):**
   - **SSE:** luồng một chiều cho feed thông báo và chuông, có heartbeat 25 giây.
   - **WebSocket (Socket.IO, namespace `/realtime`):** hai chiều. Client subscribe kênh để nhận sự kiện của kênh. Server kiểm tra quyền thành viên trước khi cho vào (chống IDOR).
3. **Email Dispatcher:**
   - Mail mời tham gia dự án. Link mời chỉ được trỏ về domain FE của Nexus (chống phishing).
   - Mail mã OTP.
   - Ghi lịch sử gửi mail vào `mail_logs` (SENT / FAILED), **không** lưu nội dung OTP.
4. **OTP (Redis):**
   - Mã 6 số sinh bằng `crypto.randomInt`, hiệu lực **60 giây**, Redis chỉ lưu **HMAC-SHA256** của mã, không lưu mã gốc.
   - Chống spam: chỉ gửi lại sau 60 giây. Chống dò mã: sai quá **5 lần** thì mã bị huỷ.
   - Mỗi mã chỉ dùng được **1 lần**, kể cả khi có 2 request đúng mã gửi cùng lúc. Mã tách riêng theo mục đích: `REGISTER`, `LOGIN`, `RESET_PIN`.

## Cấu trúc thư mục (DDD 4 lớp):
```text
notification/
├── package.json
├── .env.example
├── prisma/
│   ├── schema.prisma                 # notifications, notification_recipients, mail_logs
│   └── migrations/                   # Prisma Migrate (20261123161152_init/...)
└── src/
    ├── main.ts                       # Bootstrap, CORS, Socket.IO adapter
    ├── app.module.ts / notification.module.ts / mail.module.ts / otp.module.ts
    ├── config/                       # Đọc env, dừng khởi động nếu thiếu secret
    ├── common/
    │   ├── http/                     # Envelope { success, code, message, data }, exception filter
    │   └── auth/                     # Verify JWT, JwtAuthGuard, @CurrentUser, InternalTokenGuard
    ├── domain/                       # NotificationEvent, NotificationItem, NOTIFICATION_TYPES
    ├── application/                  # Use cases: NotificationService, MailService, OtpService
    │   └── ports/                    # Interface: NotificationRepository, RealtimePublisher, MembershipPort, MailSender...
    ├── infrastructure/               # Adapter thật: Prisma, Redis, Nodemailer, RealtimeHub, Membership stub
    ├── interfaces/
    │   ├── http/                     # REST Controllers + DTO (class-validator)
    │   └── ws/                       # Socket.IO Gateway
    └── testing/                      # Chỉ dùng cho test (in-memory repo, env test)
```
Phụ thuộc chỉ đi một chiều `interfaces → application → domain`. `infrastructure` implement các port, nên service nghiệp vụ không phụ thuộc Prisma, Redis hay Nodemailer.

---

## Chạy local

### 1. Hạ tầng (Docker)
```bash
docker run -d --name nexus-pg    -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16
docker run -d --name nexus-redis -p 6379:6379 redis:7
docker run -d --name nexus-mail  -p 1025:1025 -p 8025:8025 axllent/mailpit   # xem mail: http://localhost:8025
```
Tạo database bằng `database/init-databases.sql` (đã có dòng `CREATE DATABASE notification;`).

### 2. Cấu hình
```bash
cd backend/domains/notification
cp .env.example .env
```
Các biến **bắt buộc** (thiếu hoặc quá ngắn thì service không khởi động):

| Biến | Yêu cầu | Ghi chú |
|---|---|---|
| `JWT_SECRET` | ≥ 32 ký tự | **Phải trùng** với Identity service (Đạt) |
| `INTERNAL_SERVICE_TOKEN` | ≥ 24 ký tự | Token dùng chung giữa các service. Sinh bằng `openssl rand -hex 32` |
| `OTP_HMAC_SECRET` | ≥ 32 ký tự | Sinh bằng `openssl rand -hex 32` |
| `NODE_ENV` | `development` khi dev | Bỏ trống thì coi như production: membership stub **từ chối tất cả** |

Các biến còn lại (`DATABASE_URL`, `REDIS_*`, `SMTP_*`, `OTP_*`, `WEB_ORIGIN`) xem trong `.env.example`.

### 3. Cài đặt và chạy
```bash
npm install
npx prisma generate
npm run prisma:migrate      # = prisma migrate dev (môi trường server: npx prisma migrate deploy)
npm run start:dev           # http://localhost:3002/health
```

### 4. Test
```bash
npm test          # 8 bộ test / 52 test, KHÔNG cần Postgres/Redis (dùng in-memory repo + ioredis-mock)
npm run test:cov
```

| Script | Mô tả |
|---|---|
| `start:dev` | Chạy dev, tự reload |
| `build` / `start:prod` | Build ra `dist/` và chạy bản build |
| `test` / `test:cov` | Unit + e2e test / kèm coverage |
| `prisma:migrate` | Tạo và chạy migration (dev) |
| `prisma:studio` | Xem dữ liệu DB trên trình duyệt |

---

## API

Mọi REST response đều có dạng:
```json
{ "success": true, "code": 200, "message": "OK", "data": { } }
```
Khi lỗi thì `success: false`, `data: null`. Lỗi validate có thêm `errors: string[]`. Lỗi không lường trước trả `500 INTERNAL_ERROR` và **không** lộ stack trace.

### 1. Public: FE gọi qua API Gateway (`8000`), header `Authorization: Bearer <JWT>`

| Method | Path | Mô tả | Response `data` |
|---|---|---|---|
| GET | `/api/v1/notifications?limit=20&cursor=` | Thông báo của user trong token, mới nhất trước. `limit` từ 1 đến 50 | `{ items: NotificationItem[], next_cursor }` |
| GET | `/api/v1/notifications?page=1&limit=20` | Thông báo của user trong token, mới nhất trước. `page` từ 1 đến 100, `limit` từ 1 đến 50 | `{ items: NotificationItem[], page, limit, total, has_more }` |
| PATCH | `/api/v1/notifications/{id}/read` | Đánh dấu đã đọc. `id` phải là UUID | `{ notification_id, read: true }` |
| POST | `/api/v1/notifications/read-all` | Đánh dấu tất cả đã đọc | `{ updated }` |
| GET | `/api/v1/notifications/stream` | **SSE**: event `notification` (data là `NotificationItem`), event `ping` mỗi 25 giây | stream |

Mã lỗi:
- `401 MISSING_ACCESS_TOKEN` / `INVALID_ACCESS_TOKEN`
- `404 NOTIFICATION_NOT_FOUND`: thông báo không tồn tại **hoặc** thuộc người khác (chống IDOR)
- `400`: id không phải UUID, `page` / `limit` ngoài khoảng cho phép, hoặc gửi tham số lạ (ví dụ `cursor`)

```json
// NotificationItem
{
  "notification_id": "6f1c...-uuid",
  "type": "project.member_added",
  "title": "Bạn được thêm vào dự án",
  "body": "Aurora Pay",
  "project_id": "p1",
  "channel_id": null,
  "created_at": "2026-11-22T10:00:00.000Z",
  "read_at": null
}
```

### 2. Realtime WebSocket: Socket.IO namespace `/realtime`

Xác thực bằng JWT gửi trong `handshake.auth.token` (**không** gửi qua query string). Việc kiểm tra nằm ở middleware, nên token sai thì client nhận `connect_error: UNAUTHORIZED` và không bao giờ kết nối được.

| Hướng | Event | Payload | Ý nghĩa |
|---|---|---|---|
| server → client | `notification` | `NotificationItem` | Thông báo gửi cho chính user |
| server → client | `channel.event` | `NotificationItem` | Sự kiện của kênh đã subscribe |
| client → server (ack) | `channel.subscribe` | `{ channel_id }` | Ack trả `400 VALIDATION_FAILED`, `403 FORBIDDEN` hoặc `success` |
| client → server (ack) | `channel.unsubscribe` | `{ channel_id }` | Huỷ đăng ký |

### 3. Internal: chỉ service nội bộ gọi, header `X-Internal-Token`

> ⚠️ API Gateway **không được** expose `/internal/*` ra ngoài.

| Method | Path | Ai gọi | Body | Response `data` |
|---|---|---|---|---|
| POST | `/internal/v1/events` | Workspace, Collaboration | `NotificationEvent` | `202` `{ created, notification_id }`. Trùng `event_id` thì `created: false` |
| POST | `/internal/v1/mails/invitation` | Workspace / Organization | `{ to_email, inviter_name, project_name, invite_link, expires_at }` | `202` `{ sent: true }` |
| POST | `/internal/v1/otp/send` | Identity | `{ email, purpose }` | `202` `{ expires_in: 60 }` |
| POST | `/internal/v1/otp/verify` | Identity | `{ email, purpose, code }` | `200` `{ valid }` |

`purpose` nhận một trong `REGISTER`, `LOGIN`, `RESET_PIN`. `code` gồm đúng 6 chữ số.

Mã lỗi:
- `401 INVALID_INTERNAL_TOKEN`
- `400 VALIDATION_FAILED`
- `400 INVITE_LINK_NOT_ALLOWED`: link mời không thuộc `WEB_ORIGIN`
- `429 OTP_RESEND_TOO_SOON`
- `502 MAIL_DELIVERY_FAILED`

### 4. Tiện ích

| Method | Path | Mô tả |
|---|---|---|
| GET | `/health` | `{ status: "ok", service: "notification" }` |

---

## Event contract (dành cho các service gửi event)

```json
POST /internal/v1/events
{
  "event_id": "evt-123",
  "event_type": "project.member_added",
  "occurred_at": "2026-11-22T10:00:00Z",
  "actor_user_id": "u1",
  "project_id": "p1",
  "channel_id": null,
  "recipient_user_ids": ["u2", "u3"],
  "title": "Bạn được thêm vào dự án",
  "body": "Aurora Pay",
  "data": {}
}
```

| Trường | Bắt buộc | Ràng buộc |
|---|---|---|
| `event_id` | ✔ | 1–64 ký tự, **duy nhất**. Dùng để chống trùng khi retry |
| `event_type` | ✔ | `project.updated` \| `project.member_added` \| `channel.created` \| `channel.message_mentioned` |
| `occurred_at` | ✔ | ISO 8601 |
| `recipient_user_ids` | ✔ | 1–1000 phần tử, mỗi id 1–64 ký tự (trùng sẽ được tự gộp) |
| `title` / `body` | ✔ | 1–200 / 1–2000 ký tự |
| `actor_user_id`, `project_id`, `channel_id` | | ≤ 64 ký tự. Có `channel_id` thì phát thêm `channel.event` tới phòng của kênh đó |
| `data` | | object tuỳ ý |

---

## Kết nối từ Frontend

```ts
// WebSocket
import { io } from 'socket.io-client'
const socket = io(`${API_BASE_URL}/realtime`, { auth: { token: accessToken } })
socket.on('connect_error', (err) => { /* UNAUTHORIZED → về trang login */ })
socket.on('notification', (n) => { /* cập nhật chuông / danh sách */ })
const ack = await socket.emitWithAck('channel.subscribe', { channel_id })

// SSE — EventSource gốc không gửi được header, dùng @microsoft/fetch-event-source
import { fetchEventSource } from '@microsoft/fetch-event-source'
await fetchEventSource(`${API_BASE_URL}/api/v1/notifications/stream`, {
  headers: { Authorization: `Bearer ${accessToken}` },
  onmessage: (ev) => { if (ev.event === 'notification') handle(JSON.parse(ev.data)) },
})
```

---

## Database (`notification`, chuẩn 3NF)

| Bảng | Khoá | Mô tả |
|---|---|---|
| `notifications` | PK `notification_id` (uuid), UNIQUE `event_id` | Nội dung thông báo, mỗi event chỉ lưu 1 lần |
| `notification_recipients` | PK (`notification_id`, `user_id`), FK → `notifications` (cascade) | Ai nhận và `read_at` riêng của từng người |
| `mail_logs` | PK `mail_id` (uuid) | Lịch sử gửi mail: `template` (INVITATION/OTP), `status` (SENT/FAILED), `error` |

`project_id`, `channel_id` và `user_id` là id do service khác sở hữu, nên **không** đặt khoá ngoại xuyên database (database-per-domain).

## Bảo mật

- **JWT:** chỉ chấp nhận HS256 (chặn `alg=none` và tấn công đổi thuật toán). `user_id` luôn lấy từ claim `sub`, **không** lấy từ body hay query.
- **IDOR:** điều kiện `user_id` nằm ngay trong câu WHERE. "Không tồn tại" và "của người khác" đều trả cùng một mã 404. Subscribe kênh phải qua `MembershipPort`.
- **Internal token:** so sánh constant-time (`timingSafeEqual` trên SHA-256).
- **Validation:** `whitelist` + `forbidNonWhitelisted`, nên body có field lạ sẽ bị trả 400 (chống mass assignment).
- **Mail:** escape HTML mọi biến, bỏ ký tự xuống dòng trong subject (chống header injection), giới hạn domain của link mời.
- **OTP:** chỉ lưu HMAC, mã sinh bằng `crypto`, TTL 60 giây, cooldown 60 giây, tối đa 5 lần thử, dùng 1 lần, không ghi log mã.
- **Membership stub fail-closed:** chỉ cho phép khi `NODE_ENV` là `development` hoặc `test`.

## Phụ thuộc với các domain khác

| Domain | Cần gì | Trạng thái |
|---|---|---|
| Identity (Đạt) | Dùng chung `JWT_SECRET`, claim `sub` = `user_id`. Gọi `/internal/v1/otp/*` | Cần xác nhận |
| Workspace (Huy) | API kiểm tra user có quyền vào kênh không (thay `StubMembershipAdapter`). Gọi `/internal/v1/events` và `/internal/v1/mails/invitation` | Chờ API |
| API Gateway (Huy) | Route `/api/v1/notifications/*` và WebSocket `/realtime` về `3002`. **Chặn** `/internal/*` | Chờ cấu hình |

## Việc còn lại (Roadmap)

- [ ] Thay `StubMembershipAdapter` bằng HTTP client gọi Workspace service.
- [ ] Đưa event và mail vào hàng đợi (BullMQ, sau đó Kafka). Consumer gọi lại `NotificationService.handleEvent()`, không phải sửa logic nghiệp vụ.
- [ ] Redis adapter cho Socket.IO khi chạy nhiều instance.
- [ ] Mail thông báo bảo mật (đăng nhập lạ, thiết bị mới) theo event từ Identity.