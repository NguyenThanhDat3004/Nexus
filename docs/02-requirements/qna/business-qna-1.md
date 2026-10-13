1. Ai được khởi tạo đề xuất chính thức? (BA hay Customer hay PM)
   Dat: PM cấu hình chanel, các thread có thể khởi tạo từ nhiều bên
   Huy: BA vì cần 1 người có thể đứng ra chịu trách nhiệm về tính chính xác và BA sẽ  người chuyển yêu cầu của khách thành requirement có cấu trúc
3. Nếu 1 thread đưa ra một thay đổi ở 1 phần nào đó mà khách không đồng ý thì quy trình đi đâu?(cái ni chắc là đóng thread)
   Dat: Chưa clear câu hỏi lắm?
   Huy : Khách bấm Reject ( thì nên bắt buộc ghi lý do) → thread sang REJECTED, giữ nguyên lịch sử + tạo summary link → read-only rồi tự lock sau 10 ngày. Muốn làm tiếp thì BA mở đề xuất mới link về thread cũ — không được hồi sinh bản đã bị reject.  
5. nếu mà khi giải quyết xong 1 thread thì có đóng thread đó hay không? nếu mà đóng thì nếu mà có thay đổi thì xử lý như răng (có mở thêm 1 thread khác không)
   Dat:
   Problem => chanel => thread nội bộ => trao đổi.
   Approve:
    ==> khởi tạo link sumary
    Khởi tạo ticket jira => gắn ticket như là bản confirm của thread => close thread => thread hoạt động thêm 10 ngày => cấm chat
   Rejected:
    ==> khởi tạo link sumary
    ==> đóng sau 10 ngày unactive
   Huy: đồng tình với ý kiến của đạt nhưng có một chút sửa đổi là jira ticket ko phải bản confirm. Bản confirm ( có đầy đủ chữ kí, timestamp ) thuộc về nexus, jira ticket chỉ trả lời việc này đang làm tới đâu. Còn đoạn close thread thì nên nói rõ ra nó sẽ hoạt động ở trạng thái đọc, không được chat nếu có vấn đề xảy ra thì mở thread mới link về thread cũ, nêu rõ vấn đề phát hiện — rồi đi lại luồng bình thường (BA formalize → customer confirm). Sau 10 ngày này sẽ đóng băng vĩnh viễn 
   -----------------------------------------------------------------
4.Khách confirm nhầm (ví dụ "15s" thay vì "1.5s") thì xử lý sao, khi BR-01 quy định confirmation là bất biến? Có cơ chế thu hồi hoặc sửa không, ai được kích hoạt?
   
