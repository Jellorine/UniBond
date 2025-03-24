import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { supabase } from "../../lib/supabse";

// Function to get and store the push token
export async function registerForPushNotifications(userId: string) {
  // Request notification permissions
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") {
    const { status: newStatus } = await Notifications.requestPermissionsAsync();
    if (newStatus !== "granted") {
      console.log("Push notification permission denied");
      return;
    }
  }

  // Get the Expo push token
  let token;
  if (Constants.isDevice) {
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log("Expo Push Token:", token);
  } else {
    console.log("Must use a physical device for Push Notifications");
  }

  // Save the token in Supabase
  if (token) {
    const { error } = await supabase
      .from("user_push_tokens") // Ensure this table exists
      .upsert([{ user_id: userId, expo_push_token: token }], {
        onConflict: ["user_id"],
      });

    if (error) {
      console.error("Error saving push token:", error);
    } else {
      console.log("Push token saved successfully!");
    }
  }
}
