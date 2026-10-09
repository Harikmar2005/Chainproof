import React, { useState } from "react";
import {
    SafeAreaView,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar
} from "react-native";
import DashboardScreen from "./src/screens/DashboardScreen";
import ScanDetailScreen from "./src/screens/ScanDetailScreen";
import AutomationsScreen from "./src/screens/AutomationsScreen";
import MonitoredImagesScreen from "./src/screens/MonitoredImagesScreen";
import AlertsScreen from "./src/screens/AlertsScreen";
import SettingsScreen from "./src/screens/SettingsScreen";

export default function App() {
    const [currentTab, setCurrentTab] = useState("dashboard");
    const [selectedScan, setSelectedScan] = useState(null);

    const renderScreen = () => {
        if (selectedScan) {
            return (
                <ScanDetailScreen
                    scan={selectedScan}
                    onBack={() => setSelectedScan(null)}
                />
            );
        }

        switch (currentTab) {
            case "dashboard":
                return <DashboardScreen onSelectScan={(scan) => setSelectedScan(scan)} />;
            case "automations":
                return <AutomationsScreen />;
            case "monitored":
                return <MonitoredImagesScreen />;
            case "alerts":
                return <AlertsScreen />;
            case "settings":
                return <SettingsScreen />;
            default:
                return <DashboardScreen onSelectScan={(scan) => setSelectedScan(scan)} />;
        }
    };

    const handleTabPress = (tab) => {
        setSelectedScan(null);
        setCurrentTab(tab);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#080c14" />
            
            {/* Main Active View */}
            <View style={styles.container}>
                {renderScreen()}
            </View>

            {/* Bottom Tab Bar */}
            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={[styles.tabItem, currentTab === "dashboard" && !selectedScan && styles.tabActive]}
                    onPress={() => handleTabPress("dashboard")}
                >
                    <Text style={[styles.tabText, currentTab === "dashboard" && !selectedScan && styles.tabTextActive]}>
                        📊 Dashboard
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tabItem, currentTab === "automations" && styles.tabActive]}
                    onPress={() => handleTabPress("automations")}
                >
                    <Text style={[styles.tabText, currentTab === "automations" && styles.tabTextActive]}>
                        ⚙️ Automations
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tabItem, currentTab === "monitored" && styles.tabActive]}
                    onPress={() => handleTabPress("monitored")}
                >
                    <Text style={[styles.tabText, currentTab === "monitored" && styles.tabTextActive]}>
                        🔭 Monitored
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tabItem, currentTab === "alerts" && styles.tabActive]}
                    onPress={() => handleTabPress("alerts")}
                >
                    <Text style={[styles.tabText, currentTab === "alerts" && styles.tabTextActive]}>
                        🔔 Alerts
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tabItem, currentTab === "settings" && styles.tabActive]}
                    onPress={() => handleTabPress("settings")}
                >
                    <Text style={[styles.tabText, currentTab === "settings" && styles.tabTextActive]}>
                        🛠️ Settings
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#080c14",
    },
    container: {
        flex: 1,
    },
    tabBar: {
        flexDirection: "row",
        backgroundColor: "#0f172a",
        borderTopWidth: 1,
        borderTopColor: "#1e293b",
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    tabItem: {
        flex: 1,
        alignItems: "center",
        paddingVertical: 6,
        borderRadius: 8,
    },
    tabActive: {
        backgroundColor: "#1e293b",
    },
    tabText: {
        fontSize: 10,
        fontWeight: "600",
        color: "#64748b",
    },
    tabTextActive: {
        color: "#38bdf8",
        fontWeight: "700",
    }
});
