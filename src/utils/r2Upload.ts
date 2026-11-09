import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
const s3 = new S3Client({
  region: "auto",
  endpoint: import.meta.env.VITE_R2_ENDPOINT,
  credentials: {
    accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY,
  },
});
export async function uploadToR2(file: File, folder: string = "ordinances") {
  const safeName = file.name.replace(/\s+/g, "-");
  const key = folder + "/" + Date.now() + "-" + safeName;
  const arrayBuffer = await file.arrayBuffer();
  await s3.send(new PutObjectCommand({
    Bucket: import.meta.env.VITE_R2_BUCKET,
    Key: key,
    Body: new Uint8Array(arrayBuffer),
    ContentType: file.type,
  }));
  return import.meta.env.VITE_R2_PUBLIC_URL + "/" + key;
}