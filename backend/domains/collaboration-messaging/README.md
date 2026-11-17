# Domain: Collaboration & Messaging

- **Port nội bộ:** `3001`
- **Công nghệ:** Node.js / NestJS / WebSocket (Socket.IO) / PostgreSQL hoặc MongoDB
- **Phụ trách chính:** Phúc

## Nghiệp vụ sở hữu (Domain Capabilities):
1. **Chat & Realtime:**
   - Quản lý tin nhắn thời gian thực trong kênh và direct message.
   - Luồng thảo luận theo Thread, Reply, Mention (@user, @team).
   - Biểu tượng cảm xúc (Reactions) và cập nhật tin nhắn tức thì qua WebSocket/SSE.
2. **Context Tagging:**
   - Đánh dấu tin nhắn quan trọng: `Requirement`, `Decision`, `Customer Confirmation`.
   - Cầu nối đồng bộ tin nhắn được duyệt sang `Project Common Hub`.
3. **Sự kiện Kênh (Channel Events):**
   - Phát sóng các sự kiện thay đổi trạng thái trong kênh cho tất cả thành viên đang online.

## Cấu trúc thư mục (DDD 4 lớp NestJS):
```text
collaboration-messaging/
├── package.json
└── src/
    ├── domain/               # Message, Thread, Reaction aggregates
    ├── application/          # SendMessageUseCase, TagContextUseCase
    ├── infrastructure/       # Persistence (Prisma/TypeORM/Mongoose), Redis PubSub
    └── interfaces/           # WebSocket Gateways, REST Controllers
```
