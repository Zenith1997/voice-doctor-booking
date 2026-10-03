// Windows Jenkins agent + Docker Desktop in Linux-container mode.
pipeline {
    agent { label 'windows-docker' }
    options {
        skipDefaultCheckout(true)
        disableConcurrentBuilds()
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }
    environment {
        APP_NAME = 'voice-doctor-booking'
        IMAGE_TAG = "${BUILD_NUMBER}"
    }
    stages {
        stage('Checkout') {
            steps {
                // Configure this job as Pipeline script from SCM.
                checkout scm
                bat 'git rev-parse HEAD > revision.txt'
            }
        }
        stage('Build') {
            steps {
                bat 'node --version'
                bat 'npm ci'
                bat 'docker build --pull -t %APP_NAME%:%IMAGE_TAG% .'
            }
        }
        stage('Test') {
            steps { bat 'npm run test:ci' }
            post { always { junit testResults: 'test-results.xml', allowEmptyResults: false } }
        }
        stage('Code Quality') {
            steps {
                script {
                    def scanner = tool 'SonarScanner'
                    withSonarQubeEnv('SonarQube') {
                        bat "\"${scanner}\\bin\\sonar-scanner.bat\""
                    }
                }
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }
        stage('Security') {
            steps {
                script {
                    // Store both reports before enforcing either exit status.
                    def auditStatus = bat(returnStatus: true,
                        script: 'npm audit --omit=dev --audit-level=high --json > npm-audit.json')
                    def trivyStatus = bat(returnStatus: true,
                        script: 'trivy image --exit-code 1 --severity HIGH,CRITICAL --format json --output trivy-image.json %APP_NAME%:%IMAGE_TAG%')
                    if (auditStatus != 0 || trivyStatus != 0) {
                        error('Security checks failed. Review archived scan reports; fix vulnerabilities or scanner errors before releasing.')
                    }
                }
            }
        }
        stage('Deploy') {
            steps {
                powershell '.\\scripts\\deploy.ps1 -Name voicecare-staging -Image "$env:APP_NAME`:$env:IMAGE_TAG" -Port 3001 -Volume voicecare-staging-db'
            }
        }
        stage('Release') {
            steps {
                // Promote the exact tested image. No rebuild and no database sharing.
                powershell '.\\scripts\\deploy.ps1 -Name voicecare-production -Image "$env:APP_NAME`:$env:IMAGE_TAG" -Port 3000 -Volume voicecare-production-db'
                bat 'docker tag %APP_NAME%:%IMAGE_TAG% %APP_NAME%:release-%BUILD_NUMBER%'
                bat 'docker image inspect %APP_NAME%:release-%BUILD_NUMBER% > release-image.json'
            }
        }
        stage('Monitoring') {
            steps {
                powershell '.\\scripts\\start-monitor.ps1 -Image "$env:APP_NAME`:$env:IMAGE_TAG"'
            }
        }
    }
    post {
        always {
            archiveArtifacts artifacts: 'revision.txt,npm-audit.json,trivy-image.json,release-image.json,monitoring-evidence.log,test-results.xml', allowEmptyArchive: true
        }
        success { echo 'All seven stages passed. Production and continuous monitoring are running.' }
        failure { echo 'Pipeline failed. Inspect logs and archived evidence. Later stages were stopped.' }
    }
}
