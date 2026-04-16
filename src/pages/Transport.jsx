import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRoutes, createRoute, deleteRoute } from '../store/slices/transportSlice';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

export default function Transport() {
  const dispatch = useDispatch();
  const { routes } = useSelector((s) => s.transport);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ routeName: '', driverName: '', vehicleNo: '', capacity: 40, stops: [] });
  const [stopInput, setStopInput] = useState({ name: '', time: '' });

  useEffect(() => { dispatch(fetchRoutes()); }, [dispatch]);

  const addStop = () => {
    if (stopInput.name) {
      setForm({ ...form, stops: [...form.stops, { ...stopInput }] });
      setStopInput({ name: '', time: '' });
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await dispatch(createRoute(form)).unwrap();
      toast.success('Route created!');
      setShowModal(false);
      setForm({ routeName: '', driverName: '', vehicleNo: '', capacity: 40, stops: [] });
    } catch (err) { toast.error(err?.error || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this route?')) {
      await dispatch(deleteRoute(id));
      toast.success('Deleted');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Transport</h1>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">+ Add Route</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {routes.map((route) => (
          <div key={route.id} className="glass p-5">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">{route.routeName}</h3>
              <button onClick={() => handleDelete(route.id)} className="text-gray-400 hover:text-red-600 text-sm">✕</button>
            </div>
            <div className="space-y-1 text-sm">
              <p className="text-gray-600">Vehicle: {route.vehicleNo || 'N/A'}</p>
              <p className="text-gray-600">Driver: {route.driverName || 'N/A'}</p>
              <p className="text-gray-600">Capacity: {route.capacity}</p>
            </div>
            {route.stops && route.stops.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2">Stops:</p>
                {route.stops.map((s, i) => (
                  <p key={i} className="text-xs text-gray-500 ml-2">- {s.name} {s.time && `(${s.time})`}</p>
                ))}
              </div>
            )}
          </div>
        ))}
        {routes.length === 0 && <div className="glass p-10 text-center text-gray-400 col-span-full">No routes added</div>}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Bus Route">
        <form onSubmit={handleCreate} className="space-y-4">
          <input className="input-field" placeholder="Route Name" value={form.routeName} onChange={(e) => setForm({ ...form, routeName: e.target.value })} required />
          <input className="input-field" placeholder="Driver Name" value={form.driverName} onChange={(e) => setForm({ ...form, driverName: e.target.value })} />
          <input className="input-field" placeholder="Vehicle No" value={form.vehicleNo} onChange={(e) => setForm({ ...form, vehicleNo: e.target.value })} />
          <input type="number" className="input-field" placeholder="Capacity" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
          <div className="border border-dark-700/50 rounded-xl p-3 space-y-2">
            <p className="text-sm text-dark-300">Stops:</p>
            {form.stops.map((s, i) => (
              <p key={i} className="text-sm text-dark-400 ml-2">• {s.name} {s.time && `(${s.time})`}</p>
            ))}
            <div className="flex gap-2">
              <input className="input-field flex-1" placeholder="Stop name" value={stopInput.name} onChange={(e) => setStopInput({ ...stopInput, name: e.target.value })} />
              <input type="time" className="input-field w-32" value={stopInput.time} onChange={(e) => setStopInput({ ...stopInput, time: e.target.value })} />
              <button type="button" onClick={addStop} className="btn btn-ghost">+</button>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost">Cancel</button>
            <button type="submit" className="btn btn-primary">Create Route</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
