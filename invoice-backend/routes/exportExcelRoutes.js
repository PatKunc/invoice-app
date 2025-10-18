import express from 'express'
import { exportDetailsToExcel } from '../controllers/exportDetailsExcel.js'

const router = express.Router()

router.get('/export/:invoiceId', exportDetailsToExcel)

export default router