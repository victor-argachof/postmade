import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SocialChannel } from "@postmade/types";

interface ChannelsState { items: SocialChannel[] }
const initialState: ChannelsState = { items: [] };

const channelsSlice = createSlice({
  name: "channels",
  initialState,
  reducers: {
    setChannels: (state, action: PayloadAction<SocialChannel[]>) => { state.items = action.payload; },
    disconnectChannel: (state, action: PayloadAction<string>) => {
      const channel = state.items.find((item) => item.id === action.payload);
      if (channel) channel.connected = false;
    },
  },
});

export const { setChannels, disconnectChannel } = channelsSlice.actions;
export default channelsSlice.reducer;
