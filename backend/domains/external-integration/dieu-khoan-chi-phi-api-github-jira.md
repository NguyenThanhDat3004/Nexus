# Điều khoản tích hợp GitHub & Jira — Nexus External Integration Service

> Tài liệu này quy định mô hình phân quyền, luồng điều phối hệ thống và
> chính sách chi phí API khi khách hàng kết nối GitHub / Jira với Nexus.
>
> Phiên bản: 1.0 — Ngày ban hành: 2026-11-21 — Trạng thái: dự thảo, chờ team phê duyệt.

## 1. Phạm vi áp dụng

- Áp dụng cho mọi khách hàng (tổ chức, nhóm) sử dụng tính năng tích hợp
  GitHub và Jira của Nexus.
- Khách hàng kết nối bằng tài khoản GitHub / Jira của chính mình. Nexus
  không cấp tài khoản GitHub / Jira thay khách hàng và không sở hữu dữ
  liệu gốc trên hai hệ thống này.
- Mọi thao tác Nexus thực hiện trên GitHub / Jira đều nằm trong phạm vi
  quyền mà chính người dùng đó có trên hệ thống gốc.

## 2. Mô hình phân quyền

| Vai trò | Quyền hạn | Trách nhiệm |
|---|---|---|
| Quản trị viên GitHub / Jira của khách hàng | Cấu hình webhook một lần cho toàn site; cấp quyền OAuth (scope); quản lý ai được kết nối | Đảm bảo webhook trỏ đúng URL của Nexus; thu hồi quyền khi nhân sự rời đi |
| Thành viên | Kết nối tài khoản cá nhân qua OAuth; nhận thông báo và thao tác trong phạm vi quyền của mình | Chỉ thao tác được những gì tài khoản của họ được phép trên GitHub / Jira |
| Hệ thống Nexus | Nhận webhook; xác thực chữ ký; điều phối sự kiện về đúng workspace; lưu token mã hóa theo từng người dùng | Không vượt quá quyền của người dùng; không chia sẻ token giữa các người dùng; không lưu secret dưới dạng text thuần |
| Đội vận hành Nexus | Quản lý OAuth App của Nexus; giám sát hàng đợi và tỷ lệ lỗi | Đảm bảo dịch vụ tích hợp hoạt động liên tục; hỗ trợ khách hàng khi vượt hạn mức |

### 2.1. Nguyên tắc phân quyền

1. **Quyền tối thiểu (least privilege):** Nexus chỉ yêu cầu các scope
   cần thiết cho tính năng đã bật (đọc thông tin user, đọc repo / issue,
   quản lý webhook; ghi trạng thái chỉ khi khách hàng bật riêng).
2. **Token theo từng người dùng:** mỗi thành viên dùng token của chính
   mình; hệ thống không dùng chung một token cho toàn bộ khách hàng.
3. **Không vượt quyền gốc:** nếu tài khoản của thành viên không có quyền
   xem một repo / issue trên GitHub / Jira thì Nexus cũng không hiển thị
   nội dung đó cho họ.
4. **Thu hồi quyền:** khi người dùng ngắt kết nối, hoặc quản trị viên thu
   hồi quyền trên GitHub / Jira, token tương ứng bị vô hiệu và Nexus ngừng
   gọi API thay mặt người đó.

## 3. Luồng điều phối hệ thống

### 3.1. Nhận sự kiện (webhook)

1. GitHub / Jira gửi sự kiện (issue cập nhật, PR mở, push, sprint thay
   đổi) về URL webhook của Nexus.
2. Nexus xác thực chữ ký của từng sự kiện (HMAC-SHA256) trước khi xử lý;
   sự kiện không có chữ ký hợp lệ bị từ chối.
3. Sự kiện trùng lặp (gửi lại do retry) được nhận diện bằng mã delivery
   và chỉ xử lý một lần.
4. Sự kiện được đưa vào hàng đợi và hệ thống trả mã 2xx ngay, tránh để
   GitHub / Jira chờ quá thời gian cho phép.

### 3.2. Chiếu trạng thái (status projection)

- Nexus chiếu trạng thái từ GitHub / Jira lên thẻ tin nhắn trong kênh
  tương ứng. Thẻ chỉ là ảnh phản chiếu; dữ liệu gốc vẫn nằm ở GitHub /
  Jira và Nexus không sửa dữ liệu gốc (trừ tính năng ghi trạng thái khi
  được bật riêng).
- Sự kiện được định tuyến về đúng workspace theo khóa project / repo.

### 3.3. Gọi API khi cần dữ liệu bổ sung

- Ưu tiên dùng dữ liệu sẵn trong payload webhook, không gọi API thêm.
- Kết quả đọc lặp lại được cache ngắn hạn; các yêu cầu trùng nhau được
  gộp lại.
- Khi gặp lỗi 429 (vượt hạn mức), yêu cầu được xếp hàng và thử lại theo
  cấp số nhân; sự kiện không bị mất.

## 4. Chính sách chi phí API

### 4.1. Chi phí thuộc về gói của khách hàng

Khách hàng sử dụng tài khoản GitHub / Jira của chính mình để kết nối với
Nexus. Mọi chi phí thuộc về gói GitHub / Jira của khách hàng — bao gồm
phí nâng gói để tăng hạn mức gọi API — do khách hàng chịu. Nexus không
chịu khoản phí này.

### 4.2. Cam kết tối ưu của Nexus

Nexus cam kết giảm số lần gọi API xuống mức tối thiểu bằng các biện pháp
ở mục 3 (dữ liệu từ payload, cache, gộp trùng, hàng đợi, token theo từng
người dùng). Trong điều kiện sử dụng bình thường, khách hàng không chạm
trần hạn mức API.

### 4.3. Khi khách hàng vượt hạn mức

Nếu khối lượng sử dụng của khách hàng vượt xa mức thiết kế (số lượng sự
kiện / thao tác lớn bất thường), việc nâng gói GitHub / Jira do khách
hàng tự quyết định và chi trả. Nexus hỗ trợ các biện pháp tối ưu bổ sung
theo yêu cầu (tài khoản bot riêng, tách luồng gọi API, tăng dung lượng
hàng đợi).

## 5. Bảo mật

- Token OAuth được lưu mã hóa, gắn với từng người dùng; không dùng chung
  token giữa các người dùng và không lưu token dưới dạng text thuần.
- Secret ký webhook chỉ tồn tại phía server; không hiển thị trên giao
  diện và không gửi qua kênh chat.
- Mọi truy cập GitHub / Jira đều qua OAuth 2.0; Nexus không sử dụng
  Personal Access Token (PAT) và không yêu cầu mật khẩu GitHub / Jira
  của khách hàng.
- Webhook không có chữ ký hợp lệ bị từ chối.

## 6. Trạng thái triển khai

| Hạng mục | Trạng thái |
|---|---|
| OAuth GitHub / Jira, webhook receiver (HMAC) | Đã triển khai |
| Chống trùng webhook, hàng đợi + thử lại, cache | Đang triển khai |
| Lưu token mã hóa theo từng người dùng (Identity service) | Kế hoạch |
| Ghi trạng thái ngược sang Jira | Tắt mặc định — cần team xác nhận |
| Xác thực JWT cho webhook động Jira | Chưa triển khai — dùng webhook admin kèm secret |
