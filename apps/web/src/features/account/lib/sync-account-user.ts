import type { PublicUser } from "@postmade/types";

import { authApi } from "@/features/auth/services/auth-api";
import { setSession } from "@/features/auth/store/auth-slice";
import { updateMemberIdentity } from "@/features/workspaces/store/workspaces-slice";
import type { AppDispatch } from "@/shared/store";

export function syncAccountUser(dispatch: AppDispatch, user: PublicUser) {
  dispatch(setSession(user));
  dispatch(
    updateMemberIdentity({
      userId: user.id,
      name: user.name,
      email: user.email,
    })
  );
  dispatch(
    authApi.util.updateQueryData("me", undefined, (cached) => {
      Object.assign(cached, user);
    })
  );
}
