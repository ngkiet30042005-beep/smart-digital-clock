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

  // 3. Hỏi về nhiệt độ / xu hướng biến thiên
  if (q.includes('nhiệt độ') || q.includes('xu hướng') || q.includes('temp') || q.includes('mẫu đo') || q.includes('lịch sử')) {
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
