import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  StyleSheet,
  BackHandler,
  SafeAreaView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { MaterialIcons } from "@expo/vector-icons";
import type { StackNavigationProp } from "@react-navigation/stack";
import { PostStackParamList } from "./PostNav";
import { useNavigation } from "expo-router";

const AddPostScreen = () => {
  const navigation = useNavigation<StackNavigationProp<PostStackParamList>>();
  const [content, setContent] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);

  // Function to pick an image from the gallery
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  // Function to handle posting content and/or image
  const handlePost = () => {
    if (!content && !imageUri) {
      Alert.alert("Empty Post", "Please enter text or select an image.");
      return;
    }
    navigation.navigate("PostScreen", { content, imageUri });
  };

  // Function to handle discard confirmation when back is pressed
  const handleBackPress = () => {
    if (content || imageUri) {
      Alert.alert("Discard Changes?", "Your changes will be lost.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => {
            // Navigate back without passing any params
            navigation.navigate("PostScreen");
          },
        },
      ]);
      return true; // Prevent default back action
    } else {
      navigation.navigate("PostScreen"); // If no content/image, go back to PostScreen directly
      return true; // Prevent default back action
    }
  };

  // Handle back button press using BackHandler
  useEffect(() => {
    const backAction = () => {
      return handleBackPress(); // Call the back handler function
    };

    BackHandler.addEventListener("hardwareBackPress", backAction);

    return () => {
      BackHandler.removeEventListener("hardwareBackPress", backAction);
    };
  }, [content, imageUri]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Create Post</Text>
        </View>

        {/* Input Field */}
        <TextInput
          style={styles.input}
          placeholder="What's on your mind?"
          value={content}
          onChangeText={setContent}
          multiline
        />

        {/* Image Picker */}
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          <MaterialIcons name="image" size={30} color="#000" />
          <Text style={styles.imageText}>Add an image</Text>
        </TouchableOpacity>

        {/* Image Preview */}
        {imageUri && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => setImageUri(null)}
            >
              <MaterialIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* Post Button */}
        <TouchableOpacity style={styles.postButton} onPress={handlePost}>
          <Text style={styles.postButtonText}>Post</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff", // Set a background color if needed
  },
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  header: {
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  input: {
    fontSize: 16,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    minHeight: 100,
  },
  imagePicker: { flexDirection: "row", alignItems: "center", marginTop: 16 },
  imageText: { marginLeft: 8, fontSize: 16, color: "black" },
  imageContainer: { marginTop: 10, alignItems: "center" },
  imagePreview: { width: 250, height: 200, borderRadius: 10 },
  removeImageButton: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "red",
    borderRadius: 15,
    padding: 4,
  },
  postButton: {
    backgroundColor: "#2C3036",
    paddingVertical: 12,
    marginTop: 20,
    borderRadius: 5,
    alignItems: "center",
  },
  postButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
});

export default AddPostScreen;
