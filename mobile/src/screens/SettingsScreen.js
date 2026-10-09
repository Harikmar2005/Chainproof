import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert
} from "react-native";
import { MobileAPI, getApiUrl, setApiUrl } from "../services/api";

export default function SettingsScreen() {
    const [endpoint, setEndpoint] = useState(getApiUrl());
    const [testing, setTesting] = useState(false);
    const [healthStatus, setHealthStatus] = useState(null);
    const [deviceToken, setDeviceToken] = useState("expo-simulated-device-token-01");
    const [registering, setRegistering] = useState(false);

    const testConnection = async () => {
        setTesting(true);
        setHealthStatus(null);
        try {
            setApiUrl(endpoint);
            const res = await MobileAPI.checkHealth();
            setHealthStatus(res);
            Alert.alert("Connection Successful", `ChainProof API status: ${res.status.toUpperCase()}`);
        } catch (err) {
            Alert.alert("Connection Error", `Could not reach ${endpoint}: ${err.message}`);
        } finally {
            setTesting(false);
        }
    };

    const handleRegisterDevice = async () => {
        if (!deviceToken.trim()) return;
        setRegistering(true);
        try {
            await MobileAPI.registerDevice(deviceToken.trim(), "Mobile SecOps Client", "MOBILE");
            Alert.alert("Device Registered", "This mobile client is now registered for real-time push security alerts.");
        } catch (err) {
            Alert.alert("Registration Failed", err.message);
        } finally {
            setRegistering(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Text style={styles.title}>Mobile Client Settings</Text>
                <Text style={styles.subtitle}>Cloud API Endpoints, Push Notifications, and Scanner Diagnostics</Text>
            </View>

            {/* Cloud Endpoint Config */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>ChainProof Cloud Security API</Text>
                <Text style={styles.cardDesc}>Enter your production VPS or VM API endpoint (HTTPS)</Text>
                <TextInput
                    style={styles.input}
                    value={endpoint}
                    onChangeText={setEndpoint}
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder="https://api.yourdomain.com/api/v1"
                    placeholderTextColor="#64748b"
                />
                <TouchableOpacity
                    style={[styles.btn, testing && styles.btnDisabled]}
                    onPress={testConnection}
                    disabled={testing}
                >
                    {testing ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.btnText}>Test Connection</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Health diagnostics */}
            {healthStatus ? (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Cloud Scanner Diagnostics</Text>
                    <View style={styles.diagRow}>
                        <Text style={styles.diagLbl}>Docker Daemon:</Text>
                        <Text style={[styles.diagVal, { color: healthStatus.components?.docker_engine?.connected ? "#10b981" : "#ef4444" }]}>
                            {healthStatus.components?.docker_engine?.connected ? "CONNECTED" : "OFFLINE"}
                        </Text>
                    </View>
                    <View style={styles.diagRow}>
                        <Text style={styles.diagLbl}>Syft SBOM:</Text>
                        <Text style={[styles.diagVal, { color: healthStatus.components?.syft_sbom?.available ? "#10b981" : "#ef4444" }]}>
                            {healthStatus.components?.syft_sbom?.available ? "AVAILABLE" : "MISSING"}
                        </Text>
                    </View>
                    <View style={styles.diagRow}>
                        <Text style={styles.diagLbl}>Docker Scout:</Text>
                        <Text style={[styles.diagVal, { color: healthStatus.components?.docker_scout?.available ? "#10b981" : "#f59e0b" }]}>
                            {healthStatus.components?.docker_scout?.available ? "AVAILABLE" : "UNAVAILABLE"}
                        </Text>
                    </View>
                    <View style={styles.diagRow}>
                        <Text style={styles.diagLbl}>Cosign Signature:</Text>
                        <Text style={[styles.diagVal, { color: healthStatus.components?.cosign_signature?.available ? "#10b981" : "#f59e0b" }]}>
                            {healthStatus.components?.cosign_signature?.available ? "AVAILABLE" : "UNAVAILABLE"}
                        </Text>
                    </View>
                    <View style={styles.diagRow}>
                        <Text style={styles.diagLbl}>Random Forest & IF:</Text>
                        <Text style={[styles.diagVal, { color: "#10b981" }]}>LOADED</Text>
                    </View>
                </View>
            ) : null}

            {/* Push Registration */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Mobile Push Alert Registration</Text>
                <Text style={styles.cardDesc}>Register Expo / FCM push token for instantaneous threat alerts</Text>
                <TextInput
                    style={styles.input}
                    value={deviceToken}
                    onChangeText={setDeviceToken}
                    placeholder="Push token..."
                    placeholderTextColor="#64748b"
                />
                <TouchableOpacity
                    style={[styles.btnSecondary, registering && styles.btnDisabled]}
                    onPress={handleRegisterDevice}
                    disabled={registering}
                >
                    {registering ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.btnSecondaryText}>Register Device Token</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Architecture note */}
            <View style={[styles.card, { borderColor: "#0284c750" }]}>
                <Text style={[styles.cardTitle, { color: "#38bdf8" }]}>Mobile Architecture</Text>
                <Text style={styles.cardDesc}>
                    Mobile operates purely as a monitoring, notification, and control client.
                    Docker, Syft, and Scout run exclusively on the Linux Scanner VM or Desktop Agent.
                </Text>
            </View>
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
    card: {
        backgroundColor: "#0f172a",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#1e293b",
        padding: 16,
        marginBottom: 14,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#f8fafc",
    },
    cardDesc: {
        fontSize: 12,
        color: "#64748b",
        marginTop: 2,
        marginBottom: 12,
    },
    input: {
        backgroundColor: "#1e293b",
        color: "#f8fafc",
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
        fontSize: 13,
        marginBottom: 10,
    },
    btn: {
        backgroundColor: "#0284c7",
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: "center",
    },
    btnSecondary: {
        backgroundColor: "#1e293b",
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#334155",
    },
    btnDisabled: {
        opacity: 0.6,
    },
    btnText: {
        color: "#ffffff",
        fontWeight: "700",
        fontSize: 14,
    },
    btnSecondaryText: {
        color: "#38bdf8",
        fontWeight: "700",
        fontSize: 14,
    },
    diagRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 4,
    },
    diagLbl: {
        fontSize: 13,
        color: "#94a3b8",
    },
    diagVal: {
        fontSize: 13,
        fontWeight: "700",
    }
});
