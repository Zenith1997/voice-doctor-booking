param([Parameter(Mandatory=$true)][string]$Image)
$ErrorActionPreference = 'Stop'
$name = 'voicecare-monitor'
$existing = docker ps -a --filter "name=^/$name`$" --format '{{.Names}}'
if ($LASTEXITCODE -ne 0) { throw 'Cannot contact Docker daemon' }
if ($existing -eq $name) {
  docker rm -f $name
  if ($LASTEXITCODE -ne 0) { throw 'Cannot remove previous monitor' }
}
# Both containers share a Docker network; no host-port dependency.
docker network inspect voicecare-monitoring *> $null
if ($LASTEXITCODE -ne 0) {
  docker network create voicecare-monitoring
  if ($LASTEXITCODE -ne 0) { throw 'Cannot create monitoring network' }
}
docker network connect voicecare-monitoring voicecare-production
if ($LASTEXITCODE -ne 0) { throw 'Cannot connect production to monitoring network' }
docker run -d --name $name --restart unless-stopped --network voicecare-monitoring --no-healthcheck -e MONITOR_URL=http://voicecare-production:3000/health $Image node scripts/monitor.js
if ($LASTEXITCODE -ne 0) { throw 'Cannot start monitor' }
Start-Sleep -Seconds 3
$logs = docker logs $name 2>&1
if ($LASTEXITCODE -ne 0) { throw 'Cannot read monitoring logs' }
$logs | Set-Content -Encoding UTF8 monitoring-evidence.log
if (($logs -join "`n") -notmatch '"status":"UP"') { throw 'Monitor has not confirmed production health' }
