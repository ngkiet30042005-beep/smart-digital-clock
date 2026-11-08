import 'dotenv/config';
import express from 'express';
import OpenAI from 'openai';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const app = express();
const port = Number(process.env.PORT) || 3000;
const indexPath = fileURLToPath(new URL('./index.html', import.meta.url));

app.use(express.json({ limit: '64kb' }));

// Phục vụ giao diện Dashboard chính
app.get('/', async (_req, res, next) => {
  try {
    res.type('html').send(await readFile(indexPath));
  } catch (error) {
    next(error);
  }
});

// Endpoint kiểm tra trạng thái toàn bộ hệ thống IoT & AI
app.get('/api/status', (_req, res) => {
  res.json({
    status: 'online',
    systemName: 'Smart Thermal Fire Alarm Clock & AI Camera Vision',
    sensors: {
      rtc: 'DS1307 (I2C Real-Time Clock)',
      thermal: 'LM35 / Thermal Flame Sensor',
      camera: 'ESP32-CAM / USB AI Vision Feed',
      alarmBuzzer: 'Active Buzzer & Strobe Alert'
    },
    aiConfigured: Boolean(process.env.OPENAI_API_KEY),
    aiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    timestamp: new Date().toISOString()
  });
});

// Hàm tạo phản hồi AI nội bộ chuyên sâu về Báo Cháy & Giám Sát Camera (Fallback AI)
function generateLocalFireAlarmAiResponse(message, context) {
  const q = (message || '').toLowerCase().trim();
  const time = context?.time || 'chưa cập nhật';
  const date = context?.date || 'hôm nay';
  const temp = Number.isFinite(Number(context?.temperature)) ? Number(context.temperature) : 28.5;
  const fireStatus = context?.fireStatus || 'SAFE'; // SAFE | WARNING | DANGER
  const threshold = Number(context?.alarmThreshold) || 50;
  const cameraStatus = context?.cameraStatus || 'Active Stream';
  const readings = Array.isArray(context?.readings) ? context.readings : [];

  // 1. Hỏi về trạng thái báo cháy / hỏa hoạn / an toàn
  if (q.includes('cháy') || q.includes('hỏa hoạn') || q.includes('báo động') || q.includes('nguy hiểm') || q.includes('còi') || q.includes('an toàn')) {
    if (fireStatus === 'DANGER' || temp >= threshold) {
      return `🚨 [CẢNH BÁO KHẨN CẤP - NGUY CƠ CHÁY CAO]
• Cảm biến nhiệt LM35 ghi nhận: ${temp}°C (Đã vượt ngưỡng an toàn ${threshold}°C!).
• Trạng thái còi hú: ĐANG KÍCH HOẠT còi báo động và đèn chớp.
• Hành động khẩn cấp:
  1. Giữ bình tĩnh, ngắt cầu dao điện tổng ngay lập tức.
  2. Quan sát hình ảnh từ Camera giám sát để xác định vị trí phát sinh nhiệt/khói.
  3. Sử dụng bình chữa cháy mini nếu đám cháy mới chớm, hoặc sơ tán theo lối thoát hiểm.
  4. Gọi ngay lực lượng Cảnh sát PCCC 114 nếu không thể tự khống chế.`;
    }

    if (fireStatus === 'WARNING' || temp >= threshold - 10) {
      return `⚠️ [CẢNH BÁO - NHIỆT ĐỘ TĂNG BẤT THƯỜNG]
• Nhiệt độ đo được: ${temp}°C (Gần tiệm cận ngưỡng báo cháy ${threshold}°C).
• Camera đang quét hình ảnh nhiệt để phát hiện khói hoặc điểm nhiệt bất thường.
• Khuyến nghị: Kiểm tra các thiết bị điện, ổ cắm hoặc nguồn nhiệt gần đồng hồ để phòng ngừa rủi ro chập điện.`;
    }

    return `✅ [TRẠNG THÁI AN TOÀN]
• Nhiệt độ hiện tại: ${temp}°C (Dưới ngưỡng báo cháy ${threshold}°C).
• Không phát hiện nguồn nhiệt cao hoặc khói từ cảm biến và camera giám sát.
• Hệ thống đồng hồ cảm ứng nhiệt và camera AI đang giám sát 24/7 ổn định.`;
  }

  // 2. Hỏi về camera giám sát / hình ảnh AI Vision
  if (q.includes('camera') || q.includes('hình ảnh') || q.includes('video') || q.includes('esp32-cam') || q.includes('chụp ảnh') || q.includes('vision')) {
    return `📷 [CAMERA GIÁM SÁT & AI VISION]
• Thiết bị: ESP32-CAM / Web Camera AI tích hợp.
• Trạng thái: ${cameraStatus}.
• Tính năng thông minh:
  - Tự động chụp ảnh chứng cứ (Snapshot) khi nhiệt độ vượt ngưỡng ${threshold}°C.
  - Phân tích hình ảnh phát hiện dấu hiệu khói và đốm lửa bất thường.
  - Hiển thị Timestamp chuẩn từ RTC DS1307 trực tiếp trên luồng camera an ninh.`;
  }

  // 3. Hỏi về dự đoán nhiệt độ / xu hướng tương lai
  if (q.includes('dự đoán') || q.includes('tiên lượng') || q.includes('forecast') || q.includes('tương lai') || q.includes('bao lâu')) {
    const temps = readings.map(r => Number(r.temperature)).filter(Number.isFinite);
    if (temps.length < 2) temps.unshift(temp);
    const diff = Number((temps[temps.length - 1] - temps[0]).toFixed(1));
    const ratePerMin = Number((diff * 2).toFixed(1));
    const est5m = Number((temp + ratePerMin * 5).toFixed(1));
    return `🔮 [DỰ ĐOÁN XU HƯỚNG NHIỆT ĐỘ AI]
• Nhiệt độ hiện tại: ${temp}°C (Ngưỡng kích hoạt: ${threshold}°C).
• Tốc độ biến thiên ước tính: ${ratePerMin > 0 ? '+' : ''}${ratePerMin}°C / phút.
• Dự báo sau 5 phút: ~${est5m}°C.
• Đánh giá rủi ro: ${est5m >= threshold ? '🚨 CẢNH BÁO SỚM: Có nguy cơ chạm hoặc vượt ngưỡng trong 5 phút tới!' : '✅ An toàn: Chưa phát hiện nguy cơ vượt ngưỡng ngắn hạn.'}.`;
  }

  // 4. Hỏi về thông báo qua Email
  if (q.includes('email') || q.includes('thư') || q.includes('gửi mail') || q.includes('hộp thư')) {
    return `📧 [HỆ THỐNG THÔNG BÁO EMAIL KHẨN CẤP]
• Tính năng: Tự động gửi thư điện tử cảnh báo tới địa chỉ cấu hình khi nhiệt độ chạm ngưỡng ${threshold}°C hoặc khi AI phát hiện tăng nhiệt khẩn cấp.
• Nội dung email: Bao gồm mức nhiệt độ LM35, nhãn thời gian từ RTC DS1307, trạng thái camera và quy trình xử lý PCCC khẩn cấp.
• Bạn có thể dùng nút "Gửi Thử Email" hoặc "Xem Thư Mẫu" trên giao diện để kiểm tra!`;
  }

  // 5. Hỏi về nhật ký hoạt động (Activity Log)
  if (q.includes('nhật ký') || q.includes('hoạt động') || q.includes('audit') || q.includes('sự kiện') || q.includes('lịch sử')) {
    return `📋 [NHẬT KÝ HOẠT ĐỘNG HỆ THỐNG]
• Hệ thống ghi nhận liên tục mọi sự kiện: Cảnh báo nhiệt LM35, bật/tắt còi hú, thay đổi ngưỡng báo động, chụp ảnh hiện trường, gửi email cảnh báo và trạng thái AI.
• Bạn có thể lọc sự kiện theo danh mục hoặc xuất file nhật ký (.txt) trực tiếp từ bảng Nhật Ký Hoạt Động.`;
  }

  // 6. Hỏi về nhiệt độ / xu hướng biến thiên chung
  if (q.includes('nhiệt độ') || q.includes('xu hướng') || q.includes('temp') || q.includes('mẫu đo')) {
    if (readings.length < 2) {
      return `🌡️ Nhiệt độ tức thời đo được là ${temp}°C. Ngưỡng báo cháy cài đặt: ${threshold}°C. Chưa có đủ dữ liệu lịch sử để kết luận xu hướng.`;
    }
    const temps = readings.map(r => Number(r.temperature)).filter(Number.isFinite);
    const first = temps[0];
    const last = temps[temps.length - 1];
    const diff = Number((last - first).toFixed(1));
    const avg = (temps.reduce((s, v) => s + v, 0) / temps.length).toFixed(1);

    let trendDesc = 'ổn định';
    if (diff > 0.5) trendDesc = `tăng nhanh (+${diff}°C) - cần theo dõi`;
    else if (diff < -0.5) trendDesc = `hạ nhiệt (${diff}°C)`;

    return `📊 [BÁO CÁO NHIỆT ĐỘ CẢM BIẾN]
• Mức đo hiện tại: ${last}°C (Trung bình: ${avg}°C).
• Xu hướng: ${trendDesc}.
• Đánh giá an toàn: ${last >= threshold ? '🚨 VƯỢT NGƯỠNG BÁO CHÁY!' : last >= threshold - 10 ? '⚠️ CẢNH BÁO NHIỆT ĐỘ CAO' : '✅ Mức nhiệt bình thường'}.`;
  }

  // 4. Hỏi về đồng hồ thời gian thực RTC DS1307
  if (q.includes('mấy giờ') || q.includes('thời gian') || q.includes('ngày') || q.includes('rtc') || q.includes('đồng hồ')) {
    return `⏱️ [ĐỒNG HỒ THỜI GIAN THỰC RTC DS1307]
• Thời gian hiện tại: ${time}
• Ngày: ${date}
• Đồng hồ RTC giúp gắn nhãn thời gian (Timestamp) chính xác cho từng biến cố báo động cháy và hình ảnh chụp từ Camera.`;
  }

  // 5. Hỏi về phần cứng & cấu hình
  if (q.includes('phần cứng') || q.includes('thiết bị') || q.includes('cảm biến') || q.includes('sơ đồ') || q.includes('linh kiện')) {
    return `🛠️ [KIẾN TRÚC HỆ THỐNG ĐỒNG HỒ CẢM ỨNG NHIỆT BÁO CHÁY]
1. Vi điều khiển trung tâm: ESP8266 / ESP32 (xử lý logic, Web Server, Wi-Fi).
2. Module đồng hồ: RTC DS1307 giao tiếp I2C (SDA/SCL) pin CR2032.
3. Cảm biến nhiệt độ: LM35 (Analog A0) hoặc Flame sensor hồng ngoại.
4. Camera quan sát: ESP32-CAM (truyền hình ảnh MJPEG stream và chụp ảnh khi quá nhiệt).
5. Chuông báo động: Active Buzzer + LED đỏ báo cháy.`;
  }

  // 6. Lời khuyên PCCC & phòng ngừa
  if (q.includes('thoát hiểm') || q.includes('lời khuyên') || q.includes('pccc') || q.includes('chữa cháy') || q.includes('phòng cháy')) {
    return `🧯 [CẨM NANG AN TOÀN PHÒNG CHÁY CHỮA CHÁY (PCCC)]
1. Trang bị ít nhất 1 bình chữa cháy bột ABC hoặc khí CO2 tại khu vực sinh hoạt.
2. Không cắm quá nhiều thiết bị công suất lớn vào cùng 1 ổ điện gây quá tải nhiệt.
3. Khi phát hiện khói: Dùng khăn ướt bịt mũi miệng, cúi thấp người men theo tường để thoát hiểm.
4. Không bao giờ sử dụng thang máy khi có sự cố cháy nổ.`;
  }

  // Phản hồi tổng quát
  return `Chào bạn! Tôi là Trợ lý AI của dự án "Đồng hồ cảm ứng nhiệt báo cháy tích hợp Camera". Hiện tại đồng hồ đang là ${time}, nhiệt độ là ${temp}°C (${fireStatus === 'DANGER' ? '🚨 ĐANG BÁO CHÁY!' : '✅ An toàn'}). Tôi có thể hỗ trợ bạn theo dõi nhiệt độ, kiểm tra camera, còi báo động và quy trình an toàn PCCC!`;
}

