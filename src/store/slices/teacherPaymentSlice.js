import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchTeacherPayments = createAsyncThunk('teacherPayments/fetch', async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/teacher-payments', { params });
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data || { error: 'Failed to fetch payments' });
  }
});

export const createTeacherPayment = createAsyncThunk('teacherPayments/create', async (paymentData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/teacher-payments', paymentData);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data || { error: 'Failed to record payment' });
  }
});

const teacherPaymentSlice = createSlice({
  name: 'teacherPayments',
  initialState: {
    payments: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTeacherPayments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeacherPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.payments = action.payload.payments;
      })
      .addCase(fetchTeacherPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error;
      })
      .addCase(createTeacherPayment.fulfilled, (state, action) => {
        state.payments.unshift(action.payload.payment);
      });
  },
});

export default teacherPaymentSlice.reducer;
