import type { SocialChannel, SocialPlatform } from "@postmade/types";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { ChannelAvatar } from "@/shared/components/channel-avatar";
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

export function PublicationChannelsSelector({
  channels,
  disabled,
  onChange,
  value,
}: {
  channels: SocialChannel[];
  disabled?: boolean;
  onChange: (channelIds: string[]) => void;
  value: string[];
}) {
  const { t } = useTranslation("createPost");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selectedChannels = channels.filter((channel) =>
    value.includes(channel.id)
  );
  const allSelected = selectedChannels.length === channels.length;
  const platforms = Array.from(
    new Set(channels.map((channel) => channel.platform))
  );

  const toggle = (channelId: string) => {
    if (disabled) return;
    onChange(
      value.includes(channelId)
        ? value.filter((id) => id !== channelId)
        : [...value, channelId]
    );
  };

  if (!channels.length) {
    return (
      <p className="mt-3 text-sm text-muted-foreground">
        {t("composer.noChannels")}
      </p>
    );
  }

  return (
    <div>
      <Popover
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (nextOpen) setQuery("");
        }}
      >
        <PopoverTrigger asChild>
          <Button
            aria-expanded={open}
            className="w-full justify-between font-normal"
            disabled={disabled}
            role="combobox"
            type="button"
            variant="outline"
          >
            <span
              className={cn(
                !selectedChannels.length && "text-muted-foreground"
              )}
            >
              {selectedChannels.length
                ? t("composer.channelSelector.selectedCount", {
                    count: selectedChannels.length,
                  })
                : t("composer.channelSelector.select")}
            </span>
            <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-(--radix-popover-trigger-width) p-0"
          sideOffset={8}
        >
          <Command value="">
            <CommandInput
              placeholder={t("composer.channelSelector.search")}
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              <CommandEmpty>
                {t("composer.channelSelector.noResults")}
              </CommandEmpty>
              {!query && (
                <CommandGroup className="border-b border-border">
                  <CommandItem
                    value="all-channels"
                    onSelect={() =>
                      onChange(
                        allSelected ? [] : channels.map((channel) => channel.id)
                      )
                    }
                  >
                    <Check
                      className={cn(
                        "mr-2 size-4 shrink-0",
                        allSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="font-semibold">
                      {t(
                        allSelected
                          ? "composer.channelSelector.clearAll"
                          : "composer.channelSelector.selectAll"
                      )}
                    </span>
                  </CommandItem>
                </CommandGroup>
              )}
              {platforms.map((platform) => (
                <ChannelPlatformGroup
                  channels={channels.filter(
                    (channel) => channel.platform === platform
                  )}
                  key={platform}
                  platform={platform}
                  selectedIds={value}
                  toggle={toggle}
                />
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedChannels.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedChannels.map((channel) => (
            <span
              className="inline-flex max-w-full items-center gap-2 rounded-full border border-primary/20 bg-primary/10 py-1 pr-2 pl-1 text-xs font-semibold text-primary"
              key={channel.id}
            >
              <ChannelAvatar channel={channel} className="size-6" />
              <span className="truncate">{channel.displayName}</span>
              <button
                aria-label={t("composer.channelSelector.remove", {
                  name: channel.displayName,
                })}
                className="cursor-pointer rounded-sm hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                disabled={disabled}
                type="button"
                onClick={() => toggle(channel.id)}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ChannelPlatformGroup({
  channels,
  platform,
  selectedIds,
  toggle,
}: {
  channels: SocialChannel[];
  platform: SocialPlatform;
  selectedIds: string[];
  toggle: (channelId: string) => void;
}) {
  const { t } = useTranslation("createPost");

  return (
    <CommandGroup heading={t(`platforms.${platform}`)}>
      {channels.map((channel) => {
        const selected = selectedIds.includes(channel.id);
        return (
          <CommandItem
            key={channel.id}
            value={`${channel.displayName} ${channel.username} ${t(
              `platforms.${channel.platform}`
            )}`}
            onSelect={() => toggle(channel.id)}
          >
            <Check
              className={cn(
                "mr-2 size-4 shrink-0",
                selected ? "opacity-100" : "opacity-0"
              )}
            />
            <ChannelAvatar channel={channel} className="mr-2" />
            <span className="min-w-0">
              <span className="block truncate font-semibold">
                {channel.displayName}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {channel.username}
              </span>
            </span>
          </CommandItem>
        );
      })}
    </CommandGroup>
  );
}