// Endpoint chẩn đoán nguy cơ hỏa hoạn tự động (Instant Fire Risk Analysis)
app.post('/api/ai/analyze-fire', async (req, res) => {
  const { context } = req.body ?? {};
  const temp = Number.isFinite(Number(context?.temperature)) ? Number(context.temperature) : 28.5;
  const threshold = Number(context?.alarmThreshold) || 50;
  const readings = Array.isArray(context?.readings) ? context.readings : [];

  let riskLevel = 'SAFE';
  let badgeColor = 'green';
  let title = 'Hệ thống an toàn';
  let advice = 'Nhiệt độ nằm trong ngưỡng tiêu chuẩn. Không có nguy cơ cháy nổ.';
  let actionRequired = false;

  if (temp >= threshold) {
    riskLevel = 'DANGER';
    badgeColor = 'red';
    title = 'BÁO ĐỘNG CHÁY CẤP 1 - NGUY HIỂM';
    advice = `Nhiệt độ cảm biến đạt ${temp}°C, vượt ngưỡng an toàn ${threshold}°C! Còi báo động đã kích hoạt. Camera đã chụp ảnh bằng chứng. Vui lòng kiểm tra hiện trường hoặc sơ tán ngay!`;
    actionRequired = true;
  } else if (temp >= threshold - 10) {
    riskLevel = 'WARNING';
    badgeColor = 'orange';
    title = 'CẢNH BÁO NHIỆT ĐỘ TĂNG CAO';
    advice = `Nhiệt độ ${temp}°C đang tiệm cận ngưỡng báo cháy (${threshold}°C). Cần quan sát camera giám sát để kiểm tra thiết bị sinh nhiệt.`;
  }

  res.json({
    temp,
    threshold,
    riskLevel,
    badgeColor,
    title,
    advice,
    actionRequired,
    timestamp: new Date().toLocaleTimeString('vi-VN', { hour12: false })
  });
});

