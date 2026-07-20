import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface CalendarState { selectedDate: string | null }
const initialState: CalendarState = { selectedDate: null };

const calendarSlice = createSlice({
  name: "calendar",
  initialState,
  reducers: {
    selectDate: (state, action: PayloadAction<string | null>) => { state.selectedDate = action.payload; },
  },
});

export const { selectDate } = calendarSlice.actions;
export default calendarSlice.reducer;
