import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// DIRECT R2 ONLY - walay Supabase fallback
// Gigamit ang VITE_R2_* nga naa na sa Vercel:
// VITE_R2_ACCESS_KEY_ID, VITE_R2_SECRET_ACCESS_KEY, VITE_R2_ENDPOINT, VITE_R2_BUCKET, VITE_R2_PUBLIC_URL

const s3 = new S3Client({
  region: 'auto',
  endpoint: (import.meta as any).env?.VITE_R2_ENDPOINT,
  credentials: {
    accessKeyId: (import.meta as any).env?.VITE_R2_ACCESS_KEY_ID || '',
    secretAccessKey: (import.meta as any).env?.VITE_R2_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true,
});

export async function uploadToR2(file: File | Blob, fileNameOrFolder: string): Promise<string> {
  const bucket = (import.meta as any).env?.VITE_R2_BUCKET;
  const publicBase = ((import.meta as any).env?.VITE_R2_PUBLIC_URL || '').replace(/\/$/, '');
  if (!bucket || !publicBase) throw new Error('R2 env missing: VITE_R2_BUCKET / VITE_R2_PUBLIC_URL');

  // Support 2 calls: uploadToR2(file, "ordinances/xxx.pdf") OR uploadToR2(file, "ordinances")
  let key = fileNameOrFolder;
  if (!key.includes('.') || (!key.includes('/') && !key.includes('.'))) {
    // folder only -> himo og filename
    const name = (file as File).name || `file-${Date.now()}.pdf`;
    key = `${fileNameOrFolder.replace(/\/$/, '')}/${Date.now()}-${name}`;
  }

  const body = file instanceof Blob ? await file.arrayBuffer() : file;
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body as any,
    ContentType: (file as File).type || 'application/pdf',
  }));

  return `${publicBase}/${key}`;
}
