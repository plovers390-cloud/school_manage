import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboardStats } from '../store/slices/reportSlice';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#4f46e5', '#7c3aed', '#2563eb', '#0891b2', '#059669'];

export default function Dashboard() {
  const dispatch = useDispatch();
  const { stats, loading } = useSelector((state) => state.reports);
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  if (loading || !stats) return <LoadingSpinner size="lg" />;

  const attendanceData = (stats.todayAttendance || []).map((a) => ({
    name: a.status,
    value: parseInt(a.count),
  }));

  const genderData = (stats.genderStats || []).map((g) => ({
    name: g.gender,
    value: parseInt(g.count),
  }));

  const classData = (stats.classStats || []).map((c) => ({
    name: c.class?.name || 'Unknown',
    students: parseInt(c.count),
  }));

  const feeData = (stats.monthlyFees || []).map((f) => ({
    month: new Date(f.month).toLocaleDateString('en-IN', { month: 'short' }),
    amount: parseFloat(f.total),
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">System Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1 font-medium italic">
            {user?.role === 'superuser' ? 'Unified Super Admin Control Center' : 'St. Xavier\'s School Management Console'}
          </p>
        </div>
        <div className="glass-light px-4 py-2 rounded-xl border border-white/5 shadow-inner">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest">Live System Status</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-sm font-bold text-gray-200">All Modules Healthy</span>
          </div>
        </div>
      </div>

      {/* Scrolling Notices Marquee */}
      <div className="glass-premium border border-primary-500/20 overflow-hidden shadow-2xl relative group">
        <div className="absolute left-0 top-0 bottom-0 px-4 bg-primary-600 flex items-center z-10 shadow-lg">
          <span className="font-black text-xs tracking-tighter italic text-white">BREAKING</span>
        </div>
        <marquee className="py-3 pl-24 text-sm font-bold tracking-wide text-white" scrollamount="5">
          🚀 <span className="text-primary-400 font-black">SYSTEM UPDATE:</span> &nbsp; Experience the all-new modern dashboard with optimized glassmorphism. &nbsp;&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;&nbsp; 🏫 <span className="text-primary-400 font-black">ST.XAVIER'S SCHOOL:</span> Excellence in Education, Empowering the Future. &nbsp;&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;&nbsp; 🛠️ Developed with ❤️ by <span className="text-yellow-400">Aditya Kumar</span>
        </marquee>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Students" value={stats.totalStudents || 0} icon="S" gradient="gradient-primary" subtitle="Across all classes" />
        <StatCard title="Total Teachers" value={stats.totalTeachers || 0} icon="T" gradient="gradient-success" subtitle="Active teaching staff" />
        <StatCard title="Classes" value={stats.totalClasses || 0} icon="C" gradient="gradient-warning" subtitle="Educational levels" />
        <StatCard title="Current Year" value={new Date().getFullYear()} icon="Y" gradient="gradient-info" subtitle="Academic Session" />
      </div>

      {/* Quick Actions - Modernized */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Primary Operations</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'New Admission', path: '/students?action=new', icon: '+', color: 'from-blue-600 to-indigo-700' },
            { label: 'Collect Fees', path: '/fees', icon: '₹', color: 'from-emerald-600 to-teal-700' },
            { label: 'Attendance', path: '/attendance', icon: '✓', color: 'from-purple-600 to-fuchsia-700' },
            { label: 'Timetable', path: '/timetable', icon: '⌚', color: 'from-amber-600 to-orange-700' },
          ].map((action, i) => (
            <button 
              key={i} 
              onClick={() => navigate(action.path)}
              className={`bg-gradient-to-br ${action.color} p-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:scale-105 transition-transform shadow-lg group`}
            >
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white text-xl font-bold group-hover:bg-white/30 transition-colors">
                {action.icon}
              </div>
              <span className="text-white text-xs font-bold tracking-wide">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 glass-premium p-6">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-white">Student Distribution</h3>
            <span className="text-xs text-gray-500 font-semibold bg-gray-100/5 px-3 py-1 rounded-full border border-white/5 uppercase">Per Class Count</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={classData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} axisLine={false} tickLine={false} dy={10} />
              <YAxis stroke="#64748b" fontSize={11} axisLine={false} tickLine={false} dx={-10} />
              <Tooltip 
                cursor={{ fill: '#ffffff08' }}
                contentStyle={{ background: '#0a1128', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff' }} 
              />
              <Bar dataKey="students" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-4 glass-premium p-6">
          <h3 className="text-lg font-bold text-white mb-6">Today's Attendance</h3>
          {attendanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie 
                  data={attendanceData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={70} 
                  outerRadius={100} 
                  paddingAngle={5}
                  dataKey="value"
                >
                  {attendanceData.map((_, i) => (
                    <Cell key={i} fill={['#10b981', '#ef4444', '#f59e0b'][i % 3]} stroke="rgba(0,0,0,0.2)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#0a1128', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex flex-col items-center justify-center text-gray-500 gap-3">
              <div className="w-16 h-16 rounded-full bg-gray-100/5 flex items-center justify-center border border-white/5 italic font-bold">?</div>
              <p className="text-xs uppercase tracking-widest font-bold">No Records Today</p>
            </div>
          )}
        </div>

        {/* Revenue/Fee Chart - Area Chart for Modern Look */}
        <div className="lg:col-span-12 glass-premium p-6">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-white">Fee Collection Trends</h3>
            <div className="flex gap-2">
               <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">↑ 12% MONTHLY</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={feeData}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
              <XAxis dataKey="month" stroke="#64748b" fontSize={11} axisLine={false} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#0a1128', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff' }} />
              <Area type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
