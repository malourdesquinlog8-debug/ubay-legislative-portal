import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
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

// --- DELETE FROM R2 - ROBUST VERSION ---
export async function deleteFromR2(fileUrl: string) {
  if (!fileUrl) return;
  try {
    const bucket = import.meta.env.VITE_R2_BUCKET;
    let key = "";
    const marker = "ordinances/";
    const idx = fileUrl.indexOf(marker);
    if (idx !== -1) {
      key = fileUrl.substring(idx);
    } else {
      const url = new URL(fileUrl);
      key = url.pathname.startsWith("/") ? url.pathname.slice(1) : url.pathname;
      if (key.startsWith(bucket + "/")) key = key.replace(bucket + "/", "");
    }
    key = key.split("?")[0];
    try { key = decodeURIComponent(key); } catch {}
    console.log("Trying to delete from R2, key:", key);
    await s3.send(new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }));
    console.log("Deleted from R2:", key);
  } catch (e: any) {
    console.log("R2 delete failed:", e);
    alert("R2 delete failed: " + e.message);
  }
}