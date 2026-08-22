import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, Length, MinLength } from "class-validator";

export class UpdateProfileDto {
  @ApiProperty({ example: "Victor Argachof", minLength: 2 })
  @IsString()
  @MinLength(2)
  name!: string;
}
export class StartEmailChangeDto {
  @ApiProperty({ example: "novo@example.com" })
  @IsEmail()
  newEmail!: string;
}
export class VerifyEmailChangeDto {
  @ApiProperty() @IsString() challengeId!: string;
  @ApiProperty({ example: "123456" }) @IsString() @Length(6, 6) code!: string;
}
export class ResendEmailChangeDto {
  @ApiProperty() @IsString() challengeId!: string;
}
export class ChangePasswordDto {
  @ApiProperty() @IsString() currentPassword!: string;
  @ApiProperty({ minLength: 8 }) @IsString() @MinLength(8) newPassword!: string;
}
