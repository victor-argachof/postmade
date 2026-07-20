import reducer, { disconnectChannel, setChannels } from "./channels-slice";

describe("channelsSlice", () => {
  it("disconnects an existing channel", () => {
    const state = reducer(undefined, setChannels([{ id: "1", platform: "x", displayName: "Postmade", username: "postmade", connected: true }]));
    expect(reducer(state, disconnectChannel("1")).items[0]?.connected).toBe(false);
  });
});
