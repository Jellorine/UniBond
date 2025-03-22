import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  Linking,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../lib/supabse';
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons for the cancel button
import * as Sharing from 'expo-sharing'; // Import expo-sharing
import * as FileSystem from 'expo-file-system'; // Import expo-file-system

const JobDetailScreen = () => {
  const { jobId, image_url } = useLocalSearchParams(); // Get the jobId from the route params
  const imageUrl = image_url as string; // Explicitly cast to string
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // Use the router to navigate back
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        // Fetch job details
        const { data: jobData, error: jobError } = await supabase
          .from('jobs')
          .select('*')
          .eq('id', jobId)
          .single();

        if (jobError) throw jobError;

        setJob(jobData);
      } catch (error) {
        console.error('Error fetching job details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId]);


  // Function to share the job image
  const shareImage = async () => {
    if (!imageUrl) return;

    try {
      // Download the image to the device
      const fileUri = `${FileSystem.cacheDirectory}job_image.jpg`;
      const { uri } = await FileSystem.downloadAsync(imageUrl, fileUri);

      // Share the downloaded image using expo-sharing
      await Sharing.shareAsync(uri, {
        dialogTitle: 'Share Job Image',
        mimeType: 'image/jpeg', // Specify the MIME type
      });
    } catch (error) {
      console.error('Error sharing image:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Job not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Container for Cancel and Share Buttons */}
      <View style={styles.buttonContainer}>
      {imageUrl && (
          <TouchableOpacity onPress={shareImage} style={styles.shareButton}>
            <Ionicons name="share-social" size={22} color="#000" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/Jobs')} // Navigate back to the previous screen
          style={styles.cancelButton}
        >
          <Ionicons name="close" size={24} color="#000" />
        </TouchableOpacity>

      </View>



      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Job Title and Company */}
        <Text style={styles.title}>{job.title}</Text>
        <Text style={styles.company}>at {job.company}</Text>

        {/* Job Image */}
        {imageUrl && (
          <View style={styles.imageContainer}>
            {imageLoading && <ActivityIndicator style={styles.loadingIndicator} />}
            {imageError ? (
              <Text style={styles.errorText}>Failed to load image</Text>
            ) : (
              <Image
                source={{ uri: imageUrl }}
                style={[styles.image, imageLoading && styles.hidden]}
                onLoad={() => setImageLoading(false)}
                onError={() => {
                  setImageLoading(false);
                  setImageError(true);
                }}
              />
            )}
          </View>
        )}

        {/* Job Details */}
        <View style={styles.detailsContainer}>
          {job.location && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Location:</Text>
              <Text style={styles.detailText}>{job.location}</Text>
            </View>
          )}

          {job.type && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Job Type:</Text>
              <Text style={styles.detailText}>{job.type}</Text>
            </View>
          )}

          {job.skills && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Skills:</Text>
              <Text style={styles.detailText}>{job.skills}</Text>
            </View>
          )}

          {job.deadline && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Deadline:</Text>
              <Text style={styles.detailText}>{job.deadline}</Text>
            </View>
          )}

          {job.job_phone && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Phone:</Text>
              <Text style={styles.phoneNumberText} onPress={() => Linking.openURL(`tel:${job.job_phone}`)}>{job.job_phone}</Text>
            </View>
          )}

          {job.job_email && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email:</Text>
              <Text style={styles.emailText} onPress={() => Linking.openURL(`mailto:${job.job_email}`)}>{job.job_email}</Text>
            </View>
          )}

          {job.job_website && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Website:</Text>
              <Text
                style={[styles.detailText, styles.link]}
                onPress={() =>{
                  const fullUrl = job.job_website.startsWith('http') ? job.job_website : `https://${job.job_website}`;
                  Linking.openURL(fullUrl);
                }
                }
              >
                {job.job_website}
              </Text>
            </View>
          )}
        </View>

        {/* Job Description */}
        {job.description && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Description:</Text>
          </View>
        )}
        <Text style={styles.description}>{job.description}</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 2,
    textAlign: 'left',
    paddingHorizontal: 16,
  },
  company: {
    fontSize: 18,
    color: 'gray',
    marginBottom: 30,
    textAlign: 'left',
    paddingHorizontal: 16,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    marginBottom: 16,
  },
  loadingIndicator: {
    position: 'absolute',
  },
  hidden: {
    opacity: 0,
  },
  detailsContainer: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontWeight: 'bold',
    marginRight: 8,
    width: 80, // Fixed width for labels
  },
  detailText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  phoneNumberText: {
    flex: 1,
    fontSize: 16,
    color: '#007BFF',
  },
  emailText: {
    flex: 1,
    fontSize: 16,
    color: '#007BFF',
  },
  link: {
    color: '#007BFF',
    textDecorationLine: 'underline',
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: '#fff',
  },
  cancelButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Semi-transparent background
    borderRadius: 20,
  },
  shareButton: {
    marginRight: 16, // Add spacing between buttons
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
});

export default JobDetailScreen;