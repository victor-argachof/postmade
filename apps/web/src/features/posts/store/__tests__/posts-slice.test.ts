import reducer, {
  toggleDraftPlatform,
  updateDraftContent,
} from "../posts-slice";

describe("postsSlice", () => {
  it("updates content and toggles a platform", () => {
    let state = reducer(undefined, updateDraftContent("Hello world"));
    state = reducer(state, toggleDraftPlatform("linkedin"));
    expect(state.draft).toEqual({
      content: "Hello world",
      selectedPlatforms: ["linkedin"],
    });
  });
});
