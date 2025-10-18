import db from "../config/db.js";

export class CustomerController {
  getAllCustomers(req, res) {
    const sql = `
            SELECT id,name
            FROM customers
        `;
    db.query(sql, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result);
    });
  }

  getCustomerByName(req, res) {
    const name = req.params.name;
    if (!name)
      return res.status(400).json({ error: "Customer name is required" });

    const sql = `
            SELECT id,name 
            FROM customers
            WHERE name LIKE ?
        `;

    // ใช้ % เพื่อ search แบบใกล้เคียง (ไม่ต้อง match ทั้งหมด)
    db.query(sql, [`%${name}%`], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result);
    });
  }

  getCustomerById(req, res) {
    const customerId = req.params.id
    if (!customerId) return res.status(400).json({ error: 'Customer ID is required' })

    const sql = 'SELECT * FROM customers WHERE id = ?'

    db.query(sql, [customerId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message })
        
        if (result.length === 0) {
        return res.status(404).json({ error: 'Customer not found' })
        }

        res.json(result[0])
    })
  }

  addCustomer(req, res) {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Customer name is required" });
    }

    const sql = "INSERT INTO customers (name) VALUES (?)";

    db.query(sql, [name], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      res.json({
        message: "Customer added successfully",
        id: result.insertId,
        name: name,
      });
    });
  }
}
