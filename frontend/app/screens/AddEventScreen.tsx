import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  BackHandler,
  SafeAreaView,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabse";
import { useAuth } from "../providers/AuthProvider";
import type { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation } from "@react-navigation/native";

import { PostStackParamList } from "./PostNav";

const EventScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation<StackNavigationProp<PostStackParamList>>();
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState<Date | null>(null);
  const [eventLocation, setEventLocation] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const backAction = () => {
      if (hasChanges) {
        Alert.alert("", "Discard the changes?", [
          { text: "Cancel", onPress: () => null, style: "cancel" },
          { text: "YES", onPress: () => navigation.navigate("PostScreen") },
        ]);
        return true;
      } else {
        navigation.navigate("PostScreen");
        return true;
      }
    };

    BackHandler.addEventListener("hardwareBackPress", backAction);

    return () => {
      BackHandler.removeEventListener("hardwareBackPress", backAction);
    };
  }, [hasChanges, navigation]);

  const handlePost = async () => {
    if (!eventName || !eventDate || !eventLocation) {
      Alert.alert("Error", "Please fill in all required fields!");
      return;
    }

    if (!user) {
      Alert.alert("Error", "User is not authenticated.");
      return;
    }

    const { id: userId } = user;
    const currentDate = new Date();
    const datePosted = currentDate.toISOString();

    try {
      const { data, error } = await supabase.from("events").insert([
        {
          uid: userId,
          event_name: eventName,
          event_date: eventDate.toISOString().split("T")[0],
          event_location: eventLocation,
          event_description: eventDescription,
          date_posted: datePosted,
        },
      ]);

      if (error) {
        console.log("Error:", error);
        Alert.alert("Error", "Error posting event: " + error.message);
      } else {
        console.log("Event posted successfully:", data);
        Alert.alert("Success", "Event successfully posted!");
        navigation.navigate("PostScreen");
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      Alert.alert("Error", "An unexpected error occurred.");
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setEventDate(selectedDate);
      setHasChanges(true);
    }
  };

  const handleCancel = () => {
    setEventName("");
    setEventDate(null);
    setEventLocation("");
    setEventDescription("");
    setHasChanges(false);
    navigation.navigate("PostScreen");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>Create Event</Text>
        <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
          <Ionicons name="close" size={24} color="#000" />
        </TouchableOpacity>

        {/* Event Name Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Event Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter event name"
            value={eventName}
            onChangeText={(text) => {
              setEventName(text);
              setHasChanges(true);
            }}
          />
        </View>

        {/* Event Date Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Event Date</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateText}>
              {eventDate
                ? eventDate.toISOString().split("T")[0]
                : "Select a date"}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={eventDate || new Date()}
              mode="date"
              display="default"
              onChange={onDateChange}
            />
          )}
        </View>

        {/* Event Location Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Event Location</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter event location"
            value={eventLocation}
            onChangeText={(text) => {
              setEventLocation(text);
              setHasChanges(true);
            }}
          />
        </View>

        {/* Event Description Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Event Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter event description"
            value={eventDescription}
            onChangeText={(text) => {
              setEventDescription(text);
              setHasChanges(true);
            }}
            multiline
            numberOfLines={4}
          />
        </View>

        <TouchableOpacity style={styles.postButton} onPress={handlePost}>
          <Text style={styles.postButtonText}>Post</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EventScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff", // Set a background color if needed
  },
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  header: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 20,
  },
  cancelButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
  },
  dateInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
  },
  dateText: {
    fontSize: 16,
    color: "#999",
  },
  textArea: {
    textAlignVertical: "top",
    height: 100,
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
});
