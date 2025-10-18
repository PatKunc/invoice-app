import express from 'express'
import { getTrucks } from '../controllers/truckController.js'

const router = express.Router()

router.get('/', getTrucks)

export default router
