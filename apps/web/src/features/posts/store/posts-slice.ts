import type { SocialPlatform } from "@postmade/types";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { PublicationFilters } from "../types";

interface PostsState {
  draft: { content: string; selectedPlatforms: SocialPlatform[] };
  filters: PublicationFilters;
}
const initialState: PostsState = {
  draft: { content: "", selectedPlatforms: [] },
  filters: {
    query: "",
    status: "all",
    platform: "all",
    channelId: "all",
    from: "",
    to: "",
  },
};

const postsSlice = createSlice({
  name: "posts",
  initialState,
  reducers: {
    updateDraftContent: (state, action: PayloadAction<string>) => {
      state.draft.content = action.payload;
    },
    toggleDraftPlatform: (state, action: PayloadAction<SocialPlatform>) => {
      const index = state.draft.selectedPlatforms.indexOf(action.payload);
      if (index >= 0) state.draft.selectedPlatforms.splice(index, 1);
      else state.draft.selectedPlatforms.push(action.payload);
    },
    resetDraft: () => initialState,
    setPublicationFilters: (
      state,
      action: PayloadAction<Partial<PublicationFilters>>
    ) => {
      state.filters = { ...state.filters, ...action.payload };
    },
  },
});

export const {
  updateDraftContent,
  toggleDraftPlatform,
  resetDraft,
  setPublicationFilters,
} = postsSlice.actions;
export default postsSlice.reducer;
