import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SearchInput } from "../search-input";

describe("SearchInput", () => {
  it("renders a standardized searchbox with primary focus styles", () => {
    render(
      <SearchInput aria-label="Search" onChange={() => undefined} value="" />
    );
    const input = screen.getByRole("searchbox", { name: "Search" });
    expect(input).toHaveAttribute("type", "search");
    expect(input).toHaveClass("focus:border-primary", "focus:ring-primary/20");
  });

  it("clears a controlled value through its optional action", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(
      <SearchInput
        aria-label="Search"
        clearLabel="Clear search"
        onChange={() => undefined}
        onClear={onClear}
        value="Postmade"
      />
    );
    await user.click(screen.getByRole("button", { name: "Clear search" }));
    expect(onClear).toHaveBeenCalledOnce();
  });
});
