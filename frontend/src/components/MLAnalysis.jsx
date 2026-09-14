function MLAnalysis({ ml }) {
    if (!ml) {
        return null;
    }

    const randomForest = ml.random_forest;
    const anomaly = ml.anomaly_detection;

    return (
        <section className="result-card">
            <h2>AI Security Analysis</h2>

            <div className="ml-section">

                {/* Random Forest */}
                <div className="ml-card">
                    <h3>Random Forest</h3>

                    <div className="ml-row">
                        <span>Prediction</span>
                        <strong>
                            {randomForest?.prediction || "N/A"}
                        </strong>
                    </div>

                    <div className="ml-row">
                        <span>Confidence</span>
                        <strong>
                            {randomForest
                                ? `${(randomForest.confidence * 100).toFixed(0)}%`
                                : "N/A"}
                        </strong>
                    </div>

                    <div className="ml-row">
                        <span>Model Status</span>
                        <strong>
                            {randomForest?.model_loaded
                                ? "Loaded"
                                : "Not Loaded"}
                        </strong>
                    </div>
                </div>

                {/* Isolation Forest */}
                <div className="ml-card">
                    <h3>Isolation Forest</h3>

                    <div className="ml-row">
                        <span>Anomaly</span>
                        <strong>
                            {anomaly?.anomaly
                                ? "Detected"
                                : "Normal"}
                        </strong>
                    </div>

                    <div className="ml-row">
                        <span>Anomaly Score</span>
                        <strong>
                            {anomaly?.score ?? "N/A"}
                        </strong>
                    </div>

                    <div className="ml-row">
                        <span>Model Status</span>
                        <strong>
                            {anomaly?.model_loaded
                                ? "Loaded"
                                : "Not Loaded"}
                        </strong>
                    </div>
                </div>

            </div>
        </section>
    );
}

export default MLAnalysis;