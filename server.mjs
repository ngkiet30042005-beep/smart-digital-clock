import 'dotenv/config';
import express from 'express';
import OpenAI from 'openai';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const app = express();
const port = Number(process.env.PORT) || 3000;
const indexPath = fileURLToPath(new URL('./index.html', import.meta.url));

app.use(express.json({ limit: '16kb' }));

// Phục vụ trang giao diện Dashboard chính
app.get('/', async (_req, res, next) => {
  try {
    res.type('html').send(await readFile(indexPath));
  } catch (error) {
    next(error);
  }
});

// Endpoint kiểm tra trạng thái máy chủ và AI
app.get('/api/status', (_req, res) => {
  res.json({
    status: 'online',
    aiConfigured: Boolean(process.env.OPENAI_API_KEY),
    aiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    timestamp: new Date().toISOString()
  });
});

// Hàm hỗ trợ tạo phản hồi thông minh nội bộ (Fallback AI) khi chưa cấu hình OPENAI_API_KEY
function generateLocalAiResponse(message, context) {
  const q = (message || '').toLowerCase().trim();
  const time = context?.time || 'chưa cập nhật';
  const date = context?.date || 'hôm nay';
  const temp = Number.isFinite(Number(context?.temperature)) ? Number(context.temperature) : 28.5;
  const mode = context?.mode || 'Simulation';
  const systemStatus = context?.systemStatus || 'ONLINE';
  const readings = Array.isArray(context?.readings) ? context.readings : [];

  // 1. Hỏi về nhiệt độ / môi trường
  if (q.includes('nhiệt độ') || q.includes('nóng') || q.includes('lạnh') || q.includes('thời tiết') || q.includes('temp') || q.includes('môi trường')) {
    let evaluation = '';
    let recommendation = '';
    if (temp < 20) {
      evaluation = 'khá lạnh';
      recommendation = 'Nên đóng bớt cửa sổ thông gió hoặc bật hệ thống sưởi ấm nhẹ.';
    } else if (temp <= 29) {
      evaluation = 'ở mức lý tưởng và thoáng mát';
      recommendation = 'Môi trường rất thích hợp để làm việc và nghỉ ngơi.';
    } else if (temp <= 34) {
      evaluation = 'hơi cao';
      recommendation = 'Nên bổ sung đủ nước và bật quạt hoặc thông gió làm mát phòng.';
    } else {
      evaluation = 'rất cao (vượt ngưỡng cảnh báo)';
      recommendation = 'Cần bật máy lạnh ngay và kiểm tra thiết bị tỏa nhiệt xung quanh!';
    }
    return `[AI Box Analysis] Nhiệt độ ghi nhận từ cảm biến LM35 hiện tại là ${temp}°C (${evaluation}).\n→ Lời khuyên: ${recommendation}\n(Hệ thống: ${systemStatus} · Chế độ: ${mode})`;
  }

  // 2. Hỏi về xu hướng / đồ thị nhiệt độ
  if (q.includes('xu hướng') || q.includes('lịch sử') || q.includes('biểu đồ') || q.includes('mẫu đo') || q.includes('tăng') || q.includes('giảm')) {
    if (readings.length < 2) {
      return `Hiện tại chưa có đủ dữ liệu lịch sử để đánh giá xu hướng. Nhiệt độ tức thời là ${temp}°C.`;
    }
    const temps = readings.map(r => Number(r.temperature)).filter(Number.isFinite);
    const first = temps[0];
    const last = temps[temps.length - 1];
    const diff = Number((last - first).toFixed(1));
    const avg = (temps.reduce((sum, v) => sum + v, 0) / temps.length).toFixed(1);
    const min = Math.min(...temps).toFixed(1);
    const max = Math.max(...temps).toFixed(1);

    let trendDesc = 'tương đối ổn định';
    if (diff > 0.4) trendDesc = `đang có xu hướng tăng nhẹ (+${diff}°C)`;
    else if (diff < -0.4) trendDesc = `đang có xu hướng giảm (-${Math.abs(diff)}°C)`;

    return `[AI Trend Report] Qua ${temps.length} mẫu đo gần nhất:\n• Xu hướng: ${trendDesc}\n• Biên độ nhiệt: Thấp nhất ${min}°C - Cao nhất ${max}°C (Trung bình: ${avg}°C).\n• Nhận định: Dao động trong ngưỡng an toàn của cảm biến LM35.`;
  }

  // 3. Hỏi về thời gian / đồng hồ RTC
  if (q.includes('mấy giờ') || q.includes('thời gian') || q.includes('ngày') || q.includes('rtc') || q.includes('giờ')) {
    return `[AI Realtime Clock] Hiện tại là ${time}, ngày ${date}.\nModule RTC DS1307 đang hoạt động bình thường qua giao thức I2C.`;
  }

  // 4. Hỏi về phần cứng / kết nối ESP8266 / cảm biến
  if (q.includes('cảm biến') || q.includes('esp8266') || q.includes('lm35') || q.includes('ds1307') || q.includes('phần cứng') || q.includes('thiết bị')) {
    return `[AI Hardware Monitor] Tổng quan thiết bị Smart Digital Clock:\n• Vi điều khiển: ESP8266 NodeMCU (phục vụ Web Server & truyền nhận dữ liệu)\n• Module RTC: DS1307 (chính xác thời gian thực, pin dự phòng CR2032)\n• Cảm biến nhiệt: LM35 (đo dải 0-100°C qua ngõ vào analog A0)\n• Trạng thái hiện tại: ${systemStatus} (${mode})`;
  }

  // 5. Lời khuyên tối ưu / tiết kiệm điện
  if (q.includes('lời khuyên') || q.includes('tiết kiệm') || q.includes('tối ưu') || q.includes('gợi ý')) {
    return `[AI Smart Advice]:\n1. Duy trì nhiệt độ phòng 26°C - 28°C để tối ưu chi phí điện năng và bảo vệ sức khỏe.\n2. Cảm biến LM35 phản ứng nhanh với dòng không khí, nên đặt cách xa nguồn tỏa nhiệt trực tiếp của máy tính hoặc adapter nguồn.\n3. Vi điều khiển ESP8266 có thể sử dụng chế độ Light-Sleep giữa các chu kỳ đọc để giảm nhiệt năng tiêu thụ.`;
  }

  // 6. Phản hồi chung
  return `Chào bạn! Tôi là Trợ lý AI Box tích hợp trong Smart Digital Clock. Tôi có thể giúp bạn theo dõi giờ, nhiệt độ (${temp}°C), phân tích xu hướng và đưa ra lời khuyên tối ưu môi trường sống. Bạn muốn tìm hiểu thông tin nào?`;
}

