import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

export default function AddInvoice() {
  const { truckId } = useParams()
  const navigate = useNavigate()
  const [truckData, setTruckData] = useState({ truck_number: '', invoices: [] })
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null })
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedYear, setSelectedYear] = useState('')

  // Alert state
  const [alertMsg, setAlertMsg] = useState('')
  const [alertType, setAlertType] = useState('error') // 'error' | 'success'
  const [showAlert, setShowAlert] = useState(false)

  useEffect(() => {
    fetchInvoices()
  }, [truckId])

  const fetchInvoices = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/invoices/byTruck/${truckId}`)
      const data = await res.json()
      setTruckData(data)
      setLoading(false)
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  const showAlertMsg = (msg, type = 'error') => {
    setAlertMsg(msg)
    setAlertType(type)
    setShowAlert(true)
    setTimeout(() => setShowAlert(false), 2000)
  }

  const handleAddInvoice = async () => {
    if (!selectedMonth || !selectedYear) return showAlertMsg('กรุณาเลือกเดือนและปี', 'error')

    const monthStr = `${selectedYear}-${selectedMonth}-01`

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/invoices/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: monthStr,
          truck_id: truckId
        })
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 400 && data.error) {
          return showAlertMsg(data.error, 'error')
        }
        throw new Error('เพิ่มใบงานไม่สำเร็จ')
      }

      showAlertMsg('เพิ่มใบงานเรียบร้อย!', 'success')
      setShowModal(false)
      setSelectedMonth('')
      setSelectedYear('')
      fetchInvoices()
    } catch (err) {
      console.error(err)
      showAlertMsg('เกิดข้อผิดพลาดขณะเพิ่มใบงาน', 'error')
    }
  }

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/invoices/delete/${id}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('ลบไม่สำเร็จ')

      showAlertMsg('ลบใบงานเรียบร้อย', 'success')
      setConfirmDelete({ show: false, id: null })
      fetchInvoices()
    } catch (err) {
      console.error(err)
      showAlertMsg('เกิดข้อผิดพลาดขณะลบ', 'error')
    }
  }

  if (loading) return <div className="p-4 text-center">กำลังโหลด...</div>

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gray-100 p-6 relative">
      <h1 className="text-2xl font-bold mb-4">
        ใบงานของรถ {truckData.truck_number}
      </h1>

      <button
        onClick={() => setShowModal(true)}
        className="mb-6 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition duration-200"
      >
        + เพิ่มใบงาน
      </button>

      {/* ตารางใบงาน */}
      <table className="min-w-full bg-white rounded shadow text-lg">
        <thead>
          <tr className="bg-gray-200 text-gray-700">
            <th className="py-2 px-4 text-left">เดือน</th>
            <th className="py-2 px-4 text-center">การจัดการ</th>
          </tr>
        </thead>
        <tbody>
          {truckData.invoices.length > 0 ? (
            truckData.invoices.map((invoice, index) => (
              <tr key={index} className="border-t hover:bg-gray-100 transition duration-200">
                <td className="py-2 px-4">
                  {new Date(invoice.month).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'long'
                  })}
                </td>
                <td className="py-2 px-4 text-center flex justify-center gap-2">
                  <button
                    onClick={() => navigate(`/editInvoice/${invoice.id}`, { state: { id: invoice.id } })}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition duration-200"
                  >
                    เพิ่มรายละเอียด
                  </button>
                  <button
                    onClick={() => setConfirmDelete({ show: true, id: invoice.id })}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition duration-200"
                  >
                    ลบ
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="py-2 px-4 text-center text-gray-500" colSpan="2">
                ยังไม่มีใบงาน
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <button
        onClick={() => navigate('/')}
        className="mt-6 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition duration-200"
      >
        กลับไปเลือกรถ
      </button>

      {/* Modal เพิ่มใบงาน */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg p-6 w-80 shadow-lg animate-fadeIn">
            <h2 className="text-lg font-bold mb-4 text-center">เพิ่มใบงานใหม่</h2>

            {/* เดือน */}
            <label className="block mb-2 text-sm text-gray-600">เดือน</label>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 mb-4"
            >
              <option value="">-- เลือกเดือน --</option>
              {Array.from({ length: 12 }, (_, i) => {
                const val = String(i + 1).padStart(2, '0')
                return (
                  <option key={val} value={val}>
                    {new Date(0, i).toLocaleString('th-TH', { month: 'long' })}
                  </option>
                )
              })}
            </select>

            {/* ปี */}
            <label className="block mb-2 text-sm text-gray-600">ปี</label>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 mb-4"
            >
              <option value="">-- เลือกปี --</option>
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() + 543 - i // พ.ศ.
                const gregorian = year - 543
                return (
                  <option key={year} value={gregorian}>
                    {year}
                  </option>
                )
              })}
            </select>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition duration-200"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleAddInvoice}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ยืนยันลบ */}
      {confirmDelete.show && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg p-6 w-80 shadow-lg animate-fadeIn text-center">
            <h2 className="text-lg font-bold mb-4 text-red-600">ยืนยันการลบ</h2>
            <p className="mb-4 text-gray-700">คุณต้องการลบใบงานนี้หรือไม่?</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setConfirmDelete({ show: false, id: null })}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition duration-200"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => handleDelete(confirmDelete.id)}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition duration-200"
              >
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {showAlert && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[9999]">
          <div
            className={`flex items-center gap-2 px-6 py-3 rounded shadow-lg animate-fadeInOut 
              ${alertType === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}
          >
            {alertType === 'error' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            <span>{alertMsg}</span>
          </div>
        </div>
      )}
    </div>
  )
}


