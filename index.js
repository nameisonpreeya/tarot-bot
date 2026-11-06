require('dotenv').config();
const express = require('express');
const line = require('@line/bot-sdk');
const mysql = require('mysql2/promise');


const app = express();
const port = 3000;

const config = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_ACCESS_TOKEN
});

// เชื่อมต่อฐานข้อมูล MySQL
// ใช้ DATABASE_URL ก้อนเดียวจบจาก Railway ได้เลย
const pool = mysql.createPool(process.env.DATABASE_URL);

app.post('/webhook', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }
  
  const userMessage = event.message.text.trim();
  
  try {
      // 1. แสดงสถานะกำลังพิมพ์ใน LINE
      await client.showLoadingAnimation({
        chatId: event.source.userId,
        loadingSeconds: 5
      });

      let replyText = "";

      // 2. เช็คเงื่อนไข: ถ้ากดปุ่ม "วิธีใช้งาน" จาก Rich Menu
      if (userMessage === "วิธีใช้งาน" || userMessage.includes("วิธีเล่น")) {
          replyText = `✨ ยินดีต้อนรับสู่บอทดูดวงไพ่ทาโรต์ค่ะ!\n\n☀️ พิมพ์หรือกดปุ่ม "ดวงประจำวัน" เพื่อรับคำทำนายไพ่ 1 ใบ\n🔮 หรือพิมพ์คำถามในใจเพื่อเปิดไพ่ 3 ใบ (อดีต-ปัจจุบัน-อนาคต) ได้เลยนะคะ`;
      } 
      // 3. เช็คเงื่อนไข: ถ้าพิมพ์ "ดวงประจำวัน", "รายวัน", หรือ "ดวงวันนี้" ให้เปิดไพ่ใบเดียว
      else if (userMessage === "ดวงประจำวัน" || userMessage.includes("รายวัน") || userMessage === "ดวงวันนี้") {
          const [rows] = await pool.query('SELECT * FROM cards ORDER BY RAND() LIMIT 1');
          if (rows.length === 0) throw new Error('ไม่พบข้อมูลไพ่');
          
          const card = rows[0];
          const isReversed = Math.random() < 0.3;
          const orientation = isReversed ? "กลับหัว 🔄" : "หัวตั้ง ✨";
          const meaning = isReversed ? card.reversed_meaning : card.meaning;

          replyText = `☀️ดวงประจำวันของคุณ\n\n🎴 ${card.card_name} (${orientation})\n\n🔮 คำทำนาย:\n${meaning}`;
      } 
      // 4. ถ้าเป็นคำถามอื่นๆ ให้เปิดไพ่ 3 ใบ (อดีต - ปัจจุบัน - อนาคต)
      else {
          const [rows] = await pool.query('SELECT * FROM cards ORDER BY RAND() LIMIT 3');
          if (rows.length < 3) throw new Error('ข้อมูลไพ่ไม่พอ');

          const positions = ["อดีต (Past)", "ปัจจุบัน (Present)", "อนาคต (Future)"];
          replyText = `🎴 คำถาม: "${userMessage}"\n\n🔮 ดวงชะตาแบบ 3 ใบ (อดีต - ปัจจุบัน - อนาคต):`;

          rows.forEach((card, index) => {
            const isReversed = Math.random() < 0.3;
            const orientation = isReversed ? "กลับหัว 🔄" : "หัวตั้ง ✨";
            const meaning = isReversed ? card.reversed_meaning : card.meaning;
            
            replyText += `\n\n-------------------\n👉${positions[index]}\n🎴 ${card.card_name} (${orientation})\n📝 คำทำนาย: ${meaning}`;
          });
      }

      // 5. ส่งผลลัพธ์กลับไปที่ LINE
      return client.replyMessage({
        replyToken: event.replyToken,
        messages: [{ type: 'text', text: replyText }]
      });

  } catch (error) {
      console.error("Database Error:", error);
      return client.replyMessage({
        replyToken: event.replyToken,
        messages: [{ type: 'text', text: "ขออภัยค่ะ พลังงานแม่หมอขัดข้องชั่วคราว" }]
      });
  }
}

app.listen(port, () => {
  console.log(`Tarot Bot (Full Features) รันอยู่ที่พอร์ต ${port}`);
});
