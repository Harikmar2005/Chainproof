import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    RefreshControl
} from "react-native";
import { MobileAPI } from "../services/api";
import RiskBadge from "../components/RiskBadge";

export default function MonitoredImagesScreen() {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [newImage, setNewImage] = useState("");
    const [adding, setAdding] = useState(false);

    const loadData = async () => {
        try {
            const data = await MobileAPI.getMonitoredImages();
            setImages(Array.isArray(data) ? data : []);
        } catch (err) {
            console.warn("Failed to load monitored images:", err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleAdd = async () => {
        const trimmed = newImage.trim();
        if (!trimmed) return;
        setAdding(true);
        try {
            await MobileAPI.addMonitoredImage({ image: trimmed });
            setNewImage("");
            loadData();
        } catch (err) {
            Alert.alert("Registration Failed", err.message);
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (id, name) => {
        try {
            await MobileAPI.deleteMonitoredImage(id);
            loadData();
        } catch (err) {
            Alert.alert("Deletion Failed", err.message);
        }
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor="#38bdf8" />}
        >
            <View style={styles.header}>
                <Text style={styles.title}>Monitored Repositories</Text>
                <Text style={styles.subtitle}>Continuous Registry Watch & Automated CVE Re-scans</Text>
            </View>

            {/* Add Image */}
            <View style={styles.addCard}>
                <Text style={styles.addTitle}>Monitor New Container</Text>
                <View style={styles.addRow}>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. ghcr.io/org/repo:latest"
                        placeholderTextColor="#64748b"
                        value={newImage}
                        onChangeText={setNewImage}
                        autoCapitalize="none"
                    />
                    <TouchableOpacity
                        style={[styles.addBtn, adding && styles.btnDisabled]}
                        onPress={handleAdd}
                        disabled={adding}
                    >
                        {adding ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.addBtnText}>+ Add</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Monitored List */}
            {loading ? (
                <ActivityIndicator size="large" color="#38bdf8" style={{ marginTop: 30 }} />
            ) : images.length === 0 ? (
                <Text style={styles.empty}>No images currently monitored.</Text>
            ) : (
                images.map((item) => (
                    <View key={item.id || item.image} style={styles.card}>
                        <View style={styles.cardMain}>
                            <Text style={styles.imageName} numberOfLines={1}>{item.image}</Text>
                            <Text style={styles.scannedTime}>
                                Last audit: {item.last_scanned ? new Date(item.last_scanned).toLocaleDateString() : "Pending"}
                            </Text>
                            {item.risk_score !== null && item.risk_score !== undefined ? (
                                <View style={{ marginTop: 6 }}>
                                    <RiskBadge severity={item.severity} score={item.risk_score} decision={item.decision} />
                                </View>
                            ) : null}
                        </View>
                        <TouchableOpacity
                            style={styles.removeBtn}
                            onPress={() => handleDelete(item.id, item.image)}
                        >
                            <Text style={styles.removeText}>✕</Text>
                        </TouchableOpacity>
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
    addCard: {
        backgroundColor: "#0f172a",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#1e293b",
        padding: 14,
        marginBottom: 16,
    },
    addTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#f1f5f9",
        marginBottom: 8,
    },
    addRow: {
        flexDirection: "row",
    },
    input: {
        flex: 1,
        backgroundColor: "#1e293b",
        color: "#f8fafc",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        fontSize: 13,
        marginRight: 8,
    },
    addBtn: {
        backgroundColor: "#0284c7",
        paddingHorizontal: 14,
        justifyContent: "center",
        borderRadius: 6,
    },
    btnDisabled: {
        opacity: 0.6,
    },
    addBtnText: {
        color: "#ffffff",
        fontWeight: "700",
        fontSize: 13,
    },
    card: {
        backgroundColor: "#0f172a",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#1e293b",
        padding: 14,
        marginBottom: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    cardMain: {
        flex: 1,
        marginRight: 10,
    },
    imageName: {
        fontSize: 14,
        fontWeight: "700",
        color: "#f8fafc",
    },
    scannedTime: {
        fontSize: 11,
        color: "#64748b",
        marginTop: 2,
    },
    removeBtn: {
        padding: 8,
    },
    removeText: {
        color: "#64748b",
        fontSize: 16,
        fontWeight: "700",
    },
    empty: {
        color: "#64748b",
        fontStyle: "italic",
        marginTop: 20,
    }
});
