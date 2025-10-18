import express from 'express'
import { InvoiceDetailsController } from '../controllers/invoiceDetailsController.js'

const router = express.Router()
const invoiceDetailsController = new InvoiceDetailsController()

router.get('/:invoiceId', invoiceDetailsController.getDetails)

router.post('/add', invoiceDetailsController.addDetails)

router.delete('/delete/:id', invoiceDetailsController.deleteDetails)

router.put('/updateDetails/:id', (req, res) => invoiceDetailsController.updateDetails(req, res))


export default router