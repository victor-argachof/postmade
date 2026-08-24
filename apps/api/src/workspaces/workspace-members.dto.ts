import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsIn } from "class-validator";

const roles = ["admin", "editor", "viewer"] as const;

export class CreateInvitationDto {
  @ApiProperty({ example: "member@example.com" }) @IsEmail() email!: string;
  @ApiProperty({ enum: roles }) @IsIn(roles) role!: (typeof roles)[number];
}
export class UpdateMemberRoleDto {
  @ApiProperty({ enum: roles }) @IsIn(roles) role!: (typeof roles)[number];
}
