import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchFeeStructures = createAsyncThunk('fees/structures', async (params, { rejectWithValue }) => {
  try { const { data } = await api.get('/fees/structure', { params }); return data; }
  catch (err) { return rejectWithValue(err.response?.data); }
});
export const createFeeStructure = createAsyncThunk('fees/createStructure', async (d, { rejectWithValue }) => {
  try { const { data } = await api.post('/fees/structure', d); return data; }
  catch (err) { return rejectWithValue(err.response?.data); }
});
export const fetchPayments = createAsyncThunk('fees/payments', async (params, { rejectWithValue }) => {
  try { const { data } = await api.get('/fees/payment', { params }); return data; }
  catch (err) { return rejectWithValue(err.response?.data); }
});
export const recordPayment = createAsyncThunk('fees/recordPayment', async (d, { rejectWithValue }) => {
  try { const { data } = await api.post('/fees/payment', d); return data; }
  catch (err) { return rejectWithValue(err.response?.data); }
});

const slice = createSlice({
  name: 'fees',
  initialState: { structures: [], payments: [], pagination: null, loading: false, error: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchFeeStructures.fulfilled, (s, a) => { s.structures = a.payload.structures; })
     .addCase(createFeeStructure.fulfilled, (s, a) => { s.structures.push(a.payload.structure); })
     .addCase(fetchPayments.fulfilled, (s, a) => { s.payments = a.payload.payments; s.pagination = a.payload.pagination; })
     .addCase(recordPayment.fulfilled, (s, a) => { s.payments.unshift(a.payload.payment); });
  },
});

export default slice.reducer;
