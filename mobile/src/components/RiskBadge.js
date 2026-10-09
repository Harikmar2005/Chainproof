import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function RiskBadge({ severity, score, decision }) {
    const sev = (severity || "LOW").toUpperCase();
    const dec = (decision || (sev === "CRITICAL" ? "BLOCK" : sev === "LOW" ? "TRUST" : "REVIEW")).toUpperCase();

    let bgColor = "#10b98120";
    let textColor = "#10b981";
    let borderColor = "#10b98140";

    if (sev === "CRITICAL" || dec === "BLOCK") {
        bgColor = "#ef444420";
        textColor = "#ef4444";
        borderColor = "#ef444450";
    } else if (sev === "HIGH") {
        bgColor = "#f9731620";
        textColor = "#f97316";
        borderColor = "#f9731650";
    } else if (sev === "MEDIUM") {
        bgColor = "#eab30820";
        textColor = "#eab308";
        borderColor = "#eab30850";
    }

    return (
        <View style={[styles.badge, { backgroundColor: bgColor, borderColor: borderColor }]}>
            <Text style={[styles.text, { color: textColor }]}>
                {sev} {score !== undefined && `• ${score}/100`}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        borderWidth: 1,
        alignSelf: "flex-start",
    },
    text: {
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 0.5,
    }
});
