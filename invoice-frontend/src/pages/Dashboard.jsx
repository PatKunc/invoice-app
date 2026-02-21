import { useNavigate } from 'react-router-dom'
import { useEffect, useState, useMemo } from 'react'
import { 
  Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title 
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { FileSpreadsheet } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title);

export default function Dashboard() {
  const navigate = useNavigate();
  const [rawData, setRawData] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedTruck, setSelectedTruck] = useState('all');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState('all');

  const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

  useEffect(() => {
    Promise.all([
      fetch(`${import.meta.env.VITE_API_BASE_URL}/api/invoiceDetails/all`).then(res => res.json()),
      fetch(`${import.meta.env.VITE_API_BASE_URL}/api/trucks`).then(res => res.json())
    ])
      .then(([invoiceData, truckData]) => {
        setRawData(invoiceData);
        setTrucks(truckData);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error:", err);
        setLoading(false);
      });
  }, []);

  const handleExportExcel = () => {
    const currentTruck = trucks.find(t => t.truck_number === selectedTruck);
    const truckId = currentTruck ? currentTruck.id : '';
    const query = new URLSearchParams();
    if (selectedYear !== 'all') query.append('year', selectedYear);
    if (truckId) query.append('truckId', truckId);
    if (selectedMonth !== 'all') query.append('month', selectedMonth);

    const exportUrl = `${import.meta.env.VITE_API_BASE_URL}/api/excel/summary?${query.toString()}`;
    window.open(exportUrl, '_blank');
  };

  const truckOptions = useMemo(() => ['all', ...new Set(rawData.map(d => d.truck_number).filter(Boolean))].sort(), [rawData]);
  const yearOptions = useMemo(() => {
    const years = rawData.map(d => new Date(d.date).getFullYear().toString());
    return ['all', ...new Set(years)].sort((a, b) => b - a);
  }, [rawData]);

  const { filteredStats, chartData, chartLabels, comparisonData } = useMemo(() => {
    const stats = { 
      revenue: 0, 
      expense: 0, 
      gas: 0, 
      toll: 0, 
      maintenanceOnly: 0, 
      repair: 0,          
      parking: 0,         
      extra: 0, 
      driverWage: 0,        
      driverWage10Wheel: 0  
    };
    const trucksComparison = {}; 
    let labels = [];
    let dataRev = [];
    let dataExp = [];

    if (selectedYear === 'all' || selectedMonth === 'all') {
      labels = monthNames;
      dataRev = Array(12).fill(0);
      dataExp = Array(12).fill(0);
    } else {
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
        const maintTotal = Number(item.driver_advance || 0); 
        const extra = Number(item.extra_expense || 0);
        const remark = (item.remark || '').toLowerCase();
        const isTenWheeler = Number(item.truck_id) === 4;

        let currentWage16 = 0;
        let currentWage10 = 0;
        let itemRepair = 0;
        let itemParking = 0;
        let itemMaintOnly = 0;

        if (isTenWheeler) {
          currentWage16 = 0; 
          if (remark.includes('สิบล้อ')) {
            currentWage10 = maintTotal;
          } else {
            if (remark.includes('ซ่อม') || remark.includes('ยาง')) itemRepair = maintTotal;
            else if (remark.includes('จอด') || remark.includes('พัก')) itemParking = maintTotal;
            else itemMaintOnly = maintTotal;
          }
        } else {
          currentWage16 = (freight - toll) * 0.16;
          currentWage10 = 0;
          if (maintTotal > 0) {
            if (remark.includes('ซ่อม') || remark.includes('ยาง')) itemRepair = maintTotal;
            else if (remark.includes('จอด') || remark.includes('พัก')) itemParking = maintTotal;
            else itemMaintOnly = maintTotal;
          }
        }

        const totalExp = gas + toll + maintTotal + extra + currentWage16;

        stats.revenue += freight;
        stats.expense += totalExp;
        stats.gas += gas;
        stats.toll += toll;
        stats.repair += itemRepair;
        stats.parking += itemParking;
        stats.maintenanceOnly += itemMaintOnly;
        stats.extra += extra;
        stats.driverWage += currentWage16;
        stats.driverWage10Wheel += currentWage10;

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

    return { 
      filteredStats: stats, 
      chartData: { dataRev, dataExp }, 
      chartLabels: labels, 
      comparisonData: trucksComparison 
    };
  }, [rawData, selectedTruck, selectedYear, selectedMonth]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500 font-bold">กำลังโหลดข้อมูล...</div>;

  const netProfit = (filteredStats?.revenue || 0) - (filteredStats?.expense || 0);
  const isLoss = netProfit < 0;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Dashboard 🚛</h1>
            <p className="text-gray-500 font-medium text-lg">สรุปงาน: {selectedTruck === 'all' ? 'รถทุกคัน' : `ทะเบียน ${selectedTruck}`}</p>
          </div>
          
          <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl shadow-sm border border-gray-200 items-center">
            <button onClick={handleExportExcel} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors">
              <FileSpreadsheet size={18} /> ส่งออก Excel
            </button>
            <div className="h-8 w-[1px] bg-gray-200 mx-1 hidden md:block"></div>
            <select className="bg-gray-100 border-none rounded-xl px-3 py-2 text-sm font-bold cursor-pointer" value={selectedTruck} onChange={(e) => setSelectedTruck(e.target.value)}>
              <option value="all">รถทุกคัน</option>
              {truckOptions.filter(o => o !== 'all').map(opt => <option key={opt} value={opt}>ทะเบียน {opt}</option>)}
            </select>
            <select className="bg-gray-100 border-none rounded-xl px-3 py-2 text-sm font-bold cursor-pointer" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
              <option value="all">ทุกปี</option>
              {yearOptions.filter(o => o !== 'all').map(y => <option key={y} value={y}>ปี {y}</option>)}
            </select>
            <select className="bg-gray-100 border-none rounded-xl px-3 py-2 text-sm font-bold cursor-pointer" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} disabled={selectedYear === 'all'}>
              <option value="all">ทุกเดือน</option>
              {monthNames.map((name, index) => (<option key={index} value={(index + 1).toString()}>{name}</option>))}
            </select>
            <button onClick={() => navigate('/')} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-red-500 transition">กลับหน้าหลัก</button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 p-6 rounded-3xl shadow-xl border-b-8 border-blue-500">
            <p className="text-gray-500 text-xs font-bold mb-1 uppercase tracking-widest">รายรับทั้งหมด</p>
            <p className="text-3xl font-black text-blue-600">฿{(filteredStats?.revenue || 0).toLocaleString()}</p>
          </div>
          <div className="bg-red-50 p-6 rounded-3xl shadow-xl border-b-8 border-red-500">
            <p className="text-gray-500 text-xs font-bold mb-1 uppercase tracking-widest">รายจ่ายรวมบริษัท</p>
            <p className="text-3xl font-black text-red-500">฿{(filteredStats?.expense || 0).toLocaleString()}</p>
          </div>
          <div className={`p-6 rounded-3xl shadow-xl text-white ${isLoss ? 'bg-red-600' : 'bg-emerald-600'}`}>
            <p className="text-xs font-bold mb-1 uppercase opacity-80 tracking-widest">กำไรสุทธิ</p>
            <p className="text-3xl font-black">฿{Math.abs(netProfit).toLocaleString()}</p>
            <p className="text-[10px] mt-1 italic">*แยกคิด 16% (6ล้อ) และ เหมาจ่าย (10ล้อ)</p>
          </div>
        </div>

        {/* Detail Expense Cards */}
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-700">
          <span className="w-2 h-6 bg-orange-500 rounded-full"></span>
          รายละเอียดรายจ่ายและค่าแรงคนขับ
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-10">
          <div className="bg-amber-50 p-4 rounded-2xl shadow-sm border-t-4 border-amber-500">
            <p className="text-amber-600 text-[10px] font-black uppercase">แก๊ส/น้ำมัน</p>
            <p className="text-lg font-bold text-amber-700">฿{(filteredStats?.gas || 0).toLocaleString()}</p>
          </div>
          <div className="bg-sky-50 p-4 rounded-2xl shadow-sm border-t-4 border-sky-500">
            <p className="text-sky-600 text-[10px] font-black uppercase">ทางด่วน</p>
            <p className="text-lg font-bold text-sky-700">฿{(filteredStats?.toll || 0).toLocaleString()}</p>
          </div>
          <div className="bg-fuchsia-50 p-4 rounded-2xl shadow-sm border-t-4 border-fuchsia-500">
            <p className="text-fuchsia-600 text-[10px] font-black uppercase">ค่าซ่อม/อะไหล่</p>
            <p className="text-lg font-bold text-fuchsia-700">฿{(filteredStats?.repair || 0).toLocaleString()}</p>
          </div>
          <div className="bg-rose-50 p-4 rounded-2xl shadow-sm border-t-4 border-rose-500">
            <p className="text-rose-600 text-[10px] font-black uppercase">ค่าจอด/ด่าน</p>
            <p className="text-lg font-bold text-rose-700">฿{(filteredStats?.parking || 0).toLocaleString()}</p>
          </div>
          <div className="bg-gray-100 p-4 rounded-2xl shadow-sm border-t-4 border-gray-400">
            <p className="text-gray-500 text-[10px] font-black uppercase">อื่นๆ</p>
            <p className="text-lg font-bold text-gray-700">฿{(filteredStats?.maintenanceOnly || 0).toLocaleString()}</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-2xl shadow-sm border-t-4 border-orange-500">
            <p className="text-orange-600 text-[10px] font-black uppercase">เบี้ยเลี้ยง</p>
            <p className="text-lg font-bold text-orange-700">฿{(filteredStats?.extra || 0).toLocaleString()}</p>
          </div>
          <div className="bg-emerald-50 p-4 rounded-2xl shadow-sm border-t-4 border-emerald-500">
            <p className="text-emerald-600 text-[10px] font-black uppercase">ค่าแรง 16%</p>
            <p className="text-lg font-bold text-emerald-700">฿{(filteredStats?.driverWage || 0).toLocaleString()}</p>
          </div>
          <div className="bg-indigo-50 p-4 rounded-2xl shadow-sm border-t-4 border-indigo-600">
            <p className="text-indigo-600 text-[10px] font-black uppercase">ค่าแรง 10 ล้อ</p>
            <p className="text-lg font-bold text-indigo-700">฿{(filteredStats?.driverWage10Wheel || 0).toLocaleString()}</p>
          </div>
        </div>

        {/* Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Bar Chart */}
          <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-700 mb-6 text-sm uppercase">แนวโน้มรายรับ - รายจ่าย</h3>
            <div className="h-[300px]">
              <Bar 
                data={{ 
                  labels: chartLabels, 
                  datasets: [
                    { label: 'รายรับ', data: chartData?.dataRev || [], backgroundColor: '#3b82f6', borderRadius: 5 }, 
                    { label: 'รายจ่าย', data: chartData?.dataExp || [], backgroundColor: '#ef4444', borderRadius: 5 }
                  ] 
                }} 
                options={{ maintainAspectRatio: false, plugins: { legend: { labels: { font: { weight: 'bold' } } } } }} 
              />
            </div>
          </div>

          {/* Doughnut Chart with Percentages */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center">
            <h3 className="font-bold text-gray-700 mb-5 text-lg uppercase">สัดส่วนรายจ่ายบริษัท</h3>
            <div className="max-w-[280px] mx-auto">
              <Doughnut 
                data={{ 
                  labels: ['แก๊ส', 'ทางด่วน', 'ค่าซ่อม', 'ค่าจอด', 'อื่นๆ', 'ค่าแรง 16%', 'ค่าแรง 10 ล้อ', 'เบี้ยเลี้ยง'], 
                  datasets: [{ 
                    data: [
                      filteredStats?.gas || 0, 
                      filteredStats?.toll || 0, 
                      filteredStats?.repair || 0, 
                      filteredStats?.parking || 0, 
                      filteredStats?.maintenanceOnly || 0,
                      filteredStats?.driverWage || 0,
                      filteredStats?.driverWage10Wheel || 0,
                      filteredStats?.extra || 0
                    ], 
                    backgroundColor: ['#f59e0b', '#0ea5e9', '#d946ef', '#f43f5e', '#94a3b8', '#10b981', '#4f46e5', '#f97316'],
                    borderWidth: 0
                  }] 
                }} 
                options={{ 
                  cutout: '70%', 
                  plugins: { 
                    legend: { 
                      position: 'bottom', 
                      labels: { 
                        usePointStyle: true, 
                        font: { size: 12 },
                        generateLabels: (chart) => {
                          const data = chart.data;
                          if (data.labels.length && data.datasets.length) {
                            const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                            return data.labels.map((label, i) => {
                              const value = data.datasets[0].data[i];
                              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                              return {
                                text: `${label} (${percentage}%)`,
                                fillStyle: data.datasets[0].backgroundColor[i],
                                index: i
                              };
                            });
                          }
                          return [];
                        }
                      } 
                    },
                    tooltip: {
                      callbacks: {
                        label: (context) => {
                          const label = context.label || '';
                          const value = context.parsed || 0;
                          const total = context.dataset.data.reduce((a, b) => a + b, 0);
                          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                          return `${label}: ฿${value.toLocaleString()} (${percentage}%)`;
                        }
                      }
                    }
                  } 
                }} 
              />
            </div>
          </div>
        </div>

        {/* Bottom Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
             <h3 className="font-bold text-gray-700 mb-6 text-sm uppercase">เปรียบเทียบผลงานรายทะเบียนรถ</h3>
             <div className="h-[250px]">
                <Bar 
                  data={{
                    labels: Object.keys(comparisonData),
                    datasets: [
                      { label: 'รายรับ', data: Object.values(comparisonData).map(v => v.rev), backgroundColor: '#10b981', borderRadius: 8 },
                      { label: 'รายจ่าย', data: Object.values(comparisonData).map(v => v.exp), backgroundColor: '#f43f5e', borderRadius: 8 }
                    ]
                  }}
                  options={{ maintainAspectRatio: false }}
                />
             </div>
          </div>
          
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
            <h3 className="font-bold text-gray-700 mb-4 text-lg uppercase tracking-widest">อัตรากำไร (Margin)</h3>
            <div className={`text-6xl font-black mb-4 tracking-tighter ${isLoss ? 'text-red-500' : 'text-emerald-600'}`}>
              {(filteredStats?.revenue || 0) > 0 ? ((netProfit / filteredStats.revenue) * 100).toFixed(1) : 0}%
            </div>
            <div className="w-full bg-gray-100 h-5 rounded-full overflow-hidden p-1">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${isLoss ? 'bg-red-500' : 'bg-emerald-500'}`} 
                style={{ width: `${Math.min(Math.max((filteredStats?.revenue || 0) > 0 ? ((netProfit / filteredStats.revenue) * 100) : 0, 0), 100)}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-gray-400 mt-4 uppercase font-bold tracking-widest">Efficiency Indicator</p>
          </div>
        </div>

      </div>
    </div>
  );
}