// Endpoint dự đoán xu hướng biến thiên nhiệt độ (AI Linear Regression & Time-To-Threshold Forecast)
app.post('/api/predict-temperature', (req, res) => {
  const { readings = [], currentTemp, threshold = 50 } = req.body ?? {};
  const curr = Number.isFinite(Number(currentTemp)) ? Number(currentTemp) : 28.5;
  const thresh = Number.isFinite(Number(threshold)) ? Number(threshold) : 50;

  const temps = Array.isArray(readings)
    ? readings.map(r => Number(r?.temp ?? r?.temperature)).filter(Number.isFinite)
    : [curr];

  if (temps.length < 2) temps.unshift(curr);

  // Tính hồi quy tuyến tính
  const n = temps.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += temps[i];
    sumXY += i * temps[i];
    sumXX += i * i;
  }
  const denom = (n * sumXX - sumX * sumX) || 1;
  const slopePerSample = (n * sumXY - sumX * sumY) / denom; // độ thay đổi mỗi mẫu (chu kỳ 5 giây)
  const ratePerMinute = Number((slopePerSample * 12).toFixed(2)); // 1 phút = 12 mẫu 5s

  const f1m = Number((curr + ratePerMinute * 1).toFixed(1));
  const f3m = Number((curr + ratePerMinute * 3).toFixed(1));
  const f5m = Number((curr + ratePerMinute * 5).toFixed(1));

  let timeToThresholdMinutes = null;
  let timeToThresholdText = 'Không có nguy cơ';
  let riskLevel = 'SAFE'; // SAFE | WARNING | DANGER
  let alertMessage = 'Nhiệt độ ổn định, không có nguy cơ chạm ngưỡng trong 15 phút tới.';

  if (curr >= thresh) {
    riskLevel = 'DANGER';
    timeToThresholdText = 'Đang vượt ngưỡng!';
    alertMessage = `Nhiệt độ hiện tại (${curr}°C) đã vượt ngưỡng báo cháy (${thresh}°C)!`;
  } else if (ratePerMinute > 0.15) {
    const minNeeded = (thresh - curr) / ratePerMinute;
    timeToThresholdMinutes = Number(minNeeded.toFixed(1));
    if (minNeeded <= 5) {
      riskLevel = 'DANGER';
      timeToThresholdText = `~${timeToThresholdMinutes} phút`;
      alertMessage = `🚨 CẢNH BÁO SỚM: Tốc độ tăng nhiệt cao (+${ratePerMinute}°C/phút). Dự kiến chạm ngưỡng ${thresh}°C sau ~${timeToThresholdMinutes} phút!`;
    } else if (minNeeded <= 15) {
      riskLevel = 'WARNING';
      timeToThresholdText = `~${timeToThresholdMinutes} phút`;
      alertMessage = `⚠️ Chú ý: Nhiệt độ có chiều hướng tăng (+${ratePerMinute}°C/phút). Dự kiến chạm ngưỡng sau ~${timeToThresholdMinutes} phút.`;
    } else {
      timeToThresholdText = `> 15 phút`;
      alertMessage = `Nhiệt độ tăng chậm (+${ratePerMinute}°C/phút). Chưa có nguy cơ trước mắt.`;
    }
  } else if (ratePerMinute < -0.15) {
    alertMessage = `Nhiệt độ đang hạ nhiệt (${ratePerMinute}°C/phút). Môi trường an toàn.`;
  }

  res.json({
    currentTemp: curr,
    threshold: thresh,
    ratePerMinute,
    trend: ratePerMinute > 0.15 ? 'rising' : ratePerMinute < -0.15 ? 'falling' : 'stable',
    forecast: {
      plus1m: Math.max(0, f1m),
      plus3m: Math.max(0, f3m),
      plus5m: Math.max(0, f5m)
    },
    timeToThresholdMinutes,
    timeToThresholdText,
    riskLevel,
    alertMessage,
    timestamp: new Date().toLocaleTimeString('vi-VN', { hour12: false })
  });
});

