import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Project_conditionbar() {
  // State to track the active tab
  const [activeTab, setActiveTab] = useState<string | null>(null);

  // Function to handle tab press
  const handleTabPress = (tabName: string) => {
    setActiveTab(tabName);
  };

  return (
    <View style={styles.container}>
      {/* Available Tab */}
      <TouchableOpacity
        style={[styles.tab, activeTab === 'Available' && styles.activeTab]}
        onPress={() => handleTabPress('Available')}
        activeOpacity={0.7}
      >
        <Ionicons
          name="person"
          size={24}
          color={activeTab === 'Available' ? '#2C3036' : '#8E8E93'}
        />
        <Text
          style={[
            styles.tabText,
            activeTab === 'Available' && styles.activeText,
          ]}
        >
          Available
        </Text>
      </TouchableOpacity>

      {/* Saved Tab */}
      <TouchableOpacity
        style={[styles.tab, activeTab === 'Saved' && styles.activeTab]}
        onPress={() => handleTabPress('Saved')}
        activeOpacity={0.7}
      >
        <Ionicons
          name="bookmark"
          size={24}
          color={activeTab === 'Saved' ? '#2C3036' : '#8E8E93'}
        />
        <Text
          style={[
            styles.tabText,
            activeTab === 'Saved' && styles.activeText,
          ]}
        >
          Saved
        </Text>
      </TouchableOpacity>

      {/* Status Tab */}
      <TouchableOpacity
        style={[styles.tab, activeTab === 'Status' && styles.activeTab]}
        onPress={() => handleTabPress('Status')}
        activeOpacity={0.7}
      >
        <Ionicons
          name="time"
          size={24}
          color={activeTab === 'Status' ? '#2C3036' : '#8E8E93'}
        />
        <Text
          style={[
            styles.tabText,
            activeTab === 'Status' && styles.activeText,
          ]}
        >
          Status
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#f9f9f9',
  },
  tab: {
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  tabText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 5,
  },
  activeText: {
    color: '#2C3036',
  },
});
