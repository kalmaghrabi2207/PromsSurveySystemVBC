import "reflect-metadata";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./modules/app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: true,
      credentials: true
    }
  });

  app.use(helmet());
  app.use(cookieParser());
  app.setGlobalPrefix("v1");
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })
  );

  const config = new DocumentBuilder()
    .setTitle("PROMs/PREMs Survey Portal API")
    .setDescription("MVP API for VBHC survey assignment, capture, and reporting.")
    .setVersion("0.1.0")
    .addApiKey({ type: "apiKey", in: "header", name: "X-EMR-Api-Key" }, "emr")
    .addBearerAuth()
    .addApiKey({ type: "apiKey", in: "header", name: "X-Tenant-Id" }, "tenant")
    .addHeader("Idempotency-Key", {
      description: "Idempotency key for safe retries",
      required: false
    })
    .build();

  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("/docs", app, doc);

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
}

bootstrap().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});

