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
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import ShowingAvatar from "../Components/ShowingAvatar";
import { router, useLocalSearchParams } from "expo-router";
import PostItem from "./PostItem"; // Import PostItem component

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
  uid: string; // User ID of the event creator
  interested_count: number; // Add this field
  is_event: boolean; // To differentiate between posts and events
  isInterestedByCurrentUser?: boolean; // Add this field
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
  const [role, setRole] = useState<boolean>(false); // State for role
  const [posts, setPosts] = useState<(Post | Event)[]>([]); // State for posts and events
  const { userId } = useLocalSearchParams();
  const [jobtitle, setJobtitle] = useState([]); // Store followers list
  const [followersList, setFollowersList] = useState([]); // Store followers list
  const [followersCount, setFollowersCount] = useState(0); // Store number of followers
  const [followingList, setFollowingList] = useState([]); // Store following list
  const [followingCount, setFollowingCount] = useState(0); // Store number of users you are following
  const [postsCount, setPostsCount] = useState(0); // Store number of posts made by the user
  const [graduationyear, setgraduationyear] = useState(); // Store number of events created by the user
  // State for dropdown menu
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null); // Store selected event for dropdown

  useEffect(() => {
    if (userId || session) {
      getProfile();
      getFollowers(); // Fetch followers
      getFollowing(); // Fetch following
      fetchPosts();
    }
  }, [userId, session]);

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
        .select("id, content, likes, comments, is_public, user_id")
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
        // Fetch interest status for each event
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

            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                {followersCount}
              </Text>
              <Text style={{ fontSize: 14, color: "#666" }}>Followers</Text>
            </View>

            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                {followingCount}
              </Text>
              <Text style={{ fontSize: 14, color: "#666" }}>Following</Text>
            </View>
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

      {/* Edit and Sign Out Buttons */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginHorizontal: 20,
          marginTop: 20,
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
            marginRight: 10,
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
      </View>

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
});
