import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  MinLength,
} from "class-validator";

export class RegisterStartDto {
  @ApiProperty({ type: String, example: "Victor Argachof" })
  @IsString()
  @MinLength(2)
  name!: string;
  @ApiProperty({ type: String, example: "victor@example.com" })
  @IsEmail()
  email!: string;
  @ApiProperty({ type: String, example: "Postmade123!", minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
  @ApiProperty({ type: String, example: "America/Sao_Paulo", required: false })
  @IsOptional()
  @IsString()
  timezone?: string;
}
export class LoginStartDto {
  @ApiProperty({ type: String, example: "victor@example.com" })
  @IsEmail()
  email!: string;
  @ApiProperty({ type: String, example: "Postmade123!" })
  @IsString()
  password!: string;
}
export class VerifyChallengeDto {
  @ApiProperty({ type: String }) @IsString() challengeId!: string;
  @ApiProperty({ type: String, example: "123456" })
  @IsString()
  @Length(6, 6)
  code!: string;
}
export class ResendCodeDto {
  @ApiProperty({ type: String }) @IsString() challengeId!: string;
}
export class ForgotPasswordDto {
  @ApiProperty({ type: String }) @IsEmail() email!: string;
}
export class ResetPasswordDto extends VerifyChallengeDto {
  @ApiProperty({ type: String, minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}
export class ChallengeResponseDto {
  @ApiProperty({ type: String }) challengeId!: string;
  @ApiProperty({ type: String }) expiresAt!: string;
  @ApiProperty({ type: String }) resendAvailableAt!: string;
}
export class IdentityResponseDto {
  @ApiProperty({ type: String, enum: ["password"] }) provider!: "password";
  @ApiProperty({ type: Boolean }) emailVerified!: boolean;
}
export class UserResponseDto {
  @ApiProperty({ type: String }) id!: string;
  @ApiProperty({ type: String }) name!: string;
  @ApiProperty({ type: String }) email!: string;
  @ApiProperty({ type: IdentityResponseDto }) identity!: IdentityResponseDto;
  @ApiProperty({ type: String }) createdAt!: string;
}
