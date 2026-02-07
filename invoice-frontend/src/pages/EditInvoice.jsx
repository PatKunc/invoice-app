import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { HiOutlineDocumentDownload } from 'react-icons/hi'


export default function EditInvoice() {
  const { invoiceId } = useParams()
  const navigate = useNavigate()

  const [details, setDetails] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null })
  const [showModal, setShowModal] = useState(false)

  // เพิ่มงาน
  const [date, setDate] = useState('')
  const [customer, setCustomer] = useState('') // id ลูกค้า
  const [customerName, setCustomerName] = useState('') // สำหรับ input
  const [loadingLoc, setLoadingLoc] = useState('')
  const [returningLoc, setReturningLoc] = useState('')
  const [freight, setFreight] = useState('')
  const [toll, setToll] = useState('')
  const [gas, setGas] = useState('')
  const [extraExpense, setExtraExpense] = useState('')
  const [remark, setRemark] = useState('')
  const [driverAdvance, setDriverAdvance] = useState(0)
  const [destination, setDestination] = useState('')

  // Alert
  const [alertMsg, setAlertMsg] = useState('')
  const [alertType, setAlertType] = useState('error')
  const [showAlert, setShowAlert] = useState(false)

  // Customer dropdown
  const [suggestions, setSuggestions] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)

  // สรุป
  // สรุปค่าใช้จ่าย
  const totalFreight = details.reduce((sum, d) => sum + parseFloat(d.freight || 0), 0)
  const totalToll = details.reduce((sum, d) => sum + parseFloat(d.toll || 0), 0)
  const totalGas = details.reduce((sum, d) => sum + parseFloat(d.gas || 0), 0)
  const totalExtra = details.reduce((sum, d) => sum + parseFloat(d.extra_expense || 0), 0)
  const totalExpense = totalToll + totalGas + totalExtra
  const remaining = totalFreight - totalExpense
  const driverIncome = (totalFreight - totalToll) * 0.16

  const [invoiceInfo, setInvoiceInfo] = useState(null)

  useEffect(() => {
    fetchDetails()
    fetchInvoiceInfo()
  }, [invoiceId])

  const fetchInvoiceInfo = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/invoices/get/withTruck/${invoiceId}`)
      const data = await res.json()
      setInvoiceInfo(data)
    } catch (err) {
      console.error(err)
      showAlertMsg('โหลดข้อมูล Invoice ไม่สำเร็จ', 'error')
    }
  }

  const fetchDetails = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/invoiceDetails/${invoiceId}`)
      const data = await res.json()
      setDetails(data)
      setLoading(false)
    } catch (err) {
      console.error(err)
      setLoading(false)
      showAlertMsg('โหลดรายละเอียดไม่สำเร็จ', 'error')
    }
  }

  const showAlertMsg = (msg, type = 'error') => {
    setAlertMsg(msg)
    setAlertType(type)
    setShowAlert(true)
    setTimeout(() => setShowAlert(false), 2000)
  }

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/invoiceDetails/delete/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('ลบไม่สำเร็จ')
      showAlertMsg('ลบเรียบร้อย', 'success')
      setConfirmDelete({ show: false, id: null })
      fetchDetails()
    } catch (err) {
      console.error(err)
      showAlertMsg('เกิดข้อผิดพลาดขณะลบ', 'error')
    }
  }

  const handleAddDetail = async () => {
    if (!date || !customerName.trim()) return showAlertMsg('กรุณากรอกวันที่และลูกค้า', 'error')

    let customerId = customer
    try {
      // ถ้าเลือก option “เพิ่มลูกค้าใหม่” หรือไม่ได้เลือก dropdown => เพิ่มลูกค้าใหม่
      if (!customerId) {
        const resAddCustomer = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/customer/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: customerName.trim() })
        })
        const newCustomer = await resAddCustomer.json()
        if (!resAddCustomer.ok) throw new Error(newCustomer.error || 'เพิ่มลูกค้าไม่สำเร็จ')
        customerId = newCustomer.id
        showAlertMsg(`เพิ่มลูกค้าใหม่: ${customerName}`, 'success')
      }

      // ✅ ถ้าไม่ได้กรอก driverAdvance ให้ส่งเป็น 0
      const driverAdvanceValue = driverAdvance === '' ? 0 : parseFloat(driverAdvance)

      // เพิ่ม detail
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/invoiceDetails/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_id: invoiceId,
          date,
          customer_id: customerId,
          loading: loadingLoc,
          returning: returningLoc,
          freight,
          toll,
          gas,
          extra_expense: extraExpense,
          remark,
          driver_advance: driverAdvanceValue,  // ✅ ใช้ตัวแปรนี้แทน
          destination: destination
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'เพิ่มงานไม่สำเร็จ')

      showAlertMsg('เพิ่มงานเรียบร้อย!', 'success')
      setShowModal(false)

      // reset form
      setDate(''); setCustomer(''); setCustomerName(''); setLoadingLoc(''); setReturningLoc('')
      setFreight(''); setToll(''); setGas(''); setExtraExpense(0); setRemark(''); setDriverAdvance(0); setDestination('');
      fetchDetails()
    } catch (err) {
      console.error(err)
      showAlertMsg(err.message || 'เกิดข้อผิดพลาด', 'error')
    }
  }

  // Fetch customers for autocomplete
  useEffect(() => {
    if (customerName.trim() === "") {
      setSuggestions([])
      return
    }
    const delayDebounce = setTimeout(() => {
      fetch(`${import.meta.env.VITE_API_BASE_URL}/api/customer/${customerName}`)
        .then(res => res.json())
        .then(data => setSuggestions(data))
        .catch(err => console.error(err))
    }, 300)
    return () => clearTimeout(delayDebounce)
  }, [customerName])

    const [showEditModal, setShowEditModal] = useState(false)

