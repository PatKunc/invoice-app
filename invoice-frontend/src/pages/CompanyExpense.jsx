import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, X, Save, AlertCircle, Calendar, 
  Loader2, ArrowRight, Home, CheckCircle2, CreditCard, 
  ShieldCheck, FileText, PieChart 
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function CompanyExpensePage() {
  const navigate = useNavigate();
  
  // --- States ---
  const [expenses, setExpenses] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  
  const [formData, setFormData] = useState({
    expense_date: new Date().toISOString().split('T')[0],
    expense_type: 'งวดรถ',
    amount: '',
    description: '',
    truck_id: ''
  });

  const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api/companyExpense`;

  // --- Helpers ---
  const showStatus = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [expRes, truckRes] = await Promise.all([
        axios.get(API_URL),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/trucks`)
      ]);
      setExpenses(expRes.data);
      setTrucks(truckRes.data);
    } catch (err) {
      showStatus('โหลดข้อมูลไม่สำเร็จ', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const getTruckNumber = (id) => {
    const truck = trucks.find(t => t.id === parseInt(id));
    return truck ? truck.truck_number : 'ไม่ระบุ';
  };

  // --- Logic: Calculations ---
  const { groupedExpenses, yearlyBreakdown, totalYearlyAmount } = useMemo(() => {
    const filtered = expenses.filter(item => 
      new Date(item.expense_date).getFullYear().toString() === selectedYear
    );

    const yBreakdown = filtered.reduce((acc, curr) => {
      acc[curr.expense_type] = (acc[curr.expense_type] || 0) + Number(curr.amount);
      return acc;
    }, {});

    const totalY = filtered.reduce((sum, item) => sum + Number(item.amount), 0);

    const groups = filtered.reduce((acc, item) => {
      const month = new Date(item.expense_date).getMonth();
      if (!acc[month]) acc[month] = [];
      acc[month].push(item);
      return acc;
    }, {});

    const sortedGroups = Object.keys(groups).sort((a, b) => b - a).map(month => ({
      month: parseInt(month),
      data: groups[month].sort((a, b) => new Date(b.expense_date) - new Date(a.expense_date)),
      total: groups[month].reduce((sum, item) => sum + Number(item.amount), 0)
    }));

    return { groupedExpenses: sortedGroups, yearlyBreakdown: yBreakdown, totalYearlyAmount: totalY };
  }, [expenses, selectedYear]);

  const typeIcons = {
    'งวดรถ': <CreditCard className="text-blue-500" size={20} />,
    'ประกันพนักงาน': <ShieldCheck className="text-emerald-500" size={20} />,
    'ภาษี': <FileText className="text-amber-500" size={20} />
  };

  // --- Handlers ---
  const handleSave = async () => {
    try {
      const payload = { ...formData, truck_id: formData.truck_id || null };
      if (currentRecord) {
        await axios.put(`${API_URL}/${currentRecord.expense_id}`, payload);
        showStatus('แก้ไขข้อมูลสำเร็จแล้ว');
      } else {
        await axios.post(API_URL, payload);
        showStatus('เพิ่มข้อมูลใหม่เรียบร้อย');
      }
      fetchData();
      setIsModalOpen(false);
    } catch (err) {
      showStatus('เกิดข้อผิดพลาดในการบันทึก', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_URL}/${currentRecord.expense_id}`);
      showStatus('ลบข้อมูลเรียบร้อยแล้ว');
      fetchData();
      setIsDeleteModalOpen(false);
    } catch (err) {
      showStatus('ลบข้อมูลไม่สำเร็จ', 'error');
    }
  };

  const monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthNamesFull = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤกษาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans pb-20 text-slate-900">
      
      {/* --- Toast Notification --- */}
      {toast.show && (
        <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-top-10 ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="font-bold">{toast.message}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-3 bg-white hover:bg-slate-100 rounded-2xl shadow-sm border border-slate-200 transition-all active:scale-95 group">
              <Home size={22} className="text-slate-600 group-hover:text-blue-600" />
            </button>
            <div>
              <h1 className="text-6xl font-black italic tracking-tighter uppercase leading-none text-blue-900">TN2P</h1>
              <p className="text-slate-400 font-bold text-xs tracking-widest uppercase mt-1">Company Expenses Management</p>
            </div>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <select 
              className="px-5 py-3 bg-white border border-slate-200 rounded-2xl font-black shadow-sm outline-none focus:ring-2 ring-blue-500/20" 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = (new Date().getFullYear() - i).toString();
                return <option key={year} value={year}>{year}</option>;
              })}
            </select>
            <button 
              onClick={() => { 
                setFormData({ expense_date: new Date().toISOString().split('T')[0], expense_type: 'งวดรถ', amount: '', description: '', truck_id: '' }); 
                setCurrentRecord(null); 
                setIsModalOpen(true); 
              }} 
              className="flex-grow md:flex-grow-0 bg-blue-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all hover:translate-y-[-2px]"
            >
              + เพิ่มรายจ่าย
            </button>
          </div>
        </div>

        {/* --- Top Dashboard Cards --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
          <div className="lg:col-span-4 bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden group flex flex-col justify-center">
            <div className="relative z-10">
              <p className="text-blue-400 text-[10px] font-black tracking-widest mb-2 uppercase">Annual Expenditure</p>
              <h2 className="text-6xl font-black tracking-tighter">฿{totalYearlyAmount.toLocaleString()}</h2>
            </div>
            <PieChart className="absolute -right-6 -bottom-6 opacity-10 group-hover:scale-110 transition-transform" size={180} />
          </div>

          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {['งวดรถ', 'ประกันพนักงาน', 'ภาษี'].map(type => {
              const amount = yearlyBreakdown[type] || 0;
              const percentage = totalYearlyAmount > 0 ? (amount / totalYearlyAmount) * 100 : 0;
              return (
                <div key={type} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col justify-between hover:border-blue-200 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-blue-50 transition-colors">
                      {typeIcons[type]}
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter bg-slate-50 px-2 py-1 rounded-lg">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{type}</p>
                    <p className="text-2xl font-black text-slate-800 tracking-tight">฿{amount.toLocaleString()}</p>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${type === 'งวดรถ' ? 'bg-blue-500' : type === 'ภาษี' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* --- Monthly Table --- */}
        {groupedExpenses.map((group) => (
          <div key={group.month} className="mb-14">
            <div className="flex items-center gap-6 mb-6">
              <span className="text-4xl font-black text-slate-200">{(group.month + 1).toString().padStart(2, '0')}</span>
              <h3 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter"> {monthNamesFull[group.month]}</h3>
              <div className="h-px flex-grow bg-slate-200"></div>
              <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
                <span className="text-sm font-black text-blue-600 tracking-tight">฿{group.total.toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr className="uppercase font-black text-[10px] text-slate-400 tracking-widest">
                    <th className="px-8 py-5">Date</th>
                    <th className="px-8 py-5">Description & Category</th>
                    <th className="px-8 py-5 text-right">Amount</th>
                    <th className="px-8 py-5 text-center">Manage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {group.data.map((expense) => (
                    <tr key={expense.expense_id} className="group hover:bg-slate-50/80 transition-all">
                      <td className="px-8 py-6 font-black text-slate-900 text-sm">
                        {new Date(expense.expense_date).getDate()} {monthNamesShort[group.month]} {new Date(expense.expense_date).getFullYear()}
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-800 text-base">{expense.description}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[12px] font-black text-slate-400 uppercase tracking-wider">{expense.expense_type}</span>
                            {expense.truck_id && (
                              <span className="flex items-center gap-1 text-[12px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md">
                                <ArrowRight size={15} /> {getTruckNumber(expense.truck_id)}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right font-black text-slate-900 text-xl tracking-tighter italic">
                        ฿{Number(expense.amount).toLocaleString()}
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => { 
                              setCurrentRecord(expense); 
                              setFormData({ ...expense, expense_date: expense.expense_date.split('T')[0], truck_id: expense.truck_id || '' }); 
                              setIsModalOpen(true); 
                            }} 
                            className="p-3 bg-white text-slate-400 hover:text-blue-600 border border-slate-200 rounded-xl shadow-sm transition-all hover:scale-105 active:scale-95"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => { setCurrentRecord(expense); setIsDeleteModalOpen(true); }} 
                            className="p-3 bg-white text-slate-400 hover:text-red-600 border border-slate-200 rounded-xl shadow-sm transition-all hover:scale-105 active:scale-95"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* --- Add/Edit Modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-xl text-slate-900 uppercase italic tracking-tighter">{currentRecord ? 'Edit Entry' : 'New Entry'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="bg-white p-2 rounded-full shadow-sm hover:text-red-500 transition-colors"><X size={20} /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Date</label>
                  <input type="date" value={formData.expense_date} onChange={(e) => setFormData({...formData, expense_date: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-blue-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Category</label>
                  <select value={formData.expense_type} onChange={(e) => setFormData({...formData, expense_type: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-blue-500 outline-none transition-all">
                    <option value="งวดรถ">งวดรถ</option>
                    <option value="ประกันพนักงาน">ประกันพนักงาน</option>
                    <option value="ภาษี">ภาษี</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Amount (฿)</label>
                <input type="number" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black text-3xl text-blue-600 focus:border-blue-500 outline-none" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Truck Link</label>
                <select value={formData.truck_id} onChange={(e) => setFormData({...formData, truck_id: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-blue-500 outline-none">
                  <option value="">-- ส่วนกลาง (OFFICE) --</option>
                  {trucks.map(truck => ( <option key={truck.id} value={truck.id}>{truck.truck_number}</option> ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Memo</label>
                <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-blue-500 outline-none" rows="2" placeholder="ระบุเลขที่บิล หรือรายละเอียด..."></textarea>
              </div>
            </div>
            <div className="p-8 bg-slate-50 flex gap-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 font-black text-slate-400 uppercase tracking-widest text-xs">Cancel</button>
              <button onClick={handleSave} className="flex-[2] bg-slate-900 text-white px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 italic">
                 <Save size={18} /> SAVE RECORD
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Delete Confirmation Modal --- */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[90] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 text-center shadow-2xl animate-in zoom-in duration-150">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100"><AlertCircle size={40} /></div>
            <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tighter italic">Delete?</h3>
            <p className="text-slate-500 font-bold text-sm mb-8 leading-relaxed uppercase">ข้อมูลจะถูกลบถาวรจากฐานข้อมูล</p>
            <div className="flex gap-3">
              <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-4 font-black text-slate-400 uppercase text-[10px] tracking-widest">Back</button>
              <button onClick={handleDelete} className="flex-1 py-4 font-black bg-red-500 text-white rounded-2xl shadow-xl shadow-red-200 hover:bg-red-600 transition-all uppercase text-[10px] tracking-widest">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}