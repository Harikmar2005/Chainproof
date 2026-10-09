import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl
} from "react-native";
import { MobileAPI } from "../services/api";

export default function AlertsScreen() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState("ALL");

    const loadData = async () => {
        try {
            const data = await MobileAPI.getNotifications();
            setNotifications(Array.isArray(data) ? data : []);
        } catch (err) {
            console.warn("Failed to load notifications:", err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filtered = notifications.filter((n) => {
        if (filter === "ALL") return true;
        return (n.severity || "").toUpperCase() === filter;
    });

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor="#38bdf8" />}
        >
            <View style={styles.header}>
                <Text style={styles.title}>Security Alerts & Feed</Text>
                <Text style={styles.subtitle}>Critical policy blocks, vulnerability discoveries, and audit alerts</Text>
            </View>

            {/* Filter buttons */}
            <View style={styles.filterRow}>
                {["ALL", "CRITICAL", "HIGH", "INFO"].map((f) => (
                    <TouchableOpacity
                        key={f}
                        style={[styles.filterChip, filter === f && styles.chipActive]}
                        onPress={() => setFilter(f)}
                    >
                        <Text style={[styles.filterText, filter === f && styles.textActive]}>{f}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#38bdf8" style={{ marginTop: 30 }} />
            ) : filtered.length === 0 ? (
                <Text style={styles.empty}>No alerts matching filter.</Text>
            ) : (
                filtered.map((item) => {
                    const sev = (item.severity || "INFO").toUpperCase();
                    let borderColor = "#1e293b";
                    let badgeColor = "#38bdf8";
                    if (sev === "CRITICAL") {
                        borderColor = "#ef444460";
                        badgeColor = "#ef4444";
                    } else if (sev === "HIGH") {
                        borderColor = "#f9731660";
                        badgeColor = "#f97316";
                    }

                    return (
                        <View key={item.id} style={[styles.card, { borderColor: borderColor }]}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>{item.title}</Text>
                                <Text style={[styles.sevBadge, { color: badgeColor }]}>{sev}</Text>
                            </View>
                            <Text style={styles.cardMessage}>{item.message}</Text>
                            <View style={styles.cardFooter}>
                                <Text style={styles.channelText}>Channel: {item.channel || "SYSTEM"}</Text>
                                <Text style={styles.timeText}>{item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : "Recent"}</Text>
                            </View>
                        </View>
                    );
                })
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
        marginBottom: 14,
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
    filterRow: {
        flexDirection: "row",
        marginBottom: 14,
    },
    filterChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: "#0f172a",
        marginRight: 8,
        borderWidth: 1,
        borderColor: "#1e293b",
    },
    chipActive: {
        backgroundColor: "#0284c7",
        borderColor: "#38bdf8",
    },
    filterText: {
        color: "#94a3b8",
        fontSize: 11,
        fontWeight: "700",
    },
    textActive: {
        color: "#ffffff",
    },
    card: {
        backgroundColor: "#0f172a",
        borderRadius: 10,
        borderWidth: 1,
        padding: 14,
        marginBottom: 10,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 6,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#f8fafc",
        flex: 1,
        marginRight: 8,
    },
    sevBadge: {
        fontSize: 11,
        fontWeight: "800",
    },
    cardMessage: {
        fontSize: 13,
        color: "#cbd5e1",
        lineHeight: 18,
    },
    cardFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 10,
        borderTopWidth: 1,
        borderTopColor: "#1e293b",
        paddingTop: 8,
    },
    channelText: {
        fontSize: 11,
        color: "#64748b",
    },
    timeText: {
        fontSize: 11,
        color: "#64748b",
    },
    empty: {
        color: "#64748b",
        fontStyle: "italic",
        marginTop: 20,
    }
});
