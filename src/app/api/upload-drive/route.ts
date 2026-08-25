import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'stream';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { member_no, name, files } = body;

    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const parentFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!clientEmail || !privateKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Google Drive Service Account environment variables (GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY) are not configured.' 
        },
        { status: 400 }
      );
    }

    // Authenticate with Google Drive Service Account
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // Clean member folder name
    const cleanName = (name || 'Member').replace(/[^\w\s\u0980-\u09FF-]/gi, '').trim();
    const folderName = `Member_${member_no || 'Unknown'}_${cleanName}`;

    let folderId: string | null = null;
    let folderUrl: string = '';

    // Search existing folder
    let q = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
    if (parentFolderId) {
      q += ` and '${parentFolderId}' in parents`;
    }

    const searchRes = await drive.files.list({ q, fields: 'files(id, webViewLink)' });
    if (searchRes.data.files && searchRes.data.files.length > 0) {
      folderId = searchRes.data.files[0].id!;
      folderUrl = searchRes.data.files[0].webViewLink || `https://drive.google.com/drive/folders/${folderId}`;
    } else {
      // Create new folder
      const fileMetadata: any = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      };
      if (parentFolderId) {
        fileMetadata.parents = [parentFolderId];
      }

      const createRes = await drive.files.create({
        requestBody: fileMetadata,
        fields: 'id, webViewLink',
      });

      folderId = createRes.data.id!;
      folderUrl = createRes.data.webViewLink || `https://drive.google.com/drive/folders/${folderId}`;

      // Make folder viewable by link
      await drive.permissions.create({
        fileId: folderId,
        requestBody: { role: 'reader', type: 'anyone' },
      });
    }

    const uploadedUrls: Record<string, string> = {};

    if (Array.isArray(files) && folderId) {
      for (const item of files) {
        if (!item.base64 || !item.key) continue;

        const base64Clean = item.base64.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Clean, 'base64');
        const stream = Readable.from(buffer);
        const fileName = item.fileName || `${item.key}.jpg`;
        const mimeType = item.mimeType || 'image/jpeg';

        // Check & trash pre-existing file with same name in folder
        const existingRes = await drive.files.list({
          q: `'${folderId}' in parents and name='${fileName}' and trashed=false`,
          fields: 'files(id)',
        });
        if (existingRes.data.files) {
          for (const ex of existingRes.data.files) {
            if (ex.id) {
              await drive.files.update({
                fileId: ex.id,
                requestBody: { trashed: true },
              });
            }
          }
        }

        // Upload file to Google Drive folder
        const fileRes = await drive.files.create({
          requestBody: {
            name: fileName,
            parents: [folderId],
          },
          media: {
            mimeType: mimeType,
            body: stream,
          },
          fields: 'id, webViewLink',
        });

        const fileId = fileRes.data.id!;
        await drive.permissions.create({
          fileId: fileId,
          requestBody: { role: 'reader', type: 'anyone' },
        });

        // Direct viewable URL
        uploadedUrls[item.key] = `https://lh3.googleusercontent.com/d/${fileId}`;
      }
    }

    return NextResponse.json({
      success: true,
      folder_url: folderUrl,
      urls: uploadedUrls,
    });
  } catch (err: any) {
    console.error('Google Drive Upload Route Error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to upload to Google Drive' },
      { status: 500 }
    );
  }
}
