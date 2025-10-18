import express from 'express'
import { InvoiceController } from '../controllers/invoiceController.js'

const router = express.Router()
const invoiceController = new InvoiceController()

router.get('/', invoiceController.getAllInvoices)
// GET /api/invoices/byTruck/:truckId → ดึง invoice ตาม truck_id
router.get('/byTruck/:truckId', (req, res) => invoiceController.getInvoicesByTruckId(req, res))

router.get('/get/withTruck/:invoiceId', invoiceController.getInvoiceWithTruck)

router.post('/add', invoiceController.addInvoice)

router.delete('/delete/:invoiceId', invoiceController.deleteInvoice)


export default router
