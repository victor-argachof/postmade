import { configureStore } from "@reduxjs/toolkit";
import { afterEach, expect, it, vi } from "vitest";

import { api } from "@/shared/api/api";

import { tagsApi } from "../tags-api";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function setupFetch(response: object) {
  const NativeRequest = globalThis.Request;
  vi.stubGlobal(
    "Request",
    class extends NativeRequest {
      constructor(input: RequestInfo | URL, init?: RequestInit) {
        super(
          typeof input === "string" && input.startsWith("/")
            ? new URL(input, window.location.origin)
            : input,
          init
        );
      }
    }
  );
  const fetchMock = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(Response.json(response));
  const store = configureStore({
    reducer: { [api.reducerPath]: api.reducer },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(api.middleware),
  });
  return { fetchMock, store };
}

it("sends pagination, search and sorting to the administrative endpoint", async () => {
  const { fetchMock, store } = setupFetch({
    items: [],
    page: 2,
    pageSize: 25,
    total: 0,
    totalPages: 0,
  });
  await store
    .dispatch(
      tagsApi.endpoints.getTagGroups.initiate({
        workspaceId: "workspace-1",
        page: 2,
        pageSize: 25,
        query: "social",
        sortBy: "tagCount",
        sortDirection: "desc",
      })
    )
    .unwrap();
  const request = fetchMock.mock.calls[0]![0] as Request;
  const url = new URL(request.url);
  expect(url.pathname).toContain("/workspaces/workspace-1/tag-groups");
  expect(Object.fromEntries(url.searchParams)).toMatchObject({
    page: "2",
    pageSize: "25",
    query: "social",
    sortBy: "tagCount",
    sortDirection: "desc",
  });
});

it("sends selected snapshot IDs to lookup", async () => {
  const { fetchMock, store } = setupFetch({
    options: [],
    existingIds: ["tag-1"],
  });
  await store
    .dispatch(
      tagsApi.endpoints.lookupTagGroups.initiate({
        workspaceId: "workspace-1",
        query: "post",
        includeIds: ["tag-1", "tag-2"],
      })
    )
    .unwrap();
  const url = new URL((fetchMock.mock.calls[0]![0] as Request).url);
  expect(url.pathname).toContain("/tag-groups/lookup");
  expect(url.searchParams.get("includeIds")).toBe("tag-1,tag-2");
});
