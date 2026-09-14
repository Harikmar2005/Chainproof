function RiskBreakdown({ risk }) {
    if (!risk) {
        return null;
    }

    const breakdown = risk.score_breakdown || {};

    const items = [
        {
            label: "ML Base Score",
            value: Number(breakdown.ml_base_score || 0),
            type: "base",
        },
        {
            label: "Critical CVE Contribution",
            value: Number(breakdown.critical_cve_penalty || 0),
            type: "critical",
        },
        {
            label: "High CVE Contribution",
            value: Number(breakdown.high_cve_penalty || 0),
            type: "high",
        },
        {
            label: "Medium CVE Contribution",
            value: Number(breakdown.medium_cve_penalty || 0),
            type: "medium",
        },
        {
            label: "Low CVE Contribution",
            value: Number(breakdown.low_cve_penalty || 0),
            type: "low",
        },
        {
            label: "Signature Penalty",
            value: Number(breakdown.signature_penalty || 0),
            type: "signature",
        },
        {
            label: "Anomaly Penalty",
            value: Number(breakdown.anomaly_penalty || 0),
            type: "anomaly",
        },
    ];

    const maxValue = Math.max(
        ...items.map((item) => item.value),
        1
    );

    return (
        <section className="result-card risk-breakdown">

            <div className="section-heading">
                <div>
                    <h2>Risk Breakdown</h2>

                    <p>
                        How security signals contributed to the final risk score.
                    </p>
                </div>

                <div className="risk-breakdown-score">
                    <span>Final Risk</span>
                    <strong>{risk.risk_score ?? 0}</strong>
                </div>
            </div>


            <div className="breakdown-list">

                {items.map((item) => {

                    const width =
                        item.value === 0
                            ? 0
                            : Math.max((item.value / maxValue) * 100, 5);

                    return (
                        <div
                            className="breakdown-item"
                            key={item.label}
                        >

                            <div className="breakdown-label">

                                <span>
                                    {item.label}
                                </span>

                                <strong>
                                    +{item.value}
                                </strong>

                            </div>

                            <div className="breakdown-bar">

                                <div
                                    className={`breakdown-fill ${item.type}`}
                                    style={{
                                        width: `${width}%`,
                                    }}
                                />

                            </div>

                        </div>
                    );
                })}

            </div>


            <div className="risk-explanation">

                <strong>
                    AI Decision
                </strong>

                <p>
                    Random Forest classified this image as{" "}
                    <strong>
                        {risk.ml_prediction || "UNKNOWN"}
                    </strong>{" "}
                    with{" "}
                    <strong>
                        {((risk.ml_confidence || 0) * 100).toFixed(0)}%
                    </strong>{" "}
                    confidence.

                    {risk.anomaly_detected && (
                        <>
                            {" "}
                            Isolation Forest also detected an unusual
                            security profile.
                        </>
                    )}
                </p>

            </div>

        </section>
    );
}

export default RiskBreakdown;