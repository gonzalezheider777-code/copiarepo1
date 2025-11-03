import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const r2Client = new S3Client({
  region: "auto",
  endpoint: "https://137569df68ffc80cc0977391324e77fc.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: "ef17d1ec85ce10f3f265229b0939438d",
    secretAccessKey: "09855cbf7199800be6d22981a3a6adc4beda827ede622568ef308862c5bf1636",
  },
});

const BUCKET_NAME = "uniconnect";
const PUBLIC_URL = "https://pub-YOUR_PUBLIC_URL.r2.dev";

export const uploadToR2 = async (
  file: File,
  folder: "posts" | "avatars" | "covers" | "messages"
): Promise<{ url: string; key: string }> => {
  try {
    const fileExtension = file.name.split(".").pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: file,
      ContentType: file.type,
    });

    await r2Client.send(command);

    const url = `${PUBLIC_URL}/${fileName}`;

    return { url, key: fileName };
  } catch (error) {
    console.error("Error uploading to R2:", error);
    throw new Error("Failed to upload file to R2");
  }
};

export const deleteFromR2 = async (fileKey: string): Promise<void> => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    });

    await r2Client.send(command);
  } catch (error) {
    console.error("Error deleting from R2:", error);
    throw new Error("Failed to delete file from R2");
  }
};

export const extractR2Key = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.substring(1);
  } catch {
    return null;
  }
};
