import * as React from "react";
import {
  Text,
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  SafeAreaView,
} from "react-native";
import SearchBar from "../../Components/SearchBar";
import { supabase } from "../../../lib/supabse"; // Import your Supabase client
import { useRouter } from "expo-router";

// Define the type for the profiles table
interface Profile {
  id: string;
  username: string;
  // Add other fields as needed
}

const Search = () => {
  const [searchResults, setSearchResults] = React.useState<Profile[]>([]);
  const router = useRouter();

  const handleSearch = async (query: string) => {
    if (query.trim() === "") {
      setSearchResults([]);
      return;
    }

    try {
      // Modify query to match usernames starting with the search query
      const { data, error } = await supabase
        .from<"profiles", Profile>("profiles")
        .select("*")
        .ilike("username", `${query}%`); // Matches usernames that start with the query

      if (error) throw error;

      setSearchResults(data || []);
    } catch (error) {
      console.error("Error fetching profiles:", error);
      setSearchResults([]);
    }
  };

  const handleUserPress = (user: Profile) => {
    Keyboard.dismiss(); // Dismiss the keyboard when a user is selected
    router.push({
      pathname: "/screens/ProfileScreen",
      params: { userId: user.id },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <SearchBar placeholder="Search here..." onSearch={handleSearch} />
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultItem}
              onPress={() => handleUserPress(item)}
            >
              <Text>{item.username}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text>No results found</Text>}
          keyboardShouldPersistTaps="handled"
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Search;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff", // Set a background color if needed
  },
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#fff",
  },
  resultItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
});