// import { useParams, useNavigate } from 'react-router-dom'
// import { useState, useEffect } from 'react'

// export default function AddInvoice() {
//   const { truckId } = useParams()
//   const navigate = useNavigate()
//   const [truckData, setTruckData] = useState(null)
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState(null)

//   useEffect(() => {
//     fetch(`http://localhost:5000/api/invoices/byTruck/${truckId}`)
//       .then(res => {
//         if (!res.ok) throw new Error('Network response was not ok')
//         return res.json()
//       })
//       .then(data => {
//         setTruckData(data)
//         setLoading(false)
//       })
//       .catch(err => {
//         console.error(err)
//         setError('โหลดข้อมูลไม่สำเร็จ')
//         setLoading(false)
//       })
//   }, [truckId])

//   if (loading) return <div className="p-4 text-center">กำลังโหลด...</div>
//   if (error) return <div className="p-4 text-center text-red-500">{error}</div>
//   if (!truckData) return null

//   return (
//     <div className="min-h-screen flex flex-col items-center bg-gray-100 p-6">
//       <h1 className="text-4xl font-bold mb-4">
//         ใบงานของรถ {truckData.truck_number}
//       </h1>

//       <button 
//         onClick={() => alert('เพิ่มใบงานใหม่ (ไว้เชื่อม API ทีหลัง)')}
//         className="mb-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition duration-200 text-lg"
//       >
//         + เพิ่มใบงาน
//       </button>

//       <table className="min-w-full bg-white rounded shadow text-lg">
//         <thead>
//           <tr className="bg-gray-200 text-gray-700">
//             <th className="py-2 px-4 text-left">เดือน</th>
//             <th className="py-2 px-4 text-center">การจัดการ</th>
//           </tr>
//         </thead>
//         <tbody>
//           {truckData.invoices.length > 0 ? (
//             truckData.invoices.map((invoice, index) => (
//               <tr key={index} className="border-t hover:bg-gray-100">
//                 <td className="py-2 px-4">
//                   {new Date(invoice.month).toLocaleDateString('th-TH', {
//                     year: 'numeric',
//                     month: 'long'
//                   })}
//                 </td>
//                 <td className="py-2 px-4 text-center">
//                   <button
//                     onClick={() => alert(`เพิ่ม detail ของ ${invoice.month}`)}
//                     className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition duration-200"
//                   >
//                     เพิ่มรายละเอียด
//                   </button>
//                 </td>
//               </tr>
//             ))
//           ) : (
//             <tr>
//               <td className="py-2 px-4 text-center text-gray-500" colSpan="2">
//                 ยังไม่มีใบงาน
//               </td>
//             </tr>
//           )}
//         </tbody>
//       </table>

//       <button
//         onClick={() => navigate('/')}
//         className="mt-6 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition duration-200"
//       >
//         กลับไปเลือกรถ
//       </button>
//     </div>
//   )
// }
