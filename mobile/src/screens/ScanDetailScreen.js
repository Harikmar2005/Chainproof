import React from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity
} from "react-native";
import RiskBadge from "../components/RiskBadge";

export default function ScanDetailScreen({ scan, onBack }) {
    if (!scan) return null;

    const docker = scan.docker || {};
    const sbom = scan.sbom || {};
    const vulns = scan.vulnerabilities || {};
    const sig = scan.signature || {};
    const ml = scan.ml || {};
    const ai = scan.ai_analysis || {};
    const findings = scan.findings || [];

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Header with Back button */}
            <TouchableOpacity style={styles.backBtn} onPress={onBack}>
                <Text style={styles.backBtnText}>← Back to Dashboard</Text>
            </TouchableOpacity>

            <View style={styles.titleCard}>
                <Text style={styles.imageName} numberOfLines={2}>{scan.image}</Text>
                <Text style={styles.scanId}>Scan ID: {scan.scan_id || scan.id}</Text>
                <View style={styles.badgeRow}>
                    <RiskBadge severity={scan.severity} score={scan.risk_score} decision={ai.security_decision} />
                    <Text style={styles.decisionText}>
                        Policy Decision: <Text style={{ fontWeight: "700", color: "#38bdf8" }}>{ai.security_decision || scan.verdict || "REVIEW"}</Text>
                    </Text>
                </View>
            </View>

            {/* AI Security Correlation & Assessment */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>AI Security Correlation Engine</Text>
                <Text style={styles.aiAssessment}>{ai.assessment || "CORRELATED SECURITY EVALUATION"}</Text>
                <Text style={styles.aiSummary}>{ai.summary || "Deterministic audit completed."}</Text>
                {ai.recommended_action ? (
                    <View style={styles.recommendationBox}>
                        <Text style={styles.recommendationLabel}>Actionable Recommendation:</Text>
                        <Text style={styles.recommendationText}>{ai.recommended_action}</Text>
                    </View>
                ) : null}
            </View>

            {/* Docker & Container Integrity */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Container Metadata</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Size:</Text>
                    <Text style={styles.value}>
                        {docker.size_bytes ? `${(docker.size_bytes / (1024 * 1024)).toFixed(1)} MB` : "N/A"}
                    </Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Layers:</Text>
                    <Text style={styles.value}>{docker.layers_count || 1}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Cosign Signature:</Text>
                    <Text style={[styles.value, { color: sig.verified ? "#10b981" : "#f59e0b" }]}>
                        {sig.verified ? "VERIFIED (Signed)" : "UNVERIFIED (Unsigned)"}
                    </Text>
                </View>
            </View>

            {/* Vulnerabilities Breakdown */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Vulnerability Scan (Docker Scout)</Text>
                <View style={styles.vulnStats}>
                    <View style={styles.vulnStatItem}>
                        <Text style={[styles.vulnStatNum, { color: "#ef4444" }]}>{vulns.critical || 0}</Text>
                        <Text style={styles.vulnStatLbl}>Critical</Text>
                    </View>
                    <View style={styles.vulnStatItem}>
                        <Text style={[styles.vulnStatNum, { color: "#f97316" }]}>{vulns.high || 0}</Text>
                        <Text style={styles.vulnStatLbl}>High</Text>
                    </View>
                    <View style={styles.vulnStatItem}>
                        <Text style={[styles.vulnStatNum, { color: "#eab308" }]}>{vulns.medium || 0}</Text>
                        <Text style={styles.vulnStatLbl}>Medium</Text>
                    </View>
                    <View style={styles.vulnStatItem}>
                        <Text style={[styles.vulnStatNum, { color: "#38bdf8" }]}>{vulns.low || 0}</Text>
                        <Text style={styles.vulnStatLbl}>Low</Text>
                    </View>
                </View>
            </View>

            {/* SBOM Summary */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Software Bill of Materials (Syft)</Text>
                <Text style={styles.textLight}>Indexed Packages: <Text style={{ color: "#f8fafc", fontWeight: "700" }}>{sbom.package_count || 0}</Text></Text>
                {sbom.packages && sbom.packages.length > 0 ? (
                    <View style={styles.packageList}>
                        {sbom.packages.slice(0, 5).map((pkg, i) => (
                            <Text key={i} style={styles.pkgItem} numberOfLines={1}>
                                • {pkg.name} ({pkg.version || "unknown"}) [{pkg.type || "pkg"}]
                            </Text>
                        ))}
                        {sbom.packages.length > 5 ? (
                            <Text style={styles.morePkg}>+ {sbom.packages.length - 5} more packages</Text>
                        ) : null}
                    </View>
                ) : null}
            </View>

            {/* ML Security Models */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Dual Machine Learning Inference</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Random Forest Prediction:</Text>
                    <Text style={styles.value}>{ml.random_forest?.prediction || "EVALUATED"}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>RF Confidence:</Text>
                    <Text style={styles.value}>
                        {ml.random_forest?.confidence ? `${(ml.random_forest.confidence * 100).toFixed(1)}%` : "N/A"}
                    </Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Isolation Forest Anomaly:</Text>
                    <Text style={[styles.value, { color: ml.anomaly_detection?.anomaly ? "#ef4444" : "#10b981" }]}>
                        {ml.anomaly_detection?.anomaly ? "ANOMALOUS PROFILE" : "NORMAL PROFILE"}
                    </Text>
                </View>
            </View>

            {/* Findings List */}
            {findings.length > 0 ? (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Security Findings ({findings.length})</Text>
                    {findings.map((f, idx) => (
                        <View key={idx} style={styles.findingRow}>
                            <Text style={[styles.findingSev, {
                                color: f.severity === "CRITICAL" ? "#ef4444" : f.severity === "HIGH" ? "#f97316" : "#eab308"
                            }]}>[{f.severity}]</Text>
                            <Text style={styles.findingMsg}>{f.message}</Text>
                        </View>
                    ))}
                </View>
            ) : null}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#080c14",
    },
    content: {
        padding: 16,
        paddingBottom: 40,
    },
    backBtn: {
        marginBottom: 12,
    },
    backBtnText: {
        color: "#38bdf8",
        fontSize: 14,
        fontWeight: "600",
    },
    titleCard: {
        backgroundColor: "#0f172a",
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#1e293b",
        marginBottom: 16,
    },
    imageName: {
        fontSize: 18,
        fontWeight: "800",
        color: "#f8fafc",
    },
    scanId: {
        fontSize: 11,
        color: "#64748b",
        marginTop: 4,
        marginBottom: 12,
    },
    badgeRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    decisionText: {
        fontSize: 12,
        color: "#94a3b8",
    },
    card: {
        backgroundColor: "#0f172a",
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#1e293b",
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#38bdf8",
        marginBottom: 10,
    },
    aiAssessment: {
        fontSize: 14,
        fontWeight: "700",
        color: "#f1f5f9",
        marginBottom: 4,
    },
    aiSummary: {
        fontSize: 13,
        color: "#cbd5e1",
        lineHeight: 18,
    },
    recommendationBox: {
        backgroundColor: "#1e293b",
        padding: 10,
        borderRadius: 8,
        marginTop: 10,
    },
    recommendationLabel: {
        fontSize: 11,
        fontWeight: "700",
        color: "#38bdf8",
        marginBottom: 2,
    },
    recommendationText: {
        fontSize: 12,
        color: "#f8fafc",
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 4,
    },
    label: {
        fontSize: 13,
        color: "#94a3b8",
    },
    value: {
        fontSize: 13,
        fontWeight: "600",
        color: "#f8fafc",
    },
    vulnStats: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginTop: 6,
    },
    vulnStatItem: {
        alignItems: "center",
    },
    vulnStatNum: {
        fontSize: 20,
        fontWeight: "800",
    },
    vulnStatLbl: {
        fontSize: 11,
        color: "#64748b",
        marginTop: 2,
    },
    textLight: {
        fontSize: 13,
        color: "#94a3b8",
        marginBottom: 6,
    },
    packageList: {
        backgroundColor: "#080c14",
        padding: 10,
        borderRadius: 8,
        marginTop: 6,
    },
    pkgItem: {
        fontSize: 12,
        color: "#cbd5e1",
        marginVertical: 2,
    },
    morePkg: {
        fontSize: 11,
        color: "#64748b",
        fontStyle: "italic",
        marginTop: 4,
    },
    findingRow: {
        flexDirection: "row",
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: "#1e293b",
    },
    findingSev: {
        fontSize: 12,
        fontWeight: "700",
        marginRight: 6,
    },
    findingMsg: {
        flex: 1,
        fontSize: 12,
        color: "#cbd5e1",
    }
});
