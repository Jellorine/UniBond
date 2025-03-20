import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
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
      full_name?: string; 
      avatar_url?: string;
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

  // Fetch notifications & follower details
  const fetchNotifications = async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching notifications:", error);
      setLoading(false);
      return;
    }

    // Fetch follower details for each notification
    const followerIds = data.map((notif) => notif.follower_id);
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", followerIds);

    if (profileError) {
      console.error("Error fetching profiles:", profileError);
      setLoading(false);
      return;
    }

    const SUPABASE_STORAGE_URL = "https://jnqvgrycauzjnvepqorq.supabase.co/storage/v1/object/public/";

    // Merge notifications with profile details
    const enrichedNotifications = data.map((notif) => {
      const follower = profiles.find((p) => p.id === notif.follower_id);
      return {
        ...notif,
        full_name: follower?.full_name || "Unknown",
        avatar_url: follower?.avatar_url
          ? `${SUPABASE_STORAGE_URL}avatars/${follower.avatar_url}`
          : null,
      };
    });

    setNotifications(enrichedNotifications);
    setLoading(false);
  };

  // Remove notification from Supabase
  const handleRemoveNotification = async (id: string) => {
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (error) {
      console.error("Error deleting notification:", error);
    } else {
      setNotifications((prev) => prev.filter((notif) => notif.id !== id));
    }
  };

  // Navigate to the follower's profile
  const handleNotificationPress = (follower_id: string) => {
    router.push({
      pathname: "./ProfileScreen",
      params: { userId: follower_id },
    });
  };

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
      full_name?: string;
      avatar_url?: string;
    };
  }) => {
    return (
      <View style={styles.notification}>
        <TouchableOpacity
          style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
          onPress={() => handleNotificationPress(item.follower_id)}
        >
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.placeholderAvatar}>
              <Text style={styles.avatarText}>{item.full_name?.charAt(0)}</Text>
            </View>
          )}
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={styles.followerName}>{item.full_name}</Text>
            <Text>{item.message}</Text>
          </View>
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
    alignItems: "center",
    backgroundColor: "#E6F7FF",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  placeholderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#bbb",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  followerName: {
    fontWeight: "bold",
    fontSize: 14,
  },
});

export default NotificationScreen;
