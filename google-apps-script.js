/**
 * Google Apps Script for Automated Google Drive Member Folder & Image Storage
 * Account: mariamtelecom7011@gmail.com
 * Parent Folder ID: 1NnSLLkd-plY13jynoj2O2Z-J7itnoE1V
 * 
 * Instructions:
 * 1. Log in to your Google account (mariamtelecom7011@gmail.com)
 * 2. Go to https://script.google.com
 * 3. Click "New project"
 * 4. Replace all code in Code.gs with this script
 * 5. Click "Deploy" -> "New deployment" -> Select "Web app"
 * 6. Execute as: "Me" | Who has access: "Anyone"
 * 7. Copy the Web App URL and paste it in your .env.local as:
 *    NEXT_PUBLIC_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/.../exec
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var memberNo = data.member_no || 'Unknown';
    var name = data.name || 'Member';
    var files = data.files || [];

    // Target Google Drive Parent Folder ID (mariamtelecom7011@gmail.com folder)
    var PARENT_FOLDER_ID = "1NnSLLkd-plY13jynoj2O2Z-J7itnoE1V";
    var rootFolder;
    try {
      rootFolder = DriveApp.getFolderById(PARENT_FOLDER_ID);
    } catch (err) {
      var rootFolders = DriveApp.getFoldersByName("Loan Management System Members");
      rootFolder = rootFolders.hasNext() ? rootFolders.next() : DriveApp.createFolder("Loan Management System Members");
    }

    // Clean folder name for the member
    var cleanName = name.replace(/[^\w\s\u0980-\u09FF-]/gi, '').trim();
    var folderName = "Member_" + memberNo + "_" + cleanName;
    
    // Find or create member folder inside root folder
    var subFolders = rootFolder.getFoldersByName(folderName);
    var memberFolder;
    if (subFolders.hasNext()) {
      memberFolder = subFolders.next();
    } else {
      memberFolder = rootFolder.createFolder(folderName);
    }

    // Make folder viewable via link
    memberFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    var folderUrl = memberFolder.getUrl();

    var uploadedUrls = {};

    for (var i = 0; i < files.length; i++) {
      var fileItem = files[i];
      if (!fileItem.base64 || !fileItem.key) continue;

      var base64Clean = fileItem.base64.replace(/^data:image\/\w+;base64,/, '');
      var decoded = Utilities.base64Decode(base64Clean);
      var blob = Utilities.newBlob(decoded, fileItem.mimeType || 'image/jpeg', fileItem.fileName || (fileItem.key + '.jpg'));

      // Remove existing file with same name if any
      var existingFiles = memberFolder.getFilesByName(blob.getName());
      while (existingFiles.hasNext()) {
        existingFiles.next().setTrashed(true);
      }

      var createdFile = memberFolder.createFile(blob);
      createdFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      
      var fileId = createdFile.getId();
      // Direct embed URL for web images
      var directUrl = "https://lh3.googleusercontent.com/d/" + fileId;
      
      uploadedUrls[fileItem.key] = directUrl;
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      folder_url: folderUrl,
      urls: uploadedUrls
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "ok",
    message: "Loan Management Google Drive API is active for folder: 1NnSLLkd-plY13jynoj2O2Z-J7itnoE1V"
  })).setMimeType(ContentService.MimeType.JSON);
}
