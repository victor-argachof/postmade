import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

export class TagGroupBodyDto {
  @ApiProperty({ example: "Campanha" })
  @IsString()
  name!: string;

  @ApiProperty({ type: [String], example: ["Postmade", "SocialMedia"] })
  @IsArray()
  @IsString({ each: true })
  tags!: string[];
}

export class TagGroupsQueryDto {
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

  @ApiPropertyOptional() @IsOptional() @IsString() query?: string;

  @ApiPropertyOptional({
    enum: ["name", "tagCount", "createdAt", "updatedAt"],
    default: "name",
  })
  @IsOptional()
  @IsIn(["name", "tagCount", "createdAt", "updatedAt"])
  sortBy: "name" | "tagCount" | "createdAt" | "updatedAt" = "name";

  @ApiPropertyOptional({ enum: ["asc", "desc"], default: "asc" })
  @IsOptional()
  @IsIn(["asc", "desc"])
  sortDirection: "asc" | "desc" = "asc";
}

export class TagGroupsLookupQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() query?: string;

  @ApiPropertyOptional({ default: 20, maximum: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  limit = 20;

  @ApiPropertyOptional({ description: "Comma-separated snapshot group IDs" })
  @IsOptional()
  @IsString()
  includeIds?: string;
}

export class TagGroupResponseDto {
  @ApiProperty({ type: String }) id!: string;
  @ApiProperty({ type: String }) name!: string;
  @ApiProperty({ type: [String] }) tags!: string[];
  @ApiProperty({ type: String }) createdBy!: string;
  @ApiProperty({ type: String }) createdAt!: string;
  @ApiProperty({ type: String }) updatedAt!: string;
}

export class TagGroupsPageResponseDto {
  @ApiProperty({ type: [TagGroupResponseDto] }) items!: TagGroupResponseDto[];
  @ApiProperty({ type: Number }) page!: number;
  @ApiProperty({ type: Number }) pageSize!: number;
  @ApiProperty({ type: Number }) total!: number;
  @ApiProperty({ type: Number }) totalPages!: number;
}

export class TagGroupsLookupResponseDto {
  @ApiProperty({ type: [TagGroupResponseDto] }) options!: TagGroupResponseDto[];
  @ApiProperty({ type: [String] }) existingIds!: string[];
}
