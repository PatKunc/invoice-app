import express from 'express'
import { CustomerController } from '../controllers/customerController.js'

const router = express.Router()
const customerController = new CustomerController()

router.get('/', customerController.getAllCustomers)

router.get('/:name', customerController.getCustomerByName)

router.get('/byId/:id', customerController.getCustomerById)

router.post('/add', customerController.addCustomer)

export default router