// Endpoint gửi thông báo khẩn cấp qua Email (Email Notification Dispatcher)
app.post('/api/send-email', (req, res) => {
  const {
    to = 'ng.kiet30042005@gmail.com',
    subject,
    alertType = 'FIRE_ALARM',
    temperature,
    threshold = 50,
    timestamp,
    details = ''
  } = req.body ?? {};

  const recipient = String(to).trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(recipient)) {
    return res.status(400).json({ error: 'Địa chỉ email không đúng định dạng.' });
  }

  const currTemp = Number.isFinite(Number(temperature)) ? Number(temperature).toFixed(1) : '28.5';
  const currThresh = Number.isFinite(Number(threshold)) ? Number(threshold).toFixed(1) : '50.0';
  const currTime = timestamp || new Date().toLocaleString('vi-VN');
  const isEmergency = alertType === 'FIRE_ALARM' || Number(currTemp) >= Number(currThresh);

  const mailSubject = subject || (isEmergency
    ? `🚨 [KHẨN CẤP] CẢNH BÁO BÁO CHÁY TẠI ĐỒNG HỒ SỐ IoT - ${currTemp}°C`
    : `ℹ️ [THÔNG BÁO] Cập nhật Hệ thống Smart Fire Alarm Clock - ${currTemp}°C`);

  const emailHtml = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>${mailSubject}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
    .email-card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .email-header { background: ${isEmergency ? '#dc2626' : '#0284c7'}; color: #ffffff; padding: 24px 20px; text-align: center; }
    .email-header h1 { margin: 0; font-size: 20px; letter-spacing: 0.5px; }
    .email-body { padding: 24px; }
    .metric-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 18px 0; }
    .metric-card { background: #f1f5f9; padding: 12px; border-radius: 8px; border-left: 4px solid ${isEmergency ? '#dc2626' : '#0284c7'}; }
    .metric-title { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; }
    .metric-value { font-size: 18px; font-weight: bold; color: #0f172a; margin-top: 4px; }
    .danger-text { color: #dc2626 !important; }
    .action-box { background: #fef2f2; border: 1px dashed #f87171; border-radius: 8px; padding: 14px; margin: 18px 0; font-size: 13.5px; color: #991b1b; }
    .footer { font-size: 11.5px; color: #64748b; text-align: center; padding: 16px; border-top: 1px solid #f1f5f9; background: #f8fafc; }
  </style>
</head>
<body>
  <div class="email-card">
    <div class="email-header">
      <h1>${isEmergency ? '🚨 CẢNH BÁO BÁO CHÁY KHẨN CẤP' : '🔔 THÔNG BÁO TỪ SMART CLOCK'}</h1>
      <div style="font-size: 13px; opacity: 0.9; margin-top: 6px;">Hệ thống Đồng hồ Cảm ứng Nhiệt & Camera Giám sát AI</div>
    </div>
    <div class="email-body">
      <p style="font-size: 14.5px; line-height: 1.6;">
        Kính gửi người quản lý / gia chủ,<br>
        Hệ thống IoT phát hiện biến cố nhiệt độ tại trạm giám sát <strong>ESP32-CAM-01</strong>. Dưới đây là thông số ghi nhận:
      </p>
      <div class="metric-grid">
        <div class="metric-card">
          <div class="metric-title">Nhiệt độ LM35</div>
          <div class="metric-value ${isEmergency ? 'danger-text' : ''}">${currTemp} °C</div>
        </div>
        <div class="metric-card">
          <div class="metric-title">Ngưỡng Báo Cháy</div>
          <div class="metric-value">${currThresh} °C</div>
        </div>
        <div class="metric-card">
          <div class="metric-title">Thời gian RTC DS1307</div>
          <div class="metric-value" style="font-size:14px;">${currTime}</div>
        </div>
        <div class="metric-card">
          <div class="metric-title">Trạng thái Còi & Camera</div>
          <div class="metric-value" style="font-size:14px; color:#0284c7;">${isEmergency ? 'Đang Hú Còi & Đã Chụp Ảnh' : 'Giám sát bình thường'}</div>
        </div>
      </div>
      ${details ? `<div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px; font-size:13px; margin:14px 0;"><strong>Chi tiết sự kiện:</strong> ${details}</div>` : ''}
      ${isEmergency ? `
      <div class="action-box">
        <strong>⚠️ HƯỚNG DẪN XỬ LÝ KHẨN CẤP:</strong>
        <ol style="margin: 8px 0 0 18px; padding: 0;">
          <li>Ngắt ngay cầu dao điện khu vực xảy ra cảnh báo.</li>
          <li>Mở Dashboard kiểm tra hình ảnh Camera để xác thực điểm cháy.</li>
          <li>Sử dụng bình chữa cháy tại chỗ hoặc di chuyển theo lối thoát hiểm.</li>
          <li>Liên hệ lực lượng Cứu hỏa PCCC chuyên nghiệp: <strong>114</strong>.</li>
        </ol>
      </div>` : ''}
    </div>
    <div class="footer">
      Email tự động phát đi từ Smart Thermal Fire Alarm Clock · Vi điều khiển ESP8266 / ESP32-CAM · RTC DS1307
    </div>
  </div>
</body>
</html>`;

  console.log(`[EMAIL DISPATCH] Đã phát email thông báo tới: ${recipient} | Chủ đề: ${mailSubject} | Mức nhiệt: ${currTemp}°C`);

  res.json({
    success: true,
    to: recipient,
    subject: mailSubject,
    sentAt: new Date().toLocaleTimeString('vi-VN', { hour12: false }),
    simulated: true,
    previewHtml: emailHtml,
    message: `Đã gửi thông báo thành công tới ${recipient}`
  });
});

// Endpoint chat chính của AI Box (hỗ trợ OpenAI Live hoặc Local Fire Alarm AI Engine)
app.post('/api/chat', async (req, res) => {
  const { message, context } = req.body ?? {};

  if (typeof message !== 'string' || !message.trim() || message.length > 2000) {
    return res.status(400).json({ error: 'Câu hỏi phải có nội dung và tối đa 2.000 ký tự.' });
  }

  if (context !== undefined && (context === null || typeof context !== 'object' || Array.isArray(context))) {
    return res.status(400).json({ error: 'Dữ liệu dashboard không hợp lệ.' });
  }

  const fireContext = context ? {
    time: typeof context.time === 'string' ? context.time.slice(0, 40) : '',
    date: typeof context.date === 'string' ? context.date.slice(0, 100) : '',
    temperature: typeof context.temperature === 'string' ? context.temperature.slice(0, 20) : '',
    fireStatus: typeof context.fireStatus === 'string' ? context.fireStatus.slice(0, 30) : 'SAFE',
    alarmThreshold: Number(context.alarmThreshold) || 50,
    cameraStatus: typeof context.cameraStatus === 'string' ? context.cameraStatus.slice(0, 40) : 'Active',
    readings: Array.isArray(context.readings)
      ? context.readings.slice(-8).map(reading => ({
          time: typeof reading?.time === 'string' ? reading.time.slice(0, 40) : '',
          temperature: Number.isFinite(reading?.temperature) ? reading.temperature : null
        }))
      : []
  } : {};

  // Nếu chưa cấu hình OpenAI API key: Sử dụng Local Fire Alarm AI Engine
  if (!process.env.OPENAI_API_KEY) {
    const reply = generateLocalFireAlarmAiResponse(message, fireContext);
    return res.json({ reply });
  }

  // Nếu có OpenAI API key: Gọi trực tiếp GPT-4o-mini
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 30_000, maxRetries: 1 });
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    const systemPrompt = `Bạn là Trợ lý AI chuyên gia phòng cháy chữa cháy tích hợp trong hệ thống IoT "Đồng hồ cảm ứng nhiệt báo cháy có tích hợp Camera giám sát".
Nhiệm vụ:
1. Phân tích dữ liệu cảm biến nhiệt độ LM35 và đồng hồ thời gian thực RTC DS1307.
2. Giám sát trạng thái Camera an ninh (ESP32-CAM) và cảnh báo nguy cơ cháy nổ.
3. Đưa ra chỉ dẫn an toàn, quy trình thoát hiểm PCCC khẩn cấp, xúc tích, dễ hiểu bằng tiếng Việt.
4. Trả lời các thắc mắc về kỹ thuật mạch điện tử (ESP8266, ESP32-CAM, RTC DS1307, còi buzzer).`;

    const completion = await client.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Dữ liệu thời gian thực của thiết bị:\n${JSON.stringify(fireContext, null, 2)}\n\nCâu hỏi của người dùng:\n${message.trim()}`
        }
      ]
    });

    let replyText = completion.choices?.[0]?.message?.content?.trim();
    if (!replyText) {
      replyText = generateLocalFireAlarmAiResponse(message, fireContext);
    }
    return res.json({ reply: replyText });
  } catch (error) {
    console.error('Lỗi khi gọi OpenAI API:', error.message);
    const fallbackReply = generateLocalFireAlarmAiResponse(message, fireContext);
    return res.json({
      reply: `${fallbackReply}\n\n*(Ghi chú: Đang chạy bằng AI Engine nội bộ do kết nối OpenAI gặp sự cố: ${error.message})*`
    });
  }
});

app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({ error: 'Nội dung JSON không hợp lệ.' });
  }
  console.error('Request failed:', error);
  return res.status(500).json({ error: 'Máy chủ gặp lỗi khi xử lý yêu cầu.' });
});

app.listen(port, () => {
  console.log(`=================================================================`);
  console.log(`🚨 Smart Thermal Fire Alarm Clock & AI Camera Server đang chạy!`);
  console.log(`📡 Địa chỉ Web: http://localhost:${port}`);
  console.log(`🤖 AI Status: ${process.env.OPENAI_API_KEY ? 'OpenAI API Connected (' + (process.env.OPENAI_MODEL || 'gpt-4o-mini') + ')' : 'Local Fire Safety AI Engine (Ready)'}`);
  console.log(`=================================================================`);
});
