import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MinLength } from "class-validator";

export class UpdateWorkspaceDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;
  @ApiPropertyOptional({ type: String, example: "America/Sao_Paulo" })
  @IsOptional()
  @IsString()
  timezone?: string;
}
export class WorkspaceResponseDto {
  @ApiProperty({ type: String }) id!: string;
  @ApiProperty({ type: String }) name!: string;
  @ApiProperty({ type: String }) ownerId!: string;
  @ApiProperty({ type: String }) timezone!: string;
  @ApiProperty({ type: String, enum: ["owner", "admin", "editor", "viewer"] })
  role!: string;
  @ApiProperty({
    type: String,
    enum: ["trialing", "active", "past_due", "canceled", "expired"],
  })
  subscriptionStatus!: string;
  @ApiProperty({ type: Object, example: { channels: 3, members: 1 } })
  subscriptionConfiguration!: { channels: number; members: number };
  @ApiProperty({ type: String }) trialStartedAt!: string;
  @ApiProperty({ type: String }) trialEndsAt!: string;
  @ApiProperty({ type: String }) createdAt!: string;
}
