/**
 * Utility to compress and resize image files to ~200KB - 300KB target size
 * before saving to PostgreSQL / Supabase / LocalStorage database.
 */
export async function compressImage(
  file: File,
  maxKB: number = 250,
  maxDimension: number = 1000
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Proportional resize if larger than maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(event.target?.result as string);
        }

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Iteratively lower JPEG quality until payload size <= maxKB
        let quality = 0.85;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);

        // Calculate size in KB (approx: string length * (3/4) / 1024)
        while (dataUrl.length * 0.75 > maxKB * 1024 && quality > 0.3) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(dataUrl);
      };

      img.onerror = (err) => reject(err);
      img.src = event.target?.result as string;
    };

    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Calculates human-readable KB size of a Base64 Data URL string
 */
export function getBase64SizeKB(dataUrl: string): number {
  if (!dataUrl) return 0;
  const stringLength = dataUrl.length - (dataUrl.indexOf(',') + 1);
  return Math.round((stringLength * 0.75) / 1024);
}
