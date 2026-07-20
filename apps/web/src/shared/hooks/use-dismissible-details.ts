import { useEffect, useRef } from "react";

export function useDismissibleDetails() {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const close = () => detailsRef.current?.removeAttribute("open");

    const handlePointerDown = (event: PointerEvent) => {
      const details = detailsRef.current;
      if (!details?.open || !(event.target instanceof Node)) return;
      if (!details.contains(event.target)) close();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && detailsRef.current?.open) close();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return detailsRef;
}
