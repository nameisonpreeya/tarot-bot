require('dotenv').config();
const mysql = require('mysql2/promise');

async function testConnection() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        console.log("✅ เชื่อมต่อฐานข้อมูล MySQL สำเร็จ!");
        
        // ลองดึงข้อมูลมาดู
        const [rows] = await connection.execute('SELECT * FROM cards');
        console.log("🎴 ข้อมูลไพ่ในระบบ:", rows);
        
        await connection.end();
    } catch (error) {
        console.error("❌ เชื่อมต่อ MySQL ไม่ได้:", error.message);
    }
}

testConnection();