import type { PublicationTagGroupSnapshot, TagGroup } from "@postmade/types";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/shared/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { cn } from "@/shared/lib/utils";

import { createTagGroupSnapshot } from "../lib/tags";
import { useLazyLookupTagGroupsQuery } from "../services/tags-api";

export function PostTagGroupsSelector({
  disabled,
  onChange,
  onManage,
  value,
  workspaceId,
}: {
  disabled?: boolean;
  onChange: (snapshots: PublicationTagGroupSnapshot[]) => void;
  onManage: () => void;
  value: PublicationTagGroupSnapshot[];
  workspaceId: string;
}) {
  const { t } = useTranslation("tags");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [lookup, { data, isError, isFetching }] = useLazyLookupTagGroupsQuery();
  const groups = data?.options ?? [];
  const availableIds = new Set([
    ...(data?.existingIds ?? []),
    ...groups.map((group) => group.id),
  ]);
  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timeout);
  }, [search]);
  useEffect(() => {
    if (open && workspaceId)
      void lookup({
        workspaceId,
        query: debouncedSearch,
        includeIds: value.map((snapshot) => snapshot.groupId),
      });
  }, [debouncedSearch, lookup, open, value, workspaceId]);
  const toggle = (group: TagGroup) => {
    if (disabled) return;
    const selected = value.some((snapshot) => snapshot.groupId === group.id);
    onChange(
      selected
        ? value.filter((snapshot) => snapshot.groupId !== group.id)
        : [...value, createTagGroupSnapshot(group)]
    );
  };
  const remove = (groupId: string) =>
    onChange(value.filter((snapshot) => snapshot.groupId !== groupId));
  return (
    <section className="mt-4">
      <Popover
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (nextOpen) setSearch("");
        }}
      >
        <PopoverTrigger asChild>
          <Button
            aria-label={t("composer.select")}
            aria-expanded={open}
            className="w-full justify-between font-normal"
            disabled={disabled}
            role="combobox"
            type="button"
            variant="outline"
          >
            <span className={cn(!value.length && "text-muted-foreground")}>
              {value.length
                ? t("composer.selectedCount", { count: value.length })
                : t("composer.select")}
            </span>
            <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[var(--radix-popover-trigger-width)] p-0"
          sideOffset={8}
        >
          <Command shouldFilter={false}>
            <CommandInput
              value={search}
              placeholder={t("composer.search")}
              onValueChange={setSearch}
            />
            <CommandList>
              {isFetching && (
                <p
                  className="p-4 text-center text-sm text-muted-foreground"
                  role="status"
                >
                  {t("loading")}
                </p>
              )}
              {isError && (
                <p
                  className="p-4 text-center text-sm text-red-600"
                  role="alert"
                >
                  {t("composer.lookupError")}
                </p>
              )}
              <CommandEmpty>
                {groups.length ? (
                  t("composer.noResults")
                ) : (
                  <span>
                    <button
                      className="cursor-pointer font-semibold text-primary hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        onManage();
                      }}
                    >
                      {t("composer.emptyAction")}
                    </button>{" "}
                    {t("composer.emptyDescription")}
                  </span>
                )}
              </CommandEmpty>
              <CommandGroup>
                {groups.map((group) => {
                  const selected = value.some(
                    (snapshot) => snapshot.groupId === group.id
                  );
                  return (
                    <CommandItem
                      key={group.id}
                      value={`${group.name} ${group.tags.join(" ")}`}
                      onSelect={() => toggle(group)}
                    >
                      <Check
                        className={cn(
                          "mr-2 size-4",
                          selected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="min-w-0">
                        <span className="block font-semibold">
                          {group.name}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {group.tags.map((tag) => `#${tag}`).join(" ")}
                        </span>
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {value.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {value.map((snapshot) => {
            const unavailable =
              Boolean(data) && !availableIds.has(snapshot.groupId);
            return (
              <span
                className={cn(
                  "inline-flex max-w-full items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary",
                  unavailable &&
                    "border-dashed border-border bg-muted text-muted-foreground"
                )}
                key={snapshot.groupId}
                title={snapshot.tags.map((tag) => `#${tag}`).join(" ")}
              >
                {snapshot.groupName}
                {unavailable && ` · ${t("composer.removed")}`}
                <button
                  aria-label={t("composer.remove", {
                    name: snapshot.groupName,
                  })}
                  className="cursor-pointer rounded-sm hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                  disabled={disabled}
                  type="button"
                  onClick={() => remove(snapshot.groupId)}
                >
                  <X className="size-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </section>
  );
}
