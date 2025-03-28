import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  BackHandler,
  Alert,
  SafeAreaView,
  Platform,
} from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useAuth } from "../providers/AuthProvider";
import PostOptionItem from "../Components/PostOptionItem";
import { useRoute, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { PostStackParamList } from "./PostNav";
import { router } from "expo-router";
import { supabase } from "../lib/supabse";
import * as FileSystem from "expo-file-system";
import * as mime from "mime";

interface PostData {
  content?: string;
  imageUri?: string;
}

const PostScreen = () => {
  const route = useRoute();
  const navigation = useNavigation<StackNavigationProp<PostStackParamList>>();
  const { profile } = useAuth();

  const [postData, setPostData] = useState<PostData | null>(
    route.params || null
  );
  const [showPreview, setShowPreview] = useState(!!postData);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedVisibility, setSelectedVisibility] = useState("Anyone");
  const [loading, setLoading] = useState(false);

  const storageUrl =
    "https://jnqvgrycauzjnvepqorq.supabase.co/storage/v1/object/public/avatars/";
  const imageUrl = profile.avatar_url
    ? `${storageUrl}${profile.avatar_url}`
    : null;

  //router.push("../(home)/(tabs)/Home");

  const showDiscardAlert = (e?: any) => {
    Alert.alert(
      "Discard Changes?",
      "Are you sure you want to leave without posting?",
      [
        {
          text: "Cancel",
          onPress: () => null,
          style: "cancel",
        },
        {
          text: "Leave",
          onPress: () => {
            router.push("../(home)/(tabs)/Home");
            if (e) e.preventDefault();
          },
        },
      ]
    );
  };

  useEffect(() => {
    const backAction = () => {
      if (showPreview) {
        showDiscardAlert();
        return true;
      }
      router.push("../(home)/(tabs)/Home");
      return true;
    };

    if (Platform.OS === "android") {
      BackHandler.addEventListener("hardwareBackPress", backAction);
    } else {
      const unsubscribe = navigation.addListener("beforeRemove", (e) => {
        if (!showPreview) {
          e.preventDefault();
          showDiscardAlert(e);
        } else {
          router.push("../(home)/(tabs)/Home");
        }
      });

      return () => unsubscribe();
    }

    return () => {
      if (Platform.OS === "android") {
        BackHandler.removeEventListener("hardwareBackPress", backAction);
      }
    };
  }, [showPreview, navigation]);

  const uploadImage = async (uri) => {
    try {
      setLoading(true);
      console.log("Image URI:", uri);

      // Get the file extension
      const fileExt = uri.split(".").pop();
      const timeStamp = Date.now().toString(); // Only timestamp as filename
      const fileName = `${timeStamp}.${fileExt}`;
      const filePath = `${fileName}`; // Correct path here

      // Get MIME type
      const mimeType = mime.default.getType(uri) || `image/${fileExt}`;

      // Read file as a binary data
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error("File does not exist.");
      }

      // Convert image into a file object
      const formData = new FormData();
      formData.append("file", {
        uri: uri,
        name: fileName,
        type: mimeType,
      });

      // Upload the image to Supabase Storage
      let { data, error } = await supabase.storage
        .from("post_images")
        .upload(filePath, formData, {
          contentType: mimeType,
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Error uploading image:", error);
        Alert.alert("Upload Failed", error.message);
        return null;
      }

      console.log("Upload successful:", data);
      return fileName; // Return only the image filename
    } catch (err) {
      console.error("Upload error:", err);
      Alert.alert("Upload Error", "Could not upload image.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handlePostPress = async () => {
    if (!postData || (!postData.content && !postData.imageUri)) {
      console.error("Post cannot be empty");
      return;
    }

    const isPublic = selectedVisibility === "Anyone";

    // Get the local time in your timezone (UTC +5:30)
    const localTime = new Date();
    const timezoneOffset = 5.5 * 60 * 60 * 1000; // Convert 5.5 hours to milliseconds
    const adjustedTime = new Date(localTime.getTime() + timezoneOffset);

    const formattedTime = adjustedTime
      .toISOString()
      .slice(0, 19)
      .replace("T", " "); // Format as 'YYYY-MM-DD HH:mm:ss'

    let image = null;

    try {
      if (postData.imageUri) {
        image = await uploadImage(postData.imageUri);
        if (!image) {
          console.error("Image upload failed, cannot proceed.");
          return;
        }
      }

      const { data: postDataRes, error: postError } = await supabase
        .from("posts")
        .insert([
          {
            user_id: profile.id,
            content: postData.content,
            media_url: image,
            created_at: formattedTime, // Store adjusted time
            is_public: isPublic,
          },
        ])
        .select();

      if (postError) {
        console.error("Error inserting post:", postError);
        Alert.alert("Error", "Failed to post. Please try again.");
      } else {
        console.log("Post inserted successfully:");

        const postId = postDataRes?.[0]?.id; // Extract inserted post ID

        if (!isPublic && postId) {
          await handlePostVisibility(postId, profile.id, formattedTime);
        }

        setPostData(null); // Clear post data
        setShowPreview(false); // Hide preview
        router.push("../(home)/(tabs)/Home");
      }
    } catch (err) {
      console.error("Error with post submission:", err);
    }
  };

  const handlePostVisibility = async (
    postId: number,
    userId: number,
    formattedTime: string
  ) => {
    try {
      const { data: followersData, error: followersError } = await supabase
        .from("followers")
        .select("follower_id")
        .eq("followed_id", userId);

      if (followersError) {
        console.error("Error fetching followers:", followersError);
        return;
      }
      if (!followersData || followersData.length === 0) {
        console.log("No followers found. Post will not be visible.");
        return;
      }

      const visibilityRecords = followersData.map((follower) => ({
        post_id: postId,
        follower_id: follower.follower_id,
        created_at: formattedTime,
      }));

      const { error: postVisibilityError } = await supabase
        .from("post_visibility")
        .insert(visibilityRecords);

      if (postVisibilityError) {
        console.error("Error inserting post visibility:", postVisibilityError);
      }
    } catch (err) {
      console.error("Error with post visibility:", err);
    }
  };

  const toggleModal = () => {
    setModalVisible((prev) => !prev);
  };

  const handleOptionSelect = (option: string) => {
    setSelectedVisibility(option);
    toggleModal();
  };

  const handleCancelPreview = () => {
    setShowPreview(false);
    setPostData(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Custom Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Share Post</Text>
          <TouchableOpacity onPress={handlePostPress}>
            <TouchableOpacity
              onPress={handlePostPress}
              disabled={!postData || (!postData.content && !postData.imageUri)}
            >
              <Text
                style={[
                  styles.postButton,
                  (!postData || (!postData.content && !postData.imageUri)) &&
                    styles.disabledButton,
                ]}
              >
                Post
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        {/* User Info Section */}
        <View style={styles.userInfo}>
          <View style={styles.profileImage}>
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={{ width: 50, height: 50, borderRadius: 25 }}
              />
            ) : (
              <MaterialIcons name="person" size={40} color="#fff" />
            )}
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>
              {profile?.username || "Guest User"}
            </Text>
            <TouchableOpacity
              style={styles.visibilitySelector}
              onPress={toggleModal}
            >
              <MaterialIcons name="public" size={16} color="#000" />
              <Text style={styles.visibilityText}>{selectedVisibility}</Text>
              <MaterialIcons name="arrow-drop-down" size={16} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.promptText}>What do you want to talk about?</Text>

        {/* Conditionally Render Preview */}
        {postData && (postData.content || postData.imageUri) && showPreview && (
          <View style={styles.previewContainer}>
            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelPreview}
            >
              <Text style={styles.cancelText}>X</Text>
            </TouchableOpacity>

            {postData.content ? (
              <Text style={styles.promptText}>{postData.content}</Text>
            ) : null}
            {postData.imageUri ? (
              <Image
                source={{ uri: postData.imageUri }}
                style={styles.imagePreview}
                onError={(error) =>
                  console.log("Image load error:", error.nativeEvent)
                }
              />
            ) : null}
          </View>
        )}

        {/* Post Options */}
        <View style={styles.options}>
          <PostOptionItem
            label="Add a Post"
            icon={<Ionicons name="image-outline" size={24} color="#000" />}
            onPress={() => navigation.navigate("AddPostScreen")}
          />
          <PostOptionItem
            label="Add a Project"
            icon={<Ionicons name="folder" size={24} color="#000" />}
            onPress={() => navigation.navigate("AddProjectScreen")}
          />
          <PostOptionItem
            label="Share a Job"
            icon={<MaterialIcons name="work-outline" size={24} color="#000" />}
            onPress={() => navigation.navigate("AddJobScreen")}
          />
          <PostOptionItem
            label="Share an Event"
            icon={<MaterialIcons name="event" size={24} color="#000" />}
            onPress={() => navigation.navigate("AddEventScreen")}
          />
        </View>

        {/* Visibility Selector Modal */}
        <Modal
          visible={isModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={toggleModal}
        >
          <TouchableOpacity
            style={styles.modalBackground}
            onPress={toggleModal}
            activeOpacity={1}
          >
            <View style={styles.modalContainer}>
              {["Anyone", "My Network"].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.option}
                  onPress={() => handleOptionSelect(option)}
                >
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff", // Set a background color if needed
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  postButton: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007BFF",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  userDetails: {
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  visibilitySelector: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
  },
  visibilityText: {
    fontSize: 14,
    color: "#000",
    marginLeft: 4,
    marginRight: 4,
  },
  promptText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 16,
  },
  previewContainer: {
    borderColor: "#ddd",
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
    position: "relative",
  },
  cancelButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#FF4040",
    borderRadius: 20,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2, // Ensures it's on top
  },
  cancelText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
  },
  options: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 20,
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    width: 200,
  },
  option: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  optionText: {
    fontSize: 16,
    color: "#000",
    textAlign: "center",
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 8,
  },
  disabledButton: {
    color: "#ccc",
  },
  errorText: {
    color: "red",
    fontSize: 14,
    marginTop: 10,
    textAlign: "center",
  },
});

export default PostScreen;
