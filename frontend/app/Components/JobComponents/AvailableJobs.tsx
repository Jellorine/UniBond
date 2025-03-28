import React, { useEffect, useState, useRef } from 'react';
import { View, FlatList, ActivityIndicator, Alert, Text, TextInput, StyleSheet, NativeSyntheticEvent, NativeScrollEvent, TouchableOpacity } from 'react-native';
import { supabase } from '@/app/lib/supabse'; // Assuming this path
import { deleteJob } from './DeleteFunction'; // Import the delete function
import { MaterialIcons } from '@expo/vector-icons'; // Import MaterialIcons
import JobCard from './JobCard';
import ScrollToTopButton from './ScrollToTopButton';

interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  skills: string;
  deadline: string;
  job_phone: string;
  job_email: string;
  job_website: string;
  description: string;
  avatar_url: string | null;
  full_name: string;
  image_url: string | null;
  created_at: string;
  user_id: string;
}

const AvailableJobs: React.FC = () => {
  const [originalJobListings, setOriginalJobListings] = useState<JobListing[]>([]); // Store original job listings
  const [jobListings, setJobListings] = useState<JobListing[]>([]); // Store displayed job listings
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMoreJobs, setHasMoreJobs] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showScrollToTopButton, setShowScrollToTopButton] = useState<boolean>(false);

  const flatListRef = useRef<FlatList>(null);

  // Fetch jobs with pagination
  const fetchJobs = async (page: number, pageSize: number = 10) => {
    try {
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (jobsError) {
        console.error('Error fetching jobs:', jobsError.message);
        return;
      }

      const userIds = jobs.map((job) => job.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError.message);
        return;
      }

      const SUPABASE_STORAGE_URL = 'https://jnqvgrycauzjnvepqorq.supabase.co/storage/v1/object/public/';

      const jobsWithProfiles = jobs.map((job) => {
        const profile = profiles.find((p) => p.id === job.user_id);
        return {
          ...job,
          avatar_url: profile?.avatar_url ? `${SUPABASE_STORAGE_URL}avatars/${profile.avatar_url}` : null,
          full_name: profile?.full_name || 'Unknown',
          image_url: job.image_url ? `${SUPABASE_STORAGE_URL}job_Images/${job.image_url}` : null,
        };
      });

      return jobsWithProfiles;
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  };

  // Load more jobs for infinite scrolling
  const loadMoreJobs = async () => {
    if (!hasMoreJobs || isLoadingMore) return;

    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    const newJobs = await fetchJobs(nextPage);

    if (newJobs && newJobs.length > 0) {
      setOriginalJobListings((prevJobs) => [...prevJobs, ...newJobs]); // Update original job listings
      setJobListings((prevJobs) => [...prevJobs, ...newJobs]); // Update displayed job listings
      setCurrentPage(nextPage);
    } else {
      setHasMoreJobs(false);
    }

    setIsLoadingMore(false);
  };

  // Fetch initial jobs and user info
  useEffect(() => {
    const loadInitialJobs = async () => {
      setIsLoading(true);
      const jobs = await fetchJobs(1);
      if (jobs) {
        setOriginalJobListings(jobs); // Set original job listings
        setJobListings(jobs); // Set displayed job listings
      }
      setIsLoading(false);
    };

    const getUserAndSavedJobs = async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Error fetching user:', userError.message);
        return;
      }
      setUser(userData?.user);

      if (userData?.user) {
        const { data: savedJobs, error: savedJobsError } = await supabase
          .from('saved_jobs')
          .select('job_id')
          .eq('user_id', userData.user.id);

        if (savedJobsError) {
          console.error('Error fetching saved jobs:', savedJobsError.message);
        } else {
          setSavedJobIds(savedJobs.map((job) => job.job_id));
        }
      }
    };

    loadInitialJobs();
    getUserAndSavedJobs();
  }, []);

  // Save or unsave a job
  const saveJob = async (jobId: string) => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please log in to save jobs.');
      return;
    }

    try {
      if (savedJobIds.includes(jobId)) {
        const { error } = await supabase.from('saved_jobs').delete().eq('user_id', user.id).eq('job_id', jobId);

        if (error) {
          console.error('Error unsaving job:', error.message);
          Alert.alert('Error', 'Failed to remove job.');
        } else {
          setSavedJobIds((prev) => prev.filter((id) => id !== jobId));
          Alert.alert('Unsaved', 'The job has been unsaved successfully.');
        }
      } else {
        const { error } = await supabase.from('saved_jobs').insert([{ user_id: user.id, job_id: jobId }]);

        if (error) {
          console.error('Error saving job:', error.message);
          Alert.alert('Error', 'Failed to save job.');
        } else {
          setSavedJobIds((prev) => [...prev, jobId]);
          Alert.alert('Saved', 'The job has been saved successfully.');
        }
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  };

  // Search bar logic
  const handleSearch = async (query: string) => {
    setIsLoading(true);

    if (query === '') {
      // If the search query is empty, reset to the original job listings
      setJobListings(originalJobListings);
    } else {
      // If there's a search query, filter the original job listings
      const filteredJobs = originalJobListings.filter((job) => {
        const lowerCaseQuery = query.toLowerCase();

        return (
          job.title?.toLowerCase().includes(lowerCaseQuery) ||
          job.company?.toLowerCase().includes(lowerCaseQuery) ||
          (job.location?.toLowerCase().includes(lowerCaseQuery) ?? false) ||
          (job.skills?.toLowerCase().includes(lowerCaseQuery) ?? false) ||
          (job.type?.toLowerCase().includes(lowerCaseQuery) ?? false) ||
          (job.description?.toLowerCase().includes(lowerCaseQuery) ?? false)
        );
      });
      setJobListings(filteredJobs);
    }

    setIsLoading(false);
  };

  // Scroll to top button logic
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
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#888" style={styles.icon} />
        <TextInput
          placeholder="Search jobs..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text); // Update the searchQuery state
            handleSearch(text);   // Perform the search or reset to original listings
          }}
          style={styles.searchInput}
        />
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      ) : (
        <>
          <FlatList
            ref={flatListRef}
            data={jobListings}
            renderItem={({ item }) => (
              <JobCard
                {...item}
                jobId={item.id}
                savedJobs={savedJobIds}
                onSaveJob={saveJob}
                currentUserId={user?.id}
                onDeleteJob={() => deleteJob(item.id, item.image_url, setJobListings)}
              />
            )}
            keyExtractor={(item) => item.id}
            onEndReached={loadMoreJobs}
            onEndReachedThreshold={0.5}
            onScroll={handleScroll} // Add the scroll handler
            scrollEventThrottle={16} // Ensure smooth scrolling
            ListFooterComponent={
              isLoadingMore ? (
                <ActivityIndicator size="large" color="#0000ff" />
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.noResultsContainer}>
                <Text style={styles.noResultsText}>No results found</Text>
              </View>
            }
          />

          {/* Use the ScrollToTopButton component */}
          <ScrollToTopButton
            flatListRef={flatListRef}
            visible={showScrollToTopButton}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 50,
    paddingHorizontal: 16,
    marginHorizontal: 10,
    marginBottom: 10,
  },
  icon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  noResultsText: {
    fontSize: 16,
    color: '#888',
  },
  scrollToTopButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#0000ff',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});

export default AvailableJobs;