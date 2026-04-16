import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchRoutes = createAsyncThunk('transport/fetch', async (_, { rejectWithValue }) => {
  try { const { data } = await api.get('/transport'); return data; }
  catch (err) { return rejectWithValue(err.response?.data); }
});
export const createRoute = createAsyncThunk('transport/create', async (d, { rejectWithValue }) => {
  try { const { data } = await api.post('/transport', d); return data; }
  catch (err) { return rejectWithValue(err.response?.data); }
});
export const deleteRoute = createAsyncThunk('transport/delete', async (id, { rejectWithValue }) => {
  try { await api.delete(`/transport/${id}`); return id; }
  catch (err) { return rejectWithValue(err.response?.data); }
});

const slice = createSlice({
  name: 'transport',
  initialState: { routes: [], loading: false, error: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchRoutes.fulfilled, (s, a) => { s.routes = a.payload.routes; })
     .addCase(createRoute.fulfilled, (s, a) => { s.routes.push(a.payload.route); })
     .addCase(deleteRoute.fulfilled, (s, a) => { s.routes = s.routes.filter(r => r.id !== a.payload); });
  },
});

export default slice.reducer;
