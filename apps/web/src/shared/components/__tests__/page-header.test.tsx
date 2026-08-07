import { render, screen } from "@testing-library/react";
import { PageHeader } from "../page-header";

describe("PageHeader", () => {
  it("renders the provided fields", () => {
    render(<PageHeader eyebrow="Workspace" title="Settings" description="Manage your workspace." />);

    expect(screen.getByText("Workspace")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Settings" })).toBeInTheDocument();
    expect(screen.getByText("Manage your workspace.")).toBeInTheDocument();
  });

  it("supports omitted fields", () => {
    render(<PageHeader title="Settings" />);

    expect(screen.getByRole("heading", { level: 1, name: "Settings" })).toBeInTheDocument();
    expect(screen.queryByText("Workspace")).not.toBeInTheDocument();
  });
});
