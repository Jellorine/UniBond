import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Project_titlebox from "./Project_titlebox"; // Import the Project_titlebox component
import Project_status from "./Project_status"; // Import the Project_status component
import Saved_project from "./Saved_project"; // Import the Saved_project component

const TABS = ["Available", "Saved", "Status"];

export default function ProjectConditionBar() {
  const [activeTab, setActiveTab] = useState<string>("Available");

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.7}
            accessibilityLabel={`Switch to ${tab} tab`}
          >
            <Ionicons
              name={
                tab === "Available"
                  ? "person"
                  : tab === "Saved"
                    ? "bookmark"
                    : "time"
              }
              size={24}
              color={activeTab === tab ? "#2C3036" : "#8E8E93"}
            />
            <Text
              style={[styles.tabText, activeTab === tab && styles.activeText]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Display Content Based on Active Tab */}
      <View style={styles.content}>
        {activeTab === "Available" && <Project_titlebox />}
        {activeTab === "Saved" && <Saved_project />}
        {activeTab === "Status" && <Project_status />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: "#f9f9f9",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tab: {
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  activeTab: {
    backgroundColor: "#fff",
  },
  tabText: {
    fontSize: 14,
    color: "#8E8E93",
    marginTop: 5,
    fontWeight: "500",
  },
  activeText: {
    color: "#2C3036",
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
});
