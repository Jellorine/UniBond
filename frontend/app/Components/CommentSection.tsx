import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  StyleSheet,
  Image,
} from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useAuth } from "../providers/AuthProvider";
import { supabase } from "../lib/supabse";
import CommentActions from "./CommentActions";

interface Comment {
  id: string;
  content: string;
  user_id: string;
  username: string;
  created_at: string;
}

interface CommentSectionProps {
  postId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ postId }) => {
  const { session, profile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [commentToDelete, setCommentToDelete] = useState<Comment | null>(null);

  const storageUrl =
    "https://jnqvgrycauzjnvepqorq.supabase.co/storage/v1/object/public/avatars/";

  // Fetch comments related to the current post
  const fetchComments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("comments")
        .select(
          "id, content, user_id, username, created_at,profiles(avatar_url)"
        )
        .eq("post_id", postId);

      if (error) {
        throw error;
      }

      const formattedComments = data.map((comment) => ({
        ...comment,
        avatar_url: comment.profiles?.avatar_url
          ? `${storageUrl}${comment.profiles.avatar_url}`
          : null,
      }));

      setComments(formattedComments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      Alert.alert("Error", "Failed to fetch comments.");
    } finally {
      setLoading(false);
    }
  };

  // Submit a new comment
  const handleCommentSubmit = async () => {
    if (newComment.trim()) {
      try {
        const { error } = await supabase.from("comments").insert([
          {
            content: newComment,
            user_id: session?.user?.id,
            username: profile?.username || "Unknown",
            post_id: postId,
            created_at: new Date().toISOString(),
          },
        ]);

        if (error) {
          console.error("Error inserting comment:", error);
          Alert.alert("Error", "Failed to submit comment.");
        } else {
          setNewComment(""); // Reset input
          fetchComments(); // Refresh comments
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        Alert.alert("Error", "An unexpected error occurred.");
      }
    } else {
      Alert.alert("Please enter a comment.");
    }
  };

  // Delete a comment
  const handleDeleteComment = async () => {
    if (commentToDelete) {
      try {
        const { error } = await supabase
          .from("comments")
          .delete()
          .eq("id", commentToDelete.id);

        if (error) {
          console.error("Error deleting comment:", error);
          Alert.alert("Error", "Failed to delete comment.");
        } else {
          setComments(
            comments.filter((comment) => comment.id !== commentToDelete.id)
          );
          setCommentToDelete(null); // Clear selected comment
        }
      } catch (error) {
        console.error("Error deleting comment:", error);
        Alert.alert("Error", "An unexpected error occurred.");
      }
    }
  };

  // Fetch comments when component mounts or postId changes
  useEffect(() => {
    fetchComments();
  }, [postId]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`;
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Comment Icon and Count */}
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={styles.commentIconContainer}
      >
        <Ionicons name="chatbubble-outline" size={24} color="blue" />
        <Text style={styles.commentCount}>{comments.length}</Text>
      </TouchableOpacity>

      {/* Modal for comments */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.closeModalButton}
            >
              <Ionicons name="close" size={24} color="gray" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Comments</Text>

            {/* Comments List */}
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                return (
                  <TouchableOpacity
                    onLongPress={() => {
                      if (item.user_id === session?.user?.id) {
                        setCommentToDelete(item); // Set comment for deletion
                      }
                    }}
                    style={styles.commentItem}
                  >
                    {/* User Avatar */}
                    <View style={styles.avatarContainer}>
                      {item.avatar_url ? (
                        <Image
                          source={{ uri: item.avatar_url }}
                          style={{ width: 50, height: 50, borderRadius: 25 }}
                        />
                      ) : (
                        <MaterialIcons name="person" size={40} color="#fff" />
                      )}
                    </View>
                    {/* Comment Content */}
                    <View style={styles.commentContent}>
                      <Text style={styles.username}>{item.username}</Text>
                      <Text style={styles.commentTimestamp}>
                        {formatTimestamp(item.created_at)}
                      </Text>
                      <Text>{item.content}</Text>
                      <CommentActions
                        commentId={item.id}
                        userId={session?.user?.id}
                      />
                    </View>
                  </TouchableOpacity>
                );
              }}
            />

            {/* New Comment Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={newComment}
                onChangeText={setNewComment}
                placeholder="Add a comment..."
              />
              <TouchableOpacity
                onPress={handleCommentSubmit}
                style={styles.sendButton}
              >
                <Ionicons name="send" size={24} color="blue" />
              </TouchableOpacity>
            </View>

            {/* Delete Confirmation Modal */}
            {commentToDelete && (
              <Modal
                transparent={true}
                animationType="fade"
                visible={!!commentToDelete}
                onRequestClose={() => setCommentToDelete(null)}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.deleteModalContainer}>
                    <Text>Are you sure you want to delete this comment?</Text>
                    <TouchableOpacity
                      onPress={handleDeleteComment}
                      style={styles.deleteButton}
                    >
                      <Text style={{ color: "red" }}>Delete</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setCommentToDelete(null)}
                      style={styles.cancelButton}
                    >
                      <Text>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  commentIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  commentCount: {
    marginLeft: 5,
    fontSize: 16,
    color: "blue",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "60%",
  },
  closeModalButton: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  commentItem: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  avatarContainer: {
    marginRight: 10,
  },
  commentContent: {
    flex: 1,
  },
  username: {
    fontWeight: "bold",
  },
  commentTimestamp: {
    fontSize: 12,
    color: "gray",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    padding: 10,
    marginRight: 10,
  },
  sendButton: {
    padding: 10,
  },
  deleteModalContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  deleteButton: {
    marginTop: 20,
  },
  cancelButton: {
    marginTop: 10,
  },
});

export default CommentSection;
