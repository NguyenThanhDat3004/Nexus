# Domain: Notification & Dispatcher

- **Port nội bộ:** `3002`
- **Công nghệ:** Node.js / NestJS / BullMQ hoặc Kafka / SMTP Mailer
- **Phụ trách chính:** Phúc

## Nghiệp vụ sở hữu (Domain Capabilities):
1. **Email Dispatcher:**
   - Mail gửi mã OTP xác thực tài khoản (hạn 1 phút).
   - Mail thông báo cảnh báo bảo mật (phát hiện đăng nhập lạ, thêm thiết bị mới).
   - Mail gửi lời mời tham gia tổ chức / dự án.
2. **Push & In-App Notification:**
   - Quản lý hàng đợi thông báo (Queue/Kafka) để gửi bất đồng bộ, không làm nghẽn API.
   - Bắn thông báo nổi (In-app notifications) tới người dùng khi được @mention hoặc có thay đổi trạng thái dự án.
