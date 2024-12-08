import React from "react";
import { View, Text, StyleSheet } from "react-native";

const SavedJobs: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Your saved jobs will appear here.</Text>
    </View>
  );
};

export default SavedJobs;

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
