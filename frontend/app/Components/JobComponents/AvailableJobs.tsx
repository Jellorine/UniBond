import React from "react";
import { View, Text, StyleSheet, ScrollView, Button } from "react-native";

interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  level: string;
  time: string;
  skills: string[];
}

interface AvailableJobsProps {
  jobListings: JobListing[];
}

const AvailableJobs: React.FC<AvailableJobsProps> = ({ jobListings }) => {
  return (
    <ScrollView style={styles.container}>
      {jobListings.map((job) => (
        <View key={job.id} style={styles.jobCard}>
          <Text style={styles.jobTitle}>{job.title}</Text>
          <Text style={styles.jobCompany}>{job.company}</Text>
          <Text style={styles.jobLocation}>{job.location}</Text>
          <Text style={styles.jobDetails}>
            {job.type} - {job.level} - {job.time}
          </Text>
          <Text style={styles.jobSkills}>
            Skills: {job.skills.join(", ")}
          </Text>
          <Button title="Save" onPress={() => alert(`Saved ${job.title}`)} />
        </View>
      ))}
    </ScrollView>
  );
};

export default AvailableJobs;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  jobCard: {
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  jobCompany: {
    fontSize: 16,
    color: "#555",
  },
  jobLocation: {
    fontSize: 14,
    color: "#777",
  },
  jobDetails: {
    fontSize: 14,
    color: "#888",
    marginVertical: 5,
  },
  jobSkills: {
    fontSize: 14,
    color: "#999",
    marginBottom: 10,
  },
});
