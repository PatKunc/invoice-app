import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import invoiceRoutes from './routes/invoiceRoutes.js'
import invoiceDetatailsRoute from './routes/invoiceDetailsRoutes.js'
import truckRoutes from './routes/truckRoutes.js'
import customerRoute from './routes/customerRoutes.js'
import exportExcelRoute from './routes/exportExcelRoutes.js'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/invoices', invoiceRoutes)
app.use('/api/invoiceDetails', invoiceDetatailsRoute)
app.use('/api/trucks', truckRoutes)
app.use('/api/customer', customerRoute)
app.use('/api/excel', exportExcelRoute)


app.listen(process.env.PORT, () => {
  console.log(`🚀 Server running on port ${process.env.PORT}`)
})