import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert, TouchableWithoutFeedback, Keyboard, Linking } from 'react-native';
import { Ionicons, MaterialIcons, Entypo } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface JobCardProps {
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
  avatar_url?: string | null;
  full_name?: string;
  image_url: string | null;
  created_at: string;
  jobId: string;
  savedJobs: string[];
  onSaveJob: (jobId: string) => void;
  user_id: string;
  currentUserId?: string;
  onDeleteJob?: (jobId: string, image_url: string | null) => void;
}

const JobCard: React.FC<JobCardProps> = ({
  title,
  company,
  location,
  type,
  skills,
  deadline,
  job_phone,
  job_email,
  job_website,
  description,
  avatar_url,
  full_name,
  image_url,
  created_at,
  jobId,
  savedJobs,
  onSaveJob,
  user_id,
  currentUserId,
  onDeleteJob,
}) => {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [avatarError, setAvatarError] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const menuRef = useRef<TouchableOpacity>(null!);

  const isOwner = currentUserId === user_id;

  const handleDeleteJob = () => {
    setMenuVisible(false);
    Alert.alert(
      "Delete Job",
      "Are you sure you want to delete this job posting?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDeleteJob?.(jobId, image_url)
        }
      ]
    );
  };

  const getRelativeTime = (createdAt: string) => {
    const now = new Date();
    const createdDate = new Date(createdAt);
    const diffInSeconds = Math.floor((now.getTime() - createdDate.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min${Math.floor(diffInSeconds / 60) > 1 ? 's' : ''} ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hour${Math.floor(diffInSeconds / 3600) > 1 ? 's' : ''} ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} day${Math.floor(diffInSeconds / 86400) > 1 ? 's' : ''} ago`;

    return createdDate.toLocaleDateString();
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        if (menuVisible) setMenuVisible(false);
      }}
      accessible={false} // Ensures it doesn't interfere with screen readers
    >
      <View style={styles.container} accessible={true} accessibilityLabel={`Job posting for ${title} at ${company}`}>
        <View style={styles.headerContainer}>
          <View style={styles.profileContainer}>
            <TouchableOpacity
              onPress={() => {
                router.push({
                  pathname: '/screens/ProfileScreen',
                  params: { userId: user_id },
                });
              }}
              accessible={true}
              accessibilityLabel={`View profile of ${full_name}`}
              accessibilityRole="button"
            >
              {avatar_url && !avatarError ? (
                <View>
                  {avatarLoading && <ActivityIndicator style={styles.loadingIndicator} />}
                  <Image
                    source={{ uri: avatar_url }}
                    style={[styles.avatar, avatarLoading && styles.hidden]}
                    onLoad={() => setAvatarLoading(false)}
                    onError={() => setAvatarError(true)}
                  />
                </View>
              ) : (
                <Ionicons name="person-circle" size={40} color="gray" />
              )}
            </TouchableOpacity>
            <View>
              <Text style={styles.name}>{full_name}</Text>
              <Text style={styles.date}>{getRelativeTime(created_at)}</Text>
            </View>
          </View>


          {isOwner && (
            <TouchableOpacity
              ref={menuRef}
              onPress={() => setMenuVisible(!menuVisible)}
              style={styles.menuButton}
              accessible={true}
              accessibilityLabel="More options"
              accessibilityRole="button"
            >
              <Entypo name="dots-three-vertical" size={20} color="gray" />
            </TouchableOpacity>
          )}

          {menuVisible && (
            <View style={styles.menuContainer}>
              {/* Edit Button */}
              <TouchableOpacity
                onPress={() => {
                  setMenuVisible(false); // Close the menu
                  router.push({
                    pathname: '/screens/EditJobScreen', // Replace with your edit screen path
                    params: { jobId: jobId }, // Pass the job ID to the edit screen
                  });
                }}
                style={styles.menuItem}
              >
                <MaterialIcons name="edit" size={20} color="#007BFF" />
                <Text style={[styles.menuItemText, { color: '#007BFF' }]}>Edit Job</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleDeleteJob} style={styles.menuItem}>
                <MaterialIcons name="delete" size={20} color="red" />
                <Text style={styles.menuItemText}>Delete Job</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={() => {
            router.push({
              pathname: '/screens/JobDetailScreen',
              params: { jobId: jobId, image_url: image_url }, // Pass the job ID to the detail screen
            });
          }}
        >
          <View style={styles.card}>
            <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">{title}</Text>
            {company && <Text style={styles.company}>at {company}</Text>}

            {image_url && !imageError && (
              <View style={styles.imageContainer}>
                {imageLoading && <ActivityIndicator style={styles.loadingIndicator} />}
                <Image
                  source={{ uri: image_url }}
                  style={[styles.image, imageLoading && styles.hidden]}
                  onLoad={() => setImageLoading(false)}
                  onError={() => setImageError(true)}
                />
              </View>
            )}

            <View style={styles.details}>
              {location && (
                <View style={styles.row}>
                  <MaterialIcons name="location-on" size={20} color="gray" />
                  <Text style={styles.detailText}>{location}</Text>
                </View>
              )}
              {type && (
                <View style={styles.row}>
                  <Ionicons name="briefcase-outline" size={20} color="gray" />
                  <Text style={styles.detailText}>{type}</Text>
                </View>
              )}
              {skills && (
                <View style={styles.row}>
                  <MaterialIcons name="article" size={20} color="gray" />
                  <Text style={styles.detailText}>{truncateText(skills, 100)}</Text>
                </View>
              )}
              {deadline && (
                <View style={styles.row}>
                  <MaterialIcons name="event" size={20} color="gray" />
                  <Text style={styles.detailText}>{deadline}</Text>
                </View>
              )}

              {(job_phone || job_email || job_website) && (
                <View>
                  {job_phone && (
                    <TouchableOpacity style={styles.row} onPress={() => Linking.openURL(`tel:${job_phone}`)}>
                      <MaterialIcons name="phone" size={20} color="gray" />
                      <Text style={styles.detailText}>{job_phone}</Text>
                    </TouchableOpacity>
                  )}
                  {job_email && (
                    <TouchableOpacity style={styles.row} onPress={() => Linking.openURL(`mailto:${job_email}`)}>
                      <MaterialIcons name="email" size={20} color="gray" />
                      <Text style={styles.detailText}>{job_email}</Text>
                    </TouchableOpacity>
                  )}
                  {job_website && (
                    <TouchableOpacity
                      style={styles.row}
                      onPress={() => {
                        const fullUrl = job_website.startsWith('http') ? job_website : `https://${job_website}`;
                        Linking.openURL(fullUrl);
                      }}
                      accessibilityRole="link"
                    >
                      <MaterialIcons name="public" size={20} color="gray" />
                      <Text style={styles.detailText}>{truncateText(job_website, 30)}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                onPress={() => onSaveJob(jobId)}
                style={styles.iconButton}
                accessible={true}
                accessibilityLabel={savedJobs.includes(jobId) ? "Remove from saved jobs" : "Save this job"}
                accessibilityRole="button"
              >
                <Ionicons
                  name={savedJobs.includes(jobId) ? "bookmark" : "bookmark-outline"}
                  size={30}
                  color="#000"
                />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    marginHorizontal: 10,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    position: 'absolute',
    top: 40,
    right: 10,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 9999, // Add this line to make sure it appears above all other elements
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  menuItemText: {
    marginLeft: 8,
    color: 'red',
    fontSize: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
    color: 'gray',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  company: {
    fontSize: 14,
    color: 'gray',
    marginBottom: 15,
    textAlign: 'center',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    marginBottom: 10,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  loadingIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -10 }, { translateY: -10 }],
  },
  hidden: {
    opacity: 0,
  },
  details: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: 'gray',
  },
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  iconButton: {
    padding: 6,
    borderRadius: 50,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default JobCard;