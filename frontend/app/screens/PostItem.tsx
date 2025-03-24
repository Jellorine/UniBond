import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Image, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabse";
import CommentSection from "../Components/CommentSection";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PostItem = ({
  post,
  username,
  onLike,
  onCommentSubmit,
  onLikeComment,
  onDeleteComment,
}) => {
  const [hasLiked, setHasLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const bounceAnim = new Animated.Value(1);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const postImageSize = 260;

  useEffect(() => {
    if (post.media_url) {
      fetchImageUrl(post.media_url);
    }

    const checkIfLiked = async () => {
      const likedStatus = await AsyncStorage.getItem(`liked-${post.id}`);
      if (likedStatus === "true") {
        setHasLiked(true);
      }
    };

    checkIfLiked();
  }, [post.media_url]);

  // Fetch the image URL from Supabase Storage
  const fetchImageUrl = async (filePath) => {
    try {
      const { data, error } = await supabase.storage
        .from("post_images")
        .download(filePath);
      if (error) throw error;

      const fr = new FileReader();
      fr.readAsDataURL(data);
      fr.onload = () => {
        setImageUrl(fr.result as string);
      };
    } catch (error) {
      console.error("Error downloading image:", error.message);
    }
  };

  // Handle Like Button Click
  const handleLikeToggle = async () => {
    const newHasLiked = !hasLiked;
    const newLikeCount = newHasLiked ? likeCount + 1 : likeCount - 1;

    setHasLiked(newHasLiked);
    setLikeCount(newLikeCount);

    await AsyncStorage.setItem(`liked-${post.id}`, newHasLiked.toString());

    // Animation effect
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: 1.2,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(bounceAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      onLike(post.id, newHasLiked);
    } catch (error) {
      console.error("Error updating like count:", error);
      setHasLiked(!newHasLiked);
      setLikeCount(likeCount);
    }
  };

  return (
    <View style={styles.postContainer}>
      {/* Post Content */}
      <Text style={styles.postContent}>{post.content}</Text>

      {/* Post Image */}
      <View>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={[
              { height: postImageSize, width: postImageSize },
              styles.image,
            ]}
            accessibilityLabel="Post Image"
          />
        ) : (
          <View
            style={[
              { height: postImageSize, width: postImageSize },
              styles.noImage,
            ]}
          >
            <Text style={styles.noImageText}>No Image</Text>
          </View>
        )}
      </View>

      {/* Like & Comment Buttons */}
      <View style={styles.postActions}>
        {/* Like Post */}
        <TouchableOpacity
          onPress={handleLikeToggle}
          style={styles.actionButton}
        >
          <Animated.View style={{ transform: [{ scale: bounceAnim }] }}>
            <Ionicons
              name="heart"
              size={24}
              color={hasLiked ? "red" : "gray"}
            />
          </Animated.View>
          <Text>{likeCount}</Text>
        </TouchableOpacity>

        {/* Comment Section */}
        <CommentSection
          postId={post.id}
          comments={post.comments}
          onCommentSubmit={onCommentSubmit}
          onLikeComment={onLikeComment}
          onDeleteComment={onDeleteComment}
        />
      </View>
    </View>
  );
};

export default PostItem;

const styles = {
  postContainer: {
    padding: 10,
    backgroundColor: "white",
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postContent: {
    fontSize: 16,
    marginBottom: 10,
  },
  image: {
    borderRadius: 8,
    resizeMode: "cover",
  },
  noImage: {
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  noImageText: {
    color: "#888",
  },
  postActions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
  },
};
