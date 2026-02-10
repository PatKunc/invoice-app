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
        const { date, loading, customer_id, returning, freight, toll, gas, extra_expense, remark, driver_advance, destination } = req.body

        if (!id) return res.status(400).json({ error: 'id is required' })

        const sql = `
            UPDATE invoices_details 
            SET 
            date = ?, 
            loading = ?, 
            customer_id = ?,
            returning = ?, 
            freight = ?, 
            toll = ?, 
            gas = ?, 
            extra_expense = ?, 
            remark = ?, 
            driver_advance = ?,
            destination = ?
            WHERE id = ?
        `

        const params = [
            date, 
            loading, 
            customer_id,
            returning, 
            freight, 
            toll, 
            gas, 
            extra_expense, 
            remark, 
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

    async bulkImport(req, res) {
    const { invoice_id, rows } = req.body;

    if (!invoice_id || !rows || !Array.isArray(rows)) {
        return res.status(400).json({ error: 'invoice_id and rows array are required' });
    }

    try {
        // ใช้ Promise.all และครอบ db.query ด้วย Promise เอง เพื่อให้รองรับ async/await
        const query = (sql, params) => {
            return new Promise((resolve, reject) => {
                db.query(sql, params, (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });
        };

        const results = [];

        for (const row of rows) {
            let customerId;

            // 1. ค้นหาลูกค้า
            const findCustSql = "SELECT id FROM customers WHERE name = ? LIMIT 1";
            const existingCust = await query(findCustSql, [row.customerName.trim()]);

            if (existingCust.length > 0) {
                customerId = existingCust[0].id;
            } else {
                // 2. เพิ่มลูกค้าใหม่
                const insertCustSql = "INSERT INTO customers (name) VALUES (?)";
                const newCust = await query(insertCustSql, [row.customerName.trim()]);
                customerId = newCust.insertId;
            }

            // 3. จัดการวันที่
            const dateParts = row.date.split('/');
            const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;

            // 4. บันทึกข้อมูล (เช็คชื่อคอลัมน์ order_no หรือ order ให้ดีนะครับ)
            const insertDetailSql = `
                INSERT INTO invoices_details
                (date, \`order\`, loading, returning, freight, toll, gas, extra_expense, remark, invoice_id, customer_id, driver_advance, destination)
                VALUES (?, ?, ?, ?, ?, 0, 0, 0, '', ?, ?, 0, ?)
            `;

            const params = [
                formattedDate,
                row.order || '',
                row.pickup || '',
                row.returnLoc || '',
                row.freight || 0,
                invoice_id,
                customerId,
                row.goods || ''
            ];

            await query(insertDetailSql, params);
            results.push({ date: formattedDate, order: row.order });
        }

        res.json({
            message: `นำเข้าข้อมูลสำเร็จ ${results.length} รายการ`,
            count: results.length
        });

    } catch (err) {
        console.error('Bulk Import Error:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด: ' + err.message });
    }
}

getAllInvoiceDetails(req, res) {
    const sql = `
        SELECT 
            d.*, 
            t.truck_number,
            i.truck_id
        FROM invoices_details d
        LEFT JOIN invoices i ON d.invoice_id = i.id
        LEFT JOIN trucks t ON i.truck_id = t.id
        ORDER BY d.date DESC
    `;

    db.query(sql, [], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        console.log("Raw Data Count:", result.length); // ดูใน Console ว่าเจอไหม
        res.json(result);
    });
}

}
