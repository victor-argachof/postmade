import { fireEvent, render, screen } from "@testing-library/react";
import { useDismissibleDetails } from "../use-dismissible-details";

function TestDropdown() {
  const ref = useDismissibleDetails();

  return (
    <>
      <details ref={ref} data-testid="dropdown">
        <summary>Open</summary>
        Content
      </details>
      <button type="button">Outside</button>
    </>
  );
}

describe("useDismissibleDetails", () => {
  it("closes an open details element on outside interaction and Escape", () => {
    render(<TestDropdown />);
    const dropdown = screen.getByTestId("dropdown");

    dropdown.setAttribute("open", "");
    fireEvent.pointerDown(screen.getByRole("button", { name: "Outside" }));
    expect(dropdown).not.toHaveAttribute("open");

    dropdown.setAttribute("open", "");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(dropdown).not.toHaveAttribute("open");
  });
});
