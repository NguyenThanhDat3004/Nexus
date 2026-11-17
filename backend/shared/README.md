# Shared Kernel / Common Utilities

Thư mục này chứa các thành phần chia sẻ dùng chung giữa các domain (nếu cần thiết):
- Chuẩn định dạng `APIResponse<T>` (success, message, data, timestamp, error).
- Event Contracts (Định dạng JSON của các sự kiện bắn qua Kafka/RabbitMQ/Redis PubSub).
- Enums dùng chung (UserRole, ProjectType, ContextTagType).
- Correlation ID filter & Logging utilities.
