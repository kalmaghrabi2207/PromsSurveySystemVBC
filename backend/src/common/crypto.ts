import { createHash, randomBytes } from "crypto";

export function sha256Hex(input: string) {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

export function randomTokenUrlSafe(bytes = 32) {
  return randomBytes(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

