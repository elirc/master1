import { Injectable } from "@nestjs/common";
import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { loadConfig } from "@globalwork/config";

interface UploadIntentInput {
  key: string;
  contentType: string;
  expiresInSeconds?: number;
}

@Injectable()
export class StorageService {
  private readonly config = loadConfig();
  private readonly client = new S3Client({
    region: this.config.S3_REGION,
    endpoint: this.config.S3_ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId: this.config.S3_ACCESS_KEY_ID,
      secretAccessKey: this.config.S3_SECRET_ACCESS_KEY
    }
  });

  async createUploadIntent(input: UploadIntentInput) {
    const command = new PutObjectCommand({
      Bucket: this.config.S3_BUCKET,
      Key: input.key,
      ContentType: input.contentType
    });

    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: input.expiresInSeconds ?? 15 * 60
    });

    return {
      bucket: this.config.S3_BUCKET,
      key: input.key,
      uploadUrl,
      method: "PUT",
      headers: {
        "content-type": input.contentType
      }
    };
  }

  async verifyObjectExists(key: string) {
    if (process.env.STORAGE_VERIFY_MODE === "mock") {
      return { exists: true, key, verifiedBy: "mock" as const };
    }

    if (!key || key.includes("..")) {
      return { exists: false, key, verifiedBy: "local-key-validation" as const };
    }

    if (process.env.STORAGE_VERIFY_MODE !== "s3") {
      return { exists: true, key, verifiedBy: "local-key-validation" as const };
    }

    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.config.S3_BUCKET,
          Key: key
        })
      );
      return { exists: true, key, verifiedBy: "s3-head-object" as const };
    } catch {
      return { exists: false, key, verifiedBy: "s3-head-object" as const };
    }
  }
}
