# Smart Thermal Fire Alarm Clock & AI Camera Vision System
### (Hệ thống Đồng hồ Cảm ứng Nhiệt Báo Cháy Tích hợp Camera Giám sát AI)

Dự án IoT kết hợp giữa **Đồng hồ thời gian thực (RTC DS1307)**, **Cảm biến nhiệt độ cảnh báo cháy (LM35 / Flame Sensor)**, **Camera giám sát an ninh (ESP32-CAM / Webcam)** và **AI Smart Box** hỗ trợ chẩn đoán PCCC và hướng dẫn thoát hiểm thời gian thực.

---

## ✦ Các tính năng nổi bật của dự án

1. **Đồng hồ số thời gian thực (RTC DS1307)**:
   - Hiển thị giờ, phút, giây, thứ, ngày, tháng, năm chuẩn xác qua bus I2C.
   - Tự động gắn nhãn thời gian (Timestamp Watermark) lên từng hình ảnh chụp từ Camera khi có sự cố.

2. **Cảm biến nhiệt độ & Hệ thống Báo cháy Thông minh (LM35 / Thermal Sensor)**:
   - Giám sát nhiệt độ môi trường liên tục theo thời gian thực.
   - **Tùy chỉnh ngưỡng báo cháy (Interactive Slider)**: Cho phép cài đặt ngưỡng kích hoạt từ `35°C` đến `80°C` ngay trên giao diện.
   - **Còi báo động âm thanh thật (Web Audio API Synthesizer)**: Tự động hụ còi báo cháy đa tần số (Wail Siren) khi nhiệt độ vượt ngưỡng an toàn mà không cần kết nối mạng hay tải file mp3 ngoài.
   - Nút mô phỏng hỏa hoạn thử nghiệm (`🚨 Test Báo Cháy 65°C`) và nút đặt lại an toàn.

3. **Camera Giám sát Hiện trường Tích hợp (Live Camera & AI Vision)**:
   - Hỗ trợ 3 chế độ nguồn phát:
     1. **Webcam thiết bị thật**: Xem trực tiếp luồng camera từ máy tính/laptop qua WebRTC.
     2. **ESP32-CAM IP Stream**: Kết nối luồng video MJPEG từ module phần cứng ESP32-CAM.
     3. **Simulation Radar Nhiệt**: Giả lập quét hồng ngoại, phát hiện đốm lửa và hiển thị khung Bounding Box AI Vision.
   - **Tự động chụp ảnh chứng cứ (Snapshot Evidence Log)** khi xảy ra báo cháy và lưu vào thư viện hiện trường.

4. **Biểu đồ nhiệt & Nhật ký biến cố PCCC**:
   - Biểu đồ cột đổi màu theo mức độ rủi ro (Xanh an toàn, Vàng chú ý >40°C, Đỏ nguy cấp >50°C).
   - Bảng nhật ký ghi lại chi tiết các mốc cảnh báo nhiệt độ.

5. **AI Smart Box chuyên gia PCCC & An toàn Môi trường**:
   - **Công tắc Bật/Tắt AI Box (On/Off Toggle Switch)**: Cho phép người dùng chủ động bật hoặc tạm dừng toàn bộ mô-đun AI Box (phân tích tự động, chẩn đoán LM35, hỏi đáp chat) ngay tại tiêu đề panel hoặc từ giao diện chờ. Trạng thái bật/tắt được tự động lưu vào bộ nhớ trình duyệt (localStorage).
   - Chẩn đoán mức độ rủi ro cháy nổ tự động (Safe / Warning / Danger).
   - Tư vấn hướng dẫn thoát hiểm 4 bước khẩn cấp khi xảy ra hỏa hoạn.
   - Hỗ trợ hỏi đáp thông minh qua OpenAI GPT-4o-mini hoặc Fallback AI Engine nội bộ (hoạt động 100% kể cả khi chưa có API key).

---

## 🚀 Hướng dẫn cài đặt và chạy

### Cách 1: Chạy với Node.js Server (Khuyên dùng)

1. Cài đặt các thư viện cần thiết:
   ```bash
   npm install
   ```

2. Khởi động máy chủ:
   ```bash
   npm start
   ```
   hoặc:
   ```bash
   node server.mjs
   ```

3. Mở trình duyệt web truy cập: [http://localhost:3000](http://localhost:3000)

---

### Cách 2: Mở trực tiếp (Không cần Node.js)
- Bạn có thể nhấp đúp trực tiếp vào tệp `index.html` trong File Explorer để mở trên Chrome/Edge. Toàn bộ tính năng đồng hồ, còi báo cháy, camera webcam/simulation và AI Box đều hoạt động mượt mà.
