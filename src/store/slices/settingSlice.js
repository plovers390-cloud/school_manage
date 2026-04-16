import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchSettings = createAsyncThunk('settings/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/settings');
    return data.settings;
  } catch (error) {
    return rejectWithValue(error.response.data);
  }
});

export const updateSettings = createAsyncThunk('settings/update', async (formData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/settings', formData);
    return data.settings;
  } catch (error) {
    return rejectWithValue(error.response.data);
  }
});

const initialState = {
  school: {
    name: "My School",
    logo: null,
    address: "",
    phone: "",
    email: "",
    principalName: "",
    tagline: "",
    currentSession: "2024-2025"
  },
  loading: false,
  error: null,
};

const settingSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.school = action.payload;
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.school = action.payload;
      })
      .addCase(updateSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default settingSlice.reducer;
