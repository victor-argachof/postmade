import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Response } from "express";

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const status =
      error instanceof HttpException
        ? error.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const payload = error instanceof HttpException ? error.getResponse() : null;
    const object =
      typeof payload === "object" && payload
        ? (payload as Record<string, unknown>)
        : {};
    const rawMessage =
      object.message ??
      (error instanceof Error ? error.message : "Unexpected error");
    const validation = Array.isArray(rawMessage)
      ? rawMessage.map((message) => ({
          field: String(message).split(" ")[0],
          message: String(message),
        }))
      : undefined;
    response.status(status).json({
      statusCode: status,
      code:
        typeof object.code === "string"
          ? object.code
          : validation
            ? "VALIDATION_ERROR"
            : status === 500
              ? "INTERNAL_ERROR"
              : `HTTP_${status}`,
      message: validation ? "Request validation failed" : String(rawMessage),
      ...(validation ? { details: validation } : {}),
    });
  }
}
