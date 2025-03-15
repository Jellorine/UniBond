import { Alert } from 'react-native';
import { supabase } from '@/app/lib/supabse'; // Adjust the path if needed

export const deleteJob = async (jobId: string, imageUrl: string | null, setJobListings: Function) => {
  try {
    // If the job has an image, delete it from storage
    if (imageUrl) {
      const imagePath = imageUrl.split('/').pop(); // Extract the image name

      if (imagePath) {
        const { error: imageDeleteError } = await supabase.storage
          .from('job_Images')
          .remove([imagePath]);

        if (imageDeleteError) {
          console.error('Error deleting job image:', imageDeleteError.message);
          Alert.alert('Error', 'Failed to delete job image.');
          return;
        }
      }
    }

    // Delete related records from saved_jobs
    const { error: savedJobsError } = await supabase
      .from('saved_jobs')
      .delete()
      .eq('job_id', jobId);

    if (savedJobsError) {
      console.error('Error deleting saved jobs:', savedJobsError.message);
      Alert.alert('Error', 'Failed to delete saved job references.');
      return;
    }

    // Delete the job itself
    const { error: jobError } = await supabase
      .from('jobs')
      .delete()
      .eq('id', jobId);

    if (jobError) {
      console.error('Error deleting job:', jobError.message);
      Alert.alert('Error', 'Failed to delete the job.');
      return;
    }

    // Update state to remove the deleted job
    setJobListings((prevJobs: any) => prevJobs.filter((job: any) => job.id !== jobId));
    Alert.alert('Success', 'Job deleted successfully.');
  } catch (error) {
    console.error('Unexpected error:', error);
    Alert.alert('Error', 'An unexpected error occurred.');
  }
};
