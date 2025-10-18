import db from '../config/db.js'

export class InvoiceController {
  getAllInvoices(req,res) {
    db.query(`
      SELECT i.month,t.truck_number
      FROM invoices i 
      JOIN trucks t on i.truck_id = t.id`,
      (err, results) =>{
        if (err) return res.status(500).json({ error: err.message })
        res.json(results)
      }
    )
  }

  // method ของ instance
  getInvoicesByTruckId(req, res) {
  const truckId = req.params.truckId
  if (!truckId) return res.status(400).json({ error: 'truckId is required' })

  // ดึง truck_number มาจาก trucks ก่อน แล้วค่อยดึง invoices
  const sql = `
    SELECT t.truck_number, i.month, i.id
    FROM trucks t
    LEFT JOIN invoices i ON i.truck_id = t.id
    WHERE t.id = ?
  `

  db.query(sql, [truckId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message })

    if (results.length === 0) {
      return res.status(404).json({ error: 'Truck not found' })
    }

    const truckNumber = results[0].truck_number
    const invoices = results
      .filter(row => row.month !== null)
      .map(row => ({
        id: row.id,
        month: row.month
      }))

    const response = {
      truck_number: truckNumber,
      invoices
    }

    res.json(response)
  })
}

addInvoice(req, res) {
  let { month, truck_id } = req.body

  if (!month || !truck_id) {
    return res.status(400).json({ error: 'month and truck_id are required' })
  }

  // ✅ แปลง month ให้เป็นวันที่เต็ม (ถ้าผู้ใช้ส่งมาแค่ YYYY-MM)
  if (/^\d{4}-\d{2}$/.test(month)) {
    month = `${month}-01`
  }

  // ✅ ตรวจสอบซ้ำ (truck_id + month/year)
  const checkSql = `
    SELECT id 
    FROM invoices 
    WHERE truck_id = ? 
      AND MONTH(month) = MONTH(?) 
      AND YEAR(month) = YEAR(?)
  `

  db.query(checkSql, [truck_id, month, month], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message })

    if (rows.length > 0) {
      return res.status(400).json({ error: 'เดือนซ้ำ' })
    }

    // ✅ ถ้าไม่ซ้ำ ให้เพิ่มข้อมูลใหม่
    const insertSql = 'INSERT INTO invoices (month, truck_id) VALUES (?, ?)'
    db.query(insertSql, [month, truck_id], (err, result) => {
      if (err) return res.status(500).json({ error: err.message })
      res.json({ message: 'Invoice added successfully', id: result.insertId })
    })
  })
}

deleteInvoice(req,res) {
  const invoiceId = req.params.invoiceId
  if (!invoiceId) return res.status(400).json({ error: 'invoiceId is required' })
  
  db.query(`DELETE from invoices where id = ${invoiceId}`,(err, result) =>{
    if (err) return res.status(500).json({error: err.message})
    res.json({ message: `Invoice id${invoiceId} deleted successfully` })
  })
}

// GET invoice by ID พร้อม truck_number
getInvoiceWithTruck (req, res) {
  const invoiceId = req.params.invoiceId
  if (!invoiceId) return res.status(400).json({ error: 'invoiceId is required' })

  const sql = `
    SELECT i.id AS invoiceId, i.month, t.truck_number
    FROM trucks t
    JOIN invoices i ON t.id = i.truck_id
    WHERE i.id = ?
  `

  db.query(sql, [invoiceId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message })
    if (result.length === 0) return res.status(404).json({ error: 'Invoice not found' })
    res.json(result[0]) // คืน object แทน array
  })
}

}
// export const getInvoicesByTruckId = (req, res) => {
//   db.query('select i.month,t.truck_number from invoices i join trucks t on i.truck_id = t.id;', 
//     (err, results) => {
//     if (err) return res.status(500).json({ error: err.message })
//     res.json(results)
//   })
// }
