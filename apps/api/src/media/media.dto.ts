import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsString, Min } from "class-validator";

export class CreateMediaUploadDto {
  @ApiProperty({ type: String }) @IsString() filename!: string;
  @ApiProperty({ type: String }) @IsString() mimeType!: string;
  @ApiProperty({ type: Number }) @IsInt() @Min(1) size!: number;
}

export class MediaResponseDto {
  @ApiProperty({ type: String }) id!: string;
  @ApiProperty({ enum: ["image", "video"] }) type!: string;
  @ApiProperty({ type: String }) filename!: string;
  @ApiProperty({ type: String }) mimeType!: string;
  @ApiProperty({ type: Number }) size!: number;
  @ApiProperty({ enum: ["pending", "ready", "failed", "deleting", "deleted"] })
  status!: string;
}

export class MediaUploadResponseDto {
  @ApiProperty({ type: MediaResponseDto }) media!: MediaResponseDto;
  @ApiProperty({ type: String }) uploadUrl!: string;
  @ApiProperty({ type: String }) expiresAt!: string;
  @ApiProperty({ type: Object }) requiredHeaders!: Record<string, string>;
}

export class MediaAccessResponseDto {
  @ApiProperty({ type: String }) url!: string;
  @ApiProperty({ type: String }) expiresAt!: string;
}
