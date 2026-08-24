import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

const platforms = [
  "facebook",
  "linkedin",
  "instagram",
  "tiktok",
  "youtube",
] as const;

export class ChannelsQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 10, enum: [10, 25, 50] })
  @IsOptional()
  @Type(() => Number)
  @IsIn([10, 25, 50])
  pageSize: 10 | 25 | 50 = 10;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({ enum: platforms })
  @IsOptional()
  @IsIn(platforms)
  platform?: (typeof platforms)[number];
}

export class ChannelsLookupQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({ default: 20, maximum: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  limit = 20;

  @ApiPropertyOptional({ description: "Comma-separated channel IDs" })
  @IsOptional()
  @IsString()
  includeIds?: string;
}

export class ChannelResponseDto {
  @ApiProperty({ type: String }) id!: string;
  @ApiProperty({ type: String }) workspaceId!: string;
  @ApiProperty({ type: String, enum: platforms }) platform!: string;
  @ApiProperty({ type: String }) displayName!: string;
  @ApiProperty({ type: String }) username!: string;
  @ApiProperty({ type: String, nullable: true }) avatarUrl!: string | null;
  @ApiProperty({
    type: String,
    enum: [
      "connected",
      "requires_reauthentication",
      "unavailable",
      "disconnected",
    ],
  })
  connectionStatus!: string;
  @ApiProperty({ type: String, nullable: true }) lastCheckedAt!: string | null;
  @ApiProperty({ type: String }) connectedAt!: string;
  @ApiProperty({ type: String, nullable: true }) disconnectedAt!: string | null;
  @ApiProperty({ type: String }) createdAt!: string;
  @ApiProperty({ type: String }) updatedAt!: string;
}

export class ChannelSummaryDto {
  @ApiProperty({ type: Number }) total!: number;
  @ApiProperty({ type: Object, additionalProperties: { type: "number" } })
  byPlatform!: Record<string, number>;
}

export class ChannelsPageResponseDto {
  @ApiProperty({ type: [ChannelResponseDto] }) items!: ChannelResponseDto[];
  @ApiProperty({ type: Number }) page!: number;
  @ApiProperty({ type: Number }) pageSize!: number;
  @ApiProperty({ type: Number }) total!: number;
  @ApiProperty({ type: Number }) totalPages!: number;
  @ApiProperty({ type: ChannelSummaryDto }) summary!: ChannelSummaryDto;
}

export class ChannelsLookupResponseDto {
  @ApiProperty({ type: [ChannelResponseDto] }) options!: ChannelResponseDto[];
  @ApiProperty({ type: [ChannelResponseDto] }) included!: ChannelResponseDto[];
  @ApiProperty({ type: [String] }) connectedIds!: string[];
}

export class StartOAuthResponseDto {
  @ApiProperty({ type: String }) url!: string;
}
