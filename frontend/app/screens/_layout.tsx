import { Stack } from "expo-router";
const Layout = () => {
  return (
    <Stack>
      <Stack.Screen
        name="PostScreen"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="AddPostScreen"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="AddProjectScreen"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="DonationScreen"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="AddJobScreen"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="AddEventScreen"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="EditEventScreen"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ProfileScreen"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ShowProfileEdit"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="DetailsForStudents"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="OnScreen"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="DonationDetailsScreen"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="EditPostScreen"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="EditJobScreen"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="JobDetailScreen"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
};

export default Layout;
