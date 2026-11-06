require('dotenv').config();

async function listMyModels() {
    console.log("กำลังตรวจสอบรายชื่อ AI ที่ API Key ของคุณมีสิทธิ์ใช้...");
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.error) {
            console.log("❌ ข้อผิดพลาดจาก Google:", data.error.message);
            return;
        }
        
        console.log("✅ รายชื่อรุ่น AI ที่คุณสามารถนำไปใส่ในโค้ดได้:");
        data.models.forEach(model => {
            // คัดมาเฉพาะรุ่นที่ใช้พิมพ์แชทตอบโต้ได้ (generateContent)
            if (model.supportedGenerationMethods.includes("generateContent")) {
                console.log(`- ${model.name.replace('models/', '')}`);
            }
        });
    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการเชื่อมต่อ:", error);
    }
}

listMyModels();