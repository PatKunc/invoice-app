import db from '../config/db.js'

export class InvoiceDetailsController {
    getDetails (req,res){
        const invoiceId = req.params.invoiceId
        if (!invoiceId) return res.status(400).json({ error: 'invoiceId is required' })

        const sql = `
            SELECT d.*, c.name AS customer_name
            FROM invoices_details d
            LEFT JOIN customers c ON d.customer_id = c.id
            WHERE d.invoice_id = ?
            ORDER BY d.date ASC
        `

        db.query(sql, [invoiceId], (err, result) => {
            if (err) return res.status(500).json({ error: err.message })
            res.json(result)
        })
    }

    addDetails (req,res){
        const { date, loading, returning, freight, toll, gas, extra_expense, remark, invoice_id, customer_id, driver_advance, destination } = req.body

        // ตรวจสอบค่า required
        if (!invoice_id || !customer_id || !date) {
            return res.status(400).json({ error: 'invoice_id, customer_id, and date are required' })
        }

        const sql = `
            INSERT INTO invoices_details
            (date, loading, returning, freight, toll, gas, extra_expense, remark, invoice_id, customer_id,driver_advance, destination)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)
        `

        db.query(sql, [date, loading || '', returning || '', freight || 0, toll || 0, gas || 0, extra_expense || 0, remark || '', invoice_id, customer_id, driver_advance, destination], (err, result) => {
            if (err) return res.status(500).json({ error: err.message })

            res.json({
            message: 'Invoice detail added successfully',
            id: result.insertId,
            date,
            loading,
            returning,
            freight,
            toll,
            gas,
            extra_expense,
            remark,
            invoice_id,
            customer_id,
            driver_advance,
            destination
            })
        })
    }

    deleteDetails(req,res){
        const id = req.params.id
        if (!id) return res.status(400).json({ error: 'Detail ID is required' })

        const sql = 'DELETE FROM invoices_details WHERE id = ?'

        db.query(sql, [id], (err, result) => {
            if (err) return res.status(500).json({ error: err.message })

            if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Detail not found' })
            }

            res.json({
            message: 'Invoice detail deleted successfully',
            id: id
            })
        })
    }

    updateDetails(req,res) {
        const { id } = req.params
        const { date, loading, returning, freight, toll, gas, extra_expense, remark, customer_id, driver_advance, destination } = req.body

        if (!id) return res.status(400).json({ error: 'id is required' })

        const sql = `
            UPDATE invoices_details 
            SET 
            date = ?, 
            loading = ?, 
            returning = ?, 
            freight = ?, 
            toll = ?, 
            gas = ?, 
            extra_expense = ?, 
            remark = ?, 
            customer_id = ?, 
            driver_advance = ?,
            destination = ?
            WHERE id = ?
        `

        const params = [
            date, 
            loading, 
            returning, 
            freight, 
            toll, 
            gas, 
            extra_expense, 
            remark || '-', 
            customer_id, 
            driver_advance || 0,
            destination,
            id
        ]

        db.query(sql, params, (err, result) => {
            if (err) return res.status(500).json({ error: err.message })

            if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Detail not found' })
            }

            res.json({ message: 'Invoice detail updated successfully' })
        })
    }

}
