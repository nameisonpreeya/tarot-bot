require('dotenv').config();
const express = require('express');
const line = require('@line/bot-sdk');
const { Pool } = require('pg');

const app = express();

const config = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_ACCESS_TOKEN
});

// เชื่อมต่อฐานข้อมูล PostgreSQL บน Supabase
const pool = new Pool({
  connectionString: process.env.SUPERBASE_SQL, // ตรวจสอบชื่อตัวแปรให้ตรงกับใน Netlify Environment ด้วยนะคะ
  ssl: {
    rejectUnauthorized: false
  },
  // ปรับลด Max Connection สำหรับ Serverless ป้องกันปัญหา Connection เต็ม
  max: 2, 
  idleTimeoutMillis: 3000,
  connectionTimeoutMillis: 2000,
});

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
          const result = await pool.query('SELECT * FROM cards ORDER BY RANDOM() LIMIT 1');
          if (result.rows.length === 0) throw new Error('ไม่พบข้อมูลไพ่');
          
          const card = result.rows[0];
          const isReversed = Math.random() < 0.3;
          const orientation = isReversed ? "กลับหัว 🔄" : "หัวตั้ง ✨";
          const meaning = isReversed ? card.reversed_meaning : card.meaning;

          replyText = `☀️ดวงประจำวันของคุณ\n\n🎴 ${card.card_name} (${orientation})\n\n🔮 คำทำนาย:\n${meaning}`;
      } 
      // 4. ถ้าเป็นคำถามอื่นๆ ให้เปิดไพ่ 3 ใบ
      else {
          const result = await pool.query('SELECT * FROM cards ORDER BY RANDOM() LIMIT 3');
          if (result.rows.length < 3) throw new Error('ข้อมูลไพ่ไม่พอ');

          const positions = ["อดีต (Past)", "ปัจจุบัน (Present)", "อนาคต (Future)"];
          replyText = `🎴 คำถาม: "${userMessage}"\n\n🔮 ดวงชะตาแบบ 3 ใบ (อดีต - ปัจจุบัน - อนาคต):`;

          result.rows.forEach((card, index) => {
            const isReversed = Math.random() < 0.3;
            const orientation = isReversed ? "กลับหัว 🔄" : "หัวตั้ง ✨";
            const meaning = isReversed ? card.reversed_meaning : card.meaning;
            
            replyText += `\n\n-------------------\n👉${positions[index]}\n🎴 ไพ่: ${card.card_name} (${orientation})\n📝 คำทำนาย: ${meaning}`;
          });
      }

      // 5. ส่งผลลัพธ์กลับไปที่ LINE
      return client.replyMessage({
        replyToken: event.replyToken,
        messages: [{ type: 'text', text: replyText }]
      });

    } catch (error) {
      console.error("Database Error Full Details:", error); 
      
      return client.replyMessage({
        replyToken: event.replyToken,
        messages: [{ type: 'text', text: `ขออภัยค่ะ พลังงานแม่หมอขัดข้องชั่วคราว (Error: ${error.message})` }]
      });
  }
}

// ✅ เพิ่มบรรทัดนี้ลงไปแทนที่ด้านล่างสุด เพื่อ Export ไปให้ฟังก์ชันของ Netlify ใช้งาน
module.exports = app;
