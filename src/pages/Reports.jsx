import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboardStats } from '../store/slices/reportSlice';
import LoadingSpinner from '../components/LoadingSpinner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444'];

export default function Reports() {
  const dispatch = useDispatch();
  const { stats, loading } = useSelector((s) => s.reports);

  useEffect(() => { dispatch(fetchDashboardStats()); }, [dispatch]);

  if (loading || !stats) return <LoadingSpinner size="lg" />;

  const genderData = (stats.genderStats || []).map((g) => ({ name: g.gender, value: parseInt(g.count) }));
  const classData = (stats.classStats || []).map((c) => ({ name: c.class?.name || 'Unknown', students: parseInt(c.count) }));
  const feeData = (stats.monthlyFees || []).map((f) => ({ month: new Date(f.month).toLocaleDateString('en-IN', { month: 'short' }), amount: parseFloat(f.total) }));
  const attendanceData = (stats.todayAttendance || []).map((a) => ({ name: a.status, value: parseInt(a.count) }));

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Students per Class</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={classData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#1e293b' }} />
              <Bar dataKey="students" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Gender Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={genderData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label>
                {genderData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#1e293b' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="glass p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Monthly Fee Collection (₹)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={feeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#1e293b' }} />
              <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Today's Attendance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={attendanceData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label>
                {attendanceData.map((_, i) => <Cell key={i} fill={['#10b981', '#ef4444', '#f59e0b'][i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
