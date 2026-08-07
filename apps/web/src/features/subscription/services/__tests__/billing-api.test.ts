import { configureStore } from "@reduxjs/toolkit";
import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "@/shared/api/api";
import { billingApi } from "../billing-api";

describe("billingApi", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("sends configured quantities to checkout", async () => {
    const NativeRequest = globalThis.Request;
    vi.stubGlobal("Request", class extends NativeRequest {
      constructor(input: RequestInfo | URL, init?: RequestInit) {
        super(typeof input === "string" && input.startsWith("/")
          ? new URL(input, window.location.origin)
          : input, init);
      }
    });
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(
      JSON.stringify({ url: "https://checkout.example" }),
      { headers: { "content-type": "application/json" }, status: 200 },
    ));
    const store = configureStore({
      reducer: { [api.reducerPath]: api.reducer },
      middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
    });

    await store.dispatch(billingApi.endpoints.createCheckoutSession.initiate({
      workspaceId: "workspace-1",
      channelQuantity: 25,
      memberQuantity: 4,
    })).unwrap();

    const request = fetchMock.mock.calls[0]![0] as Request;
    expect(request.url).toContain("/workspaces/workspace-1/checkout");
    expect(await request.clone().json()).toEqual({
      channelQuantity: 25,
      memberQuantity: 4,
    });
  });

  it("sends new quantities to the subscription update endpoint", async () => {
    const NativeRequest = globalThis.Request;
    vi.stubGlobal("Request", class extends NativeRequest {
      constructor(input: RequestInfo | URL, init?: RequestInit) {
        super(typeof input === "string" && input.startsWith("/")
          ? new URL(input, window.location.origin)
          : input, init);
      }
    });
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));
    const store = configureStore({
      reducer: { [api.reducerPath]: api.reducer },
      middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
    });

    await store.dispatch(billingApi.endpoints.updateSubscription.initiate({
      workspaceId: "workspace-1",
      channelQuantity: 6,
      memberQuantity: 3,
    })).unwrap();

    const request = fetchMock.mock.calls[0]![0] as Request;
    expect(request.url).toContain("/workspaces/workspace-1/subscription");
    expect(request.method).toBe("PATCH");
    expect(await request.clone().json()).toEqual({
      channelQuantity: 6,
      memberQuantity: 3,
    });
  });
});
