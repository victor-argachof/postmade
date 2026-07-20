import reducer, { selectDate } from "./calendar-slice";

describe("calendarSlice", () => {
  it("selects a date", () => {
    expect(reducer(undefined, selectDate("2026-07-18")).selectedDate).toBe("2026-07-18");
  });
});
