import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    RefreshControl
} from "react-native";
import { MobileAPI } from "../services/api";

export default function AutomationsScreen() {
    const [automations, setAutomations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [runningId, setRunningId] = useState(null);

    const loadData = async () => {
        try {
            const data = await MobileAPI.getAutomations();
            setAutomations(Array.isArray(data) ? data : []);
        } catch (err) {
            console.warn("Failed to load automations:", err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleRun = async (id, name) => {
        setRunningId(id);
        try {
            const res = await MobileAPI.runAutomation(id);
            Alert.alert(
                "Automation Triggered",
                `Successfully queued execution for '${name}'. ${res.jobs_triggered || 1} job(s) dispatched to scanner.`
            );
            loadData();
        } catch (err) {
            Alert.alert("Execution Failed", err.message);
        } finally {
            setRunningId(null);
        }
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor="#38bdf8" />}
        >
            <View style={styles.header}>
                <Text style={styles.title}>Automations & Schedulers</Text>
                <Text style={styles.subtitle}>Scheduled Audits, Registry Listeners, and CI/CD Gates</Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#38bdf8" style={{ marginTop: 30 }} />
            ) : automations.length === 0 ? (
                <Text style={styles.empty}>No automation rules configured.</Text>
            ) : (
                automations.map((item) => (
                    <View key={item.id} style={styles.card}>
                        <View style={styles.cardTop}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.ruleName}>{item.name}</Text>
                                <View style={styles.triggerBadge}>
                                    <Text style={styles.triggerText}>{item.trigger}</Text>
                                </View>
                            </View>
                            <Text style={styles.targetsText}>
                                Targets: <Text style={{ color: "#f8fafc" }}>
                                    {(item.targets && item.targets.join(", ")) || item.target || "All"}
                                </Text>
                            </Text>
                            {item.schedule ? (
                                <Text style={styles.scheduleText}>Schedule: {item.schedule} UTC</Text>
                            ) : null}
                        </View>

                        <View style={styles.cardBottom}>
                            <Text style={styles.runCount}>Runs: {item.run_count || 0}</Text>
                            <TouchableOpacity
                                style={[styles.runBtn, runningId === item.id && styles.btnDisabled]}
                                onPress={() => handleRun(item.id, item.name)}
                                disabled={runningId === item.id}
                            >
                                {runningId === item.id ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.runBtnText}>Run Now</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                ))
            )}
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
    header: {
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: "800",
        color: "#f8fafc",
    },
    subtitle: {
        fontSize: 12,
        color: "#94a3b8",
        marginTop: 2,
    },
    empty: {
        color: "#64748b",
        fontStyle: "italic",
        marginTop: 20,
    },
    card: {
        backgroundColor: "#0f172a",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#1e293b",
        padding: 14,
        marginBottom: 12,
    },
    cardTop: {
        marginBottom: 10,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 6,
    },
    ruleName: {
        fontSize: 15,
        fontWeight: "700",
        color: "#f8fafc",
        flex: 1,
        marginRight: 8,
    },
    triggerBadge: {
        backgroundColor: "#0284c725",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: "#0284c750",
    },
    triggerText: {
        color: "#38bdf8",
        fontSize: 10,
        fontWeight: "700",
    },
    targetsText: {
        fontSize: 12,
        color: "#94a3b8",
        marginTop: 4,
    },
    scheduleText: {
        fontSize: 11,
        color: "#64748b",
        marginTop: 2,
    },
    cardBottom: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderTopWidth: 1,
        borderTopColor: "#1e293b",
        paddingTop: 10,
    },
    runCount: {
        fontSize: 12,
        color: "#64748b",
    },
    runBtn: {
        backgroundColor: "#0284c7",
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 6,
    },
    btnDisabled: {
        opacity: 0.6,
    },
    runBtnText: {
        color: "#ffffff",
        fontSize: 12,
        fontWeight: "700",
    }
});
