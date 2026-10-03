# VoiceCare: SIT753 seven-stage Jenkins pipeline

This change adds Build, Test, Code Quality, Security, Deploy, Release and Monitoring, plus an initial SCM checkout. It targets a Windows Jenkins agent with Docker Desktop running Linux containers. It is a local assessment deployment, not a public clinical service.

## 1. Get the pipeline branch

The changes are available in pull request #1 on branch `sit753-jenkins-pipeline`. Review and merge it when ready, or configure Jenkins to use `*/sit753-jenkins-pipeline` while testing. After merging, use `*/main`.

Previously committed node_modules are removed from this branch. `npm ci` recreates dependencies from the updated package-lock.json. Keep your local `.env` private; no API key is required for CI tests or the basic local deployment.

## 2. Prepare the Windows Jenkins agent

- Install Node.js 24 LTS, Git, Docker Desktop and Trivy. Put Node, Git and Trivy on the PATH visible to the Jenkins agent. Restart the agent after PATH changes.
- Run Docker Desktop in Linux-container mode. Check `node --version`, `git --version`, `docker info`, and `trivy --version` under the same Windows account as the agent. An interactive agent running as your Docker Desktop user is simplest; a Windows service account often cannot reach your user's Docker daemon.
- In Manage Jenkins > Nodes, give the agent the label `windows-docker`. Only this job should manage containers named voicecare-staging, voicecare-production and voicecare-monitor.
- Install/update Pipeline, Git, JUnit, SonarQube Scanner, and Pipeline: Nodes and Processes plugins. The agent must have Windows PowerShell.
- In Manage Jenkins > Tools, configure SonarQube Scanner named exactly `SonarScanner`.

## 3. Configure SonarQube or SonarCloud

- Create a project with key `voice-doctor-booking`, or edit sonar-project.properties to use your own key.
- Store the analysis token as Jenkins Secret text. In Manage Jenkins > System > SonarQube installations, add a server named exactly `SonarQube`, enter its URL and select the token credential.
- For SonarCloud, the URL is `https://sonarcloud.io`; also add `sonar.organization=YOUR_ORGANIZATION_KEY` to sonar-project.properties. Disable Automatic Analysis for this project before using Jenkins CI analysis.
- Add a Sonar webhook pointing to `http://YOUR_JENKINS_ADDRESS:8080/sonarqube-webhook/` (including the final slash). The Sonar server must be able to reach this address; hosted SonarCloud cannot call an inaccessible localhost Jenkins. Use a reachable Jenkins URL or a local SonarQube instance.
- Set an appropriate quality gate in Sonar. Jenkins waits for its result and stops on failure. Native Node test coverage is printed by `npm test`; this version does not import LCOV coverage into Sonar. A gate requiring imported coverage needs an LCOV-producing tool before it can pass. Do not claim a Sonar coverage result from the terminal coverage table.

## 4. Create the Jenkins job

1. New Item > Pipeline > name `VoiceCare-SIT753`.
2. Pipeline > Definition: **Pipeline script from SCM**.
3. SCM: Git. Repository URL: `https://github.com/Zenith1997/voice-doctor-booking.git`.
4. Branch: `*/main` (or your feature branch while testing).
5. Script Path: `Jenkinsfile`.
6. Save and Build Now.

Do not paste the file as an inline pipeline: `checkout scm` needs SCM job configuration.

## 5. What each stage does

| Stage | Operation | Failure condition/evidence |
| --- | --- | --- |
| Build | npm ci, builds versioned Docker image | Failed dependency install or image build stops job |
| Test | Six isolated in-memory SQLite API integration tests | Failed assertion stops job; JUnit XML published |
| Code Quality | SonarScanner and waitForQualityGate | Gate failure or five-minute timeout stops job |
| Security | npm audit production dependencies and Trivy image scan | HIGH/CRITICAL finding or scan error stops release; JSON reports archived |
| Deploy | Starts staging on localhost:3001 with its own named database volume | Database-backed /health must pass within retries |
| Release | Promotes the same image to localhost:3000; records release tag and image ID | Production must pass health check; no rebuild |
| Monitoring | Starts separate monitor container checking production every 30 seconds | Startup requires an UP event; later DOWN/RECOVERED alerts go to Docker logs |

Trivy scans the base image as well as application packages. New advisories can legitimately block a build even when npm audit passes. Inspect archived results, update dependencies/base image and rebuild; do not bypass the scanner exit code.

Release replaces the existing local production container, so a short interruption is expected. It preserves the named database volume, but does not provide automatic rollback. The image tag is a local release record; it is not a pushed registry image or GitHub Release. The pipeline disables concurrent builds of this job.

## 6. Verify and capture your own evidence

Open `http://localhost:3001` for staging and `http://localhost:3000` for production. The Docker commands bind host ports to loopback.

```powershell
docker ps
docker logs --tail 20 voicecare-monitor
docker stop voicecare-production
# Wait at least 30 seconds, then show a DOWN alert.
docker logs --tail 20 voicecare-monitor
docker start voicecare-production
# Wait at least 30 seconds, then show RECOVERED and UP.
docker logs --tail 20 voicecare-monitor
```

The monitor remains running when Jenkins ends. Jenkins archives its initial UP event, not every subsequent monitoring event. Docker's health status alone does not restart an unhealthy but running application container.

Optional external alerts: scripts/monitor.js accepts ALERT_WEBHOOK_URL and sends `{ "text": "..." }` to a compatible webhook. Configure a private environment file and pass it only to the monitor container if you want external notifications. This is not configured by default; log alerts are the implemented behavior.

The app's existing seeded admin login is `admin@voicecare.local` / `admin123`. Use only demonstration data. Existing application limitations include the known demo password, in-memory sessions and no session expiry. Dependency and image scans do not prove application authentication is secure. Optional OpenAI access is not required for the tests, health checks or pipeline; API keys are intentionally not passed to containers. Voice features requiring OpenAI need separate private runtime configuration.

For your assessment, capture the actual Jenkins stage view, six passing tests, Sonar gate, security findings/interpretation, running containers, staging/production pages and the monitoring outage/recovery demonstration. Do not claim stages passed until your Jenkins run provides evidence.

## Validation performed in the preparation environment

Node 24.19.0: six integration tests passed using a fresh in-memory SQLite database. JUnit output generated successfully. JavaScript syntax and Git whitespace checks passed. Production dependency audit results are recorded separately in VALIDATION.md. Docker, Trivy, Sonar, PowerShell and Jenkins execution must be validated on the Windows agent; they were not available here.
