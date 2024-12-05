import { View, Text } from "react-native";
import ChatList from "./Components/ChatList";

const index = () => {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f8f9fa",
      }}
    >
      <Text style={{ fontSize: 32, fontWeight: "bold", color: "#0078D7" }}>
        UniBond
      </Text>
      <ChatList></ChatList>
    </View>
  );
};

export default index;