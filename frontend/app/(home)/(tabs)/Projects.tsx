import * as React from "react";
import { Text, View, StyleSheet, SafeAreaView } from "react-native";
import Project_topbar from "../../Components/Project_topbar";
import Project_conditionbar from "../../Components/Project_conditionbar";
//import Project_titlebox from "../../Components/Project_titlebox";

const Projects = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* <Text>Projects</Text> */}
        <Project_topbar />
        <Project_conditionbar />
        {/* <Project_titlebox /> */}
      </View>
    </SafeAreaView>
  );
};

export default Projects;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea:{
    flex: 1,
    paddingHorizontal: 16,
  },
}
);
