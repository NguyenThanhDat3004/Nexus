# Phase 02: Requirements Engineering — User Story #002 (US-002)

## 📌 Story Metadata

- **Story ID:** `US-002`
- **Story Title:** Contractual Decision Thread, Noise Isolation & AI-Driven Formalization
- **Bounded Context:** `Collaboration & Messaging`, `Project Context & Confirmation`, `AI Context & Knowledge`
- **Primary Persona:** Customer Sponsor (Sarah), Lead BA (Minh), Project Manager (Hung), Tech Lead (An)
- **Target Release:** Sprint 1 Handoff / Core Context Engine

---

## 💡 Bối cảnh & Vấn đề thực tế (The Problem)

1. **Khuyết điểm của mô hình Discord/Slack:**
   - **Xé nhỏ luồng (Channel Fragmentation):** Tạo quá nhiều kênh/thread con khiến thông tin bị phân tán, mất dấu bức tranh tổng thể. Cần một **Kênh chung tập trung (Single Common Stream)** nhưng phải có cấu trúc quản lý rõ ràng.
   - **Giao tiếp cợt nhả/lời nói gió bay (Informal Chatter vs. Binding Decisions):** Nhiều tin nhắn chat bông đùa, ý kiến cá nhân ("nói lơi") dễ bị nhầm thành yêu cầu chính thức, hoặc ngược lại: quyết định quan trọng bị trôi theo tán gẫu mà không có tính pháp lý/ràng buộc.
2. **Khuyết điểm của Jira:**
   - **Phình to phạm vi (Scope Creep):** Dễ dàng tạo ticket hoặc sửa description mà không có bằng chứng phê duyệt chính thức từ phía khách hàng.
   - **Rời rạc với thảo luận:** Jira lưu ticket nhưng không lưu ngữ cảnh tranh luận và thỏa thuận dẫn đến ticket đó.

---

## 📖 User Story Statement

> **As a** Project Manager & Lead BA,  
> **I want** một luồng trao đổi thống nhất (Unified Project Thread) có khả năng phân loại tin nhắn tán gẫu với thỏa thuận ràng buộc, cho phép đóng gói các đồng thuận nhỏ thành "Hợp đồng quyết định" (Decision/Confirmation Contract) và có AI hỗ trợ làm sạch/truy vết dữ liệu,  
> **So that** mọi thỏa thuận với khách hàng đều có giá trị cam kết bất biến (Source of Truth), ngăn chặn Scope Creep và tự động đồng bộ sang Jira Ticket có liên kết chặt chẽ.

---

## 🎯 Acceptance Criteria (AC)

### AC-01: Phân loại Thông tin: Tán gẫu (Chatter) vs. Đề xuất có ràng buộc (Binding Proposal)
- **Given** cuộc trò chuyện trên Kênh chung (Project Common Hub),
- **When** thành viên trao đổi bình thường ("nói lơi", thảo luận tự do),
- **Then** tin nhắn mặc định ở trạng thái `INFORMAL_CHAT` (không tạo ràng buộc, không kích hoạt quy trình thay đổi scope).
- **When** BA hoặc Customer muốn đưa ra một yêu cầu chính thức,
- **Then** họ có thể đánh dấu hoặc mở một `Decision Thread` gắn nhãn `FORMAL_PROPOSAL` kèm theo tiêu đề rõ ràng (theo Sprint / Module).

### AC-02: Cơ chế Đóng gói & Ký duyệt Hợp đồng Quyết định (Contract Conclusion)
- **Given** một nhóm các phản hồi/đồng thuận nhỏ trong thread thảo luận,
- **When** Lead BA hoặc PM bấm **"Synthesize & Conclude Contract"**,
- **Then** hệ thống tổng hợp thành một bản **Decision Summary** (Tóm tắt quyết định, Scope tác động, Sprint áp dụng),
- **And** yêu cầu đại diện Customer bấm **"Sign / Confirm Contract"** (Hỗ trợ cơ chế phân quyền Vote hoặc Phê duyệt theo thẩm quyền),
- **And** sau khi duyệt, nội dung được đóng băng (`IMMUTABLE_LOCKED`) kèm chữ ký số/audit log không thể chỉnh sửa.

