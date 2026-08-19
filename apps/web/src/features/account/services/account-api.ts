import { api } from "@/shared/api/api";

import type {
  AccountDeletionImpact,
  DeleteAccountRequest,
} from "../types/deletion";

export const accountApi = api.injectEndpoints({
  endpoints: (build) => ({
    getAccountDeletionImpact: build.query<AccountDeletionImpact, void>({
      query: () => "/account/deletion-impact",
    }),
    deleteAccount: build.mutation<void, DeleteAccountRequest>({
      query: (body) => ({
        url: "/account",
        method: "DELETE",
        body,
      }),
    }),
  }),
});

export const {
  useLazyGetAccountDeletionImpactQuery,
  useDeleteAccountMutation,
} = accountApi;
