import db from '../config/db.js'

export const getTrucks = (req, res) => {
  db.query('SELECT id,truck_number FROM trucks', (err, results) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json(results)
  })
}