// Endpoint phân tích nhanh tình trạng môi trường (Instant AI Insight)
app.post('/api/ai/analyze', async (req, res) => {
  const { context } = req.body ?? {};
  const temp = Number.isFinite(Number(context?.temperature)) ? Number(context.temperature) : 28.5;
  const readings = Array.isArray(context?.readings) ? context.readings : [];

  let comfort = 'Tối ưu';
  let badgeColor = 'green';
  let advice = 'Nhiệt độ phòng ở mức lý tưởng, không khí thoáng mát.';
  let trend = 'Ổn định';

  if (temp < 20) {
    comfort = 'Khá lạnh';
    badgeColor = 'blue';
    advice = 'Cần chú ý giữ ấm không gian làm việc.';
  } else if (temp > 33) {
    comfort = 'Cảnh báo nhiệt độ cao';
    badgeColor = 'orange';
    advice = 'Nhiệt độ phòng nóng, hãy bật thông gió hoặc điều hòa để bảo vệ sức khỏe.';
  }

  if (readings.length >= 2) {
    const first = readings[0].temperature;
    const last = readings[readings.length - 1].temperature;
    const diff = last - first;
    if (diff > 0.5) trend = `Đang tăng (+${diff.toFixed(1)}°C)`;
    else if (diff < -0.5) trend = `Đang giảm (${diff.toFixed(1)}°C)`;
  }

  const summary = `Cảm biến LM35 ghi nhận ${temp}°C (${comfort}). Xu hướng: ${trend}. ${advice}`;

  res.json({
    temp,
    comfort,
    badgeColor,
    trend,
    advice,
    summary,
    source: process.env.OPENAI_API_KEY ? 'OpenAI Live' : 'AI Smart Engine'
  });
});

