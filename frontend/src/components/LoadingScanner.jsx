import { useState, useEffect } from "react";
import { DockerIcon, PackageIcon, ShieldIcon, KeyIcon, CpuIcon, LightningIcon, ShieldCheckIcon } from "./Icons";

const SCAN_STEPS = [
    { label: "Inspecting container image layers & metadata", Icon: DockerIcon },
    { label: "Generating Software Bill of Materials (Syft SBOM)", Icon: PackageIcon },
    { label: "Querying Docker Scout CVE vulnerability database", Icon: ShieldIcon },
    { label: "Verifying Sigstore Cosign cryptographic signatures", Icon: KeyIcon },
    { label: "Running Random Forest & Isolation Forest ML inference", Icon: CpuIcon },
    { label: "Synthesizing final supply-chain risk verdict", Icon: LightningIcon },
];

function LoadingScanner({ image }) {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentStepIndex((prev) => (prev < SCAN_STEPS.length - 1 ? prev + 1 : prev));
        }, 800);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="loading-scanner-card" aria-live="polite" aria-busy="true">
            <div className="scanner-radar">
                <div className="radar-circle"></div>
                <div className="radar-sweep"></div>
                <div className="radar-center-icon">
                    <ShieldCheckIcon size={32} className="radar-icon-svg" />
                </div>
            </div>

            <div className="loading-scanner-header">
                <h2>Analyzing Container Image</h2>
                <div className="target-image-badge">
                    <code>{image}</code>
                </div>
            </div>

            <div className="scanning-steps-list">
                {SCAN_STEPS.map((step, idx) => {
                    const isDone = idx < currentStepIndex;
                    const isCurrent = idx === currentStepIndex;
                    const StepIconComponent = step.Icon;

                    return (
                        <div 
                            key={idx} 
                            className={`scan-step-item ${isDone ? "done" : isCurrent ? "current" : "pending"}`}
                        >
                            <div className="step-icon-status">
                                {isDone ? (
                                    <span className="step-done-check">✓</span>
                                ) : isCurrent ? (
                                    <span className="step-spinner-icon"></span>
                                ) : (
                                    <span className="step-bullet">•</span>
                                )}
                            </div>
                            <span className="step-label">
                                <StepIconComponent size={16} />
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

export default LoadingScanner;
