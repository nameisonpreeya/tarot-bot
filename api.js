const serverless = require('serverless-http');
const app = require('../index'); // ชื่อไฟล์ต้องตรงกับไฟล์หลักของคุณ (ถ้าไฟล์หลักชื่อ app.js ให้เปลี่ยนเป็น ../app)

module.exports.handler = serverless(app);