import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

import "@/shared/i18n";

import { TagInput } from "../tag-input";

function Fixture() {
  const [tags, setTags] = useState<string[]>([]);
  return <TagInput value={tags} onChange={setTags} />;
}

describe("TagInput", () => {
  it("creates, deduplicates and removes chips with the keyboard", async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    const input = screen.getByRole("textbox", { name: /hashtag/i });
    await user.type(input, "#Postmade{Enter}postmade{Enter}conteúdo,");
    expect(screen.getByText("#Postmade")).toBeInTheDocument();
    expect(screen.getByText("#conteúdo")).toBeInTheDocument();
    expect(screen.getAllByText(/#Postmade/i)).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: /remove #postmade/i }));
    expect(screen.queryByText("#Postmade")).not.toBeInTheDocument();
  });
});
