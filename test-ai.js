require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ดึง API Key จากไฟล์ .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function runTest() {
    try {
        console.log("กำลังส่งข้อความหา Gemini...");
        // ลองใช้โมเดลล่าสุด
        console.log("👉 รันโค้ดใหม่แล้ว! กำลังใช้ 3.8...");
        const model = genAI.getGenerativeModel({ model: "gemini-3.8-flash" });

        const result = await model.generateContent("สวัสดีแม่หมอ ขอไพ่ทาโรต์ 1 ใบ");
        console.log("✅ แม่หมอตอบว่า:\n", result.response.text());
    } catch (error) {
        console.error("❌ เกิด Error ขึ้น:\n", error);
    }
}

runTest();