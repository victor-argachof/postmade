import { SessionBootstrap } from "@/features/auth/components/session-bootstrap";
import { AppRouter } from "@/routes/app-router";
import { ScrollToTop } from "@/shared/components/scroll-to-top";
import { AppToaster } from "@/shared/components/ui/toaster";

export function App() {
  return (
    <>
      <SessionBootstrap>
        <ScrollToTop />
        <AppRouter />
      </SessionBootstrap>
      <AppToaster />
    </>
  );
}
