param(
  [Parameter(Mandatory = $true)]
  [string]$BaseUrl,
  [string]$Username = "superadmin",
  [string]$Password = "superadmin123",
  [string]$RootDir = ".\uploads"
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Net.Http

if (!(Test-Path $RootDir)) {
  throw "Folder uploads tidak ditemukan di '$RootDir'."
}

$loginBody = @{
  username = $Username
  password = $Password
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod `
  -Method Post `
  -Uri ($BaseUrl.TrimEnd("/") + "/api/auth/login") `
  -ContentType "application/json" `
  -Body $loginBody

$token = $loginResponse.token
if ([string]::IsNullOrWhiteSpace($token)) {
  throw "Gagal mendapatkan token login."
}

$client = New-Object System.Net.Http.HttpClient
$client.DefaultRequestHeaders.Authorization = New-Object System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", $token)

$files = Get-ChildItem -Path $RootDir -Recurse -File

foreach ($file in $files) {
  $relativePath = $file.FullName.Substring((Resolve-Path ".").Path.Length + 1).Replace("\", "/")
  Write-Host "Importing $relativePath"

  $content = New-Object System.Net.Http.MultipartFormDataContent
  $content.Add((New-Object System.Net.Http.StringContent($relativePath)), "key")

  $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
  $fileContent = New-Object System.Net.Http.ByteArrayContent -ArgumentList @(,$bytes)
  $fileContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse("application/pdf")
  $content.Add($fileContent, "file", $file.Name)

  $response = $client.PostAsync(($BaseUrl.TrimEnd("/") + "/api/admin/assets/import"), $content).GetAwaiter().GetResult()
  if (-not $response.IsSuccessStatusCode) {
    $responseBody = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
    throw "Gagal import $relativePath. Status: $($response.StatusCode). Body: $responseBody"
  }
}

Write-Host "Semua assets berhasil diimport ke D1."
