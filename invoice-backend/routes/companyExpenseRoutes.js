import express from 'express'
import { CompanyExpense } from '../controllers/companyExpenseController.js'

const router = express.Router()
const companyExpenses = new CompanyExpense()

// 1. ดึงข้อมูลรายจ่ายทั้งหมด
router.get('/', companyExpenses.getCompanyExpense)

// 2. เพิ่มรายจ่ายใหม่
router.post('/', companyExpenses.addCompanyExpense)

// 3. แก้ไขรายจ่าย (อ้างอิงตาม id ที่ส่งมาใน URL)
router.put('/:id', companyExpenses.updateCompanyExpense)

// 4. ลบรายจ่าย (อ้างอิงตาม id ที่ส่งมาใน URL)
router.delete('/:id', companyExpenses.deleteCompanyExpense)

export default router