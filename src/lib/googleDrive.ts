/**
 * Google Drive Upload Client Utility
 * Integrates Google Drive folder creation and image storage.
 */

export interface ImageUploadItem {
  key: 'photo_url' | 'nid_front_url' | 'nid_back_url' | 'guarantor_nid_front_url' | 'guarantor_nid_back_url';
  base64: string;
  fileName?: string;
}

export interface GoogleDriveUploadResult {
  folder_url: string;
  urls: {
    photo_url?: string;
    nid_front_url?: string;
    nid_back_url?: string;
    guarantor_nid_front_url?: string;
    guarantor_nid_back_url?: string;
  };
  isDriveConfigured: boolean;
}

export async function uploadMemberImagesToDrive(
  memberNo: string,
  memberName: string,
  imageItems: ImageUploadItem[]
): Promise<GoogleDriveUploadResult> {
  const scriptUrl = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL?.trim();

  const validItems = imageItems.filter((i) => i.base64 && i.base64.startsWith('data:image/'));

  // Default fallback response if no images were provided
  if (validItems.length === 0) {
    return {
      folder_url: '',
      urls: {},
      isDriveConfigured: false,
    };
  }

  // Option A: Upload via Google Apps Script Web App
  if (scriptUrl) {
    try {
      const payload = {
        member_no: memberNo,
        name: memberName,
        files: validItems.map((item) => ({
          key: item.key,
          fileName: `${memberNo}_${item.key}.jpg`,
          mimeType: 'image/jpeg',
          base64: item.base64,
        })),
      };

      const res = await fetch(scriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8', // GAS requires text/plain to prevent CORS preflight issues
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        return {
          folder_url: json.folder_url || '',
          urls: json.urls || {},
          isDriveConfigured: true,
        };
      }
    } catch (err) {
      console.warn('Google Apps Script upload failed, attempting Next.js API route fallback...', err);
    }
  }

  // Option B: Try Next.js Server Route /api/upload-drive (Google Cloud Service Account)
  try {
    const payload = {
      member_no: memberNo,
      name: memberName,
      files: validItems.map((item) => ({
        key: item.key,
        fileName: `${memberNo}_${item.key}.jpg`,
        mimeType: 'image/jpeg',
        base64: item.base64,
      })),
    };

    const res = await fetch('/api/upload-drive', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success) {
        return {
          folder_url: json.folder_url || '',
          urls: json.urls || {},
          isDriveConfigured: true,
        };
      }
    }
  } catch (err) {
    console.warn('Next.js Google Drive API route fallback unfulfilled', err);
  }

  // Fallback: Google Drive is not yet configured. Return original Data URLs.
  const fallbackUrls: Record<string, string> = {};
  validItems.forEach((item) => {
    fallbackUrls[item.key] = item.base64;
  });

  return {
    folder_url: '',
    urls: fallbackUrls,
    isDriveConfigured: false,
  };
}
