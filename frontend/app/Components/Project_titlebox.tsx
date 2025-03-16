import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { supabase } from "../lib/supabse";

interface ProjectData {
  project_id: number;
  user_id: string;
  user_name: string;
  project_title: string;
  location: string;
  date_posted: string;
  project_status: string;
  skills: string;
  is_saved: boolean;
  is_applied: boolean;
  time_posted: string;
  avatar_url?: string; // Add avatar_url to the interface
}

interface ProfileData {
  id: string;
  avatar_url: string;
}

export default function ProjectTitleBox() {
  const [projectData, setProjectData] = useState<ProjectData[]>([]);
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [loading, setLoading] = useState(true);

  // Function to fetch project data and profiles
  const fetchData = async () => {
    try {
      // Fetch projects
      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select("*");
      if (projectsError) throw projectsError;

      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, avatar_url");
      if (profilesError) throw profilesError;

      // Map profiles to projects
      const projectsWithProfiles = projects.map((project) => {
        const profile = profiles.find((p) => p.id === project.user_id);
        return {
          ...project,
          avatar_url: profile?.avatar_url
            ? `https://jnqvgrycauzjnvepqorq.supabase.co/storage/v1/object/public/avatars/${profile.avatar_url}`
            : null,
        };
      });

      setProjectData(projectsWithProfiles);
      setProfiles(profiles);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Use useFocusEffect to fetch data when the screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const handleSave = async (projectId: number) => {
    try {
      const { error } = await supabase
        .from("projects")
        .update({ is_saved: true })
        .eq("project_id", projectId);

      if (error) throw error;

      // Update the local state
      setProjectData((prevProjects) =>
        prevProjects.map((project) =>
          project.project_id === projectId
            ? { ...project, is_saved: true }
            : project
        )
      );

      Alert.alert("Success", "Project saved successfully!");
    } catch (error) {
      console.error("Error saving project:", error);
      Alert.alert("Error", "Failed to save the project. Please try again.");
    }
  };

  const handleApply = async (projectId: number, user_id?: string) => {
    try {
      if (!user_id) {
        Alert.alert("Error", "User information is missing. Please try again.");
        return;
      }

      const { error } = await supabase
        .from("projects")
        .update({ is_applied: true })
        .eq("project_id", projectId);

      if (error) throw error;

      setProjectData((prevProjects) =>
        prevProjects.map((project) =>
          project.project_id === projectId
            ? { ...project, is_applied: true }
            : project
        )
      );

      Alert.alert("You Can Send Message to applied for the project!");

      router.push(`../user?userId=${encodeURIComponent(user_id)}`);
    } catch (error) {
      console.error("Error applying to project:", error);
      Alert.alert("Error", "Failed to apply for the project. Please try again.");
    }
  };

  const calculatePostDuration = (datePosted: string, timePosted: string) => {
    const postDateTime = new Date(`${datePosted}T${timePosted}`); // Combine and parse

    // Check if the date is valid
    if (isNaN(postDateTime.getTime())) {
      throw new Error("Invalid date or time format");
    }

    const currentDate = new Date();
    const timeDifference = currentDate.getTime() - postDateTime.getTime();

    // Handle case where the post date is in the future
    if (timeDifference < 0) {
      return "Just now";
    }

    const seconds = Math.floor(timeDifference / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 7) {
      return postDateTime.toLocaleDateString("en-US", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      });
    } else if (days > 0) {
      return `${days} day${days > 1 ? "s" : ""} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    } else {
      return "Just now";
    }
  };

  const calculatePostDuration = (datePosted: string, timePosted: string) => {
    const postDateTime = new Date(`${datePosted}T${timePosted}`); // Combine and parse

    // Check if the date is valid
    if (isNaN(postDateTime.getTime())) {
      throw new Error("Invalid date or time format");
    }

    const currentDate = new Date();
    const timeDifference = currentDate.getTime() - postDateTime.getTime();

    // Handle case where the post date is in the future
    if (timeDifference < 0) {
      return "Just now";
    }

    const seconds = Math.floor(timeDifference / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 7) {
      return postDateTime.toLocaleDateString("en-US", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      });
    } else if (days > 0) {
      return `${days} day${days > 1 ? "s" : ""} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    } else {
      return "Just now";
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (projectData.length === 0) {
    return (
      <View style={styles.loader}>
        <Text style={{ color: "gray", fontSize: 16 }}>No Projects Found</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: ProjectData }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.project_title}</Text>
      <View style={styles.userInfo}>
        <Image
          source={{ uri: item.avatar_url || "https://via.placeholder.com/40" }} // Use avatar_url or a fallback
          style={styles.avatar}
        />
        <View style={styles.textGroup}>
          <Text style={styles.name}>{item.user_name}</Text>
          <Text style={styles.location}>{item.location}</Text>
          <Text style={styles.date}>
            {calculatePostDuration(item.date_posted, item.time_posted)}
          </Text>
        </View>
      </View>
      <View style={styles.details}>
        <View style={styles.row}>
          <Ionicons name="briefcase-outline" size={20} color="gray" />
          <Text style={styles.detailText}>Status: {item.project_status}</Text>
        </View>
        <View style={styles.row}>
          <MaterialIcons name="article" size={20} color="gray" />
          <Text style={styles.detailText}>Skills: {item.skills}</Text>
        </View>
      </View>
      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => handleSave(item.project_id)}
          disabled={item.is_saved}
        >
          <Text style={styles.buttonText}>
            {item.is_saved ? "Saved" : "Save"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.applyButton}
          onPress={() => handleApply(item.project_id, item.user_id)}
        >
          <Text style={styles.buttonText}>Apply</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <FlatList
      data={projectData}
      renderItem={renderItem}
      keyExtractor={(item) => item.project_id.toString()}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    margin: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  textGroup: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
  },
  location: {
    fontSize: 14,
    color: "gray",
  },
  date: {
    fontSize: 12,
    color: "gray",
  },
  details: {
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: "gray",
  },
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  saveButton: {
    backgroundColor: "#000",
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: "center",
  },
  applyButton: {
    backgroundColor: "#000",
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});