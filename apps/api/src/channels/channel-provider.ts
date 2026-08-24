import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { SocialPlatform } from "@postmade/types";

export interface MockProviderAccount {
  providerAccountId: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
}

export interface ChannelProvider {
  readonly enabled: boolean;
  createAccount(
    platform: SocialPlatform,
    providerAccountId: string
  ): MockProviderAccount;
  revoke(providerAccountId: string): Promise<void>;
}

const PLATFORM_NAMES: Record<SocialPlatform, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  youtube: "YouTube",
};

@Injectable()
export class MockChannelProvider implements ChannelProvider {
  readonly enabled: boolean;

  constructor(@Inject(ConfigService) config: ConfigService) {
    this.enabled = config.get<string>("CHANNEL_PROVIDER_MODE") === "mock";
  }

  createAccount(
    platform: SocialPlatform,
    providerAccountId: string
  ): MockProviderAccount {
    const suffix = providerAccountId.slice(-6);
    return {
      providerAccountId,
      displayName: `${PLATFORM_NAMES[platform]} Mock ${suffix}`,
      username: `@postmade_mock_${suffix}`,
      avatarUrl: null,
    };
  }

  async revoke(_providerAccountId: string) {
    await Promise.resolve();
  }
}
