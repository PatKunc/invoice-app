import db from "../config/db.js";

export class CompanyExpense {
  getCompanyExpense(req, res) {
    const sql = `
            SELECT *
            FROM company_expenses
        `;
    db.query(sql, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result);
    });
  }

  // 2. เพิ่มรายการใหม่ (Create)
  addCompanyExpense(req, res) {
    const { expense_date, expense_type, amount, description, truck_id } = req.body;

    // Validation เบื้องต้น
    if (!expense_date || !expense_type || !amount) {
      return res.status(400).json({ error: "กรุณากรอกวันที่, ประเภท และจำนวนเงิน" });
    }

    const sql = `
      INSERT INTO company_expenses 
      (expense_date, expense_type, amount, description, truck_id) 
      VALUES (?, ?, ?, ?, ?)
    `;

    const values = [expense_date, expense_type, amount, description, truck_id || null];

    db.query(sql, values, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        message: "เพิ่มข้อมูลรายจ่ายเรียบร้อยแล้ว",
        id: result.insertId
      });
    });
  }

  // 3. แก้ไขรายการ (Update)
  updateCompanyExpense(req, res) {
    const { id } = req.params;
    const { expense_date, expense_type, amount, description, truck_id } = req.body;

    const sql = `
      UPDATE company_expenses 
      SET expense_date = ?, expense_type = ?, amount = ?, description = ?, truck_id = ? 
      WHERE expense_id = ?
    `;

    const values = [expense_date, expense_type, amount, description, truck_id || null, id];

    db.query(sql, values, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) return res.status(404).json({ message: "ไม่พบข้อมูลที่ต้องการแก้ไข" });
      
      res.json({ message: "แก้ไขข้อมูลเรียบร้อยแล้ว" });
    });
  }

  // 4. ลบรายการ (Delete)
  deleteCompanyExpense(req, res) {
    const { id } = req.params;
    const sql = "DELETE FROM company_expenses WHERE expense_id = ?";

    db.query(sql, [id], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) return res.status(404).json({ message: "ไม่พบข้อมูลที่ต้องการลบ" });
      
      res.json({ message: "ลบข้อมูลเรียบร้อยแล้ว" });
    });
  }
}
