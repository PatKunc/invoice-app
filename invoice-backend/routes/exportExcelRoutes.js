import express from 'express'
import { ExportExcelController } from '../controllers/exportDetailsExcel.js'

const router = express.Router()
const exportExcelController = new ExportExcelController()

router.get('/summary', exportExcelController.exportYearlySummary)

router.get('/export/:invoiceId', exportExcelController.exportDetailsToExcel)

export default router