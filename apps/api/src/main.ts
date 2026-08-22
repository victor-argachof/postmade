import "reflect-metadata";

import { Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import type { NextFunction, Request, Response } from "express";

import { AppModule } from "./app.module.js";
import { apiError } from "./common/api-error.js";
import { ApiExceptionFilter } from "./common/api-exception.filter.js";
import { validationException } from "./common/validation-error.js";
import { createOpenApiDocument } from "./swagger.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);
  app.useLogger(new Logger("PostmadeApi"));
  app.enableShutdownHooks();
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: validationException,
    })
  );
  app.useGlobalFilters(new ApiExceptionFilter());
  app.setGlobalPrefix("api/v1", { exclude: ["docs", "docs-json"] });
  const origins = config
    .getOrThrow<string>("CORS_ORIGINS")
    .split(",")
    .map((value) => value.trim());
  app.use((request: Request, response: Response, next: NextFunction) => {
    const origin = request.get("origin");
    if (
      !["GET", "HEAD", "OPTIONS"].includes(request.method) &&
      origin &&
      !origins.includes(origin)
    )
      return response.status(403).json({
        statusCode: 403,
        ...apiError("ORIGIN_FORBIDDEN", "Request origin is not allowed"),
      });
    next();
  });
  app.enableCors({
    origin: origins,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  });
  const swaggerEnabled =
    config.get<string>("SWAGGER_ENABLED") === "true" ||
    (config.get("NODE_ENV") !== "production" &&
      config.get<string>("SWAGGER_ENABLED") !== "false");
  if (swaggerEnabled) {
    const document = createOpenApiDocument(app);
    SwaggerModule.setup("docs", app, document, {
      jsonDocumentUrl: "docs-json",
    });
  }
  await app.listen(config.get<number>("PORT") ?? 3000, "0.0.0.0");
}
void bootstrap();
