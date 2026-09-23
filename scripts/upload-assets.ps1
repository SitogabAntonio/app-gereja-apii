param(
  [string]$BucketName = "app-gereja-assets",
  [string]$WranglerPath = "C:\Users\user\AppData\Roaming\npm\wrangler.cmd",
  [string]$RootDir = ".\uploads"
)

$ErrorActionPreference = "Stop"

if (!(Test-Path $WranglerPath)) {
  throw "Wrangler tidak ditemukan di '$WranglerPath'."
}

if (!(Test-Path $RootDir)) {
  throw "Folder uploads tidak ditemukan di '$RootDir'."
}

$files = Get-ChildItem -Path $RootDir -Recurse -File

foreach ($file in $files) {
  $relativePath = $file.FullName.Substring((Resolve-Path ".").Path.Length + 1).Replace("\", "/")
  Write-Host "Uploading $relativePath"
  & $WranglerPath r2 object put "$BucketName/$relativePath" --file $file.FullName
}

Write-Host "Upload assets selesai."
