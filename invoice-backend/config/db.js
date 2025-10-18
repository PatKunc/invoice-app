import mysql from 'mysql2'
import dotenv from 'dotenv'

dotenv.config() // ต้องอยู่บรรทัดแรก

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    timezone: '+07:00' // <-- ตั้ง timezone
})

db.connect(err => {
    if(err){
        console.error('Database connection failed:', err)
        return
    }
    console.log('✅ Connected to MySQL')
})

export default db