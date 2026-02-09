import ExcelJS from 'exceljs'
import db from '../config/db.js'

export const exportDetailsToExcel = async (req, res) => {
  const { invoiceId } = req.params
  if (!invoiceId) return res.status(400).json({ error: 'invoiceId is required' })

  // ดึงข้อมูล invoice พร้อม truck_number แบบ string YYYY-MM
  const sqlInvoice = `
    SELECT t.truck_number,
           DATE_FORMAT(i.month, '%Y-%m') AS month_str
    FROM invoices i
    JOIN trucks t ON i.truck_id = t.id
    WHERE i.id = ?
  `

  db.query(sqlInvoice, [invoiceId], (err, invoiceData) => {
    if (err) return res.status(500).json({ error: err.message })
    if (invoiceData.length === 0) return res.status(404).json({ error: 'Invoice not found' })

    const { truck_number, month_str } = invoiceData[0]
    const filename = `${truck_number}_${month_str}.xlsx`

    // ดึง invoices_details แบบ string YYYY-MM-DD
    const sqlDetails = `
      SELECT d.id,
             DATE_FORMAT(d.date, '%Y-%m-%d') AS date,
             d.order,
             c.name AS customer_name,
             d.loading,
             d.returning,
             d.destination,
             d.freight,
             d.toll,
             d.gas,
             d.extra_expense,
             d.driver_advance,
             d.remark
      FROM invoices_details d
      LEFT JOIN customers c ON d.customer_id = c.id
      WHERE d.invoice_id = ?
      ORDER BY d.date ASC
    `

    db.query(sqlDetails, [invoiceId], async (err, details) => {
      if (err) return res.status(500).json({ error: err.message })
      if (details.length === 0) return res.status(404).json({ error: 'No details found for this invoice' })

      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Invoice Details')

      // Header
      worksheet.columns = [
        { header: 'ID', key: 'id', width: 8 },
        { header: 'วันที่', key: 'date', width: 15 },
        { header: 'ใบงาน', key: 'order', width: 15 },
        { header: 'ลูกค้า', key: 'customer_name', width: 20 },
        { header: 'รับตู้', key: 'loading', width: 20 },
        { header: 'คืนตู้', key: 'returning', width: 20 },
        { header: 'ส่งของ', key: 'destination', width: 20 },
        { header: 'ค่าบรรทุก', key: 'freight', width: 12 },
        { header: 'ทางด่วน', key: 'toll', width: 10 },
        { header: 'ก๊าซ/น้ำมัน', key: 'gas', width: 10 },
        { header: 'จ่ายพิเศษ', key: 'extra_expense', width: 15 },
        { header: 'เบิก', key: 'driver_advance', width: 15 },
        { header: 'หมายเหตุ', key: 'remark', width: 25 },
      ]

      // Fill data
      details.forEach(row => worksheet.addRow(row))

      // สรุปค่าใช้จ่าย
      const totalFreight = details.reduce((sum, d) => sum + parseFloat(d.freight || 0), 0)
      const totalToll = details.reduce((sum, d) => sum + parseFloat(d.toll || 0), 0)
      const totalGas = details.reduce((sum, d) => sum + parseFloat(d.gas || 0), 0)
      const totalExtra = details.reduce((sum, d) => sum + parseFloat(d.extra_expense || 0), 0)
      const totalExpense = totalToll + totalGas + totalExtra
      const remaining = totalFreight - totalExpense
      const driverIncome = (totalFreight - totalToll) * 0.16
      const driverNetIncome = driverIncome + totalExtra


      worksheet.addRow([])
      worksheet.addRow({ loading: 'รวมค่าขนส่งทั้งหมด', freight: totalFreight })
      worksheet.addRow({ loading: 'รวมค่าทางด่วน', freight: totalToll })
      worksheet.addRow({ loading: 'รวมค่าน้ำมัน', freight: totalGas })
      worksheet.addRow({ loading: 'รวมค่าใช้จ่ายอื่นๆ', freight: totalExtra })
      worksheet.addRow({ loading: 'รวมค่าใช้จ่ายทั้งหมด', freight: totalExpense })
      worksheet.addRow({ loading: 'คงเหลือ (รายได้สุทธิ)', freight: remaining })
      worksheet.addRow({ loading: 'รายได้พนักงานขับ (16%)', freight: driverIncome })
      worksheet.addRow({ loading: 'รายได้คนขับสุทธิ', freight: driverNetIncome })

      // จัดฟอร์แมตส่วนสรุป
      const summaryStartRow = details.length + 3
      for (let i = summaryStartRow; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i)
        row.getCell('loading').font = { bold: true }
        row.getCell('freight').numFmt = '#,##0.00'
      }

      // Styling header
      worksheet.getRow(1).eachCell(cell => {
        cell.font = { bold: true }
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCE6F1' } }
      })

      // Set filename
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

      await workbook.xlsx.write(res)
      res.end()
    })
  })
}
