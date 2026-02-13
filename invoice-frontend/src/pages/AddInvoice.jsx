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
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans text-gray-800 relative">
      <div className="max-w-4xl mx-auto">
        
        {/* ส่วนหัว (Header) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="p-2.5 bg-white rounded-xl shadow-sm hover:bg-gray-50 transition border border-gray-100 text-gray-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                ใบงานของรถ {truckData.truck_number}
              </h1>
              <p className="text-blue-600 font-bold text-sm">จัดการข้อมูลใบงานรายเดือน</p>
            </div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3.5 rounded-2xl font-bold shadow-lg shadow-emerald-100 transition-all active:scale-95"
          >
            <span className="text-xl">+</span> เพิ่มใบงาน
          </button>
        </div>

        {/* ตารางใบงาน (Table Card) */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="py-5 px-8 text-xs font-black text-gray-400 uppercase tracking-widest">เดือน</th>
                  <th className="py-5 px-8 text-xs font-black text-gray-400 uppercase tracking-widest text-center">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {truckData.invoices.length > 0 ? (
                  truckData.invoices.map((invoice, index) => (
                    <tr key={index} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="py-5 px-8">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <span className="font-bold text-gray-700 text-lg">
                            {new Date(invoice.month).toLocaleDateString('th-TH', {
                              year: 'numeric',
                              month: 'long'
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="py-5 px-8">
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={() => navigate(`/editInvoice/${invoice.id}`, { state: { id: invoice.id } })}
                            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-blue-100 text-sm"
                          >
                            เพิ่มรายละเอียด
                          </button>
                          <button
                            onClick={() => setConfirmDelete({ show: true, id: invoice.id })}
                            className="p-2.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-20 text-center text-gray-400" colSpan="2">
                      <div className="flex flex-col items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="font-medium text-lg italic">ยังไม่มีใบงาน</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ปุ่มกลับ */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 font-bold hover:text-gray-600 transition flex items-center gap-2"
          >
            กลับไปเลือกรถ
          </button>
        </div>

        {/* Modal เพิ่มใบงาน */}
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm z-50 p-4 text-gray-800">
            <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
              <h2 className="text-2xl font-black mb-6 text-center">เพิ่มใบงานใหม่</h2>

              <label className="block mb-2 text-xs font-black text-gray-400 uppercase ml-1">เดือน</label>
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-3.5 focus:border-blue-500 outline-none font-bold mb-4 transition-all cursor-pointer"
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

              <label className="block mb-2 text-xs font-black text-gray-400 uppercase ml-1">ปี</label>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-3.5 focus:border-blue-500 outline-none font-bold mb-6 transition-all cursor-pointer"
              >
                <option value="">-- เลือกปี --</option>
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() + 543 - i
                  const gregorian = year - 543
                  return (
                    <option key={year} value={gregorian}>
                      {year}
                    </option>
                  )
                })}
              </select>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-4 text-gray-400 font-bold hover:bg-gray-50 rounded-2xl transition"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleAddInvoice}
                  className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition active:scale-95"
                >
                  บันทึก
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal ยืนยันลบ */}
        {confirmDelete.show && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm z-50 p-4 text-center text-gray-800">
            <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                ⚠️
              </div>
              <h2 className="text-xl font-black text-gray-900 mb-2">ยืนยันการลบ</h2>
              <p className="text-gray-500 mb-8 font-medium italic">คุณต้องการลบใบงานนี้หรือไม่?</p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setConfirmDelete({ show: false, id: null })}
                  className="flex-1 py-3.5 text-gray-400 font-bold hover:bg-gray-50 rounded-2xl transition"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => handleDelete(confirmDelete.id)}
                  className="flex-1 py-3.5 bg-rose-500 text-white font-bold rounded-2xl hover:bg-rose-600 transition active:scale-95 shadow-lg shadow-rose-100"
                >
                  ลบ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Alert Modal */}
        {showAlert && (
          <div className="fixed top-10 left-0 right-0 flex justify-center pointer-events-none z-[9999] px-4">
            <div
              className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-top-full duration-300 
                ${alertType === 'error' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}`}
            >
              <span className="text-xl">
                {alertType === 'error' ? '❌' : '✅'}
              </span>
              <span className="font-bold tracking-wide">{alertMsg}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
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
