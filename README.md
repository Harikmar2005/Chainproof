
# 🛡️ ChainProof

## AI-Powered Software Supply-Chain Security Platform

ChainProof is an AI-powered container security platform designed to analyze Docker images for security risks before deployment.

It combines container inspection, Software Bill of Materials (SBOM), vulnerability scanning, digital signature verification, Random Forest risk classification, Isolation Forest anomaly detection, and evidence-based risk scoring into a unified security dashboard.

---

## 🚀 Why ChainProof?

Modern applications depend heavily on containers and open-source packages. A single vulnerable or untrusted container image can introduce security risks into an entire deployment pipeline.

Traditional container scanning tools often provide individual security results, but security teams still need to interpret those results and determine the overall risk.

ChainProof combines multiple security signals into one intelligent risk assessment.

Instead of simply reporting:

> "10 vulnerabilities found"

ChainProof attempts to answer:

> **"How risky is this container, and why?"**

---

# 🎯 Key Features

## 🔍 Container Image Analysis

ChainProof analyzes Docker images and collects important container metadata including:

- Image name
- Image size
- Layer information
- Container metadata
- Image configuration

## 📦 Software Bill of Materials

ChainProof uses **Syft** to generate an SBOM for the scanned container.

The SBOM provides visibility into the software packages contained inside the image.

Information includes:

- Package count
- Package information
- SBOM generation status
- Software composition data

## 🛡️ Vulnerability Detection

ChainProof integrates **Docker Scout** to identify known vulnerabilities in container images.

Vulnerabilities are categorized into:

- 🔴 Critical
- 🟠 High
- 🟡 Medium
- 🟢 Low

The platform calculates vulnerability statistics and displays individual vulnerability findings in the dashboard.

## 🔐 Digital Signature Verification

ChainProof uses **Cosign** to verify whether a container image has a trusted digital signature.

The system checks:

- Whether the image is signed
- Whether the signature can be verified
- Image integrity status

Unsigned or unverifiable images contribute additional risk to the final assessment.

---

# 🤖 AI / ML Security Analysis

ChainProof uses two machine-learning approaches.

## 🌲 Random Forest

A **Random Forest classifier** predicts the overall security risk category based on extracted container security features.

Features include:

- Critical CVEs
- High CVEs
- Medium CVEs
- Low CVEs
- Package Count
- Image Size
- Signature Status
- Signature Verification Status

The model produces:

- Risk prediction
- Prediction confidence
- Model status

Possible predictions:

