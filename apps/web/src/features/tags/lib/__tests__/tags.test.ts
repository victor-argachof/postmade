import { effectivePublicationContent, normalizeTags } from "../tags";

describe("tag helpers", () => {
  it("normalizes unicode tags and removes case-insensitive duplicates", () => {
    expect(
      normalizeTags(["#Postmade", "postmade", " criação ", "inválida-tag"])
    ).toEqual(["Postmade", "criação"]);
  });

  it("appends deduplicated snapshot hashtags to content", () => {
    expect(
      effectivePublicationContent("Hello", [
        { groupId: "one", groupName: "One", tags: ["Postmade", "social"] },
        { groupId: "two", groupName: "Two", tags: ["postmade", "conteúdo"] },
      ])
    ).toBe("Hello\n\n#Postmade #social #conteúdo");
    expect(
      effectivePublicationContent("", [
        { groupId: "one", groupName: "One", tags: ["Postmade"] },
      ])
    ).toBe("#Postmade");
  });
});
