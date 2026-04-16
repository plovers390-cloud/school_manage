import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    loadingCount: 0,
    error: null,
  },
  reducers: {
    startLoading: (state) => {
      state.loadingCount += 1;
    },
    stopLoading: (state) => {
      state.loadingCount = Math.max(0, state.loadingCount - 1);
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { startLoading, stopLoading, setError, clearError } = uiSlice.actions;
export default uiSlice.reducer;
