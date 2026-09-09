import { configureStore } from "@reduxjs/toolkit";
import { afterEach, expect, it, vi } from "vitest";

import { api } from "@/shared/api/api";

import { postsApi } from "../posts-api";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it("updates only the internal title through the dedicated endpoint", async () => {
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
  const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
    Response.json({
      id: "publication-1",
      createdBy: "user-1",
      title: "Campanha",
      status: "published",
      content: "Legenda",
      media: [],
      targets: [],
      scheduledFor: null,
      publishedAt: "2026-09-09T12:00:00.000Z",
      createdAt: "2026-09-09T12:00:00.000Z",
      updatedAt: "2026-09-09T12:00:00.000Z",
    })
  );
  const store = configureStore({
    reducer: { [api.reducerPath]: api.reducer },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(api.middleware),
  });

  await store
    .dispatch(
      postsApi.endpoints.updatePublicationTitle.initiate({
        workspaceId: "workspace-1",
        publicationId: "publication-1",
        title: "Campanha",
      })
    )
    .unwrap();

  const request = fetchMock.mock.calls[0]![0] as Request;
  expect(request.url).toContain(
    "/workspaces/workspace-1/publications/publication-1/title"
  );
  expect(request.method).toBe("PATCH");
  expect(await request.clone().json()).toEqual({ title: "Campanha" });
});
