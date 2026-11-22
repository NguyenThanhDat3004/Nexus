Cấu trúc thư mục
Đây là trạng thái sau khi làm xong 9 commit. Số trong ngoặc là commit tạo ra file đó.


backend/domains/notification/
├── .env.example                          (1)
├── .gitignore                            (1)
├── nest-cli.json                         (1)
├── package.json / package-lock.json      (1, cập nhật ở 2,3,6,7,8)
├── tsconfig.json / tsconfig.build.json   (1)
├── README.md                             (9)
│
├── prisma/
│   ├── schema.prisma                     (3)  bảng notifications, notification_recipients, mail_logs
│   └── migrations/
│       ├── migration_lock.toml           (3)
│       └── 20261122000000_init/migration.sql (3)
│
└── src/
    ├── main.ts                           (1, sửa ở 6: gắn ConfiguredIoAdapter)
    ├── app.module.ts                     (1, thêm module ở 2,3,4,7,8)
    ├── notification.module.ts            (4, thêm controller ở 5, realtime ở 6)
    ├── mail.module.ts                    (7)
    ├── otp.module.ts                     (8)
    │
    ├── config/
    │   ├── configuration.ts              (1)  đọc env, kiểm tra secret
    │   └── configuration.spec.ts         (1)
    │
    ├── common/                           ── dùng chung cho mọi module
    │   ├── common.providers.ts           (2)  ValidationPipe, interceptor, filter toàn cục
    │   ├── common.spec.ts                (2)
    │   ├── http/
    │   │   ├── api-response.ts           (2)  envelope {success, code, message, data}
    │   │   ├── response-envelope.interceptor.ts (2)
    │   │   └── api-exception.filter.ts   (2)
    │   └── auth/
    │       ├── auth.module.ts            (2)
    │       ├── access-token.verifier.ts  (2)  verify JWT của Đạt
    │       ├── jwt-auth.guard.ts         (2)  guard + decorator @CurrentUser
    │       └── internal-token.guard.ts   (2)  guard X-Internal-Token
    │
    ├── domain/                           ── lớp 1: kiểu dữ liệu nghiệp vụ, không phụ thuộc framework
    │   └── notification.ts               (4)  NotificationEvent, NotificationItem, NOTIFICATION_TYPES
    │
    ├── application/                      ── lớp 2: nghiệp vụ (use case)
    │   ├── ports/                        ── interface; infrastructure sẽ implement
    │   │   ├── notification.repository.ts (4)
    │   │   ├── realtime.publisher.ts     (4)
    │   │   ├── membership.port.ts        (6)
    │   │   └── mail.ports.ts             (7)  MailSender, MailLogRepository
    │   ├── cursor.ts                     (4)  phân trang theo cursor
    │   ├── notification.service.ts       (4)
    │   ├── notification.service.spec.ts  (4)
    │   ├── mail.service.ts               (7)
    │   ├── mail.service.spec.ts          (7)
    │   ├── otp.service.ts                (8)
    │   └── otp.service.spec.ts           (8)
    │
    ├── infrastructure/                   ── lớp 3: kết nối hạ tầng thật
    │   ├── prisma/
    │   │   ├── prisma.service.ts         (3)
    │   │   ├── prisma-notification.repository.ts (4)
    │   │   └── prisma-mail-log.repository.ts     (7)
    │   ├── redis/
    │   │   └── redis.module.ts           (8)
    │   ├── mail/
    │   │   ├── nodemailer.mail-sender.ts (7)
    │   │   └── templates.ts              (7)  template mail mời và OTP (có escape HTML)
    │   ├── realtime/
    │   │   ├── realtime.hub.ts           (6)  phát cho cả SSE lẫn Socket.IO
    │   │   └── configured-io.adapter.ts  (6)  CORS cho Socket.IO
    │   └── membership/
    │       └── stub-membership.adapter.ts (6)  TẠM, chờ API của Huy
    │
    ├── interfaces/                       ── lớp 4: cổng vào (HTTP, WebSocket)
    │   ├── http/
    │   │   ├── health.controller.ts      (1)
    │   │   ├── notifications.controller.ts (5, thêm SSE ở 6)
    │   │   ├── notifications.e2e.spec.ts (5)
    │   │   ├── internal-events.controller.ts (5)
    │   │   ├── internal-mail.controller.ts   (7)
    │   │   ├── internal-otp.controller.ts    (8)
    │   │   └── dto/
    │   │       ├── notification-event.dto.ts     (5)
    │   │       ├── list-notifications.query.ts   (5)
    │   │       ├── invitation.dto.ts             (7)
    │   │       └── otp.dto.ts                    (8)
    │   └── ws/
    │       ├── realtime.gateway.ts       (6)
    │       └── realtime.e2e.spec.ts      (6)
    │
    └── testing/                          ── chỉ dùng cho test, không nằm trong bản build
        ├── setup-env.ts                  (5)
        └── in-memory-notification.repository.ts (5)
Chiều phụ thuộc giữa các lớp chỉ đi một hướng:


interfaces → application → domain
                 ↑
          infrastructure (implement các port trong application/ports)
Service trong application/ chỉ biết đến các abstract class trong ports/, không biết đến Prisma, Redis hay nodemailer. Nhờ vậy:

Trong test, thay hạ tầng thật bằng bản in-memory hoặc mock rất dễ.
Sau này đổi /internal/v1/events sang queue thì chỉ cần thêm một consumer gọi cùng hàm handleEvent(), logic nghiệp vụ không phải sửa.



Bảng commit
#	Commit	Nội dung	~Dòng (không tính lockfile)
1	chore(notification): scaffold NestJS service with validated config	khung project, config, health	~200
2	feat(notification): add response envelope, error filter and auth guards	envelope, filter, JWT guard, internal guard, test	~330
3	feat(notification): add Prisma schema and initial migration	schema 3NF, migration, PrismaService, tạo DB	~170
4	feat(notification): add notification service and repository	domain, port, repo Prisma, service, test	~300
5	feat(notification): add notification REST API	DTO, controller public và internal, e2e test	~300
6	feat(notification): stream notifications over SSE and WebSocket	hub, SSE, gateway, membership stub, test	~300
7	feat(notification): add invitation email with mail log	nodemailer, template, mail log, test	~280
8	feat(notification): add OTP issue and verify backed by Redis	Redis, OtpService, controller, test	~260
9	docs(notification): document API, setup and event contract	README, .env.example gốc	~150