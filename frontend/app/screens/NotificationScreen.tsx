import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabse"; // Adjust path as needed

const NotificationScreen = () => {
  const [notifications, setNotifications] = useState<
    {
      id: string;
      user_id: string;
      follower_id: string;
      message: string;
      created_at: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  // Get logged-in user's ID
  const getUser = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error("Error fetching user:", error);
    } else if (data?.user) {
      setUserId(data.user.id);
    }
  };

  // Fetch notifications for the logged-in user
  const fetchNotifications = async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId) // Only get notifications for the logged-in user
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching notifications:", error);
    } else {
      setNotifications(data || []);
    }
    setLoading(false);
  };

  // Remove notification from Supabase
  const handleRemoveNotification = async (id: string) => {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id);
    if (error) {
      console.error("Error deleting notification:", error);
    } else {
      setNotifications((prev) => prev.filter((notif) => notif.id !== id));
    }
  };

  // Navigate to the profile of the follower who triggered the notification
  const handleNotificationPress = (follower_id: string) => {
    router.push({
      pathname: "./ProfileScreen",
      params: { userId: follower_id }, // Pass follower_id as userId to the profile screen
    });
  };

  // Fetch user & notifications on mount
  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchNotifications();

      // Real-time notifications for the logged-in user
      const subscription = supabase
        .channel("realtime:notifications")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications" },
          (payload) => {
            if (payload.new.user_id === userId) {
              setNotifications((prev) => [payload.new, ...prev]);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [userId]);

  // Render each notification
  const renderNotification = ({
    item,
  }: {
    item: {
      id: string;
      user_id: string;
      follower_id: string;
      message: string;
      created_at: string;
    };
  }) => {
    return (
      <View style={styles.notification}>
        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={() => handleNotificationPress(item.follower_id)} // Navigate to follower's profile on press
        >
          <Text>{item.message}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleRemoveNotification(item.id)}>
          <MaterialIcons name="delete" size={24} color="red" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notifications</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<Text>No notifications yet.</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  notification: {
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#E6F7FF",
  },
});

export default NotificationScreen;
