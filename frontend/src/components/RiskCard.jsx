function RiskCard({ result }) {
    if (!result) {
        return (
            <section className="result-card risk-result">
                <h2>Security Risk</h2>

                <div className="risk-score">
                    —
                </div>

                <div className="risk-severity">
                    No Scan
                </div>

                <div className="risk-verdict">
                    Run a container scan to analyze the image.
                </div>
            </section>
        );
    }

    const score = result.risk_score ?? 0;
    const severity = result.severity || "UNKNOWN";
    const verdict = result.verdict || "UNKNOWN";

    return (
        <section className="result-card risk-result">

            <h2>Security Risk</h2>

            <div className="risk-score">
                {score}
            </div>

            <div className="risk-severity">
                {severity}
            </div>

            <div className="risk-verdict">
                {verdict}
            </div>

        </section>
    );
}

export default RiskCard;