### AC-03: AI Agent Data Cleansing & Contractual Retrieval (Làm sạch dữ liệu & Truy vết)
- **Given** kho dữ liệu trò chuyện chứa cả tin nhắn tán gẫu và quyết định chính thức,
- **When** AI Agent thực hiện truy vấn/tìm kiếm thông tin dự án,
- **Then** AI Agent phải chạy qua tầng **Data Sanitizer (Làm sạch dữ liệu)**:
  - Lọc bỏ nhiễu (loại bỏ tin nhắn `INFORMAL_CHAT`, biểu cảm, tán gẫu ngoài lề),
  - Chỉ ưu tiên trích xuất và tham chiếu từ các `CONTRACTUAL_CONFIRMATION` đã được ký duyệt,
- **And** khi trả kết quả, AI Agent phải dẫn kèm: *Link gốc đến bản ký duyệt, Người duyệt, Thời điểm duyệt, Mã Sprint liên quan*.

### AC-04: Móc nối 2 chiều với Jira (Prevent Scope Creep)
- **Given** một Decision Contract đã được Customer ký duyệt trên Nexus,
- **When** trạng thái chuyển thành `CUSTOMER_CONFIRMED`,
- **Then** hệ thống cho phép tạo mới hoặc móc nối (Bind) trực tiếp với Jira Issue / Epic,
- **And** trên Jira Ticket tự động gắn nhãn và trường tùy biến chứa: `Nexus-Contract-ID` và link đối soát chứng minh yêu cầu này đã được phê duyệt chính thức.

---

## 🧪 Acceptance Test Cases (Traceability Matrix)

| Test Case ID | Mục tiêu kiểm thử | Loại kiểm thử | Kết quả mong đợi |
| :--- | :--- | :--- | :--- |
| `TC-US002-01` | Phân biệt `INFORMAL_CHAT` và `FORMAL_PROPOSAL` | Functional API | Tin nhắn chat thông thường không kích hoạt quy trình thay đổi scope |
| `TC-US002-02` | Tổng hợp và Khóa bất biến Decision Contract | Security & Integrity | Khi Customer ký duyệt, trạng thái chuyển `LOCKED`, ngăn chặn sửa đổi lén |
| `TC-US002-03` | AI Data Cleansing (Loại bỏ tin rác/tán gẫu) | AI / Knowledge Unit Test | Kết quả truy vấn của AI bỏ qua tin tán gẫu, chỉ căn cứ vào quyết định chính thức |
| `TC-US002-04` | Ràng buộc liên kết Jira Issue | Integration API | Jira ticket được tạo/link chứa đúng `Contract-ID`, ngăn chặn ticket "mồ côi" không có phê duyệt |

---------------
Cần một thread trò chuyện nhưng phải mang tính hợp đồng có ràng buộc truy vết và là chân lí
-----------------------------------------------------------
discord: 
- chia nhiều luồng như rộng ==> điểm yếu, có trang trò chuyện chung, tất cả mọi thông tin đều là 1 luồng ==> 
==> assign kênh chung
==> confirm nhỏ thì cũng thành từng nhóm riêng, sprint ===> tiêu đề thread ==> hợp đồng conclusion 1 chat chung để năm thông tin==> agent search lấy thông tin ==> đánh giá trả kết quả. (tech: nhớ làm sạch dữ liệu)
- lơi: nói lơi, vui vui nhắn nhưng không có ràng buộc ==> log ticket (phân vote hay không) 
- cá nhân hóa AI
------
jira: 
- sprint ==> 
- tạo ticket ==> móc nối
- phình to ==> cần cái gì đó confirm, tức là cần một yêu cầu chính thức
-----

