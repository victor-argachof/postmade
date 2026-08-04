import { configureStore } from "@reduxjs/toolkit";
import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "@/shared/api/api";
import { billingApi } from "./billing-api";

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
      billingCycle: "annual",
      channelQuantity: 25,
      memberQuantity: 4,
    })).unwrap();

    const request = fetchMock.mock.calls[0]![0] as Request;
    expect(request.url).toContain("/workspaces/workspace-1/checkout");
    expect(await request.clone().json()).toEqual({
      billingCycle: "annual",
      channelQuantity: 25,
      memberQuantity: 4,
    });
  });
});
