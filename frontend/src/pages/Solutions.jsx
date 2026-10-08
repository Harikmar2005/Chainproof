import { useState } from "react";
import { 
    ShieldCheckIcon, 
    KeyIcon, 
    PackageIcon, 
    CpuIcon, 
    TerminalIcon, 
    LightningIcon, 
    CheckCircleIcon,
    AlertTriangleIcon,
    CopyIcon,
    DockerIcon,
    FileTextIcon,
    BrainIcon,
    ChevronRightIcon
} from "../components/Icons";

function Solutions({ onRouteChange }) {
    const [activeSolutionTab, setActiveSolutionTab] = useState("cicd");
    const [copiedIndex, setCopiedIndex] = useState(null);

    const handleCopy = (text, index) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const solutions = [
        {
            id: "supplychain",
            badge: "PROVENANCE & INTEGRITY",
            title: "Zero-Trust Supply Chain Verification",
            description: "Catalog every open-source component with Syft SBOMs and enforce tamper-proof cryptographic provenance with Sigstore Cosign and Rekor transparency logs.",
            icon: KeyIcon,
            features: [
                "Automated SPDX and CycloneDX SBOM cataloging",
                "Keyless OIDC container signing with Sigstore",
                "SLSA Level 3 build provenance attestation",
                "Cryptographic digest verification at every deployment stage"
            ]
        },
        {
            id: "ml-ai",
            badge: "PREDICTIVE THREAT DETECTION",
            title: "ML & AI Threat Correlation Engine",
            description: "Combine supervised Random Forest classification, unsupervised Isolation Forest anomaly detection, and deterministic multi-signal AI reasoning.",
            icon: BrainIcon,
            features: [
                "Supervised Random Forest risk prediction (0-100 score)",
                "Unsupervised Isolation Forest composition anomaly detection",
                "Multi-signal correlation across CVEs, SBOM, and signatures",
                "Zero-hallucination evidence-grounded policy decisions"
            ]
        },
        {
            id: "cicd",
            badge: "SHIFT-LEFT ENFORCEMENT",
            title: "Automated CI/CD Pipeline Gates",
            description: "Stop vulnerable, unverified, or anomalous containers before they ever touch your artifact registry or cloud environments.",
            icon: TerminalIcon,
            features: [
                "Drop-in GitHub Actions, GitLab CI, and Jenkins integration",
                "Automated pull request gating on 'BLOCK' verdicts",
                "Instant developer feedback with prescriptive fix instructions",
                "Non-blocking review workflows for staging clusters"
            ]
        },
        {
            id: "k8s",
            badge: "RUNTIME & ADMISSION CONTROL",
            title: "Kubernetes Admission Enforcement",
            description: "Prevent unauthorized or untrusted container images from running in production Kubernetes clusters using Kyverno and OPA Gatekeeper policies.",
            icon: ShieldCheckIcon,
            features: [
                "Zero-trust cluster admission policy enforcement",
                "Real-time signature and digest verification on pod creation",
                "Automated blocking of unapproved base image layers",
                "Seamless integration with AWS EKS, GKE, and Azure AKS"
            ]
        },
        {
            id: "remediation",
            badge: "AUTOMATED REMEDIATION",
            title: "Intelligent Fix & Hardening Engine",
            description: "Transform raw vulnerability lists into actionable, ordered Dockerfile refactoring roadmaps and minimal base image migrations.",
            icon: DockerIcon,
            features: [
                "Automated multi-stage Dockerfile hardening suggestions",
                "Distroless and minimal base image migration recommendations",
                "Prescriptive package patch roadmaps ranked by exploitability",
                "One-click downloadable bash remediation scripts"
            ]
        }
    ];

    const pipelineSnippet = `name: ChainProof Enterprise Supply Chain Defense
on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]

jobs:
  chainproof-security-gate:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Build Container Image
        run: docker build -t my-org/app:\${{ github.sha }} .

      - name: ChainProof Security Intelligence Audit
        uses: chainproof/security-gate-action@v2
        with:
          image: 'my-org/app:\${{ github.sha }}'
          max-risk-score: 50
          fail-on-decision: 'BLOCK'
          strict-signature-enforcement: true

      - name: Sign Container with Sigstore Cosign
        if: success()
        run: |
          cosign sign --key \${{ secrets.COSIGN_KEY }} my-org/app:\${{ github.sha }}`;

    const kyvernoSnippet = `apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: enforce-chainproof-trusted-workloads
spec:
  validationFailureAction: Enforce
  background: false
  rules:
    - name: verify-chainproof-signature
      match:
        any:
          - resources:
              kinds:
                - Pod
      verifyImages:
        - imageReferences:
            - "my-registry.io/*:*"
          attestors:
            - entries:
                - keys:
                    publicKeys: |
                      -----BEGIN PUBLIC KEY-----
                      MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...
                      -----END PUBLIC KEY-----`;

    return (
        <main className="solutions-page" id="main-content">
            <div className="solutions-container">
                {/* Hero Banner */}
                <section className="solutions-hero">
                    <div className="solutions-hero-badge">
                        <ShieldCheckIcon size={14} />
                        <span>ENTERPRISE CONTAINER SUPPLY CHAIN SOLUTIONS</span>
                    </div>
                    <h1 className="solutions-hero-title">
                        End-to-End Container Defense <br />
                        <span className="gradient-text">From Code Commit to Kubernetes Runtime</span>
                    </h1>
                    <p className="solutions-hero-desc">
                        ChainProof delivers continuous verification, cryptographic supply-chain integrity, 
                        machine-learning anomaly detection, and automated AI security decisions for modern enterprise DevOps.
                    </p>
                    <div className="solutions-hero-actions">
                        <button
                            type="button"
                            className="cta-button primary"
                            onClick={() => onRouteChange("scan")}
                        >
                            <LightningIcon size={16} /> Scan a Container Image
                        </button>
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => onRouteChange("dashboard")}
                        >
                            <BrainIcon size={16} /> View Security Dashboard
                        </button>
                    </div>
                </section>

                {/* 5 Core Solutions Grid */}
                <section className="solutions-grid-section" aria-label="Enterprise Solution Pillars">
                    <div className="section-header-centered">
                        <span className="sub-badge">CORE CAPABILITIES</span>
                        <h2 className="section-title">Engineered for Zero-Trust DevOps</h2>
                        <p className="section-subtext">Five integrated layers of protection safeguarding your modern container fleet.</p>
                    </div>

                    <div className="solutions-cards-grid">
                        {solutions.map((sol) => {
                            const IconComponent = sol.icon;
                            return (
                                <div key={sol.id} className="solution-pillar-card">
                                    <div className="sol-card-header">
                                        <div className="sol-icon-wrapper">
                                            <IconComponent size={22} />
                                        </div>
                                        <span className="sol-badge">{sol.badge}</span>
                                    </div>
                                    <h3 className="sol-title">{sol.title}</h3>
                                    <p className="sol-desc">{sol.description}</p>
                                    <div className="sol-divider" />
                                    <ul className="sol-feature-list">
                                        {sol.features.map((feat, fIdx) => (
                                            <li key={fIdx}>
                                                <CheckCircleIcon size={14} className="feat-check" />
                                                <span>{feat}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Interactive Integration Sandbox */}
                <section className="solution-integration-sandbox" aria-label="DevOps Integration Sandbox">
                    <div className="sandbox-header">
                        <div>
                            <span className="sub-badge">SEAMLESS INTEGRATION</span>
                            <h2>Deploy in Seconds Across Your Stack</h2>
                            <p>Copy production-ready configurations for GitHub Actions, Kubernetes, or Cosign.</p>
                        </div>
                        <div className="sandbox-tabs">
                            <button
                                type="button"
                                className={`sandbox-tab ${activeSolutionTab === "cicd" ? "active" : ""}`}
                                onClick={() => setActiveSolutionTab("cicd")}
                            >
                                <TerminalIcon size={14} /> GitHub Actions Gate
                            </button>
                            <button
                                type="button"
                                className={`sandbox-tab ${activeSolutionTab === "k8s" ? "active" : ""}`}
                                onClick={() => setActiveSolutionTab("k8s")}
                            >
                                <ShieldCheckIcon size={14} /> Kyverno K8s Policy
                            </button>
                        </div>
                    </div>

                    <div className="sandbox-code-card">
                        <div className="code-card-top">
                            <span className="code-file-name">
                                {activeSolutionTab === "cicd" ? ".github/workflows/chainproof-security-gate.yml" : "k8s/kyverno-enforce-chainproof.yaml"}
                            </span>
                            <button
                                type="button"
                                className="copy-code-btn"
                                onClick={() => handleCopy(activeSolutionTab === "cicd" ? pipelineSnippet : kyvernoSnippet, "sandbox")}
                            >
                                <CopyIcon size={13} /> {copiedIndex === "sandbox" ? "Copied to Clipboard!" : "Copy Configuration"}
                            </button>
                        </div>
                        <pre className="sandbox-code-pre">
                            <code>{activeSolutionTab === "cicd" ? pipelineSnippet : kyvernoSnippet}</code>
                        </pre>
                    </div>
                </section>

                {/* Enterprise Value Metrics */}
                <section className="solution-metrics-banner" aria-label="Business Impact">
                    <div className="roi-stat-item">
                        <strong className="roi-number">95%</strong>
                        <span className="roi-label">Vulnerability Reduction</span>
                        <p className="roi-desc">Via automated minimal base migration</p>
                    </div>
                    <div className="roi-stat-item">
                        <strong className="roi-number">100%</strong>
                        <span className="roi-label">Cryptographic Provenance</span>
                        <p className="roi-desc">Sigstore Cosign keyless attestation</p>
                    </div>
                    <div className="roi-stat-item">
                        <strong className="roi-number">&lt; 3s</strong>
                        <span className="roi-label">AI Decision Latency</span>
                        <p className="roi-desc">Real-time multi-signal risk correlation</p>
                    </div>
                    <div className="roi-stat-item">
                        <strong className="roi-number">0</strong>
                        <span className="roi-label">False Positive Trust</span>
                        <p className="roi-desc">Supervised RF + Isolation Forest ML</p>
                    </div>
                </section>

                {/* Bottom Call to Action */}
                <section className="solutions-bottom-cta">
                    <div className="bottom-cta-content">
                        <h2>Ready to Secure Your Container Pipeline?</h2>
                        <p>Experience continuous verification, ML risk intelligence, and automated AI security decisions.</p>
                        <div className="bottom-cta-buttons">
                            <button
                                type="button"
                                className="cta-button primary"
                                onClick={() => onRouteChange("scan")}
                            >
                                <LightningIcon size={16} /> Start Live Security Scan
                            </button>
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => onRouteChange("reports")}
                            >
                                <FileTextIcon size={16} /> View Audit Reports
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}

export default Solutions;
