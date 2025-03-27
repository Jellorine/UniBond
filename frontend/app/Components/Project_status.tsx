import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Image, ActivityIndicator, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import supabase from "../../lib/supabse";

// Interface for project data structure
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
  time_posted: string; // Add time_posted to the interface
  avatar_url?: string; // Add avatar_url to the interface
}

interface ProfileData {
  id: string;
  avatar_url: string;
}

export default function ProjectStatus() {
  const [projectData, setProjectData] = useState<ProjectData[]>([]);
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch project data and profiles from Supabase
  useEffect(() => {
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

    fetchData();
  }, []);

  // Function to calculate post duration
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

  // Loading state while fetching data
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  // If no project data found
  if (projectData.length === 0) {
    return (
      <View style={styles.loader}>
        <Text style={{ color: "gray", fontSize: 16 }}>No Projects Found</Text>
      </View>
    );
  }

  // Render a single project card
  const renderProjectCard = ({ item }: { item: ProjectData }) => (
    <View style={styles.card}>
      {/* Title */}
      <Text style={styles.title}>{item.project_title}</Text>

      {/* User Info */}
      <View style={styles.userInfo}>
        <Image
          source={{ uri: item.avatar_url || "https://via.placeholder.com/40" }} // Use avatar_url or a fallback
          style={styles.avatar}
        />
        <View style={styles.textGroup}>
          <Text style={styles.name}>{item.user_name}</Text>
          <Text style={styles.status}>Status: {item.project_status}</Text>
          <View style={styles.row}>
            <Ionicons name="time-outline" size={16} color="black" style={{ marginRight: 4 }} />
            <Text style={styles.date}>
              {calculatePostDuration(item.date_posted, item.time_posted)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View>
      <FlatList
        data={projectData}
        renderItem={renderProjectCard}
        keyExtractor={(item) => item.project_id.toString()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
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
  status: {
    fontSize: 14,
    color: "gray",
  },
  date: {
    fontSize: 12,
    color: "gray",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  flatListContent: {
    paddingBottom: 16,
  },
});