const [editData, setEditData] = useState(null)

const handleOpenEdit = (item) => {
  // สร้าง Object Date จากค่าที่ได้จาก DB
  const localDate = new Date(item.date);
  
  // ดึงปี-เดือน-วันที่ ตามเวลาเครื่องผู้ใช้ (Local Time)
  const formattedDate = localDate.toLocaleDateString('en-CA'); // จะได้ฟอร์แมต YYYY-MM-DD พอดี

  // setEditData({
  //   id: item.id,
  //   date: formattedDate,
  //   loading: item.loading || '',
  //   customer_name: item.customer_name || '',
  //   customer_id: item.customer_id || '',
  //   returning: item.returning || '',
  //   freight: item.freight || 0,
  //   toll: item.toll || 0,
  //   gas: item.gas || 0,
  //   extra_expense: item.extra_expense || 0,
  //   remark: item.remark || '',
  //   driver_advance: item.driver_advance || '',
  //   destination: item.destination || ''
  // })
  // setShowEditModal(true)
  setEditData({
    id: item.id,
    date: formattedDate,
    loading: item.loading || '',
    returning: item.returning || '',
    freight: item.freight || 0,
    toll: item.toll || 0,
    gas: item.gas || 0,
    extra_expense: item.extra_expense || 0,
    remark: item.remark || '',
    driver_advance: item.driver_advance || '',
    destination: item.destination || ''
  })

  // ✅ เพิ่ม 2 บรรทัดนี้ เพื่อ "เชื่อม" ข้อมูลเดิมเข้ากับ State ที่ Dropdown ใช้
  setCustomerName(item.customer_name || '') // เอาชื่อมาโชว์ใน Input
  setCustomer(item.customer_id || '')       // เอา ID มาเก็บไว้ใน State กลาง
  
  setShowEditModal(true)
}

