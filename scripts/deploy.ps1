param([Parameter(Mandatory=$true)][string]$Name,
      [Parameter(Mandatory=$true)][string]$Image,
      [Parameter(Mandatory=$true)][int]$Port,
      [Parameter(Mandatory=$true)][string]$Volume)
$ErrorActionPreference = 'Stop'
# Existence check avoids swallowing genuine Docker daemon errors.
$existing = docker ps -a --filter "name=^/$Name`$" --format '{{.Names}}'
if ($LASTEXITCODE -ne 0) { throw 'Cannot contact Docker daemon' }
if ($existing -eq $Name) {
  docker rm -f $Name
  if ($LASTEXITCODE -ne 0) { throw 'Cannot remove previous container' }
}
docker run -d --name $Name --restart unless-stopped -p "127.0.0.1:${Port}:3000" --mount "type=volume,source=$Volume,target=/app/db" $Image
if ($LASTEXITCODE -ne 0) { throw 'Deployment failed' }
for ($attempt = 0; $attempt -lt 30; $attempt++) {
  try {
    $response = Invoke-RestMethod -Uri "http://localhost:$Port/health" -TimeoutSec 5
    if ($response.status -eq 'ok') { Write-Host "$Name is healthy"; exit 0 }
  } catch { }
  Start-Sleep -Seconds 2
}
docker logs --tail 50 $Name
throw 'Deployment failed its health check'
