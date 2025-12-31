import { createHash, randomBytes, timingSafeEqual } from "crypto";

export function sha256Hex(input: string) {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

export function randomTokenUrlSafe(bytes = 32) {
  // base64url without padding
  return randomBytes(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

