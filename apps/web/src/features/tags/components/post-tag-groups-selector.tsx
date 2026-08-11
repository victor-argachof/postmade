import type { PublicationTagGroupSnapshot, TagGroup } from "@postmade/types";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { useState } from "react";
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

export function PostTagGroupsSelector({
  disabled,
  groups,
  onChange,
  onManage,
  value,
}: {
  disabled?: boolean;
  groups: TagGroup[];
  onChange: (snapshots: PublicationTagGroupSnapshot[]) => void;
  onManage: () => void;
  value: PublicationTagGroupSnapshot[];
}) {
  const { t } = useTranslation("tags");
  const [open, setOpen] = useState(false);
  const [commandValue, setCommandValue] = useState("");
  const availableIds = new Set(groups.map((group) => group.id));
  const removed = value.filter(
    (snapshot) => !availableIds.has(snapshot.groupId)
  );
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
          if (nextOpen) setCommandValue("");
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
          <Command value={commandValue} onValueChange={setCommandValue}>
            <CommandInput placeholder={t("composer.search")} />
            <CommandList>
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
            const unavailable = !availableIds.has(snapshot.groupId);
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
