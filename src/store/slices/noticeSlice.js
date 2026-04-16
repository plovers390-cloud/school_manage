import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchNotices = createAsyncThunk('notices/fetch', async (_, { rejectWithValue }) => {
  try { const { data } = await api.get('/notices'); return data; }
  catch (err) { return rejectWithValue(err.response?.data); }
});
export const createNotice = createAsyncThunk('notices/create', async (d, { rejectWithValue }) => {
  try { const { data } = await api.post('/notices', d); return data; }
  catch (err) { return rejectWithValue(err.response?.data); }
});
export const deleteNotice = createAsyncThunk('notices/delete', async (id, { rejectWithValue }) => {
  try { await api.delete(`/notices/${id}`); return id; }
  catch (err) { return rejectWithValue(err.response?.data); }
});

const slice = createSlice({
  name: 'notices',
  initialState: { list: [], loading: false, error: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchNotices.fulfilled, (s, a) => { s.list = a.payload.notices; })
     .addCase(createNotice.fulfilled, (s, a) => { s.list.unshift(a.payload.notice); })
     .addCase(deleteNotice.fulfilled, (s, a) => { s.list = s.list.filter(n => n.id !== a.payload); });
  },
});

export default slice.reducer;
