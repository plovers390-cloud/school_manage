import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchTimetable = createAsyncThunk('timetable/fetch', async (params, { rejectWithValue }) => {
  try { const { data } = await api.get('/timetable', { params }); return data; }
  catch (err) { return rejectWithValue(err.response?.data); }
});
export const createTimetable = createAsyncThunk('timetable/create', async (d, { rejectWithValue }) => {
  try { const { data } = await api.post('/timetable', d); return data; }
  catch (err) { return rejectWithValue(err.response?.data); }
});

const slice = createSlice({
  name: 'timetable',
  initialState: { entries: [], loading: false, error: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchTimetable.fulfilled, (s, a) => { s.entries = a.payload.timetables; })
     .addCase(createTimetable.fulfilled, (s, a) => { s.entries.push(a.payload.timetable); })
     .addCase(createTimetable.rejected, (s, a) => { s.error = a.payload?.error; });
  },
});

export default slice.reducer;