const handleExportExcel = async () => {
  if (!invoiceInfo) return showAlertMsg('โหลดข้อมูล Invoice ไม่สำเร็จ', 'error')

  try {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/excel/export/${invoiceId}`)
    if (!res.ok) throw new Error('Export Excel ล้มเหลว')

    const blob = await res.blob()

    // ตั้งชื่อไฟล์ truckNumber_YYYY-MM.xlsx
    const date = new Date(invoiceInfo.month)
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const fileName = `${invoiceInfo.truck_number}_${yyyy}-${mm}.xlsx`

    // ดาวน์โหลดไฟล์
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    window.URL.revokeObjectURL(url)
  } catch (err) {
    console.error(err)
    showAlertMsg(err.message || 'เกิดข้อผิดพลาดขณะ Export Excel', 'error')
  }
}

const handleUpdateDetail = async () => {
  // if (!editData) return

  // try {
  //   const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/invoiceDetails/updateDetails/${editData.id}`, {
  //     method: 'PUT',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify(editData)
  //   })
  //   const data = await res.json()
  //   if (!res.ok) throw new Error(data.error || 'อัปเดตไม่สำเร็จ')

  //   showAlertMsg('อัปเดตรายการสำเร็จ', 'success')
  //   setShowEditModal(false)
  //   fetchDetails()
  //   console.log(editData)
  // } catch (err) {
  //   console.error(err)
  //   showAlertMsg(err.message || 'เกิดข้อผิดพลาด', 'error')
  // }

  if (!customerName.trim()) return showAlertMsg('กรุณากรอกชื่อลูกค้า', 'error');

  try {
    let finalCustomerId = customer; // เริ่มต้นด้วย ID ที่อยู่ใน State (อาจจะเป็นของเดิม หรือที่เลือกใหม่)

    // ✅ ถ้ามีการพิมพ์ชื่อใหม่ แต่ไม่ได้เลือกจาก Dropdown (ไม่มี ID)
    if (!finalCustomerId) {
      const resAdd = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/customer/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: customerName.trim() })
      });
      const newCust = await resAdd.json();
      if (!resAdd.ok) throw new Error(newCust.error || 'เพิ่มลูกค้าไม่สำเร็จ');
      finalCustomerId = newCust.id; // ใช้ ID ใหม่ที่เพิ่งสร้าง
    }

    // ✅ ส่ง Update โดยใช้ finalCustomerId
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/invoiceDetails/updateDetails/${editData.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...editData,
        customer_id: finalCustomerId // ตัวนี้แหละที่จะทำให้ DB อัปเดต!
      })
    });

    if (!res.ok) throw new Error('อัปเดตไม่สำเร็จ');

    showAlertMsg('แก้ไขเรียบร้อย', 'success');
    setShowEditModal(false);
    
    // ล้างค่า State กลางหลังจบงาน
    setCustomerName('');
    setCustomer('');
    
    fetchDetails(); 
  } catch (err) {
    showAlertMsg(err.message, 'error');
  }
}

  if (loading) return <div className="p-4 text-center">กำลังโหลด...</div>

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 p-4 md:p-6 relative">
      <h1 className="text-xl md:text-2xl font-bold mb-4 text-center">
        รายละเอียดใบงาน {invoiceId} {invoiceInfo ? `(เดือน: ${new Date(invoiceInfo.month).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })} / รถ: ${invoiceInfo.truck_number})` : ''}
      </h1>

      <div className='flex items-center gap-3 pb-3'>
        <button onClick={() => navigate(-1)} className=" bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition duration-200 text-sm md:text-base">
          กลับ
        </button>
        <button onClick={() => setShowModal(true)} className=" bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition duration-200 text-sm md:text-base">
          + เพิ่มงาน
        </button>
        <button onClick={handleExportExcel} className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded transition duration-200 text-sm md:text-base">
          <HiOutlineDocumentDownload className="w-5 h-5" />
          Download Excel
        </button>
      </div>

      <p className='text-gray-700 py-2'>จำนวนงาน: {details.length}</p>

      <div className="w-full max-w-4xl mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-gray-500 text-sm">ค่าบรรทุกรวม</p>
          <p className="font-bold text-lg">{totalFreight.toLocaleString()} ฿</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-gray-500 text-sm">ค่าใช้จ่ายรวม</p>
          <p className="font-bold text-lg">{totalExpense.toLocaleString()} ฿</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-gray-500 text-sm">คงเหลือ</p>
          <p className="font-bold text-lg">{remaining.toLocaleString()} ฿</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-gray-500 text-sm">รายได้พขร.</p>
          <p className="font-bold text-lg">{driverIncome.toLocaleString()} ฿</p>
        </div>
      </div>


      {/* Desktop Table */}
      <div className="hidden md:block w-full overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow text-sm md:text-base">
          <thead>
            <tr className="bg-gray-200 text-gray-700">
              <th className="py-2 px-4 text-left">วันที่</th>
              <th className="py-2 px-4 text-left">ลูกค้า</th>
              <th className="py-2 px-4 text-left">รับตู้</th>
              <th className="py-2 px-4 text-left">คืนตู้</th>
              <th className="py-2 px-4 text-left">ส่งของ</th>
              <th className="py-2 px-4 text-right">ค่าบรรทุก</th>
              <th className="py-2 px-4 text-right">ค่าทางด่วน</th>
              <th className="py-2 px-4 text-right">ค่าก๊าซ</th>
              <th className="py-2 px-4 text-right">จ่ายพิเศษ</th>
              <th className="py-2 px-4 text-right">เบิก</th>
              <th className="py-2 px-4 text-center">หมายเหตุ</th>
              <th className="py-2 px-4 text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {details.length > 0 ? details.map(d => (
              <tr key={d.id} className="border-t hover:bg-gray-100 transition duration-200">
                <td className="py-2 px-4">{new Date(d.date).toLocaleDateString('th-TH')}</td>
                <td className="py-2 px-4">{d.customer_name}</td>
                <td className="py-2 px-4">{d.loading}</td>
                <td className="py-2 px-4">{d.returning}</td>
                <td className="py-2 px-4">{d.destination}</td>
                <td className="py-2 px-4 text-right">{parseFloat(d.freight).toLocaleString()}</td>
                <td className="py-2 px-4 text-right">{parseFloat(d.toll).toLocaleString()}</td>
                <td className="py-2 px-4 text-right">{parseFloat(d.gas).toLocaleString()}</td>
                <td className="py-2 px-4 text-right">{parseFloat(d.extra_expense).toLocaleString()}</td>
                <td className="py-2 px-4 text-right">{parseFloat(d.driver_advance).toLocaleString()}</td>
                <td className="py-2 px-4 text-center">{d.remark}</td>
                <td className="py-2 px-4 text-center flex justify-center gap-2">
                  <button 
                    onClick={() => handleOpenEdit(d)} 
                    className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs">
                    แก้ไข
                  </button>
                  <button onClick={() => setConfirmDelete({ show: true, id: d.id })} className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs">
                    ลบ
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="12" className="py-2 px-4 text-center text-gray-500">ยังไม่มีรายละเอียด</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="block md:hidden w-full space-y-4">
        {details.length > 0 ? details.map(d => (
          <div key={d.id} className="bg-white rounded-xl shadow p-4 border border-gray-100">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-gray-800 text-sm">{d.customer_name}</h3>
              <span className="text-xs text-gray-500">{new Date(d.date).toLocaleDateString('th-TH')}</span>
            </div>
            <p className="text-sm text-gray-600"><b>รับ:</b> {d.loading}</p>
            <p className="text-sm text-gray-600"><b>คืน:</b> {d.returning}</p>
            <p className="text-sm text-gray-600"><b>ส่งของ:</b> {d.destination}</p>
            <div className="grid grid-cols-2 text-sm text-gray-700 mt-2">
              <p><b>ค่าบรรทุก:</b> {d.freight}฿</p>
              <p><b>ค่าน้ำมัน:</b> {d.gas}฿</p>
              <p><b>ทางด่วน:</b> {d.toll}฿</p>
              <p><b>จ่ายพิเศษ:</b> {d.extra_expense}฿</p>
              {d.remark && <p><b>หมายเหตุ:</b> {d.remark}</p>}
              {d.driver_advance && <p><b>เบิก:</b> {d.driver_advance}</p>}
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button 
                onClick={() => handleOpenEdit(d)} 
                className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs">
                แก้ไข
              </button>
              <button onClick={() => setConfirmDelete({ show: true, id: d.id })} className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600">
                ลบ
              </button>
            </div>
          </div>
        )) : (
          <div className="text-center text-gray-500">ยังไม่มีรายละเอียด</div>
        )}
      </div>

      <button onClick={() => navigate(-1)} className=" bg-gray-500 text-white px-4 py-2 my-4 rounded hover:bg-gray-600 transition duration-200 text-sm md:text-base">
          กลับ
      </button>

      {/* Modal เพิ่มงาน */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg p-4 w-full max-w-md shadow-lg animate-fadeIn overflow-y-auto max-h-[90vh]">
            <h2 className="text-lg font-bold mb-4 text-center">เพิ่มงานใหม่</h2>

            <label className="block mb-2 text-sm">วันที่ <span className='text-red-500'>*</span></label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border rounded p-2 mb-2"/>

            {/* Customer dropdown */}
            <div className="relative mb-2">
              <label className="block mb-2 text-sm">ลูกค้า <span className='text-red-500'>*</span></label>
              <input
                type="text"
                value={customerName}
                onChange={e => {
                  setCustomerName(e.target.value)
                  setCustomer('')
                  setShowDropdown(true)
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="พิมพ์ชื่อลูกค้า..."
                className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200"
              />
              {showDropdown && (
                <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto animate-fadeIn">
                  {suggestions.map(item => (
                    <li key={item.id} onClick={() => { setCustomer(item.id); setCustomerName(item.name); setShowDropdown(false); }}
                      className="px-3 py-2 hover:bg-blue-100 cursor-pointer text-gray-700 text-sm transition-colors duration-150">
                      {item.name}
                    </li>
                  ))}
                  {!suggestions.find(s => s.name.toLowerCase() === customerName.toLowerCase()) && customerName.trim() !== '' && (
                    <li onClick={() => { setCustomer(''); setShowDropdown(false); }}
                      className="px-3 py-2 hover:bg-green-100 cursor-pointer text-green-700 text-sm font-semibold transition-colors duration-150">
                      ➕ เพิ่มลูกค้าใหม่: {customerName}
                    </li>
                  )}
                </ul>
              )}
            </div>

            <label className="block mb-2 text-sm">รับตู้</label>
            <input type="text" value={loadingLoc} onChange={e => setLoadingLoc(e.target.value)} className="w-full border rounded p-2 mb-2"/>
            <label className="block mb-2 text-sm">คืนตู้</label>
            <input type="text" value={returningLoc} onChange={e => setReturningLoc(e.target.value)} className="w-full border rounded p-2 mb-2"/>
            <label className="block mb-2 text-sm">ส่งของ</label>
            <input type="text" value={destination} onChange={e => setDestination(e.target.value)} className="w-full border rounded p-2 mb-2"/>
            <label className="block mb-2 text-sm">ค่าบรรทุก</label>
            <input type="number" value={freight} onChange={e => setFreight(e.target.value)} className="w-full border rounded p-2 mb-2"/>
            <label className="block mb-2 text-sm">ค่าทางด่วน</label>
            <input type="number" value={toll} onChange={e => setToll(e.target.value)} className="w-full border rounded p-2 mb-2"/>
            <label className="block mb-2 text-sm">ค่าก๊าซ/น้ำมัน</label>
            <input type="number" value={gas} onChange={e => setGas(e.target.value)} className="w-full border rounded p-2 mb-2"/>
            <label className="block mb-2 text-sm">จ่ายพิเศษ</label>
            <input type="number" value={extraExpense} onChange={e => setExtraExpense(e.target.value)} className="w-full border rounded p-2 mb-2"/>
            <label className="block mb-2 text-sm">หมายเหตุ</label>
            <input type="text" value={remark} onChange={e => setRemark(e.target.value)} className="w-full border rounded p-2 mb-4"/>
             <label className="block mb-2 text-sm">เบิก</label>
            <input type="text" value={driverAdvance} onChange={e => setDriverAdvance(e.target.value)} className="w-full border rounded p-2 mb-4"/>

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition">ยกเลิก</button>
              <button onClick={handleAddDetail} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition">บันทึก</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal แก้ไขรายละเอียด */}
        {showEditModal && editData && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="bg-white rounded-lg p-4 w-full max-w-md shadow-lg overflow-y-auto max-h-[90vh] animate-fadeIn">
              <h2 className="text-lg font-bold mb-4 text-center">แก้ไขรายละเอียด</h2>

              <label className="block mb-2 text-sm">วันที่</label>
              <input type="date" 
                value={editData.date} 
                onChange={e => setEditData({ ...editData, date: e.target.value })} 
                className="w-full border rounded p-2 mb-2"/>

                <div className="relative mb-2">
                  <label className="block mb-2 text-sm font-semibold">
                    ลูกค้า <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customerName} // ผูกกับ State กลาง
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      setCustomer(''); // ล้าง ID ทันทีที่มีการพิมพ์ใหม่ เพื่อรอเช็คว่าเป็นลูกค้าใหม่หรือไม่
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="พิมพ์ชื่อลูกค้า..."
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />

                  {/* Dropdown รายชื่อลูกค้า */}
                  {showDropdown && (
                    <ul className="absolute z-[100] w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto mt-1">
                      {suggestions.map((item) => (
                        <li
                          key={item.id}
                          onClick={() => {
                            setCustomer(item.id);
                            setCustomerName(item.name);
                            setShowDropdown(false);
                          }}
                          className="px-3 py-2 hover:bg-blue-100 cursor-pointer text-sm border-b last:border-none"
                        >
                          {item.name}
                        </li>
                      ))}

                      {/* ปุ่มเพิ่มลูกค้าใหม่ (กรณีพิมพ์ชื่อที่ไม่เคยมี) */}
                      {!suggestions.find((s) => s.name.toLowerCase() === customerName.toLowerCase()) &&
                        customerName.trim() !== "" && (
                          <li
                            onClick={() => {
                              setCustomer(""); // ยืนยันว่าไม่มี ID (เป็นลูกค้าใหม่)
                              setShowDropdown(false);
                            }}
                            className="px-3 py-2 hover:bg-green-100 cursor-pointer text-green-700 text-sm font-bold bg-green-50"
                          >
                            ➕ เพิ่มลูกค้าใหม่: "{customerName}"
                          </li>
                        )}
                    </ul>
                  )}
                </div>

              {/* <label className="block mb-2 text-sm">ลูกค้า</label>
              <input type="text" 
                value={editData.customer_name} 
                onChange={e => setEditData({ ...editData, customer_id: e.target.value })} 
                className="w-full border rounded p-2 mb-2 "
                /> */}

              <label className="block mb-2 text-sm">รับตู้</label>
              <input type="text" 
                value={editData.loading} 
                onChange={e => setEditData({ ...editData, loading: e.target.value })} 
                className="w-full border rounded p-2 mb-2"/>

              <label className="block mb-2 text-sm">คืนตู้</label>
              <input type="text" 
                value={editData.returning} 
                onChange={e => setEditData({ ...editData, returning: e.target.value })} 
                className="w-full border rounded p-2 mb-2"/>

              <label className="block mb-2 text-sm">ส่งของ</label>
              <input type="text" 
                value={editData.destination} 
                onChange={e => setEditData({ ...editData, destination: e.target.value })} 
                className="w-full border rounded p-2 mb-2"/>

              <label className="block mb-2 text-sm">ค่าบรรทุก</label>
              <input type="number" 
                value={editData.freight} 
                onChange={e => setEditData({ ...editData, freight: e.target.value })} 
                className="w-full border rounded p-2 mb-2"/>

              <label className="block mb-2 text-sm">ค่าทางด่วน</label>
              <input type="number" 
                value={editData.toll} 
                onChange={e => setEditData({ ...editData, toll: e.target.value })} 
                className="w-full border rounded p-2 mb-2"/>

              <label className="block mb-2 text-sm">ค่าก๊าซ/น้ำมัน</label>
              <input type="number" 
                value={editData.gas} 
                onChange={e => setEditData({ ...editData, gas: e.target.value })} 
                className="w-full border rounded p-2 mb-2"/>

              <label className="block mb-2 text-sm">จ่ายพิเศษ</label>
              <input type="number" 
                value={editData.extra_expense} 
                onChange={e => setEditData({ ...editData, extra_expense: e.target.value })} 
                className="w-full border rounded p-2 mb-2"/>

              <label className="block mb-2 text-sm">เบิก</label>
              <input type="number" 
                value={editData.driver_advance} 
                onChange={e => setEditData({ ...editData, driver_advance: e.target.value })} 
                className="w-full border rounded p-2 mb-2"/>

              <label className="block mb-2 text-sm">หมายเหตุ</label>
              <input type="text" 
                value={editData.remark} 
                onChange={e => setEditData({ ...editData, remark: e.target.value })} 
                className="w-full border rounded p-2 mb-4"/>

              <div className="flex justify-end gap-2">
                <button onClick={() => setShowEditModal(false)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition">ยกเลิก</button>
                <button onClick={handleUpdateDetail} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition">บันทึก</button>
              </div>
            </div>
          </div>
        )}


      {/* Modal ยืนยันลบ */}
      {confirmDelete.show && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg p-6 w-80 shadow-lg animate-fadeIn text-center">
            <h2 className="text-lg font-bold mb-4 text-red-600">ยืนยันการลบ</h2>
            <p className="mb-4 text-gray-700">คุณต้องการลบรายการนี้หรือไม่?</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setConfirmDelete({ show: false, id: null })} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition duration-200">ยกเลิก</button>
              <button onClick={() => handleDelete(confirmDelete.id)} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition duration-200">ลบ</button>
            </div>
          </div>
        </div>
      )}

      {/* Alert */}
      {showAlert && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[9999]">
          <div className={`flex items-center gap-2 px-6 py-3 rounded shadow-lg animate-fadeInOut ${alertType === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
            <span>{alertMsg}</span>
          </div>
        </div>
      )}
    </div>
  )
}

