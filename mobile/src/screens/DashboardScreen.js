import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    RefreshControl
} from "react-native";
import { MobileAPI } from "../services/api";
import RiskBadge from "../components/RiskBadge";

export default function DashboardScreen({ onSelectScan, onTriggerScan }) {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [quickInput, setQuickInput] = useState("");
    const [scanning, setScanning] = useState(false);
    const [scanError, setScanError] = useState("");

    const loadData = async () => {
        try {
            const data = await MobileAPI.getReports();
            setReports(Array.isArray(data) ? data : []);
        } catch (err) {
            console.warn("Failed to load reports:", err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const handleQuickScan = async () => {
        const trimmed = quickInput.trim();
        if (!trimmed) return;
        setScanning(true);
        setScanError("");
        try {
            const result = await MobileAPI.triggerScan(trimmed);
            setQuickInput("");
            loadData();
            if (onSelectScan) onSelectScan(result);
        } catch (err) {
            setScanError(err.message || "Scan failed.");
        } finally {
            setScanning(false);
        }
    };

    // Metrics calculations
    const totalScans = reports.length;
    let criticalCount = 0;
    let totalCves = 0;
    let avgScore = 0;
    let scoreSum = 0;

    reports.forEach((r) => {
        const sev = (r.severity || "LOW").toUpperCase();
        if (sev === "CRITICAL") criticalCount++;
        totalCves += (r.vulnerabilities?.total || 0);
        scoreSum += (r.risk_score || 0);
    });
    if (totalScans > 0) avgScore = Math.round(scoreSum / totalScans);

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" />}
        >
            <View style={styles.header}>
                <Text style={styles.platformTitle}>CHAINPROOF CLOUD</Text>
                <Text style={styles.headerSubtitle}>Supply-Chain Security & Risk Posture</Text>
            </View>

            {/* Metrics Row */}
            <View style={styles.metricsGrid}>
                <View style={styles.metricCard}>
                    <Text style={styles.metricNumber}>{totalScans}</Text>
                    <Text style={styles.metricLabel}>Total Scans</Text>
                </View>
                <View style={[styles.metricCard, { borderColor: "#ef444450" }]}>
                    <Text style={[styles.metricNumber, { color: "#ef4444" }]}>{criticalCount}</Text>
                    <Text style={styles.metricLabel}>Critical Images</Text>
                </View>
                <View style={styles.metricCard}>
                    <Text style={[styles.metricNumber, { color: "#f97316" }]}>{totalCves}</Text>
                    <Text style={styles.metricLabel}>Total CVEs</Text>
                </View>
                <View style={styles.metricCard}>
                    <Text style={[styles.metricNumber, { color: "#38bdf8" }]}>{avgScore}/100</Text>
                    <Text style={styles.metricLabel}>Avg Risk</Text>
                </View>
            </View>

            {/* Quick Scan Input */}
            <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Trigger Container Scan</Text>
                <Text style={styles.sectionDesc}>Request cloud execution on real Docker daemon</Text>
                <View style={styles.scanInputRow}>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. alpine:latest, nginx:alpine"
                        placeholderTextColor="#64748b"
                        value={quickInput}
                        onChangeText={setQuickInput}
                        autoCapitalize="none"
                    />
                    <TouchableOpacity
                        style={[styles.scanBtn, scanning && styles.btnDisabled]}
                        onPress={handleQuickScan}
                        disabled={scanning}
                    >
                        {scanning ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.scanBtnText}>Scan</Text>
                        )}
                    </TouchableOpacity>
                </View>
                {scanError ? <Text style={styles.errorText}>{scanError}</Text> : null}
            </View>

            {/* Recent Scans List */}
            <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Recent Container Audits</Text>
                {loading ? (
                    <ActivityIndicator size="large" color="#38bdf8" style={{ marginVertical: 20 }} />
                ) : reports.length === 0 ? (
                    <Text style={styles.emptyText}>No historical scans recorded yet.</Text>
                ) : (
                    reports.slice(0, 10).map((item, idx) => (
                        <TouchableOpacity
                            key={item.scan_id || idx}
                            style={styles.scanItem}
                            onPress={() => onSelectScan && onSelectScan(item)}
                        >
                            <View style={styles.itemMain}>
                                <Text style={styles.itemImage} numberOfLines={1}>{item.image}</Text>
                                <Text style={styles.itemDate}>{item.timestamp || "Recent"}</Text>
                            </View>
                            <RiskBadge
                                severity={item.severity}
                                score={item.risk_score}
                                decision={item.ai_analysis?.security_decision}
                            />
                        </TouchableOpacity>
                    ))
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#080c14",
    },
    contentContainer: {
        padding: 16,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 16,
    },
    platformTitle: {
        fontSize: 22,
        fontWeight: "900",
        color: "#38bdf8",
        letterSpacing: 1.5,
    },
    headerSubtitle: {
        fontSize: 13,
        color: "#94a3b8",
        marginTop: 2,
    },
    metricsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    metricCard: {
        width: "48%",
        backgroundColor: "#0f172a",
        padding: 14,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#1e293b",
        marginBottom: 10,
    },
    metricNumber: {
        fontSize: 24,
        fontWeight: "800",
        color: "#f8fafc",
    },
    metricLabel: {
        fontSize: 12,
        color: "#64748b",
        marginTop: 4,
    },
    sectionCard: {
        backgroundColor: "#0f172a",
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#1e293b",
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#f1f5f9",
    },
    sectionDesc: {
        fontSize: 12,
        color: "#64748b",
        marginBottom: 12,
        marginTop: 2,
    },
    scanInputRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    input: {
        flex: 1,
        backgroundColor: "#1e293b",
        color: "#f8fafc",
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
        fontSize: 14,
        marginRight: 8,
    },
    scanBtn: {
        backgroundColor: "#0284c7",
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 8,
    },
    btnDisabled: {
        opacity: 0.6,
    },
    scanBtnText: {
        color: "#ffffff",
        fontWeight: "700",
        fontSize: 14,
    },
    errorText: {
        color: "#ef4444",
        fontSize: 12,
        marginTop: 8,
    },
    scanItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#1e293b",
    },
    itemMain: {
        flex: 1,
        marginRight: 10,
    },
    itemImage: {
        fontSize: 14,
        fontWeight: "600",
        color: "#f8fafc",
    },
    itemDate: {
        fontSize: 11,
        color: "#64748b",
        marginTop: 2,
    },
    emptyText: {
        color: "#64748b",
        fontStyle: "italic",
        marginVertical: 10,
    }
});
