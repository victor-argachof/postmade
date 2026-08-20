import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ApiErrorDetailDto {
  @ApiProperty({ type: String, example: "email" }) field!: string;
  @ApiProperty({ type: String, example: "must be an email" }) message!: string;
}

export class ApiErrorDto {
  @ApiProperty({ type: Number, example: 400 }) statusCode!: number;
  @ApiProperty({ type: String, example: "VALIDATION_ERROR" }) code!: string;
  @ApiProperty({ type: String, example: "Request validation failed" })
  message!: string;
  @ApiPropertyOptional({ type: [ApiErrorDetailDto] })
  details?: ApiErrorDetailDto[];
}
