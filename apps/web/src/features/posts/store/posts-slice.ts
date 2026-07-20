import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SocialPlatform } from "@postmade/types";

interface PostsState {
  draft: { content: string; selectedPlatforms: SocialPlatform[] };
}
const initialState: PostsState = { draft: { content: "", selectedPlatforms: [] } };

const postsSlice = createSlice({
  name: "posts",
  initialState,
  reducers: {
    updateDraftContent: (state, action: PayloadAction<string>) => { state.draft.content = action.payload; },
    toggleDraftPlatform: (state, action: PayloadAction<SocialPlatform>) => {
      const index = state.draft.selectedPlatforms.indexOf(action.payload);
      if (index >= 0) state.draft.selectedPlatforms.splice(index, 1);
      else state.draft.selectedPlatforms.push(action.payload);
    },
    resetDraft: () => initialState,
  },
});

export const { updateDraftContent, toggleDraftPlatform, resetDraft } = postsSlice.actions;
export default postsSlice.reducer;
