import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsIn,
  IsInt,
  IsISO8601,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";

const statuses = [
  "draft",
  "scheduled",
  "publishing",
  "published",
  "failed",
] as const;
const writableStatuses = ["draft", "scheduled", "published"] as const;
const platforms = [
  "facebook",
  "linkedin",
  "instagram",
  "tiktok",
  "youtube",
] as const;

export class TagSnapshotDto {
  @ApiProperty({ type: String }) @IsString() groupId!: string;
  @ApiProperty({ type: String }) @IsString() groupName!: string;
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  tags!: string[];
}

export class PublicationTargetBodyDto {
  @ApiProperty({ type: String }) @IsString() channelId!: string;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  contentOverride?: string | null;
  @ApiPropertyOptional({ type: [TagSnapshotDto], nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TagSnapshotDto)
  tagGroupSnapshotsOverride?: TagSnapshotDto[] | null;
  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;
}

export class PublicationBodyDto {
  @ApiProperty({ enum: writableStatuses })
  @IsIn(writableStatuses)
  status!: (typeof writableStatuses)[number];
  @ApiProperty({ type: String }) @IsString() content!: string;
  @ApiProperty({ type: [PublicationTargetBodyDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PublicationTargetBodyDto)
  targets!: PublicationTargetBodyDto[];
  @ApiPropertyOptional({ type: [TagSnapshotDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TagSnapshotDto)
  tagGroupSnapshots: TagSnapshotDto[] = [];
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsISO8601()
  scheduledFor?: string | null;
}

export class PublicationsQueryDto {
  @ApiPropertyOptional({ default: 1 })
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
  @ApiPropertyOptional() @IsOptional() @IsString() query?: string;
  @ApiPropertyOptional({ enum: statuses })
  @IsOptional()
  @IsIn(statuses)
  status?: (typeof statuses)[number];
  @ApiPropertyOptional({ enum: platforms })
  @IsOptional()
  @IsIn(platforms)
  platform?: (typeof platforms)[number];
  @ApiPropertyOptional() @IsOptional() @IsString() channelId?: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() from?: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() to?: string;
}

export class PublicationTargetResponseDto {
  @ApiProperty({ type: String }) channelId!: string;
  @ApiProperty({ enum: platforms }) platform!: string;
  @ApiProperty({ type: String, nullable: true }) contentOverride!:
    string | null;
  @ApiProperty({ type: [TagSnapshotDto], nullable: true })
  tagGroupSnapshotsOverride!: TagSnapshotDto[] | null;
  @ApiProperty({ type: [Object] }) mediaOverride!: [];
  @ApiProperty({ type: Object }) settings!: Record<string, unknown>;
  @ApiProperty({ enum: statuses }) status!: string;
  @ApiProperty({ type: String, nullable: true }) errorCode!: string | null;
  @ApiProperty({ type: String, nullable: true }) externalUrl!: string | null;
}

export class PublicationResponseDto {
  @ApiProperty({ type: String }) id!: string;
  @ApiProperty({ type: String }) createdBy!: string;
  @ApiProperty({ enum: statuses }) status!: string;
  @ApiProperty({ type: String }) content!: string;
  @ApiProperty({ type: [Object] }) media!: [];
  @ApiProperty({ type: [PublicationTargetResponseDto] })
  targets!: PublicationTargetResponseDto[];
  @ApiProperty({ type: [TagSnapshotDto] }) tagGroupSnapshots!: TagSnapshotDto[];
  @ApiProperty({ type: String, nullable: true }) scheduledFor!: string | null;
  @ApiProperty({ type: String, nullable: true }) publishedAt!: string | null;
  @ApiProperty({ type: String }) createdAt!: string;
  @ApiProperty({ type: String }) updatedAt!: string;
}

export class PublicationsPageResponseDto {
  @ApiProperty({ type: [PublicationResponseDto] })
  items!: PublicationResponseDto[];
  @ApiProperty({ type: Number }) page!: number;
  @ApiProperty({ type: Number }) pageSize!: number;
  @ApiProperty({ type: Number }) total!: number;
  @ApiProperty({ type: Number }) totalPages!: number;
}
