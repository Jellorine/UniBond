import { useEffect, useState } from "react";
import { supabase } from "../lib/supabse";
import { useAuth } from "../providers/AuthProvider";
import {
  SafeAreaView,
  FlatList,
  Modal,
  TouchableWithoutFeedback,
  Linking,
} from "react-native";
import {
  TouchableOpacity,
  View,
  Text,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import ShowingAvatar from "../Components/ShowingAvatar";
import { Link, router, useLocalSearchParams } from "expo-router";
import PostItem from "./PostItem";
import { ScrollView } from "react-native-gesture-handler";

export default function ProfileScreen() {
  const [fullname, setFullname] = useState("");
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [contactNumber, setContactNumber] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState(new Date());
  const [department, setDepartment] = useState("");
  const [faculty, setFaculty] = useState("");
  const [course, setCourse] = useState("");
  const [skills, setSkills] = useState("");
  const [interests, setInterests] = useState("");
  const [role, setRole] = useState<boolean>(false);
  const { userId } = useLocalSearchParams();
  const { session } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [followingList, setFollowingList] = useState([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [posts, setPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [postCount, setPostCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [email, setEmail] = useState("");
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [jobtitle, setJobtitle] = useState([]);
  const [graduationyear, setgraduationyear] = useState();
  const [selectedTab, setSelectedTab] = useState("posts");

  useEffect(() => {
    if (userId || session) {
      getProfile();
      checkFollowingStatus();
      getFollowing();
      getFollowerCount();
      fetchPostCount();
      fetchFollowingCount();
      if (isFollowing) {
        fetchPostsAndEvents();
      }
    }
  }, [userId, session, isFollowing]);

  const fetchPostCount = async () => {
    try {
      const profileId = userId || session?.user?.id;
      if (!profileId) throw new Error("No user on the session!");

      const { data, error } = await supabase
        .from("posts")
        .select("id")
        .eq("user_id", profileId);

      if (error) throw error;

      setPostCount(data.length);
    } catch (error) {
      console.error("Error fetching post count:", error);
    }
  };

  const fetchFollowingCount = async () => {
    try {
      const profileId = userId || session?.user?.id;
      if (!profileId) throw new Error("No user on the session!");

      const { data, error } = await supabase
        .from("followers")
        .select("followed_id")
        .eq("follower_id", profileId);

      if (error) throw error;

      setFollowingCount(data.length);
    } catch (error) {
      console.error("Error fetching following count:", error);
    }
  };

  const fetchPostsAndEvents = async () => {
    try {
      const profileId = userId || session?.user?.id;
      if (!profileId) throw new Error("No user on the session!");

      // Fetch posts with comments
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select(`*, comments(*)`)
        .eq("user_id", profileId)
        .order("created_at", { ascending: false });

      if (postsError) throw postsError;

      // Fetch events with interest status
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select("*")
        .eq("uid", profileId);

      if (eventsError) throw eventsError;

      const eventsWithInterestStatus = await Promise.all(
        eventsData.map(async (event) => {
          const { data: interestData, error: interestError } = await supabase
            .from("event_interests")
            .select("*")
            .eq("event_id", event.id)
            .eq("user_id", session?.user?.id);

          if (interestError) throw interestError;

          return {
            ...event,
            isInterestedByCurrentUser: interestData.length > 0,
          };
        })
      );

      setPosts(postsData || []);
      setEvents(eventsWithInterestStatus || []);

      const totalCount = (postsData?.length || 0) + (eventsData?.length || 0);
      setPostCount(totalCount);
    } catch (error) {
      console.error("Error fetching posts and events:", error);
      Alert.alert("Error", "Unable to load posts and events.");
    }
  };

  const getFollowerCount = async () => {
    try {
      const { data, error } = await supabase
        .from("followers")
        .select("follower_id")
        .eq("followed_id", userId);

      if (error) throw error;

      setFollowerCount(data.length);
    } catch (error) {
      console.error("Error fetching follower count:", error);
    }
  };

  const checkFollowingStatus = async () => {
    const profileId = session?.user?.id;
    const { data, error } = await supabase
      .from("followers")
      .select("follower_id")
      .eq("follower_id", profileId)
      .eq("followed_id", userId);

    if (error) {
      console.error("Error fetching following status:", error);
    } else {
      setIsFollowing(data.length > 0);
    }
  };

  const getFollowing = async () => {
    const profileId = session?.user?.id;
    const { data, error } = await supabase
      .from("followers")
      .select("followed_id, profiles(*)")
      .eq("follower_id", profileId);

    if (error) {
      console.error("Error fetching following list:", error);
    } else {
      setFollowingList(data);
    }
  };

  const toggleFollow = async (followedId) => {
    setLoading(true);
    try {
      const action = isFollowing ? unfollowUser : followUser;
      await action(followedId);
      setIsFollowing((prev) => !prev);
      getFollowing();
      getFollowerCount();
      if (!isFollowing) {
        fetchPostsAndEvents();
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const followUser = async (followedId) => {
    const profileId = session?.user?.id;
    const { error } = await supabase
      .from("followers")
      .insert([{ follower_id: profileId, followed_id: followedId }]);

    if (error) throw new Error("Error following user.");
  };

  const unfollowUser = async (followedId) => {
    const profileId = session?.user?.id;
    const { error } = await supabase
      .from("followers")
      .delete()
      .eq("follower_id", profileId)
      .eq("followed_id", followedId);

    if (error) throw new Error("Error unfollowing user.");
  };

  async function getProfile() {
    try {
      const profileId = userId || session?.user?.id;
      if (!profileId) throw new Error("No user on the session!");

      const { data, error } = await supabase
        .from("profiles")
        .select(
          `username, avatar_url, full_name, dob, contact_number, gender, department, faculty, course, skills, interests, role, email, github, linkedin, portfolio,job_title,graduation_year`
        )
        .eq("id", profileId)
        .single();

      if (error) throw error;

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
        setEmail(data.email);
        setGithub(data.github);
        setLinkedin(data.linkedin);
        setPortfolio(data.portfolio);
        setJobtitle(data.job_title);
        setgraduationyear(data.graduation_year);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      Alert.alert("Error", "Unable to load profile data.");
    }
  }

  const renderPost = ({ item }) => (
    <PostItem
      post={item}
      username={username}
      onLike={async (postId, hasLiked) => {
        try {
          const { error } = await supabase
            .from("posts")
            .update({ likes: hasLiked ? item.likes + 1 : item.likes - 1 })
            .eq("id", postId);

          if (error) throw error;
        } catch (error) {
          console.error("Error updating like count:", error);
        }
      }}
      onCommentSubmit={async (postId, commentText) => {
        try {
          const { data, error } = await supabase
            .from("comments")
            .insert([
              {
                post_id: postId,
                user_id: session?.user?.id,
                content: commentText,
                username: username,
              },
            ])
            .select();

          if (error) throw error;

          setPosts(prevPosts =>
            prevPosts.map(post =>
              post.id === postId
                ? {
                    ...post,
                    comments: [...(post.comments || []), data[0]],
                  }
                : post
            )
          );
        } catch (error) {
          console.error("Error submitting comment:", error);
        }
      }}
      onLikeComment={async (commentId, hasLiked) => {
        try {
          const { error } = await supabase
            .from("comments")
            .update({ likes: hasLiked ? item.likes + 1 : item.likes - 1 })
            .eq("id", commentId);

          if (error) throw error;
        } catch (error) {
          console.error("Error updating comment like:", error);
        }
      }}
      onDeleteComment={async (postId, commentId) => {
        try {
          const { error } = await supabase
            .from("comments")
            .delete()
            .eq("id", commentId);

          if (error) throw error;

          setPosts(prevPosts =>
            prevPosts.map(post =>
              post.id === postId
                ? {
                    ...post,
                    comments: post.comments.filter(c => c.id !== commentId),
                  }
                : post
            )
          );
        } catch (error) {
          console.error("Error deleting comment:", error);
        }
      }}
    />
  );

  const handleInterestToggle = async (eventId: number) => {
    try {
      const profileId = session?.user?.id;
      if (!profileId) throw new Error("No user on the session!");

      const { data: interestData, error: interestError } = await supabase
        .from("event_interests")
        .select("*")
        .eq("event_id", eventId)
        .eq("user_id", profileId);

      if (interestError) throw interestError;

      const isInterested = interestData.length > 0;

      if (isInterested) {
        const { error: removeError } = await supabase
          .from("event_interests")
          .delete()
          .eq("event_id", eventId)
          .eq("user_id", profileId);

        if (removeError) throw removeError;

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

        setEvents((prevEvents) =>
          prevEvents.map((event) =>
            event.id === eventId
              ? {
                  ...event,
                  interested_count: newInterestedCount,
                  isInterestedByCurrentUser: false,
                }
              : event
          )
        );
      } else {
        const { error: addError } = await supabase
          .from("event_interests")
          .insert([{ event_id: eventId, user_id: profileId }]);

        if (addError) throw addError;

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

        setEvents((prevEvents) =>
          prevEvents.map((event) =>
            event.id === eventId
              ? {
                  ...event,
                  interested_count: newInterestedCount,
                  isInterestedByCurrentUser: true,
                }
              : event
          )
        );
      }
    } catch (error) {
      console.error("Error toggling interest:", error);
      Alert.alert("Error", "Could not toggle interest.");
    }
  };

  const renderEvent = ({ item }) => (
    <View style={styles.eventItem}>
      <Text style={styles.eventName}>{item.event_name}</Text>
      <Text style={styles.eventDescription}>{item.event_description}</Text>
      <Text style={styles.eventLocation}>Location: {item.event_location}</Text>
      <Text style={styles.eventDate}>Date: {item.event_date}</Text>
      <Text style={styles.eventInterested}>
        Interested: {item.interested_count}
      </Text>
      <View style={styles.divider} />

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
          {item.isInterestedByCurrentUser ? "Not Interested" : "Interested"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const toggleDropdown = () => {
    setShowDropdown((prev) => !prev);
  };

  const renderDropdown = () => (
    <Modal
      transparent={true}
      visible={showDropdown}
      onRequestClose={() => setShowDropdown(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowDropdown(false)}>
        <View style={styles.dropdownOverlay}>
          <View style={styles.dropdownMenu}>
            <Text style={styles.dropdownHeader}>Contact Info</Text>
            <Text style={styles.dropdownItem}>Email: {email}</Text>
            <Text style={styles.dropdownItem}>Contact: {contactNumber}</Text>

            <TouchableOpacity
              onPress={() => {
                if (github) Linking.openURL(github);
              }}
            >
              <Text
                style={[
                  styles.dropdownItem,
                  { color: github ? "blue" : "black" },
                ]}
              >
                GitHub: {github || "Not provided"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                if (linkedin) Linking.openURL(linkedin);
              }}
            >
              <Text
                style={[
                  styles.dropdownItem,
                  { color: linkedin ? "blue" : "black" },
                ]}
              >
                LinkedIn: {linkedin || "Not provided"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                if (portfolio) Linking.openURL(portfolio);
              }}
            >
              <Text
                style={[
                  styles.dropdownItem,
                  { color: portfolio ? "blue" : "black" },
                ]}
              >
                Portfolio: {portfolio || "Not provided"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  return (
    
    <SafeAreaView style={{ flex: 1 }}>
     
      <View style={{ flexDirection: "row", justifyContent: "center" }}>
        <TouchableOpacity
          style={{ position: "absolute", left: 0, top: 20 }}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <View
        style={{
          alignItems: "flex-start",
          marginTop: 40,
          marginHorizontal: 20,
        }}
      >
        <View style={{ flexDirection: "row", marginTop: 20 }}>
          <ShowingAvatar
            url={avatarUrl}
            size={150}
            onUpload={(newAvatarUrl) => setAvatarUrl(newAvatarUrl)}
          />
          <View
            style={{
              flexDirection: "row",
              marginBottom: 20,
              marginRight: 10,
              marginLeft: 10,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ alignItems: "center", marginHorizontal: 5 }}>
                <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                  {postCount}
                </Text>
                <Text style={{ fontSize: 14, color: "#666" }}>Posts</Text>
              </View>

              <Text
                style={{ fontSize: 20, color: "#666", marginHorizontal: 5 }}
              >
                |
              </Text>

              <View style={{ alignItems: "center", marginHorizontal: 5 }}>
                <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                  {followerCount}
                </Text>
                <Text style={{ fontSize: 14, color: "#666" }}>Followers</Text>
              </View>

              <Text
                style={{ fontSize: 20, color: "#666", marginHorizontal: 5 }}
              >
                |
              </Text>

              <View style={{ alignItems: "center", marginHorizontal: 5 }}>
                <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                  {followingCount}
                </Text>
                <Text style={{ fontSize: 14, color: "#666" }}>Following</Text>
              </View>
            </View>
          </View>
        </View>
        <Text style={{ fontSize: 20, fontWeight: "bold" }}>
          {fullname || "Profile"} {role ? "(Alumni)" : "(Student)"}
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
        <Text style={{ fontSize: 16, color: "#555" }}>
          {username} | {faculty}
        </Text>
        <Text style={{ fontSize: 16, color: "#555" }}>
          {department} | {course}
        </Text>
        <Text style={{ fontSize: 16, marginTop: 10, fontWeight: "bold" }}>
          Skills :
        </Text>
        <Text style={{ fontSize: 14 }}>{skills}</Text>
      </View>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginHorizontal: 20,
          marginTop: 20,
        }}
      >
        {userId !== session?.user?.id && (
          <TouchableOpacity
            onPress={() => toggleFollow(userId)}
            disabled={loading}
            style={{
              backgroundColor: isFollowing ? "#FF3B30" : "#2C3036",
              padding: 10,
              borderRadius: 25,
              marginRight: 10,
              flex: 1,
              alignItems: "center",
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "#fff" }}>
                {isFollowing ? "Unfollow" : "Follow"}
              </Text>
            )}
          </TouchableOpacity>
        )}

        {!userId && (
          <TouchableOpacity
            onPress={() => router.push("/screens/DetailsForStudents")}
            style={{
              backgroundColor: "#2C3036",
              padding: 10,
              borderRadius: 25,
              marginLeft: 5,
              flex: 1,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff" }}>Edit</Text>
          </TouchableOpacity>
        )}

        {userId !== session?.user?.id && isFollowing && (
          <>
            <TouchableOpacity
              style={{
                backgroundColor: "#2C3036",
                padding: 10,
                borderRadius: 25,
                flex: 1,
                alignItems: "center",
              }}
            >
              <Link href={`../user?userId=${userId}`} asChild>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "#fff" }}>Message</Text>
                )}
              </Link>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={toggleDropdown}
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
          </>
        )}

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
      {renderDropdown()}
      {isFollowing && (
        <>
        
         {/* Filter Buttons */}
      <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 20 }}>
        <TouchableOpacity
          onPress={() => setSelectedTab("posts")}
          style={{
            backgroundColor: selectedTab === "posts" ? "#2C3036" : "#ccc",
            padding: 10,
            borderRadius: 25,
            marginHorizontal: 5,
            flex: 1,
            alignItems: "center",
          }}
        >
          <Text style={{ color: selectedTab === "posts" ? "#fff" : "#000" }}>Posts</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSelectedTab("events")}
          style={{
            backgroundColor: selectedTab === "events" ? "#2C3036" : "#ccc",
            padding: 10,
            borderRadius: 25,
            marginHorizontal: 5,
            flex: 1,
            alignItems: "center",
          }}
        >
          <Text style={{ color: selectedTab === "events" ? "#fff" : "#000" }}>Events</Text>
        </TouchableOpacity>
      </View>

      {/* Show Posts when "posts" is selected */}
      {selectedTab === "posts" && (
        <View style={{ marginTop: 30, marginHorizontal: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: "bold" }}>Posts</Text>
          <FlatList
            data={posts}
            renderItem={renderPost}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={
              <Text style={{ textAlign: "center", marginTop: 10 }}>No posts found.</Text>
            }
            contentContainerStyle={styles.combinedList}
          />
        </View>
      )}

      {/* Show Events when "events" is selected */}
      {selectedTab === "events" && (
        <View style={{ marginTop: 30, marginHorizontal: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: "bold" }}>Events</Text>
          <FlatList
            data={events}
            renderItem={renderEvent}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={
              <Text style={{ textAlign: "center", marginTop: 10 }}>No events found.</Text>
            }
            contentContainerStyle={styles.combinedList}
          />
        </View>
      )}
        </>
      )}
     
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  postContainer: {
    padding: 15,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    marginBottom: 10,
  },
  combinedList: {
    padding: 16,
    paddingBottom: 100, // Add padding to ensure the last item is visible
  },
  postContent: {
    fontSize: 16,
  },
  postLikes: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  eventItem: {
    padding: 15,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    marginBottom: 10,
  },
  eventName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  eventDescription: {
    fontSize: 16,
    marginTop: 5,
  },
  eventLocation: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  eventDate: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  eventInterested: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  divider: {
    height: 1,
    backgroundColor: "#2C3036",
    marginVertical: 5,
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
  dropdownOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  dropdownMenu: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "80%",
  },
  dropdownHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  dropdownItem: {
    fontSize: 16,
    marginVertical: 5,
  },
});