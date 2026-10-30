# Smart Digital Clock - IoT Dashboard & AI Box

Hệ thống giám sát thời gian thực và nhiệt độ môi trường tích hợp **AI Smart Box**, hỗ trợ mô phỏng và kết nối thiết bị IoT (ESP8266 + RTC DS1307 + Cảm biến LM35).

---

## ✦ Các tính năng chính

1. **AI Smart Box (Mới tích hợp)**:
   - **Chẩn đoán thời gian thực (Real-time Diagnostics)**: Đánh giá cảm giác nhiệt độ (Lý tưởng / Nóng / Lạnh), phân tích xu hướng biến thiên (Tăng / Giảm / Ổn định) dựa trên lịch sử mẫu đo.
   - **Hộp thoại tương tác thông minh (Interactive AI Box)**: Hỗ trợ chat hỏi đáp trực tiếp ngay trên trang hoặc qua nút nổi (floating launcher).
   - **Gợi ý câu hỏi nhanh (Quick Chips)**: Kiểm tra nhanh nhiệt độ, xu hướng, phần cứng và mẹo tiết kiệm điện.
   - **Cơ chế Fallback thông minh 3 lớp**:
     - *Lớp 1*: Kết nối OpenAI API (`gpt-4o-mini`) khi cấu hình `OPENAI_API_KEY`.
     - *Lớp 2*: Tự động chuyển sang `Local Smart AI Engine` trên `server.mjs` nếu chưa có API key (không bị lỗi 503).
     - *Lớp 3*: Tự động xử lý ngay trên trình duyệt nếu mở trực tiếp `index.html` mà chưa khởi động server Node.js.

2. **Đồng hồ số thời gian thực (RTC DS1307)**:
   - Cập nhật thời gian chính xác từng giây.
   - Hiển thị thứ, ngày, tháng, năm đầy đủ theo định dạng tiếng Việt.

3. **Giám sát nhiệt độ môi trường (LM35)**:
   - Cập nhật thông số nhiệt độ hiện tại.
   - Biểu đồ cột biểu diễn lịch sử các lần đo gần nhất.
   - Bảng nhật ký ghi nhận thời gian và nguồn đo (Simulation / ESP8266).

---

## 🚀 Hướng dẫn cài đặt và chạy

### Cách 1: Chạy với Node.js Server (Khuyến nghị)

1. Cài đặt các thư viện phụ thuộc:
   ```bash
   npm install
   ```

2. *(Tùy chọn)* Cấu hình OpenAI API key:
   - Sao chép tệp `.env.example` thành `.env`:
     ```bash
     copy .env.example .env
     ```
   - Mở `.env` và điền khóa OpenAI:
     ```env
     PORT=3000
     OPENAI_API_KEY=sk-proj-...
     OPENAI_MODEL=gpt-4o-mini
     ```
   *(Lưu ý: Nếu không điền key, hệ thống vẫn hoạt động bình thường với Smart AI Engine có sẵn).*

3. Khởi động server:
   ```bash
   npm start
   ```
   hoặc:
   ```bash
   node server.mjs
   ```

4. Truy cập giao diện tại: [http://localhost:3000](http://localhost:3000)

---

### Cách 2: Mở trực tiếp giao diện (Không cần Node.js)
- Bạn có thể nhấp đúp trực tiếp vào tệp `index.html` trong File Explorer để mở trên Chrome, Edge hoặc bất kỳ trình duyệt web nào. AI Box đã được tích hợp engine client-side để tự động phản hồi.

