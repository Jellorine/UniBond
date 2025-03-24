import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import PostScreen from "./PostScreen";
import AddPostScreen from "./AddPostScreen";
import AddEventScreen from "./AddEventScreen";
import AddJobScreen from "./AddJobScreen";
import AddProjectScreen from "./AddProjectScreen";
import EditJobScreen from "./EditJobScreen";
import JobDetailScreen from "./JobDetailScreen";

export type PostStackParamList = {
  PostScreen: { content?: string; imageUri?: string | null };
  AddPostScreen: undefined;
  AddEventScreen: undefined;
  AddJobScreen: undefined;
  AddProjectScreen: undefined;
  EditJobScreen: undefined;
  JobDetailScreen: undefined;
};

const Stack = createStackNavigator<PostStackParamList>();

const PostNav = () => {
  return (
    <Stack.Navigator initialRouteName="PostScreen">
      <Stack.Screen name="PostScreen" component={PostScreen} />
      <Stack.Screen name="AddPostScreen" component={AddPostScreen} />
      <Stack.Screen name="AddEventScreen" component={AddEventScreen} />
      <Stack.Screen name="AddJobScreen" component={AddJobScreen} />
      <Stack.Screen name="AddProjectScreen" component={AddProjectScreen} />
      <Stack.Screen name="EditJobScreen" component={EditJobScreen} />
      <Stack.Screen name="JobDetailScreen" component={JobDetailScreen} />
    </Stack.Navigator>
  );
};

export default PostNav;
