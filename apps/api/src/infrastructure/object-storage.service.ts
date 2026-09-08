import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { apiError } from "../common/api-error.js";

@Injectable()
export class ObjectStorageService {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(config: ConfigService) {
    const accountId = config.getOrThrow<string>("R2_ACCOUNT_ID");
    this.bucket = config.getOrThrow<string>("R2_BUCKET");
    this.client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.getOrThrow<string>("R2_ACCESS_KEY_ID"),
        secretAccessKey: config.getOrThrow<string>("R2_SECRET_ACCESS_KEY"),
      },
    });
  }

  private async safe<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch {
      throw new ServiceUnavailableException(
        apiError("MEDIA_STORAGE_UNAVAILABLE", "Media storage unavailable")
      );
    }
  }

  signUpload(key: string, contentType: string) {
    return this.safe(() =>
      getSignedUrl(
        this.client,
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          ContentType: contentType,
        }),
        { expiresIn: 900 }
      )
    );
  }

  signAccess(key: string) {
    return this.safe(() =>
      getSignedUrl(
        this.client,
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
        { expiresIn: 900 }
      )
    );
  }

  head(key: string) {
    return this.safe(() =>
      this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }))
    );
  }

  async readPrefix(key: string, bytes = 32): Promise<Uint8Array> {
    const result = await this.safe(() =>
      this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Range: `bytes=0-${bytes - 1}`,
        })
      )
    );
    return result.Body
      ? await result.Body.transformToByteArray()
      : new Uint8Array();
  }

  async delete(key: string) {
    await this.safe(() =>
      this.client.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: key })
      )
    );
  }
}
