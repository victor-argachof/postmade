import { type INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

export function createOpenApiDocument(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle("Postmade API")
    .setDescription("Postmade public HTTP API")
    .setVersion("1.0")
    .addCookieAuth(
      "postmade_session",
      { type: "apiKey", in: "cookie" },
      "postmade_session"
    )
    .build();
  return SwaggerModule.createDocument(app, config);
}
