import React from "react";
import { View, Text, StyleSheet } from "react-native";

const StatusJobs: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Track your job applications here.</Text>
    </View>
  );
};

export default StatusJobs;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  text: {
    fontSize: 16,
    color: "#555",
  },
});
