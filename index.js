require('dotenv').config();
const express = require('express');
const line = require('@line/bot-sdk');

const app = express();
const port = 3000;

const config = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_ACCESS_TOKEN
});

// 📚 ข้อมูลไพ่ทาโรต์ฝังในโค้ด (ไม่ต้องง้อฐานข้อมูล MySQL แล้วจ้า)
const tarotCards = [
  {
    card_name: "The Fool (คนโง่ / การเริ่มต้นใหม่)",
    meaning: "การเริ่มต้นเดินทางครั้งใหม่ การเสี่ยงโชค การทำตามสัญชาตญาณ เปิดรับโอกาสใหม่ๆ โดยไม่กลัวความล้มเหลว",
    reversed_meaning: "ความประมาท การตัดสินใจอย่างไร้เหตุผล การพลาดพลั้งเพราะความไม่รอบคอบ"
  },
  {
    card_name: "The Magician (นักกล่อม / ผู้สร้าง)",
    meaning: "มีความสามารถรอบด้าน การริเริ่มสร้างสรรค์ การใช้ทักษะแก้ปัญหาเฉพาะหน้า ทุกอย่างอยู่ในมือคุณแล้ว",
    reversed_meaning: "ความสามารถที่ซ่อนเร้น การใช้เล่ห์เหลี่ยม หรือความรู้สึกว่าพลังที่มีกำลังถดถอย"
  },
  {
    card_name: "The High Priestess (นักบวชหญิง)",
    meaning: "สัญชาตญาณ ลางสังหรณ์ ความลึกลับ การเก็บงำความรู้สึก การใช้ความเงียบสงบและการไตร่ตรอง",
    reversed_meaning: "ความลับที่ปิดบังไม่ได้ สัญชาตญาณผิดพลาด หรือการใช้อารมณ์ความรู้สึกเหนือเหตุผล"
  },
  {
    card_name: "The Empress (จักรพรรดินี)",
    meaning: "ความอุดมสมบูรณ์ ความรัก ความอบอุ่น การดูแลเอาใจใส่ ความเจริญงอกงาม และโชคลาภ",
    reversed_meaning: "ความพึ่งพาผู้อื่นมากเกินไป การขาดความรัก ความอุดมสมบูรณ์ที่ลดลง หรือความหึงหวง"
  },
  {
    card_name: "The Emperor (จักรพรรดิ)",
    meaning: "อำนาจ ความเป็นผู้นำ ระเบียบวินัย ความมั่นคง ความรับผิดชอบ และการจัดการที่ดี",
    reversed_meaning: "ความเผด็จการ ความดื้อรั้น การควบคุมทุกอย่างมากเกินไปจนคนรอบข้างอึดอัด"
  },
  {
    card_name: "The Lovers (คู่รัก)",
    meaning: "ความรัก ความสัมพันธ์ที่ลงตัว การตัดสินใจเลือกครั้งสำคัญ ความสามัคคี และมิตรภาพที่ดี",
    reversed_meaning: "ความขัดแย้งในความสัมพันธ์ การตัดสินใจผิดพลาด หรือการลังเลไม่แน่ใจ"
  },
  {
    card_name: "The Wheel of Fortune (กงล้อแห่งโชคชะตา)",
    meaning: "โชคลาภ การเปลี่ยนแปลงครั้งใหญ่ โอกาสดีๆ ที่กำลังเข้ามา วัฏจักรชีวิตที่หมุนไปในทางที่ดีขึ้น",
    reversed_meaning: "ช่วงเวลาโชคร้าย ความซวยฉับพลัน หรือการไม่ยอมรับความเปลี่ยนแปลงของชีวิต"
  },
  {
    card_name: "The Star (ดวงดาว)",
    meaning: "ความหวัง ศรัทธา แรงบันดาลใจ การเยียวยาจิตใจ อนาคตที่สดใส และความสุขสงบในจิตใจ",
    reversed_meaning: "ความสิ้นหวัง ความท้อแท้ สูญเสียความเชื่อมั่นในตัวเอง"
  },
  {
    card_name: "The Sun (ดวงอาทิตย์)",
    meaning: "ความสุข ความสำเร็จ ความสดใส พลังงานบวก ความจริงที่ปรากฏ และความโชคดีขั้นสุด",
    reversed_meaning: "ความสุขที่ล่าช้า ความอึดอัดใจเล็กน้อย หรือปัญหาที่ยังเคลียร์ไม่หมด"
  },
  {
    card_name: "The World (โลก)",
    meaning: "ความสำเร็จสมบูรณ์แบบ การเดินทางไกล การจบสิ้นวัฏจักรหนึ่งเพื่อเริ่มต้นสิ่งที่ดีกว่าเดิม",
    reversed_meaning: "ความล่าช้าในเป้าหมาย ความรู้สึกยังไม่สมบูรณ์ หรือติดขัดในขั้นตอนสุดท้าย"
  }
];

// ฟังก์ชันสุ่มไพ่จาก Array
function getRandomCards(count) {
  const shuffled = [...tarotCards].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

app.post('/webhook', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error("Webhook Error:", err);
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
          const cards = getRandomCards(1);
          const card = cards[0];
          const isReversed = Math.random() < 0.3;
          const orientation = isReversed ? "กลับหัว 🔄" : "หัวตั้ง ✨";
          const meaning = isReversed ? card.reversed_meaning : card.meaning;

          replyText = `☀️ ดวงประจำวันของคุณ\n\n🎴 ${card.card_name} (${orientation})\n\n🔮 คำทำนาย:\n${meaning}`;
      } 
      // 4. ถ้าเป็นคำถามอื่นๆ ให้เปิดไพ่ 3 ใบ (อดีต - ปัจจุบัน - อนาคต)
      else {
          const cards = getRandomCards(3);
          const positions = ["อดีต (Past)", "ปัจจุบัน (Present)", "อนาคต (Future)"];
          replyText = `🎴 คำถาม: "${userMessage}"\n\n🔮 ดวงชะตาแบบ 3 ใบ (อดีต - ปัจจุบัน - อนาคต):`;

          cards.forEach((card, index) => {
            const isReversed = Math.random() < 0.3;
            const orientation = isReversed ? "กลับหัว 🔄" : "หัวตั้ง ✨";
            const meaning = isReversed ? card.reversed_meaning : card.meaning;
            
            replyText += `\n\n-------------------\n👉 ${positions[index]}\n🎴 ไพ่: ${card.card_name} (${orientation})\n📝 คำทำนาย: ${meaning}`;
          });
      }

      // 5. ส่งผลลัพธ์กลับไปที่ LINE
      return await client.replyMessage({
        replyToken: event.replyToken,
        messages: [{ type: 'text', text: replyText }]
      });

  } catch (error) {
      console.error("🔴 ERROR DETAIL:", error);

      try {
          return await client.replyMessage({
            replyToken: event.replyToken,
            messages: [{ type: 'text', text: "ขออภัยค่ะ พลังงานแม่หมอขัดข้องชั่วคราว 🥲" }]
          });
      } catch (replyErr) {
          console.error("🔴 Reply Error:", replyErr);
      }
  }
}

app.listen(port, () => {
  console.log(`Tarot Bot (No DB Version) รันอยู่ที่พอร์ต ${port}`);
});
