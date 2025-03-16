import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Project_topbar() {
  return (
    <View style={styles.container}>
      {/* Back Button */}
      {/* <TouchableOpacity style={styles.button} onPress={() => alert('Back Button Pressed')}>
        <Ionicons name="chevron-back" size={24} color="black" />
      </TouchableOpacity> */}

      {/* Title */}
      <Text style={styles.title}>Projects</Text>

      {/* Right Button
      <TouchableOpacity style={styles.button} onPress={() => alert('Right Button Pressed')}>
        <Ionicons name="ellipsis-horizontal" size={24} color="black" />
      </TouchableOpacity> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 60,
    backgroundColor: '#ffffff',
  },
  button: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
});
