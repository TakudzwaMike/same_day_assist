import path from 'path';
import fs from 'fs';

const UPLOAD_DIR = (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)
  ? path.join('/tmp', 'uploads')
  : path.join(process.cwd(), 'uploads');

// Ensure upload directory exists safely
try {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('[Storage] mkdir warning:', e);
}

export async function saveFile(buffer: Buffer, originalName: string, mimeType: string): Promise<string> {
  const ext = originalName.split('.').pop() || 'bin';
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const filePath = path.join(UPLOAD_DIR, uniqueName);

  fs.writeFileSync(filePath, buffer);
  return `/uploads/${uniqueName}`;
}

export async function deleteFile(url: string): Promise<void> {
  const filename = url.split('/').pop();
  if (!filename) return;
  const filePath = path.join(UPLOAD_DIR, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}
