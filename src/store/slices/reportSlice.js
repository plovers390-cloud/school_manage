import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchDashboardStats = createAsyncThunk('reports/dashboard', async (_, { rejectWithValue }) => {
  try { const { data } = await api.get('/reports/dashboard'); return data; }
  catch (err) { return rejectWithValue(err.response?.data); }
});

const slice = createSlice({
  name: 'reports',
  initialState: { stats: null, loading: false, error: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchDashboardStats.pending, (s) => { s.loading = true; })
     .addCase(fetchDashboardStats.fulfilled, (s, a) => { s.loading = false; s.stats = a.payload; })
     .addCase(fetchDashboardStats.rejected, (s) => { s.loading = false; });
  },
});

export default slice.reducer;
