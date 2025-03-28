import React, { useState, useEffect } from "react";
import {
  TouchableOpacity,
  Text,
  View,
  Alert,
  TextInput,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabse";
import { useAuth } from "../providers/AuthProvider";

interface CommentActionsProps {
  commentId: number;
  userId: string;
}

interface Reply {
  id: number;
  user_id: string;
  content: string;
  created_at: string;
  user_name: string;
  profile_pic: string;
}

const CommentActions: React.FC<CommentActionsProps> = ({
  commentId,
  userId,
}) => {
  const [reply, setReply] = useState<string>(""); // Store the reply text
  const [showReplies, setShowReplies] = useState<boolean>(false); // Show replies state
  const [replies, setReplies] = useState<Reply[]>([]); // Replies data
  const [likeCount, setLikeCount] = useState<number>(0);
  const [loveCount, setLoveCount] = useState<number>(0);
  const [replyCount, setReplyCount] = useState<number>(0);
  const { profile } = useAuth(); // Fetch profile info
  const [userReaction, setUserReaction] = useState<{
    like: boolean;
    love: boolean;
  }>({
    like: false,
    love: false,
  });

  // Fetch reaction counts
  const fetchReactionCounts = async () => {
    try {
      const { data: likes } = await supabase
        .from("reactions")
        .select("id")
        .eq("comment_id", commentId)
        .eq("reaction_type", "like");

      const { data: loves } = await supabase
        .from("reactions")
        .select("id")
        .eq("comment_id", commentId)
        .eq("reaction_type", "love");

      const { data: replies } = await supabase
        .from("reactions")
        .select("id")
        .eq("comment_id", commentId)
        .eq("reaction_type", "reply");

      const { data: userReactions } = await supabase
        .from("reactions")
        .select("reaction_type")
        .eq("comment_id", commentId)
        .eq("user_id", userId);

      const userHasLiked = userReactions?.some(
        (r) => r.reaction_type === "like"
      );
      const userHasLoved = userReactions?.some(
        (r) => r.reaction_type === "love"
      );

      setLikeCount(likes?.length || 0);
      setLoveCount(loves?.length || 0);
      setReplyCount(replies?.length || 0);
      setUserReaction({ like: userHasLiked, love: userHasLoved });
    } catch (error) {
      console.error("Error fetching reactions:", error);
    }
  };

  // Fetch replies
  const fetchReplies = async () => {
    try {
      const { data, error } = await supabase
        .from("reactions")
        .select("id, user_id, content, created_at")
        .eq("comment_id", commentId)
        .eq("reaction_type", "reply")
        .order("created_at", { ascending: true });

      if (error) throw error;

      const userIds = data?.map((reply) => reply.user_id);

      const { data: users } = await supabase
        .from("profiles")
        .select("username, avatar_url, id")
        .in("id", userIds);

      const formattedReplies = data?.map((reply) => {
        const user = users?.find((user) => user.id === reply.user_id);

        const user_name = user?.username || "Anonymous"; // Fallback to "Anonymous"
        const storageUrl =
          "https://jnqvgrycauzjnvepqorq.supabase.co/storage/v1/object/public/avatars/";
        const profile_pic = user?.avatar_url
          ? `${storageUrl}${user.avatar_url}`
          : "default_profile_pic_url";

        return {
          id: reply.id,
          user_id: reply.user_id,
          content: reply.content,
          created_at: reply.created_at,
          user_name,
          profile_pic,
        };
      });

      setReplies(formattedReplies || []);
    } catch (error) {
      console.error("Error fetching replies:", error);
    }
  };

  useEffect(() => {
    fetchReactionCounts();
  }, []);

  // Toggle replies visibility
  const toggleReplies = () => {
    if (!showReplies) fetchReplies();
    setShowReplies(!showReplies);
  };

  // Handle reactions (like, love)
  const handleReaction = async (reactionType: "like" | "love") => {
    try {
      const isReacted = userReaction[reactionType];

      if (isReacted) {
        await supabase
          .from("reactions")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", userId)
          .eq("reaction_type", reactionType);
      } else {
        await supabase.from("reactions").insert([
          {
            user_id: userId,
            reaction_type: reactionType,
            comment_id: commentId,
            content: null,
          },
        ]);
      }

      fetchReactionCounts();
    } catch (error) {
      console.error("Error updating reaction:", error);
      Alert.alert("Error", "Failed to update reaction.");
    }
  };

  // Handle reply submission
  const handleReply = async () => {
    if (reply.trim() === "") {
      Alert.alert("Error", "Please enter a reply.");
      return;
    }

    try {
      await supabase.from("reactions").insert([
        {
          user_id: userId,
          reaction_type: "reply",
          comment_id: commentId,
          content: reply,
        },
      ]);

      setReply("");
      fetchReplies();
      fetchReactionCounts();
    } catch (error) {
      console.error("Error sending reply:", error);
      Alert.alert("Error", "Failed to send reply.");
    }
  };

  const deleteReply = async (replyId: number) => {
    try {
      await supabase.from("reactions").delete().eq("id", replyId);

      fetchReplies();
      fetchReactionCounts();
    } catch (error) {
      console.error("Error deleting reply:", error);
      Alert.alert("Error", "Failed to delete the reply.");
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`;
  };

  return (
    <View style={{ marginTop: 10 }}>
      {/* Reaction and Reply Buttons */}
      <View
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}
      >
        <TouchableOpacity
          onPress={() => handleReaction("like")}
          style={{ marginRight: 20 }}
        >
          <Ionicons
            name="thumbs-up"
            size={22}
            color={userReaction.like ? "blue" : "gray"}
          />
          <Text style={{ fontSize: 12 }}>{likeCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleReaction("love")}
          style={{ marginRight: 20 }}
        >
          <Ionicons
            name="heart"
            size={22}
            color={userReaction.love ? "red" : "gray"}
          />
          <Text style={{ fontSize: 12 }}>{loveCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={toggleReplies}>
          <Text style={{ color: "blue", fontSize: 14 }}>Reply</Text>
          <Text style={{ fontSize: 12, color: "blue", textAlign: "center" }}>
            {replyCount}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Display replies if any */}
      {showReplies && (
        <FlatList
          data={replies}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 5,
                borderBottomWidth: 0.5,
                borderBottomColor: "#eee",
              }}
            >
              <Image
                source={{ uri: item.profile_pic }}
                style={{ width: 24, height: 24, borderRadius: 12 }}
              />
              <View style={{ marginLeft: 10 }}>
                <Text style={{ fontWeight: "bold", fontSize: 14 }}>
                  {item.user_name}
                </Text>
                <Text style={{ fontSize: 14, color: "#333" }}>
                  {item.content}
                </Text>
                <Text style={{ fontSize: 12, color: "gray" }}>
                  {formatTimestamp(item.created_at)}
                </Text>
              </View>
              {item.user_id === userId && (
                <TouchableOpacity
                  onPress={() => deleteReply(item.id)}
                  style={{ marginLeft: 10 }}
                >
                  <Ionicons name="trash" size={20} color="red" />
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}

      {/* Reply Input Field - Show only when 'Reply' is clicked */}
      {showReplies && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 20,
            paddingHorizontal: 10,
            paddingVertical: 5,
            marginVertical: 5,
          }}
        >
          <TextInput
            value={reply}
            onChangeText={setReply}
            placeholder="Write a reply..."
            style={{ flex: 1, fontSize: 14 }}
          />
          <TouchableOpacity onPress={handleReply} disabled={reply === ""}>
            <Ionicons name="send" size={22} color={reply ? "blue" : "gray"} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default CommentActions;
