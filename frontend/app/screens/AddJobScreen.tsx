import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Image,
  SafeAreaView,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  BackHandler,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import {useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from "../providers/AuthProvider";
import { supabase } from "../lib/supabse";

const AddJobScreen = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [skills, setSkills] = useState("");
  const [deadline, setDeadline] = useState("");
  const [jobPhone, setJobPhone] = useState("");
  const [jobEmail, setJobEmail] = useState("");
  const [jobWebsite, setJobWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [media, setMedia] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);


  const hasUnsavedChanges = () => {
    return (
      title.trim() !== "" ||
      company.trim() !== "" ||
      location.trim() !== "" ||
      type.trim() !== "" ||
      skills.trim() !== "" ||
      deadline.trim() !== "" ||
      jobPhone.trim() !== "" ||
      jobEmail.trim() !== "" ||
      jobWebsite.trim() !== "" ||
      description.trim() !== "" ||
      media !== null
    );
  };

    // Handle back button press (hardware or cancel button)
    const onBackPress = () => {
      if (hasUnsavedChanges()) {
        Alert.alert(
          "Are you sure?",
          "You have unsaved changes. Are you sure you want to leave?",
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Leave",
              style: "destructive",
              onPress: () => router.back(),
            },
          ]
        );
        return true; // Prevent default behavior (going back)
      }else{
        router.back();
        return false; // Allow default behavior (going back)
      }

    };

    // Add event listener for hardware back button
  useFocusEffect(
    React.useCallback(() => {
      BackHandler.addEventListener("hardwareBackPress", onBackPress);

      return () => {
        BackHandler.removeEventListener("hardwareBackPress", onBackPress);
      };
    }, [onBackPress])
  );


  // Media picker for image selection
  const handleMediaPicker = useCallback(async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission Required", "You need to allow access to your media library.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets?.length) {
      const asset = result.assets[0]; // Access the first asset
      setMedia(asset.uri); // Set the URI of the image
    }
  }, []);

  // Function to upload the image to Supabase storage
  const uploadImage = async (imageUri: string) => {
    try {
      const fileExt = imageUri.split(".").pop();
      const imageName = `${Date.now()}.${fileExt}`;
      const response = await fetch(imageUri);
      const fileData = await response.arrayBuffer();

      const { data, error } = await supabase.storage
        .from("job_Images")
        .upload(`${imageName}`, fileData);

      if (error) throw new Error(error.message);

      return data?.path; // Return the stored image name
    } catch (error) {
      console.error("Image upload error:", error);
      return null;
    }
  };

  // Function to handle job posting
  const handleJobSubmit = useCallback(async () => {
    if (!title.trim() || !company.trim()) {
      Alert.alert("Error", "Title and Company are required.");
      return;
    }

    if (jobEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(jobEmail)) {
      Alert.alert("Error", "Please enter a valid email. ex-: www.example@gmail.com");
      return;
    }

    if (jobPhone.trim() && !/^\d+$/.test(jobPhone)) {
      Alert.alert("Error", "Phone number should contain only digits.");
      return;
    }

    if (deadline.trim()) {
      const parsedDate = Date.parse(deadline);
      if (isNaN(parsedDate)) {
        Alert.alert("Error", "Please enter a valid date. ex-: 2025-06-12");
        return;
      }
    }

    setIsLoading(true);
    let imageName = null;

    try {
      if (media) {
        console.log("Uploading image...");
        imageName = await uploadImage(media);
      }

      console.log("Inserting job data...");
      const { error } = await supabase.from("jobs").insert([
        {
          title: title.trim(),
          company: company.trim(),
          location: location.trim() || null,
          type: type.trim() || null,
          skills: skills.trim() || null,
          deadline: deadline.trim() || null,
          job_phone: jobPhone.trim() || null,
          job_email: jobEmail.trim() || null,
          job_website: jobWebsite.trim() || null,
          description: description.trim() || null,
          image_url: imageName ? imageName : null,
          user_id: user?.id,
        },
      ]);

      if (error) throw new Error(error.message);

      Alert.alert("Success", "Job posted successfully!");
      router.push('/(tabs)/Jobs');
    } catch (error: any) {
      Alert.alert("Error", error.message);
      console.error("Job submission error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [title, company, location, type, skills, deadline, jobPhone, jobEmail, jobWebsite, description, media, user]);



  return (
    <TouchableWithoutFeedback
      onPress={() => Keyboard.dismiss()} // Dismiss keyboard if open}
    >
    <SafeAreaView style={styles.safeArea}>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flexContainer} >

        <View style={styles.container}>
          {isLoading && <ActivityIndicator size="large" color="#0000ff" style={styles.loadingIndicator} />}
          <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>Post a Job</Text>

            <TouchableOpacity onPress={onBackPress} style={styles.cancelButton}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>

            {media && (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: media }} style={styles.imagePreview} />
                <TouchableOpacity style={styles.closeButton} onPress={() => setMedia(null)}>
                  <Ionicons name="close-circle" size={24} color="red" />
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity style={styles.selectImage} onPress={handleMediaPicker}>
              <Ionicons name="image-outline" size={24} />
              <Text>Select Image</Text>
            </TouchableOpacity>


            {/* <Text style={styles.label}>Job Title <Text style={styles.required}>*</Text> </Text> */}
            <TextInput
              style={styles.input}
              placeholder="Job Title *"
              placeholderTextColor="#E53935" // red
              value={title}
              onChangeText={setTitle}
            />
            {/* <Text style={styles.label}>Company <Text style={styles.required}>*</Text> </Text> */}
            <TextInput
              style={styles.input}
              placeholder="Company *"
              placeholderTextColor="#E53935" // red
              value={company}
              onChangeText={setCompany}
            />
            {/* <Text style={styles.label}>Location</Text> */}
            <TextInput
              style={styles.input}
              placeholder="Location"
              placeholderTextColor="#888" // Light gray
              value={location}
              onChangeText={setLocation}
            />
            {/* <Text style={styles.label}>Job Type</Text> */}
            <TextInput
              style={styles.input}
              placeholder="Job Type (e.g., Full-time / online)"
              placeholderTextColor="#888" // Light gray
              value={type}
              onChangeText={setType}
            />
            {/* <Text style={styles.label}>Skills</Text> */}
            <TextInput
              style={styles.input}
              placeholder="Skills (comma separated)"
              placeholderTextColor="#888" // Light gray
              value={skills}
              onChangeText={setSkills}
            />
            {/* <Text style={styles.label}>Application Deadline</Text> */}
            <TextInput
              style={styles.input}
              placeholder="Application Deadline (y-m-d)"
              placeholderTextColor="#888" // Light gray
              value={deadline}
              onChangeText={setDeadline}
            />
            {/* <Text style={styles.label}>Phone</Text> */}
            <TextInput
              style={styles.input}
              placeholder="Phone"
              placeholderTextColor="#888" // Light gray
              value={jobPhone}
              onChangeText={setJobPhone}
            />
            {/* <Text style={styles.label}>Email</Text> */}
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#888" // Light gray
              value={jobEmail}
              onChangeText={setJobEmail}
            />
            {/* <Text style={styles.label}>Website</Text> */}
            <TextInput
              style={styles.input}
              placeholder="Website"
              placeholderTextColor="#888" // Light gray
              value={jobWebsite}
              onChangeText={setJobWebsite}
            />
            {/* <Text style={styles.label}>Job Description</Text> */}
            <TextInput
              style={[styles.input, styles.descriptionInput]}
              placeholder="Additional information"
              placeholderTextColor="#888" // Light gray
              value={description}
              onChangeText={setDescription}
              multiline={true}  // Enables multiline input
              numberOfLines={4}  // Sets default height (optional)
              textAlignVertical="top"  // Aligns text to the top
            />

            <TouchableOpacity style={styles.postButton} onPress={handleJobSubmit}>
              <Text style={styles.postButtonText}>Post Job</Text>
            </TouchableOpacity>

          </ScrollView>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default AddJobScreen;

const styles = StyleSheet.create({
  scrollContainer: {
    paddingBottom: 20,
  },
  flexContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  cancelButton: {
    position: "absolute",
    top: 2,
    right: 10,
    zIndex: 1,
  },
  selectImage: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    marginTop: 10,
  },
  required: {
    color: "red",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  descriptionInput: {
    height: 120,
    textAlignVertical: "top",  // Ensures text starts from the top
  },
  imagePreviewContainer: {
    position: "relative",
    alignItems: "center",
    marginVertical: 10,
  },
  imagePreview: {
    width: '80%',
    aspectRatio: 1,
    borderRadius: 5,
  },
  closeButton: {
    position: "absolute",
    top: 5,
    right: 40,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 12,
  },
  postButton: {
    backgroundColor: "#2C3036",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  postButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingIndicator: {
    position: "absolute",
    top: "50%",
    left: "50%",
  },
});
