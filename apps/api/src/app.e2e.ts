import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { requestIdMiddleware } from "./common/request-id.middleware";
import { HealthModule } from "./modules/health/health.module";

describe("API e2e", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [HealthModule]
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    app.use(requestIdMiddleware);
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true
      })
    );
    await app.listen(0);
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns health with a request id header", async () => {
    const response = await fetch(`${await app.getUrl()}/api/health`, {
      headers: { "x-request-id": "test-request-id" }
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("x-request-id")).toBe("test-request-id");
    expect(body.status).toBe("ok");
    expect(body.service).toBe("globalwork-api");
  });
});
