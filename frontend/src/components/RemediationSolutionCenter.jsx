import { useState } from "react";
import { 
    CheckCircleIcon, 
    ShieldCheckIcon, 
    KeyIcon, 
    PackageIcon, 
    TerminalIcon, 
    CopyIcon, 
    DownloadIcon,
    AlertTriangleIcon,
    DockerIcon,
    CpuIcon,
    ListCheckIcon
} from "./Icons";

function RemediationSolutionCenter({ scanData }) {
    const [activeSolutionTab, setActiveSolutionTab] = useState("dockerfile");
    const [copiedIndex, setCopiedIndex] = useState(null);

    if (!scanData) return null;

    const image = scanData.image || "container:latest";
    const cleanImageTag = image.split(":")[0];
    const imageTag = image.split(":")[1] || "latest";
    const vulnData = scanData.vulnerabilities || {};
    const criticalCVEs = vulnData.critical || 0;
    const highCVEs = vulnData.high || 0;
    const totalCVEs = vulnData.total || 0;
    const isSigned = Boolean(scanData.signature?.verified);
    const ai = scanData.ai_analysis || {};
    const remediationSteps = ai.remediation_roadmap || ai.remediation_plan || ai.remediation_steps || [];

    const handleCopy = (text, index) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    // Solution 1: Dockerfile Fix Snippet
    const dockerfileBefore = `# Vulnerable / Legacy Dockerfile
FROM ${cleanImageTag}:${imageTag}

# Unpinned dependencies with known CVEs
RUN apt-get update && apt-get install -y \\
    curl \\
    python3-dev \\
    libssl-dev

USER root
CMD ["app"]`;

    const dockerfileAfter = `# ChainProof Hardened Multi-Stage Dockerfile
# Step 1: Secure Build Stage
FROM ${cleanImageTag}:alpine AS builder
WORKDIR /app
COPY . .

# Step 2: Zero-Vulnerability Distroless / Minimal Runtime
FROM cgr.dev/chainguard/static:latest
WORKDIR /app
COPY --from=builder /app/bin /app/bin

# Enforce Non-Root Execution
USER 65534:65534
ENTRYPOINT ["/app/bin"]`;

    // Solution 2: Cosign Attestation Commands
    const cosignCommands = `# 1. Generate Sigstore Cosign cryptographic keypair
cosign generate-key-pair

# 2. Sign container image digest into transparency log
cosign sign --key cosign.key ${image}

# 3. Verify container signature against public key
cosign verify --key cosign.pub ${image}

# 4. Attach Syft SBOM attestation
syft ${image} -o spdx-json > sbom.spdx.json
cosign attest --key cosign.key --type spdx --predicate sbom.spdx.json ${image}`;

    // Solution 3: CI/CD Pipeline Gate YAML
    const githubActionsYaml = `name: ChainProof Supply Chain Gate
on: [push, pull_request]

jobs:
  security-gate:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Build Container Image
        run: docker build -t ${image} .

      - name: ChainProof Security Audit & AI Verification
        uses: chainproof/security-action@v2
        with:
          image: '${image}'
          max-risk-score: 50
          fail-on-decision: 'BLOCK'
          verify-cosign-signature: true

      - name: Cryptographic Signing on Policy Pass
        if: success()
        run: |
          cosign sign --key \${{ secrets.COSIGN_PRIVATE_KEY }} ${image}`;

    // Solution 4: Kubernetes Admission Controller Policy (Kyverno)
    const kyvernoYaml = `apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: enforce-chainproof-verified-images
spec:
  validationFailureAction: Enforce
  background: false
  rules:
    - name: verify-cosign-and-chainproof-decision
      match:
        any:
          - resources:
              kinds:
                - Pod
      verifyImages:
        - imageReferences:
            - "${cleanImageTag}:*"
          attestors:
            - entries:
                - keys:
                    publicKeys: |
                      -----BEGIN PUBLIC KEY-----
                      MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...
                      -----END PUBLIC KEY-----`;

    // Download Remediation Shell Script
    const handleDownloadRemediationScript = () => {
        const scriptContent = `#!/usr/bin/env bash
# ChainProof Automated Remediation Script for: ${image}
# Generated on: ${new Date().toISOString()}

set -euo pipefail

echo "=========================================================="
echo "ChainProof Automated Security Remediation Engine"
echo "Target Image: ${image}"
echo "Identified Vulnerabilities: ${criticalCVEs} Critical / ${highCVEs} High"
echo "=========================================================="

echo "[1/4] Pulling hardened base image..."
docker pull cgr.dev/chainguard/static:latest || docker pull alpine:latest

echo "[2/4] Generating updated Software Bill of Materials (SBOM)..."
syft "${image}" -o spdx-json > sbom-${cleanImageTag.replace(/[^a-zA-Z0-9]/g, '_')}.json

echo "[3/4] Establishing cryptographic provenance with Sigstore Cosign..."
if [ ! -f "cosign.key" ]; then
    echo "Generating new Cosign key pair..."
    cosign generate-key-pair
fi

echo "Signing image artifact..."
cosign sign --key cosign.key "${image}" || echo "Notice: Registry credentials required to push signature."

echo "[4/4] Verifying signature against public key..."
cosign verify --key cosign.pub "${image}" || true

echo "=========================================================="
echo "Remediation routine complete. Re-run ChainProof scanner to verify."
echo "=========================================================="
`;
        const blob = new Blob([scriptContent], { type: "text/x-shellscript" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `chainproof-remediate-${cleanImageTag.replace(/[^a-zA-Z0-9]/g, '_')}.sh`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="remediation-solution-center">
            {/* Header / Hero */}
            <div className="solution-center-header">
                <div className="solution-header-left">
                    <div className="solution-icon-box">
                        <ShieldCheckIcon size={24} className="solution-glow-icon" />
                    </div>
                    <div>
                        <div className="solution-badge-row">
                            <span className="solution-pill-tag">CHAINPROOF SOLUTION &amp; REMEDIATION ENGINE</span>
                            <span className="solution-fix-pill">
                                <CheckCircleIcon size={12} /> {remediationSteps.length} Prescriptive Fixes Ready
                            </span>
                        </div>
                        <h3 className="solution-main-title">
                            Automated Remediation Roadmap for <span className="image-highlight">{image}</span>
                        </h3>
                    </div>
                </div>

                <div className="solution-header-actions">
                    <button
                        type="button"
                        className="cta-button primary solution-download-btn"
                        onClick={handleDownloadRemediationScript}
                        title="Download automated bash remediation script"
                    >
                        <DownloadIcon size={15} /> Download Fix Script (.sh)
                    </button>
                </div>
            </div>

            {/* Quick Summary Cards of Issues being Solved */}
            <div className="solution-summary-strip">
                <div className="solution-summary-card">
                    <span className="summary-card-sub">VULNERABILITIES TO MITIGATE</span>
                    <strong className="summary-card-val crit-text">{criticalCVEs} Critical / {highCVEs} High</strong>
                    <span className="summary-card-hint">Resolved via Minimal Base Migration</span>
                </div>
                <div className="solution-summary-card">
                    <span className="summary-card-sub">SUPPLY CHAIN INTEGRITY</span>
                    <strong className={`summary-card-val ${isSigned ? "ok-text" : "warn-text"}`}>
                        {isSigned ? "Cryptographically Signed" : "Unsigned Artifact"}
                    </strong>
                    <span className="summary-card-hint">Cosign Provenance Pipeline Ready</span>
                </div>
                <div className="solution-summary-card">
                    <span className="summary-card-sub">ENFORCEMENT GATE</span>
                    <strong className="summary-card-val info-text">CI/CD &amp; K8s Admission</strong>
                    <span className="summary-card-hint">Zero-Trust Policy Enforced</span>
                </div>
            </div>

            {/* Solution Selector Tabs */}
            <div className="solution-tab-bar">
                <button
                    type="button"
                    className={`solution-tab-item ${activeSolutionTab === "dockerfile" ? "active" : ""}`}
                    onClick={() => setActiveSolutionTab("dockerfile")}
                >
                    <DockerIcon size={15} /> 1. Dockerfile &amp; Base Fix
                </button>
                <button
                    type="button"
                    className={`solution-tab-item ${activeSolutionTab === "cosign" ? "active" : ""}`}
                    onClick={() => setActiveSolutionTab("cosign")}
                >
                    <KeyIcon size={15} /> 2. Sigstore Cosign Attestation
                </button>
                <button
                    type="button"
                    className={`solution-tab-item ${activeSolutionTab === "cicd" ? "active" : ""}`}
                    onClick={() => setActiveSolutionTab("cicd")}
                >
                    <TerminalIcon size={15} /> 3. CI/CD Policy Gate
                </button>
                <button
                    type="button"
                    className={`solution-tab-item ${activeSolutionTab === "k8s" ? "active" : ""}`}
                    onClick={() => setActiveSolutionTab("k8s")}
                >
                    <ShieldCheckIcon size={15} /> 4. Kubernetes Admission
                </button>
            </div>

            {/* Solution Content Panes */}
            <div className="solution-pane-wrapper">
                {/* 1. Dockerfile Fix Pane */}
                {activeSolutionTab === "dockerfile" && (
                    <div className="solution-pane">
                        <div className="pane-lead-text">
                            <h4>Base Image Refactoring &amp; Vulnerability Elimination</h4>
                            <p>
                                Replacing bloated runtime dependencies with a hardened, minimal or distroless base image eliminates up to 95% of OS-level CVEs while enforcing non-root execution.
                            </p>
                        </div>

                        <div className="code-diff-container">
                            <div className="code-diff-col before">
                                <div className="diff-header">
                                    <span className="diff-badge vuln">CURRENT PATTERN (VULNERABLE)</span>
                                </div>
                                <pre className="code-box"><code>{dockerfileBefore}</code></pre>
                            </div>

                            <div className="code-diff-col after">
                                <div className="diff-header">
                                    <span className="diff-badge secure">CHAINPROOF RECOMMENDED FIX</span>
                                    <button
                                        type="button"
                                        className="copy-snippet-btn"
                                        onClick={() => handleCopy(dockerfileAfter, "dockerfile")}
                                    >
                                        <CopyIcon size={13} /> {copiedIndex === "dockerfile" ? "Copied!" : "Copy Dockerfile"}
                                    </button>
                                </div>
                                <pre className="code-box"><code>{dockerfileAfter}</code></pre>
                            </div>
                        </div>

                        {/* Prescriptive Steps List */}
                        <div className="solution-checklist-box">
                            <h5>Actionable Refactoring Steps:</h5>
                            <ul className="solution-ordered-steps">
                                {remediationSteps.map((step, idx) => (
                                    <li key={idx}>
                                        <span className="step-idx">{idx + 1}</span>
                                        <span>{typeof step === "string" ? step.replace(/^(\d+[\.\)]*\s*)+/, "") : step}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {/* 2. Sigstore Cosign Attestation Pane */}
                {activeSolutionTab === "cosign" && (
                    <div className="solution-pane">
                        <div className="pane-lead-text">
                            <h4>Cryptographic Provenance &amp; Tamper-Proof Signing</h4>
                            <p>
                                Sign container digests using Sigstore Cosign to ensure authentic build origin and prevent dependency injection or registry tampering.
                            </p>
                        </div>

                        <div className="code-snippet-card">
                            <div className="snippet-card-header">
                                <span className="snippet-title">Cosign Signing &amp; Attestation Workflow</span>
                                <button
                                    type="button"
                                    className="copy-snippet-btn"
                                    onClick={() => handleCopy(cosignCommands, "cosign")}
                                >
                                    <CopyIcon size={13} /> {copiedIndex === "cosign" ? "Copied!" : "Copy Commands"}
                                </button>
                            </div>
                            <pre className="code-box cli-box"><code>{cosignCommands}</code></pre>
                        </div>
                    </div>
                )}

                {/* 3. CI/CD Policy Gate Pane */}
                {activeSolutionTab === "cicd" && (
                    <div className="solution-pane">
                        <div className="pane-lead-text">
                            <h4>Automated Shift-Left CI/CD Policy Gate</h4>
                            <p>
                                Prevent vulnerable or unsigned container images from ever reaching the registry. Automatically evaluate policy gates in GitHub Actions or GitLab CI.
                            </p>
                        </div>

                        <div className="code-snippet-card">
                            <div className="snippet-card-header">
                                <span className="snippet-title">.github/workflows/chainproof-gate.yml</span>
                                <button
                                    type="button"
                                    className="copy-snippet-btn"
                                    onClick={() => handleCopy(githubActionsYaml, "cicd")}
                                >
                                    <CopyIcon size={13} /> {copiedIndex === "cicd" ? "Copied!" : "Copy YAML"}
                                </button>
                            </div>
                            <pre className="code-box"><code>{githubActionsYaml}</code></pre>
                        </div>
                    </div>
                )}

                {/* 4. Kubernetes Admission Controller Pane */}
                {activeSolutionTab === "k8s" && (
                    <div className="solution-pane">
                        <div className="pane-lead-text">
                            <h4>Kubernetes Zero-Trust Admission Controller (Kyverno)</h4>
                            <p>
                                Enforce cluster-level admission verification to block unsigned pods and unverified digests from executing in production namespaces.
                            </p>
                        </div>

                        <div className="code-snippet-card">
                            <div className="snippet-card-header">
                                <span className="snippet-title">k8s/kyverno-chainproof-policy.yaml</span>
                                <button
                                    type="button"
                                    className="copy-snippet-btn"
                                    onClick={() => handleCopy(kyvernoYaml, "k8s")}
                                >
                                    <CopyIcon size={13} /> {copiedIndex === "k8s" ? "Copied!" : "Copy YAML"}
                                </button>
                            </div>
                            <pre className="code-box"><code>{kyvernoYaml}</code></pre>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default RemediationSolutionCenter;
