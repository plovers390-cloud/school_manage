import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const bulkMarkAttendance = createAsyncThunk('attendance/bulk', async (d, { rejectWithValue }) => {
  try { const { data } = await api.post('/attendance/bulk', d); return data; }
  catch (err) { return rejectWithValue(err.response?.data); }
});
export const fetchAttendance = createAsyncThunk('attendance/fetch', async (params, { rejectWithValue }) => {
  try { const { data } = await api.get('/attendance', { params }); return data; }
  catch (err) { return rejectWithValue(err.response?.data); }
});
export const fetchMonthlyReport = createAsyncThunk('attendance/monthly', async (params, { rejectWithValue }) => {
  try { const { data } = await api.get('/attendance/monthly', { params }); return data; }
  catch (err) { return rejectWithValue(err.response?.data); }
});
export const fetchLowAttendance = createAsyncThunk('attendance/low', async (params, { rejectWithValue }) => {
  try { const { data } = await api.get('/attendance/low', { params }); return data; }
  catch (err) { return rejectWithValue(err.response?.data); }
});

const slice = createSlice({
  name: 'attendance',
  initialState: { records: [], monthlyReport: null, lowAttendance: [], loading: false, error: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(bulkMarkAttendance.pending, (s) => { s.loading = true; })
     .addCase(bulkMarkAttendance.fulfilled, (s) => { s.loading = false; })
     .addCase(bulkMarkAttendance.rejected, (s, a) => { s.loading = false; s.error = a.payload?.error; })
     .addCase(fetchAttendance.fulfilled, (s, a) => { s.records = a.payload.attendances; })
     .addCase(fetchMonthlyReport.fulfilled, (s, a) => { s.monthlyReport = a.payload; })
     .addCase(fetchLowAttendance.fulfilled, (s, a) => { s.lowAttendance = a.payload.lowAttendanceStudents; });
  },
});

export default slice.reducer;
