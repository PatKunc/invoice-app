import { useNavigate } from 'react-router-dom'
import { useEffect, useState, useMemo } from 'react'
import { 
  Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title 
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title);

export default function Dashboard() {
  const navigate = useNavigate();
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Filter States ---
  const [selectedTruck, setSelectedTruck] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');

  const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/invoiceDetails/all`)
      .then(res => res.json())
      .then(data => {
        setRawData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error:", err);
        setLoading(false);
      });
  }, []);

  // ดึงข้อมูลทะเบียนรถและปีที่มีในระบบมาทำ Dropdown
  const truckOptions = useMemo(() => ['all', ...new Set(rawData.map(d => d.truck_number).filter(Boolean))].sort(), [rawData]);
  const yearOptions = useMemo(() => {
    const years = rawData.map(d => new Date(d.date).getFullYear().toString());
    return ['all', ...new Set(years)].sort((a, b) => b - a);
  }, [rawData]);

  // --- การคำนวณข้อมูลทั้งหมด ---
  const { filteredStats, chartData, chartLabels, comparisonData } = useMemo(() => {
    const stats = { revenue: 0, expense: 0, gas: 0, toll: 0, maintenance: 0, extra: 0 };
    const trucksComparison = {}; 
    
    let labels = [];
    let dataRev = [];
    let dataExp = [];

    // แก้ Bug หน้าพัง: ถ้าปีเป็น 'all' หรือเดือนเป็น 'all' ให้แสดงเป็นรายเดือน
    if (selectedYear === 'all' || selectedMonth === 'all') {
      labels = monthNames;
      dataRev = Array(12).fill(0);
      dataExp = Array(12).fill(0);
    } else {
      // เคสระบุทั้งปีและเดือน -> แสดงรายวัน
      const daysInMonth = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0).getDate();
      labels = Array.from({length: daysInMonth}, (_, i) => (i + 1).toString());
      dataRev = Array(daysInMonth).fill(0);
      dataExp = Array(daysInMonth).fill(0);
    }

    rawData.forEach(item => {
      const itemDate = new Date(item.date);
      const itemYear = itemDate.getFullYear().toString();
      const itemMonthIdx = itemDate.getMonth();
      const itemMonthStr = (itemMonthIdx + 1).toString();
      const itemDay = itemDate.getDate();
      const tNum = item.truck_number || 'ไม่ระบุ';

      const matchTruck = selectedTruck === 'all' || item.truck_number === selectedTruck;
      const matchYear = selectedYear === 'all' || itemYear === selectedYear;
      const matchMonth = selectedMonth === 'all' || itemMonthStr === selectedMonth;

      if (matchTruck && matchYear && matchMonth) {
        const freight = Number(item.freight || 0);
        const gas = Number(item.gas || 0);
        const toll = Number(item.toll || 0);
        const maint = Number(item.driver_advance || 0);
        const extra = Number(item.extra_expense || 0);
        const totalExp = gas + toll + maint + extra;

        stats.revenue += freight;
        stats.expense += totalExp;
        stats.gas += gas;
        stats.toll += toll;
        stats.maintenance += maint;
        stats.extra += extra;

        if (selectedYear === 'all' || selectedMonth === 'all') {
          dataRev[itemMonthIdx] += freight;
          dataExp[itemMonthIdx] += totalExp;
        } else {
          dataRev[itemDay - 1] += freight;
          dataExp[itemDay - 1] += totalExp;
        }

        if (selectedTruck === 'all') {
          if (!trucksComparison[tNum]) trucksComparison[tNum] = { rev: 0, exp: 0 };
          trucksComparison[tNum].rev += freight;
          trucksComparison[tNum].exp += totalExp;
        }
      }
    });

    return { filteredStats: stats, chartData: { dataRev, dataExp }, chartLabels: labels, comparisonData: trucksComparison };
  }, [rawData, selectedTruck, selectedYear, selectedMonth]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500 font-bold">กำลังโหลดข้อมูล...</div>;

  const netProfit = filteredStats.revenue - filteredStats.expense;
  const isLoss = netProfit < 0;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* หัวข้อและตัวเลือก Filter */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Dashboard 🚛</h1>
            <p className="text-gray-500 font-medium text-lg">สรุปงานขนส่ง: {selectedTruck === 'all' ? 'รถทุกคัน' : `ทะเบียน ${selectedTruck}`}</p>
          </div>
          
          <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl shadow-sm border border-gray-200">
            <select className="bg-gray-100 border-none rounded-xl px-3 py-2 text-sm font-bold cursor-pointer" value={selectedTruck} onChange={(e) => setSelectedTruck(e.target.value)}>
              <option value="all">รถทุกคัน</option>
              {truckOptions.filter(o => o !== 'all').map(opt => <option key={opt} value={opt}>ทะเบียน {opt}</option>)}
            </select>

            <select className="bg-gray-100 border-none rounded-xl px-3 py-2 text-sm font-bold cursor-pointer" value={selectedYear} onChange={(e) => { setSelectedYear(e.target.value); if(e.target.value === 'all') setSelectedMonth('all'); }}>
              <option value="all">ทุกปี</option>
              {yearOptions.filter(o => o !== 'all').map(y => <option key={y} value={y}>ปี {y}</option>)}
            </select>

            <select className={`bg-gray-100 border-none rounded-xl px-3 py-2 text-sm font-bold ${selectedYear === 'all' ? 'opacity-50' : 'cursor-pointer'}`} value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} disabled={selectedYear === 'all'}>
              <option value="all">ทุกเดือน</option>
              {monthNames.map((name, index) => (<option key={index} value={(index + 1).toString()}>{name}</option>))}
            </select>

            <button onClick={() => navigate('/')} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-red-500 transition">กลับหน้าหลัก</button>
          </div>
        </div>

        {/* --- Card สรุปหลัก (Logic สีเขียว/แดง ตามกำไร) --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border-b-8 border-green-500">
            <p className="text-gray-400 text-base font-bold mb-1 uppercase text-center md:text-left">รายรับรวม</p>
            <p className="text-3xl font-black text-green-600 text-center md:text-left">฿{filteredStats.revenue.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border-b-8 border-red-500">
            <p className="text-gray-400 text-base font-bold mb-1 uppercase text-center md:text-left">รายจ่ายรวม</p>
            <p className="text-3xl font-black text-red-500 text-center md:text-left">฿{filteredStats.expense.toLocaleString()}</p>
          </div>
          <div className={`p-6 rounded-3xl shadow-lg text-white transition-all duration-500 ${isLoss ? 'bg-red-600' : 'bg-green-600'} text-center md:text-left`}>
            <p className="text-white text-base font-bold mb-1 uppercase opacity-80">{isLoss ? 'ขาดทุนสุทธิ (Net Loss)' : 'กำไรสุทธิ (Net Profit)'}</p>
            <p className="text-3xl font-black">
               {isLoss ? '-' : ''}฿{Math.abs(netProfit).toLocaleString()}
            </p>
          </div>
        </div>

        {/* --- Card รายจ่ายแยกประเภท --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'น้ำมัน/แก๊ส', val: filteredStats.gas, color: 'text-red-500' },
            { label: 'ค่าทางด่วน', val: filteredStats.toll, color: 'text-orange-500' },
            { label: 'ซ่อม/เบี้ยเลี้ยง', val: filteredStats.maintenance, color: 'text-yellow-600' },
            { label: 'จ่ายอื่นๆ', val: filteredStats.extra, color: 'text-gray-500' }
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center md:text-left">
              <p className="text-gray-400 text-xs font-bold uppercase mb-1">{item.label}</p>
              <p className={`text-xl font-bold ${item.color}`}>฿{item.val.toLocaleString()}</p>
            </div>
          ))}
        </div>

        {/* กราฟเส้นแนวโน้ม */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mb-8">
          <h3 className="font-bold text-gray-700 mb-6 text-lg uppercase">แนวโน้ม {selectedMonth === 'all' ? 'รายเดือน' : `รายวันของเดือน ${monthNames[selectedMonth-1]}`}</h3>
          <div className="h-[300px]">
            <Line data={{ 
              labels: chartLabels, 
              datasets: [
                { label: 'รายรับ', data: chartData.dataRev, borderColor: '#10b981', backgroundColor: '#10b981', tension: 0.4 }, 
                { label: 'รายจ่าย', data: chartData.dataExp, borderColor: '#f43f5e', backgroundColor: '#f43f5e', tension: 0.4 }
              ] 
            }} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
          </div>
        </div>

        {/* เปรียบเทียบผลงานรถแต่ละคัน (แสดงเฉพาะตอนเลือก "รถทุกคัน") */}
        {selectedTruck === 'all' && (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 mb-8 animate-in fade-in duration-700">
            <h3 className="font-bold text-gray-700 mb-6 text-lg uppercase">เปรียบเทียบผลงานรายคัน</h3>
            <div className="h-[300px]">
              <Bar 
                data={{
                  labels: Object.keys(comparisonData),
                  datasets: [
                    { label: 'รายรับ', data: Object.values(comparisonData).map(v => v.rev), backgroundColor: '#10b981', borderRadius: 8 },
                    { label: 'รายจ่าย', data: Object.values(comparisonData).map(v => v.exp), backgroundColor: '#f43f5e', borderRadius: 8 }
                  ]
                }}
                options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* กราฟโดนัท (Doughnut) */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center">
            <h3 className="font-bold text-gray-700 mb-6 uppercase">สัดส่วนรายจ่ายจริง</h3>
            <div className="max-w-[260px] mx-auto">
              <Doughnut 
                data={{ 
                  labels: ['น้ำมัน/แก๊ส', 'ทางด่วน', 'ซ่อมบำรุง', 'อื่นๆ'], 
                  datasets: [{ 
                    data: [filteredStats.gas, filteredStats.toll, filteredStats.maintenance, filteredStats.extra], 
                    backgroundColor: ['#dc2626', '#ef4444', '#f97316', '#fbbf24'],
                    borderWidth: 0
                  }] 
                }} 
                options={{ cutout: '70%', plugins: { legend: { position: 'bottom' } } }}
              />
            </div>
          </div>
          
          {/* อัตรากำไร (Margin) */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center items-center">
            <h3 className="font-bold text-gray-700 mb-4 text-xl uppercase tracking-wider">Profit Margin</h3>
            <div className={`text-6xl font-black mb-4 tracking-tighter ${isLoss ? 'text-red-500' : 'text-blue-600'}`}>
              {filteredStats.revenue > 0 ? ((netProfit) / filteredStats.revenue * 100).toFixed(1) : 0}%
            </div>
            <div className="w-full bg-gray-100 h-5 rounded-full overflow-hidden mb-3 p-1">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${isLoss ? 'bg-red-500' : 'bg-blue-500'}`} 
                style={{ width: `${Math.min(Math.max(filteredStats.revenue > 0 ? ((netProfit) / filteredStats.revenue * 100) : 0, 0), 100)}%` }}
              ></div>
            </div>
            <p className="text-gray-400 text-sm font-medium italic">ประสิทธิภาพการทำกำไรตามฟิลเตอร์</p>
          </div>
        </div>

      </div>
    </div>
  );
}