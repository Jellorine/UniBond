import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  TouchableOpacity,
  BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons for the close icon
import { supabase } from '@/app/lib/supabse';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';

const EditJobScreen: React.FC = () => {
  const { jobId } = useLocalSearchParams(); // Get the job ID from navigation params
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('');
  const [skills, setSkills] = useState('');
  const [deadline, setDeadline] = useState('');
  const [jobPhone, setJobPhone] = useState('');
  const [jobEmail, setJobEmail] = useState('');
  const [jobWebsite, setJobWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [initialData, setInitialData] = useState<any>(null); // Store initial data for comparison

  // Fetch job details
  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .eq('id', jobId)
          .single();

        if (error) {
          console.error('Error fetching job details:', error.message);
          Alert.alert('Error', 'Failed to fetch job details.');
          return;
        }

        // Set all fields from the fetched job data
        setTitle(data.title);
        setCompany(data.company);
        setLocation(data.location);
        setType(data.type);
        setSkills(data.skills);
        setDeadline(data.deadline);
        setJobPhone(data.job_phone);
        setJobEmail(data.job_email);
        setJobWebsite(data.job_website);
        setDescription(data.description);
        setInitialData(data); // Store initial data for comparison
      } catch (error) {
        console.error('Unexpected error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = () => {
    if (!initialData) return false; // No initial data yet

    return (
      title !== initialData.title ||
      company !== initialData.company ||
      location !== initialData.location ||
      type !== initialData.type ||
      skills !== initialData.skills ||
      deadline !== initialData.deadline ||
      jobPhone !== initialData.job_phone ||
      jobEmail !== initialData.job_email ||
      jobWebsite !== initialData.job_website ||
      description !== initialData.description
    );
  };

  // Handle back button press (hardware or cancel button)
  const onBackPress = () => {
    if (hasUnsavedChanges()) {
      Alert.alert(
        'Are you sure?',
        'You have unsaved changes. Are you sure you want to leave?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: () => router.push('/(tabs)/Jobs'),
          },
        ]
      );
      return true; // Prevent default behavior (going back)
    } else {
      router.push('/(tabs)/Jobs'); // Explicitly navigate back if there are no unsaved changes
      return false; // Allow default behavior (going back)
    }
  };

  // Add event listener for hardware back button
  useFocusEffect(
    useCallback(() => {
      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => {
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
      };
    }, [onBackPress])
  );

  // Save updated job details
  const handleSave = async () => {
    if (!title || !company) {
      Alert.alert('Error', 'Title and Company are required.');
      return;
    }

    try {
      const { error } = await supabase
        .from('jobs')
        .update({
          title,
          company,
          location,
          type,
          skills,
          deadline,
          job_phone: jobPhone,
          job_email: jobEmail,
          job_website: jobWebsite,
          description,
        })
        .eq('id', jobId);

      if (error) {
        console.error('Error updating job:', error.message);
        Alert.alert('Error', 'Failed to update job.');
        return;
      }

      Alert.alert('Success', 'Job updated successfully.');
      router.push('/(tabs)/Jobs'); // Go back to the previous screen
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback
      onPress={() => Keyboard.dismiss()} // Dismiss keyboard if open}
    >
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flexContainer}
      >
        <ScrollView style={styles.scrollContainer}>
          {/* Cancel Button */}
          <TouchableOpacity onPress={onBackPress} style={styles.cancelButton}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>

          <Text style={styles.title}>Edit Job</Text>

          {/* Job Title */}
          <TextInput
            placeholder="Job Title *"
            placeholderTextColor="#E53935" // Red for required fields
            value={title}
            onChangeText={setTitle}
            style={styles.input}
          />

          {/* Company */}
          <TextInput
            placeholder="Company *"
            placeholderTextColor="#E53935" // Red for required fields
            value={company}
            onChangeText={setCompany}
            style={styles.input}
          />

          {/* Location */}
          <TextInput
            placeholder="Location"
            placeholderTextColor="#888" // Light gray for optional fields
            value={location}
            onChangeText={setLocation}
            style={styles.input}
          />

          {/* Type */}
          <TextInput
            placeholder="Type (e.g., Full-time, Part-time)"
            placeholderTextColor="#888" // Light gray for optional fields
            value={type}
            onChangeText={setType}
            style={styles.input}
          />

          {/* Skills */}
          <TextInput
            placeholder="Skills (comma-separated)"
            placeholderTextColor="#888" // Light gray for optional fields
            value={skills}
            onChangeText={setSkills}
            style={styles.input}
          />

          {/* Deadline */}
          <TextInput
            placeholder="Deadline (e.g., 2025-12-31)"
            placeholderTextColor="#888" // Light gray for optional fields
            value={deadline}
            onChangeText={setDeadline}
            style={styles.input}
          />

          {/* Job Phone */}
          <TextInput
            placeholder="Job Phone"
            placeholderTextColor="#888" // Light gray for optional fields
            value={jobPhone}
            onChangeText={setJobPhone}
            style={styles.input}
          />

          {/* Job Email */}
          <TextInput
            placeholder="Job Email"
            placeholderTextColor="#888" // Light gray for optional fields
            value={jobEmail}
            onChangeText={setJobEmail}
            style={styles.input}
          />

          {/* Job Website */}
          <TextInput
            placeholder="Job Website"
            placeholderTextColor="#888" // Light gray for optional fields
            value={jobWebsite}
            onChangeText={setJobWebsite}
            style={styles.input}
          />

          {/* Description */}
          <TextInput
            placeholder="Description"
            placeholderTextColor="#888" // Light gray for optional fields
            value={description}
            onChangeText={setDescription}
            multiline
            style={[styles.input, styles.descriptionInput]}
          />

          {/* Save Button */}
          <TouchableOpacity style={styles.editButton} onPress={handleSave}>
            <Text style={styles.editButtonText}>Save changes</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  flexContainer: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 20,
  },
  cancelButton: {
    position: 'absolute',
    top: 2,
    right: 10,
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  descriptionInput: {
    height: 120,
    textAlignVertical: 'top', // Ensures text starts from the top
  },
  editButton: {
    backgroundColor: '#2C3036',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 50,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EditJobScreen;