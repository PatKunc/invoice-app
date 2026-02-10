import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import AddInvoice from './pages/AddInvoice'
import EditInvoice from './pages/EditInvoice'
import Dashboard from './pages/Dashboard'
import './App.css'

function TruckSelect() {
  const [trucks , setTrucks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/trucks`)
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok')
        return res.json()
      })
      .then(data => {
        setTrucks(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setError('โหลดข้อมูลรถไม่สำเร็จ')
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="p-4 text-center">กำลังโหลดรถ...</div>
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="flex flex-col items-center w-full max-w-[390px]">

        {/* --- เพิ่มปุ่ม Dashboard ตรงนี้ --- */}
        <button 
          onClick={() => navigate('/Dashboard')}
          className="w-full mb-6 py-4 bg-teal-600 text-white rounded-lg shadow-lg font-bold text-xl hover:bg-teal-700 hover:scale-105 transition duration-200 flex items-center justify-center gap-2"
        >
          📊 ดู Dashboard ภาพรวม
        </button>

        <h1 className="text-2xl font-bold mb-6 text-center">เลือกรถ</h1>
        <div className="grid grid-cols-1 gap-4 w-full">
          {trucks.map((truck, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-lg shadow flex items-center justify-center 
              hover:bg-gray-200 hover:scale-105 transition duration-200 ease-in-out cursor-pointer"
              onClick={() => navigate(`/addInvoice/${truck.id}`)}
            >
              <h2 className="font-semibold text-4xl text-center">{truck.truck_number}</h2>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<TruckSelect />} />
      <Route path="/AddInvoice/:truckId" element={<AddInvoice />} />
      <Route path='/EditInvoice/:invoiceId' element={<EditInvoice />}></Route>
      <Route path='/Dashboard' element={<Dashboard />} />
    </Routes>
  )
}

export default App

