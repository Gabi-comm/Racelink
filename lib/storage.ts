import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { UPLOAD_KINDS, type UploadKind } from "@/lib/uploads";

// s3 kapag may S3_BUCKET (aws), local folder kapag wala (dev)
const BUCKET = process.env.S3_BUCKET;
const URL_TTL = 300;

// no keys here, sdk uses the ec2 iam role
const s3 = BUCKET ? new S3Client({ region: process.env.AWS_REGION }) : null;

export type UploadTicket = { key: string; url: string; headers: Record<string, string> };

export async function createUpload(kind: UploadKind, userId: string, contentType: string, size: number): Promise<UploadTicket> {
  const rule = UPLOAD_KINDS[kind];
  const ext = rule.types[contentType as keyof typeof rule.types];
  const key = `${rule.prefix}/${userId}/${randomUUID()}.${ext}`;
  const headers = { "Content-Type": contentType };

  if (s3) {
    const url = await getSignedUrl(
      s3,
      new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType, ContentLength: size }),
      { expiresIn: URL_TTL },
    );
    return { key, url, headers };
  }
  return { key, url: localUrl("put", key, size), headers };
}

export async function fileUrl(key: string, downloadName?: string) {
  if (s3) {
    return getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: key,
        ResponseContentDisposition: downloadName ? `inline; filename="${downloadName.replace(/"/g, "")}"` : undefined,
      }),
      { expiresIn: URL_TTL },
    );
  }
  return localUrl("get", key);
}

export async function deleteFile(key: string | null | undefined) {
  if (!key) return;
  try {
    if (s3) await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    else await rm(localPath(key), { force: true });
  } catch (err) {
    console.error("deleteFile failed", key, err);
  }
}

// local stand-in, signed links like s3 presigned urls

const LOCAL_DIR = path.join(process.cwd(), ".uploads");

function sign(op: string, key: string, exp: number, size = 0) {
  return createHmac("sha256", process.env.BETTER_AUTH_SECRET!).update(`${op}:${key}:${exp}:${size}`).digest("hex");
}

function localUrl(op: "put" | "get", key: string, size = 0) {
  const exp = Math.floor(Date.now() / 1000) + URL_TTL;
  const q = new URLSearchParams({ key, exp: String(exp), sig: sign(op, key, exp, size) });
  if (op === "put") q.set("size", String(size));
  return `/api/storage/local?${q}`;
}

export function verifyLocal(op: "put" | "get", params: URLSearchParams) {
  const key = params.get("key") ?? "";
  const exp = Number(params.get("exp"));
  const size = op === "put" ? Number(params.get("size")) : 0;
  const sig = params.get("sig") ?? "";
  if (!key || !Number.isFinite(exp) || exp < Date.now() / 1000) return null;
  const want = Buffer.from(sign(op, key, exp, size));
  const got = Buffer.from(sig);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  return { key, size };
}

export function localPath(key: string) {
  const full = path.join(LOCAL_DIR, key);
  if (!full.startsWith(LOCAL_DIR + path.sep)) throw new Error("bad key");
  return full;
}

export async function writeLocal(key: string, data: Buffer) {
  const full = localPath(key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, data);
}

export function readLocal(key: string) {
  return readFile(localPath(key));
}

export const usingS3 = Boolean(s3);
