import { AppRouter } from "@/routes/app-router";
import { AppToaster } from "@/shared/components/ui/toaster";

export function App() {
  return (
    <>
      <AppRouter />
      <AppToaster />
    </>
  );
}
