import { useEffect, useState } from "react";
import { supabase } from "../lib/supabse";
import { useAuth } from "../providers/AuthProvider";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  TouchableOpacity,
  View,
  Text,
  Alert,
  FlatList,
  StyleSheet,
  Modal,
  Image,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import ShowingAvatar from "../Components/ShowingAvatar";
import { router, useLocalSearchParams } from "expo-router";
import PostItem from "./PostItem";

// Define the Post type
type Post = {
  id: number;
  content: string;
  likes: number;
  comments: { username: string; comment: string }[];
  is_public: boolean;
  user_id: string;
};

// Define the Event type
type Event = {
  id: number;
  event_name: string;
  event_description: string;
  event_location: string;
  event_date: string;
  uid: string;
  interested_count: number;
  is_event: boolean;
  isInterestedByCurrentUser?: boolean;
};

type Profile = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
};

export default function ShowProfileEdit() {
  const [fullname, setFullname] = useState("");
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const { session } = useAuth();
  const [contactNumber, setContactNumber] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState(new Date());
  const [department, setDepartment] = useState("");
  const [faculty, setFaculty] = useState("");
  const [course, setCourse] = useState("");
  const [skills, setSkills] = useState("");
  const [interests, setInterests] = useState("");
  const [role, setRole] = useState<boolean>(false);
  const [posts, setPosts] = useState<(Post | Event)[]>([]);
  const { userId } = useLocalSearchParams();
  const [jobtitle, setJobtitle] = useState([]);
  const [followersList, setFollowersList] = useState<
    { follower_id: string; profiles: Profile }[]
  >([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingList, setFollowingList] = useState<
    { followed_id: string; profiles: Profile }[]
  >([]);
  const [followingCount, setFollowingCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);
  const [graduationyear, setgraduationyear] = useState();
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [blockedUsers, setBlockedUsers] = useState<Profile[]>([]);
  const [showBlockedList, setShowBlockedList] = useState(false);
  const storageUrl =
    "https://jnqvgrycauzjnvepqorq.supabase.co/storage/v1/object/public/avatars/";

  useEffect(() => {
    if (userId || session) {
      getProfile();
      getFollowers();
      getFollowing();
      fetchPosts();
      fetchBlockedUsers();
    }
  }, [userId, session]);

  const fetchBlockedUsers = async () => {
    try {
      const profileId = userId || session?.user?.id;
      if (!profileId) throw new Error("No user on the session!");

      // First get the blocked user IDs
      const { data: blockedData, error: blockedError } = await supabase
        .from("blocked_users")
        .select("blocked_id")
        .eq("blocker_id", profileId);

      if (blockedError) throw blockedError;

      if (!blockedData || blockedData.length === 0) {
        setBlockedUsers([]);
        return;
      }

      // Then get the profiles for those IDs
      const blockedIds = blockedData.map((item) => item.blocked_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .in("id", blockedIds);

      if (profilesError) throw profilesError;

      setBlockedUsers(profilesData || []);
    } catch (error) {
      console.error("Error fetching blocked users:", error);
      Alert.alert("Error", "Could not fetch blocked users.");
      setBlockedUsers([]);
    }
  };

  // Unblock a user
  const unblockUser = async (userIdToUnblock: string) => {
    try {
      const profileId = userId || session?.user?.id;
      if (!profileId) throw new Error("No user on the session!");

      const { error } = await supabase
        .from("blocked_users")
        .delete()
        .eq("blocker_id", profileId)
        .eq("blocked_id", userIdToUnblock);

      if (error) throw error;

      setBlockedUsers(
        blockedUsers.filter((user) => user.id !== userIdToUnblock)
      );
      Alert.alert("Success", "User unblocked successfully");
    } catch (error) {
      console.error("Error unblocking user:", error);
      Alert.alert("Error", "Could not unblock user.");
    }
  };

  // Confirm unblock action
  const confirmUnblock = (userIdToUnblock: string) => {
    Alert.alert(
      "Unblock User",
      "Are you sure you want to unblock this user? They will be able to see your profile and interact with you.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Unblock", onPress: () => unblockUser(userIdToUnblock) },
      ]
    );
  };

  // [KEEP ALL OTHER EXISTING FUNCTIONS EXACTLY AS THEY WERE]
  // Fetch followers
  const getFollowers = async () => {
    try {
      const profileId = userId || session?.user?.id;
      if (!profileId) throw new Error("No user on the session!");

      const { data, error } = await supabase
        .from("followers")
        .select("follower_id, profiles(*)")
        .eq("followed_id", profileId);

      if (error) throw error;

      setFollowersList(data || []);
      setFollowersCount(data.length);
    } catch (error) {
      console.error("Error fetching followers:", error);
      Alert.alert("Error", "Could not fetch followers.");
    }
  };

  // Fetch following
  const getFollowing = async () => {
    try {
      const profileId = userId || session?.user?.id;
      if (!profileId) throw new Error("No user on the session!");

      const { data, error } = await supabase
        .from("followers")
        .select("followed_id, profiles(*)")
        .eq("follower_id", profileId);

      if (error) throw error;

      setFollowingList(data || []);
      setFollowingCount(data.length);
    } catch (error) {
      console.error("Error fetching following:", error);
      Alert.alert("Error", "Could not fetch following.");
    }
  };

  // Fetch profile data
  async function getProfile() {
    try {
      const profileId = userId || session?.user?.id;
      if (!profileId) throw new Error("No user on the session!");

      const { data, error } = await supabase
        .from("profiles")
        .select(
          `username, avatar_url, full_name, dob, contact_number, gender, department, faculty, course, skills, interests, role, job_title,graduation_year`
        )
        .eq("id", profileId)
        .single();

      if (data) {
        setUsername(data.username);
        setFullname(data.full_name);
        setAvatarUrl(data.avatar_url);
        setDob(new Date(data.dob));
        setContactNumber(data.contact_number);
        setGender(data.gender);
        setDepartment(data.department);
        setFaculty(data.faculty);
        setCourse(data.course);
        setSkills(data.skills);
        setInterests(data.interests);
        setRole(data.role);
        setJobtitle(data.job_title);
        setgraduationyear(data.graduation_year);
      }

      if (error) throw error;
    } catch (error) {
      console.error("Error fetching profile:", error);
      if (error instanceof Error) Alert.alert("Error", error.message);
    }
  }

  // Fetch posts made by the user
  async function fetchPosts() {
    try {
      const profileId = userId || session?.user?.id;
      if (!profileId) throw new Error("No user on the session!");

      // Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("id, content, likes, comments, is_public, user_id,media_url")
        .eq("user_id", profileId);

      if (postsData) {
        setPosts(postsData);
        setPostsCount(postsData.length);
      }

      if (postsError) throw postsError;

      // Fetch events with interested_count
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select(
          "id, event_name, event_description, event_location, event_date, uid, interested_count"
        )
        .eq("uid", profileId);

      if (eventsData) {
        const eventsWithInterest = await Promise.all(
          eventsData.map(async (event) => {
            const { data: interestData, error: interestError } = await supabase
              .from("event_interests")
              .select("*")
              .eq("event_id", event.id)
              .eq("user_id", profileId);

            if (interestError) throw interestError;

            return {
              ...event,
              is_event: true,
              isInterestedByCurrentUser: interestData.length > 0,
            };
          })
        );

        setPosts((prevPosts) => [...prevPosts, ...eventsWithInterest]);
        setPostsCount((prevCount) => prevCount + eventsData.length);
      }

      if (eventsError) throw eventsError;
    } catch (error) {
      console.error("Error fetching posts and events:", error);
      Alert.alert("Error", "Could not fetch posts or events.");
    }
  }

  const handleEditPress = () => {
    router.push("/screens/DetailsForStudents");
  };

  // Function to handle liking a post
  const handleLike = async (postId: number) => {
    try {
      const { data: postData, error: fetchError } = await supabase
        .from("posts")
        .select("likes")
        .eq("id", postId)
        .single();

      if (fetchError) throw fetchError;

      const updatedLikes = (postData?.likes || 0) + 1;

      const { error: updateError } = await supabase
        .from("posts")
        .update({ likes: updatedLikes })
        .eq("id", postId);

      if (updateError) throw updateError;

      fetchPosts();
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  // Function to handle submitting a comment
  const handleCommentSubmit = async (postId: number, newComment: string) => {
    try {
      const { error } = await supabase.from("comments").insert([
        {
          post_id: postId,
          username,
          comment: newComment,
        },
      ]);

      if (error) throw error;

      fetchPosts();
    } catch (error) {
      console.error("Error submitting comment:", error);
    }
  };

  // Function to handle deleting a post
  const handleDeletePost = async (postId: number) => {
    try {
      const { error } = await supabase.from("posts").delete().eq("id", postId);
      if (error) throw error;
      fetchPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
      Alert.alert("Error", "Could not delete post.");
    }
  };

  // Function to handle editing a post
  const handleEditPost = (postId: number) => {
    router.push(`/screens/EditPost?postId=${postId}`);
  };

  // Function to handle deleting an event
  const handleDeleteEvent = async (eventId: number) => {
    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId);
      if (error) throw error;
      fetchPosts();
    } catch (error) {
      console.error("Error deleting event:", error);
      Alert.alert("Error", "Could not delete event.");
    }
  };

  // Function to handle editing an event
  const handleEditEvent = (event: Event) => {
    router.push({
      pathname: "/screens/EditEventScreen",
      params: {
        eventId: event.id,
        eventName: event.event_name,
        eventDescription: event.event_description,
        eventDate: event.event_date,
        eventLocation: event.event_location,
      },
    });
  };

  // Function to open dropdown menu for an event
  const openDropdown = (event: Event) => {
    setSelectedEvent(event);
    setDropdownVisible(true);
  };

  // Function to handle toggling interest in an event
  const handleInterestToggle = async (eventId: number) => {
    try {
      const profileId = session?.user?.id;
      if (!profileId) throw new Error("No user on the session!");

      // Check if the user is already interested
      const { data: interestData, error: interestError } = await supabase
        .from("event_interests")
        .select("*")
        .eq("event_id", eventId)
        .eq("user_id", profileId);

      if (interestError) throw interestError;

      const isInterested = interestData.length > 0;

      if (isInterested) {
        // Remove interest
        const { error: removeError } = await supabase
          .from("event_interests")
          .delete()
          .eq("event_id", eventId)
          .eq("user_id", profileId);

        if (removeError) throw removeError;

        // Decrement the interested count
        const { data: eventData, error: fetchError } = await supabase
          .from("events")
          .select("interested_count")
          .eq("id", eventId)
          .single();

        if (fetchError) throw fetchError;

        const newInterestedCount = eventData.interested_count - 1;

        const { error: updateError } = await supabase
          .from("events")
          .update({ interested_count: newInterestedCount })
          .eq("id", eventId);

        if (updateError) throw updateError;

        // Update local state
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.is_event && post.id === eventId
              ? {
                  ...post,
                  interested_count: newInterestedCount,
                  isInterestedByCurrentUser: false,
                }
              : post
          )
        );
      } else {
        // Add interest
        const { error: addError } = await supabase
          .from("event_interests")
          .insert([{ event_id: eventId, user_id: profileId }]);

        if (addError) throw addError;

        // Increment the interested count
        const { data: eventData, error: fetchError } = await supabase
          .from("events")
          .select("interested_count")
          .eq("id", eventId)
          .single();

        if (fetchError) throw fetchError;

        const newInterestedCount = eventData.interested_count + 1;

        const { error: updateError } = await supabase
          .from("events")
          .update({ interested_count: newInterestedCount })
          .eq("id", eventId);

        if (updateError) throw updateError;

        // Update local state
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.is_event && post.id === eventId
              ? {
                  ...post,
                  interested_count: newInterestedCount,
                  isInterestedByCurrentUser: true,
                }
              : post
          )
        );
      }
    } catch (error) {
      console.error("Error toggling interest:", error);
      Alert.alert("Error", "Could not toggle interest.");
    }
  };

  const handleFollowersPress = () => {
    router.push({
      pathname: "/screens/FollowersList",
      params: {
        type: "followers",
        userId: userId || session?.user?.id,
      },
    });
  };

  const handleFollowingPress = () => {
    router.push({
      pathname: "/screens/FollowList",
      params: {
        type: "following",
        userId: userId || session?.user?.id,
        following: JSON.stringify(
          followingList.map((f) => ({
            id: f.followed_id,
            username: f.profiles.username,
            full_name: f.profiles.full_name,
            avatar_url: f.profiles.avatar_url,
          }))
        ),
      },
    });
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* Back Button */}
      <View style={{ flexDirection: "row", justifyContent: "center" }}>
        <TouchableOpacity
          style={{ position: "absolute", left: 0 }}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {/* Profile Header */}
      <View style={{ marginTop: 30, marginHorizontal: 20 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Profile Picture */}
          <ShowingAvatar
            url={avatarUrl}
            size={40}
            onUpload={(newAvatarUrl) => setAvatarUrl(newAvatarUrl)}
          />

          {/* Followers, Following, and Posts Count */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              flex: 1,
              marginLeft: 20,
            }}
          >
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                {postsCount}
              </Text>
              <Text style={{ fontSize: 14, color: "#666" }}>Posts</Text>
            </View>

            <TouchableOpacity
              style={{ alignItems: "center" }}
              onPress={handleFollowersPress}
            >
              <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                {followersCount}
              </Text>
              <Text style={{ fontSize: 14, color: "#666" }}>Followers</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ alignItems: "center" }}
              onPress={handleFollowingPress}
            >
              <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                {followingCount}
              </Text>
              <Text style={{ fontSize: 14, color: "#666" }}>Following</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Details */}
        <View style={{ marginTop: 10 }}>
          <Text style={{ fontSize: 20, fontWeight: "bold" }}>
            {fullname || "Profile"} ({role ? "Alumni" : "Student"})
          </Text>
          {role && (
            <View>
              <Text style={{ fontSize: 16, color: "#666", fontWeight: "bold" }}>
                {jobtitle}
              </Text>
              <Text style={{ fontSize: 16, color: "#666" }}>
                Graduated Year:{" "}
                {new Date(graduationyear).toLocaleString("default", {
                  year: "numeric",
                })}
              </Text>
            </View>
          )}
          <Text style={{ fontSize: 16, color: "#666" }}>
            {faculty} | {department}
          </Text>
          <Text style={{ fontSize: 16, color: "#666" }}>{skills}</Text>
        </View>
      </View>

      {/* Edit, Blocked List, and Sign Out Buttons */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginHorizontal: 20,
          marginTop: 20,
          gap: 10,
        }}
      >
        <TouchableOpacity
          onPress={handleEditPress}
          style={{
            backgroundColor: "#2C3036",
            padding: 10,
            borderRadius: 25,
            flex: 1,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff" }}>Edit</Text>
        </TouchableOpacity>

        {!userId && (
          <TouchableOpacity
            onPress={async () => {
              try {
                const { error } = await supabase.auth.signOut();
                if (error) throw error;
                router.push("../(auth)/login");
              } catch (error) {
                if (error instanceof Error) {
                  Alert.alert("Error", error.message);
                }
              }
            }}
            style={{
              borderWidth: 2,
              borderColor: "#2C3036",
              backgroundColor: "transparent",
              padding: 10,
              borderRadius: 40,
              flex: 1,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#2C3036" }}>Sign Out</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => setShowBlockedList(!showBlockedList)}
          style={{
            backgroundColor: "#2C3036",
            padding: 10,
            borderRadius: 25,
            alignItems: "center",
            marginLeft: 10,
          }}
        >
          <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      <Modal
        visible={showBlockedList}
        animationType="slide"
        onRequestClose={() => setShowBlockedList(false)}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowBlockedList(false)}>
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Blocked Users</Text>
            <View style={{ width: 24 }} />
          </View>

          {blockedUsers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No blocked users</Text>
            </View>
          ) : (
            <FlatList
              data={blockedUsers}
              renderItem={({ item }) => (
                <View style={styles.blockedUserItem}>
                  <View style={styles.userInfo}>
                    {item.avatar_url ? (
                      <Image
                        source={{ uri: `${storageUrl}${item.avatar_url}` }}
                        style={styles.avatar}
                      />
                    ) : (
                      <MaterialIcons name="person" size={40} color="#ccc" />
                    )}
                    <View style={styles.userText}>
                      <Text style={styles.userName}>{item.full_name}</Text>
                      <Text style={styles.userUsername}>{item.username}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.unblockButton}
                    onPress={() => confirmUnblock(item.id)}
                  >
                    <Text style={styles.unblockButtonText}>Unblock</Text>
                  </TouchableOpacity>
                </View>
              )}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.blockedListContent}
            />
          )}
        </SafeAreaView>
      </Modal>

      {/* Posts Section */}
      <View style={{ marginTop: 30, flex: 1 }}>
        <Text style={{ fontSize: 18, fontWeight: "bold", marginLeft: 20 }}>
          My Posts
        </Text>
        <FlatList
          data={posts}
          renderItem={({ item }) => (
            <View style={{ marginBottom: 20 }}>
              {item.is_event ? (
                <View style={styles.eventItem}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={styles.eventevent_name}>
                      {item.event_name}
                    </Text>
                    <TouchableOpacity onPress={() => openDropdown(item)}>
                      <Ionicons
                        name="ellipsis-vertical"
                        size={24}
                        color="black"
                      />
                    </TouchableOpacity>
                  </View>
                  <Text>Description: {item.event_description}</Text>
                  <Text>Location: {item.event_location}</Text>
                  <Text>Date: {item.event_date}</Text>
                  <Text>Interested: {item.interested_count}</Text>
                  <View style={styles.divider} />

                  {/* Updated Interested Button */}
                  <TouchableOpacity
                    style={styles.interestedButton}
                    onPress={() => handleInterestToggle(item.id)}
                  >
                    <MaterialIcons
                      name={item.isInterestedByCurrentUser ? "remove" : "add"}
                      size={20}
                      color="#000"
                    />
                    <Text style={styles.interestedButtonText}>
                      {item.isInterestedByCurrentUser
                        ? "Not Interested"
                        : "Interested"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <PostItem
                  post={item}
                  username={username || "Anonymous"}
                  onLike={handleLike}
                  onCommentSubmit={handleCommentSubmit}
                  onDelete={handleDeletePost}
                  onEdit={handleEditPost}
                />
              )}
            </View>
          )}
          keyExtractor={(item) => item.id.toString()}
        />
      </View>

      {/* Dropdown Menu */}
      <Modal
        transparent={true}
        visible={dropdownVisible}
        onRequestClose={() => setDropdownVisible(false)}
      >
        <View style={styles.dropdownContainer}>
          <View style={styles.dropdownMenu}>
            <TouchableOpacity
              onPress={() => {
                handleEditEvent(selectedEvent!);
                setDropdownVisible(false);
              }}
              style={styles.dropdownItem}
            >
              <Text>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                handleDeleteEvent(selectedEvent!.id);
                setDropdownVisible(false);
              }}
              style={styles.dropdownItem}
            >
              <Text style={{ color: "red" }}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  eventItem: {
    padding: 15,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    marginBottom: 10,
  },
  eventevent_name: {
    fontSize: 18,
    fontWeight: "bold",
  },
  dropdownContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  dropdownMenu: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    width: 150,
  },
  dropdownItem: {
    padding: 10,
  },
  interestedButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "transparent",
    borderRadius: 5,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  interestedButtonText: {
    color: "#000",
    fontWeight: "bold",
    marginLeft: 5,
  },
  divider: {
    height: 1,
    backgroundColor: "#2C3036",
    marginVertical: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  blockedUserItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userText: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  userUsername: {
    fontSize: 14,
    color: "#666",
  },
  unblockButton: {
    backgroundColor: "#2C3036",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  unblockButtonText: {
    color: "white",
  },
  blockedListContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#888",
  },
});