```text
LOW
MEDIUM
HIGH
CRITICAL

Isolation Forest

ChainProof also uses Isolation Forest for anomaly detection.

The anomaly detector identifies unusual combinations of container security characteristics.

Example:

Unusually large package count
        +
High vulnerability count
        +
Unsigned image
        +
Unusual image characteristics
        ↓
Anomalous Security Profile

The system returns:

Anomaly detected / normal
Anomaly score
Model status
🧠 Evidence-Based Risk Engine

ChainProof combines machine-learning predictions with security evidence.

The risk engine considers:

Random Forest prediction
        +
Critical vulnerabilities
        +
High vulnerabilities
        +
Medium vulnerabilities
        +
Low vulnerabilities
        +
Digital signature status
        +
Isolation Forest anomaly detection
        ↓
Final Risk Score

The final score is normalized between:

0 ───────────────────────────── 100
LOW                         CRITICAL
Risk Categories
Risk Score	Severity	Verdict
0–24	LOW	TRUSTED
25–49	MEDIUM	CAUTION
50–74	HIGH	HIGH RISK
75–100	CRITICAL	HIGH RISK
📊 Risk Breakdown

ChainProof provides an explanation of how different security signals contributed to the final risk score.

Example:

ML Base Score              +92
Critical CVE Contribution   +6
High CVE Contribution       +8
Medium CVE Contribution   +0.5
Low CVE Contribution        +0
Signature Penalty           +8
Anomaly Penalty             +7
──────────────────────────────
Final Risk Score           100

This makes the assessment easier to understand instead of presenting a single unexplained risk number.

📈 Security Dashboard

The React dashboard provides a unified view of the scan.

Security Risk

Displays:

Risk Score
Severity
Verdict
Vulnerability Summary

Displays:

Critical
High
Medium
Low
Total vulnerabilities
Vulnerability Distribution

Provides a graphical representation of vulnerability severity.

The chart automatically reflects the results returned by the backend.

AI Security Analysis

Displays:

Random Forest prediction
Random Forest confidence
Random Forest model status
Isolation Forest anomaly detection
Isolation Forest anomaly score
Isolation Forest model status
Security Checks

The dashboard displays the status of:

Vulnerability scanning
SBOM generation
Digital signature verification
ML anomaly detection
Security Findings

Important findings are displayed with:

Finding type
Severity
Description

🏗️ System Architecture

                    ┌──────────────────────┐
                    │      React UI        │
                    │    Vite Frontend     │
                    └──────────┬───────────┘
                               │
                               │ REST API
                               ▼
                    ┌──────────────────────┐
                    │    FastAPI Backend   │
                    └──────────┬───────────┘
                               │
                 ┌─────────────┼─────────────┐
                 │             │             │
                 ▼             ▼             ▼
          ┌───────────┐ ┌───────────┐ ┌────────────┐
          │  Docker   │ │   Syft    │ │Docker Scout│
          │ Inspection│ │   SBOM    │ │    CVEs    │
          └───────────┘ └───────────┘ └────────────┘
                 │             │             │
                 └─────────────┼─────────────┘
                               │
                               ▼
                     ┌──────────────────┐
                     │     Cosign       │
                     │ Signature Verify │
                     └────────┬─────────┘
                              │
                              ▼
                    ┌────────────────────┐
                    │ Feature Extraction │
                    └─────────┬──────────┘
                              │
                 ┌────────────┴────────────┐
                 │                         │
                 ▼                         ▼
        ┌────────────────┐       ┌─────────────────┐
        │ Random Forest  │       │ Isolation Forest│
        │ Risk Classifier│       │ Anomaly Detector│
        └───────┬────────┘       └────────┬────────┘
                │                         │
                └────────────┬────────────┘
                             ▼
                    ┌──────────────────┐
                    │   Risk Engine    │
                    │ Evidence Fusion  │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Final Risk Score │
                    │ Severity/Verdict │
                    └──────────────────┘

📁 Project Structure

   ChainProof/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── scan.py
│   │   │   └── reports.py
│   │   │
│   │   ├── services/
│   │   │   ├── docker_service.py
│   │   │   ├── sbom_service.py
│   │   │   ├── vulnerability_service.py
│   │   │   ├── signature_service.py
│   │   │   └── scan_orchestrator.py
│   │   │
│   │   ├── ml/
│   │   │   ├── feature_extractor.py
│   │   │   ├── risk_model.py
│   │   │   ├── anomaly_model.py
│   │   │   ├── train.py
│   │   │   └── train_anomaly.py
│   │   │
│   │   ├── risk/
│   │   │   └── risk_engine.py
│   │   │
│   │   └── main.py
│   │
│   ├── data/
│   │   └── training_data.csv
│   │
│   ├── models/
│   │   ├── risk_model.pkl
│   │   └── anomaly_model.pkl
│   │
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── RiskCard.jsx
│   │   │   ├── VulnerabilityCards.jsx
│   │   │   ├── MLAnalysis.jsx
│   │   │   ├── SecurityChecks.jsx
│   │   │   ├── VulnerabilityTable.jsx
│   │   │   ├── LoadingScanner.jsx
│   │   │   ├── RiskBreakdown.jsx
│   │   │   └── VulnerabilityChart.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Scan.jsx
│   │   │   └── Reports.jsx
│   │   │
│   │   ├── services/
│   │   │   └── api.js
│   │   │
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   ├── package.json
│   └── vite.config.js
│
├── tests/
├── .gitignore
├── docker-compose.yml
├── README.md
└── package.json

⚙️ Technology Stack
Backend
Python
FastAPI
Scikit-learn
Pandas
Joblib
Frontend
React
Vite
JavaScript
Recharts
CSS
Container Security
Docker
Syft
Docker Scout
Cosign
Machine Learning
Random Forest
Isolation Forest
StandardScaler
Feature Extraction
Evidence-Based Risk Scoring

 Scan Workflow

 1. User enters Docker image
           ↓
2. Backend receives scan request
           ↓
3. Docker image is ensured locally
           ↓
4. Docker metadata is collected
           ↓
5. Syft generates SBOM
           ↓
6. Docker Scout scans vulnerabilities
           ↓
7. Cosign verifies signature
           ↓
8. Security features are extracted
           ↓
9. Random Forest predicts risk
           ↓
10. Isolation Forest checks anomalies
           ↓
11. Risk Engine combines evidence
           ↓
12. Final risk score generated
           ↓
13. Results returned to React
           ↓
14. Dashboard displays security analysis

Example Scan

Example image:
alpine:latest

Vulnerabilities
----------------
Critical : 2
High     : 7
Medium   : 1
Low      : 0

SBOM
----------------
Packages : 42

Signature
----------------
Signed   : No
Verified : No

AI Analysis
----------------
Random Forest : CRITICAL
Confidence   : 72%

Isolation Forest
----------------
Anomaly : 

Installation
Prerequisites

Install:

Python 3.11+
Node.js
npm
Docker Desktop
Syft
Docker Scout
Cosign

Verify Docker:

docker --version

Verify Python:

python --version

Verify Node.js:

node --version
🔧 Backend Setup

Navigate to the backend:

cd backend

Create a virtual environment:

python -m venv .venv

Activate it on Windows:

.venv\Scripts\Activate.ps1

Install dependencies:

python -m pip install -r requirements.txt
🤖 Train the Random Forest Model

From the backend directory:

python -m app.ml.train

The trained model will be saved to:

backend/models/risk_model.pkl
🕵️ Train the Anomaly Detection Model

Run:

python -m app.ml.train_anomaly

The model will be saved to:

backend/models/anomaly_model.pkl
▶️ Start the Backend

From:

ChainProof/backend

run:

python -m uvicorn app.main:app --reload

The API will be available at:

http://127.0.0.1:8000

FastAPI documentation:

http://127.0.0.1:8000/docs
💻 Start the Frontend

Open another terminal.

Navigate to:

cd frontend

Install dependencies:

npm install

Start the development server:

npm run dev

The frontend will be available at:

http://localhost:5173
🔌 API Endpoints
Health Check
GET /api/v1/health

Checks whether the backend is running.

Scan Image
POST /api/v1/scan

Example request:

{
  "image": "alpine:latest"
}

The endpoint returns:

Scan ID
Image information
Risk score
Severity
Verdict
Docker information
SBOM
Vulnerabilities
Signature status
ML analysis
Security findings
Risk breakdown
Scan Reports
GET /api/v1/reports

Returns previous scan reports.

Clear Reports
DELETE /api/v1/reports

Clears stored scan history.

🔐 Security Considerations

ChainProof is designed as a security analysis and decision-support platform.

It should be used as part of a broader security process and should not be considered a replacement for:

Secure development practices
Code review
Penetration testing
Runtime security
CI/CD security controls
Human security review

Machine-learning predictions are dependent on the quality and representativeness of the training dataset.

🔮 Future Scope

Potential future improvements include:

CI/CD security gates
Kubernetes admission control
Cloud container security
Registry integration
Continuous image monitoring
Improved ML training datasets
Explainable AI techniques
Automated remediation recommendations
Image policy enforcement
Multi-user security dashboards
Authentication and authorization
Enterprise reporting
Risk trend analytics
Container image comparison
Security alert notifications
💡 Project Vision

ChainProof aims to make container security easier to understand by combining multiple security technologies into a single intelligent decision layer.

Instead of forcing developers and security teams to interpret multiple tools independently:

Docker
   +
SBOM
   +
Vulnerability Scanner
   +
Digital Signature
   +
Machine Learning
   +
Anomaly Detection
        ↓
   ChainProof
        ↓
Security Risk Intelligence
👨‍💻 Project
ChainProof

AI-Powered Software Supply-Chain Security Platform

Built using:

FastAPI
React
Docker
Syft
Docker Scout
Cosign
Random Forest
Isolation Forest
⭐ Support

If you find ChainProof useful, consider giving the repository a ⭐ on GitHub.

📜 License

This project is intended for educational, research, and demonstration purposes.

Add an appropriate open-source license before distributing the project publicly.