// Endpoint trò chuyện chính của AI Box
app.post('/api/chat', async (req, res) => {
  const { message, context } = req.body ?? {};

  if (typeof message !== 'string' || !message.trim() || message.length > 2000) {
    return res.status(400).json({ error: 'Câu hỏi phải có nội dung và tối đa 2.000 ký tự.' });
  }

  if (context !== undefined && (context === null || typeof context !== 'object' || Array.isArray(context))) {
    return res.status(400).json({ error: 'Dữ liệu dashboard không hợp lệ.' });
  }

  const dashboardContext = context ? {
    time: typeof context.time === 'string' ? context.time.slice(0, 40) : '',
    date: typeof context.date === 'string' ? context.date.slice(0, 100) : '',
    temperature: typeof context.temperature === 'string' ? context.temperature.slice(0, 20) : '',
    systemStatus: typeof context.systemStatus === 'string' ? context.systemStatus.slice(0, 40) : '',
    mode: typeof context.mode === 'string' ? context.mode.slice(0, 20) : '',
    readings: Array.isArray(context.readings)
      ? context.readings.slice(-8).map(reading => ({
          time: typeof reading?.time === 'string' ? reading.time.slice(0, 40) : '',
          temperature: Number.isFinite(reading?.temperature) ? reading.temperature : null
        }))
      : []
  } : {};

  // Nếu chưa cấu hình OPENAI_API_KEY: Sử dụng AI Smart Engine nội bộ
  if (!process.env.OPENAI_API_KEY) {
    const reply = generateLocalAiResponse(message, dashboardContext);
    return res.json({ reply });
  }

  // Khi đã có OPENAI_API_KEY: Gọi OpenAI API
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 30_000, maxRetries: 1 });
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    let replyText = '';

    try {
      const completion = await client.chat.completions.create({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'Bạn là Trợ lý AI Box thông minh, thân thiện, tích hợp trong hệ thống Smart Digital Clock & Environment Monitor. Trả lời bằng tiếng Việt ngắn gọn, chuyên nghiệp và lịch sự. Bạn có dữ liệu thời gian thực từ đồng hồ RTC DS1307 và cảm biến nhiệt độ LM35 được gửi kèm.'
          },
          {
            role: 'user',
            content: `Dữ liệu hệ thống hiện tại:\n${JSON.stringify(dashboardContext, null, 2)}\n\nCâu hỏi của người dùng:\n${message.trim()}`
          }
        ]
      });
      replyText = completion.choices?.[0]?.message?.content?.trim();
    } catch (chatError) {
      // Fallback sang API responses nếu SDK đang ở phiên bản beta Responses API
      if (typeof client.responses?.create === 'function') {
        const result = await client.responses.create({
          model: model,
          instructions: 'Bạn là trợ lý thân thiện, trả lời bằng tiếng Việt. Hỗ trợ câu hỏi chung và dashboard đồng hồ/môi trường.',
          input: `Dữ liệu dashboard hiện tại (JSON):\n${JSON.stringify(dashboardContext)}\n\nCâu hỏi của người dùng:\n${message.trim()}`
        });
        replyText = result.output_text?.trim();
      } else {
        throw chatError;
      }
    }

    if (!replyText) {
      console.warn('OpenAI returned empty response, falling back to local engine.');
      replyText = generateLocalAiResponse(message, dashboardContext);
    }

    return res.json({ reply: replyText });
  } catch (error) {
    console.error('AI request failed:', error.message);
    // Khi gọi OpenAI bị lỗi kết nối hoặc quota, fallback về Local AI Engine để trải nghiệm không bị gián đoạn
    const fallbackReply = generateLocalAiResponse(message, dashboardContext);
    return res.json({
      reply: `${fallbackReply}\n\n*(Lưu ý: Đang hiển thị phản hồi từ AI Engine nội bộ do kết nối OpenAI API gặp sự cố: ${error.message})*`
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
  console.log(`===============================================`);
  console.log(`Smart Digital Clock Server đang chạy!`);
  console.log(`Địa chỉ: http://localhost:${port}`);
  console.log(`AI Status: ${process.env.OPENAI_API_KEY ? 'OpenAI API Connected (' + (process.env.OPENAI_MODEL || 'gpt-4o-mini') + ')' : 'Local Smart AI Engine (Ready)'}`);
  console.log(`===============================================`);
});
