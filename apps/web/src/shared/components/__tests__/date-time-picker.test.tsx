import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DatePicker, DateTimePicker } from "../date-time-picker";

import "@/shared/i18n";

describe("date and time pickers", () => {
  it("selects a date without a native date input", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <DatePicker
        aria-label="Publication date"
        onChange={onChange}
        value="2026-08-07"
      />
    );
    expect(
      document.querySelector('input[type="date"]')
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Publication date" }));
    await user.click(
      screen.getByRole("button", {
        name: /15 de agosto de 2026|august 15, 2026/i,
      })
    );
    expect(onChange).toHaveBeenCalledWith("2026-08-15");
  });

  it("renders time controls with shadcn selects", () => {
    render(
      <DateTimePicker
        aria-label="Schedule"
        onChange={() => undefined}
        value="2026-08-07T09:30"
      />
    );
    expect(screen.getAllByRole("combobox")).toHaveLength(2);
    expect(
      document.querySelector('input[type="datetime-local"]')
    ).not.toBeInTheDocument();
  });

  it("disables past time options only when requested", async () => {
    const user = userEvent.setup();
    render(
      <DateTimePicker
        aria-label="Schedule"
        disablePast
        min="2026-08-07T09:20"
        onChange={() => undefined}
        value="2026-08-07T09:30"
      />
    );

    const [hour, minute] = screen.getAllByRole("combobox");
    await user.click(hour!);
    expect(screen.getByRole("option", { name: "08" })).toHaveAttribute(
      "aria-disabled",
      "true"
    );
    await user.keyboard("{Escape}");
    await user.click(minute!);
    expect(screen.getByRole("option", { name: "15" })).toHaveAttribute(
      "aria-disabled",
      "true"
    );
    expect(screen.getByRole("option", { name: "30" })).not.toHaveAttribute(
      "aria-disabled",
      "true"
    );
  });
});
