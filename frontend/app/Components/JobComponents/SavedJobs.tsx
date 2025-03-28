import React, { useEffect, useState, useRef } from "react";
import { View, FlatList, ActivityIndicator, Alert, Text, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import JobCard from './JobCard';
import { supabase } from "@/app/lib/supabse";
import { deleteJob } from './DeleteFunction'; // Import the delete function
import ScrollToTopButton from './ScrollToTopButton'; // Import the ScrollToTopButton component

interface JobListing {
  id: string;
  user_id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  skills: string;
  description: string;
  is_active: boolean;
  deadline: string;
  job_phone: string;
  job_website: string;
  job_email: string;
  image_url: string | null;
  created_at: string;
  avatar_url?: string | null;
  full_name?: string;
}

const SavedJobs: React.FC = () => {
  const [jobListings, setJobListings] = useState<JobListing[]>([]);
  const [user, setUser] = useState<any>(null);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showScrollToTopButton, setShowScrollToTopButton] = useState<boolean>(false); // State for scroll-to-top button visibility

  const flatListRef = useRef<FlatList>(null); // Ref for the FlatList

  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoading(true);
      try {
        // Fetch the logged-in user
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) {
          console.error("Error fetching user:", userError.message);
          return;
        }
        setUser(userData?.user);

        // Fetch saved jobs for this user
        if (userData?.user) {
          const { data: savedJobs, error: savedJobsError } = await supabase
            .from("saved_jobs")
            .select("job_id")
            .eq("user_id", userData.user.id);

          if (savedJobsError) {
            console.error("Error fetching saved jobs:", savedJobsError.message);
            return;
          }

          // Get the list of job IDs
          const savedJobIdsList = savedJobs.map((job) => job.job_id);
          setSavedJobIds(savedJobIdsList);

          // Fetch jobs based on saved job IDs
          const { data: jobs, error: jobsError } = await supabase
            .from("jobs")
            .select("*")
            .in("id", savedJobIdsList)
            .order("created_at", { ascending: false }); // Sort by created_at in descending order;

          if (jobsError) {
            console.error("Error fetching jobs:", jobsError.message);
            return;
          }

          // Fetch user profile data
          const userIds = jobs.map((job) => job.user_id);
          const { data: profiles, error: profilesError } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url")
            .in("id", userIds);

          if (profilesError) {
            console.error("Error fetching profiles:", profilesError.message);
            return;
          }

          // Map profile data to jobs
          const SUPABASE_STORAGE_URL = "https://jnqvgrycauzjnvepqorq.supabase.co/storage/v1/object/public/";

          const jobsWithProfiles = jobs.map((job) => {
            const profile = profiles.find((p) => p.id === job.user_id);
            return {
              ...job,
              avatar_url: profile?.avatar_url ? `${SUPABASE_STORAGE_URL}avatars/${profile.avatar_url}` : null,
              full_name: profile?.full_name || "Unknown",
              image_url: job.image_url ? `${SUPABASE_STORAGE_URL}job_Images/${job.image_url}` : null,
            };
          });

          setJobListings(jobsWithProfiles);
        }
      } catch (error) {
        console.error("Unexpected error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, []);


  const unsaveJob = async (jobId: string) => {
    if (!user) {
      Alert.alert("Authentication Required", "Please log in to unsave jobs.");
      return;
    }

    try {
      // Remove job from saved_jobs table
      const { error } = await supabase
        .from("saved_jobs")
        .delete()
        .eq("user_id", user.id)
        .eq("job_id", jobId);

      if (error) {
        console.error("Error unsaving job:", error.message);
        Alert.alert("Error", "Failed to remove job.");
      } else {
        // Remove the job from savedJobIds and jobListings state immediately
        setSavedJobIds((prev) => prev.filter((id) => id !== jobId));
        setJobListings((prev) => prev.filter((job) => job.id !== jobId)); // Remove from jobListings as well

        Alert.alert("Unsaved", "The job has been unsaved successfully.");
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  };

  // Handle scroll event to show/hide the scroll-to-top button
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    if (offsetY > 300) {
      setShowScrollToTopButton(true);
    } else {
      setShowScrollToTopButton(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 10 }}>
      {isLoading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      ) : (
        <>
          <FlatList
            ref={flatListRef}
            data={jobListings}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <JobCard
                {...item}
                jobId={item.id}
                savedJobs={savedJobIds}
                onSaveJob={unsaveJob}
                currentUserId={user?.id}
                onDeleteJob={() => deleteJob(item.id, item.image_url, setJobListings)}
              />
            )}
            onScroll={handleScroll} // Add scroll handler
            scrollEventThrottle={16} // Ensure smooth scrolling
            ListEmptyComponent={
              <View style={{ alignItems: "center", justifyContent: "center", marginTop: 20 }}>
                <Text style={{ fontSize: 16, color: "gray" }}>No saved jobs found.</Text>
              </View>
            }
          />
          {/* Add the ScrollToTopButton */}
          <ScrollToTopButton
            flatListRef={flatListRef}
            visible={showScrollToTopButton}
          />
        </>
      )}
    </View>
  );
};

export default SavedJobs;