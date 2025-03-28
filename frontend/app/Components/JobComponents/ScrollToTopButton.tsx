import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface ScrollToTopButtonProps {
  flatListRef: React.RefObject<any>; // Reference to the FlatList
  visible: boolean; // Whether the button should be visible
  style?: ViewStyle; // Optional custom styles
}

const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({ flatListRef, visible, style }) => {
  if (!visible) return null; // Don't render if not visible

  return (
    <TouchableOpacity
      style={[styles.scrollToTopButton, style]}
      onPress={() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }}
    >
      <MaterialIcons name="arrow-upward" size={24} color="#fff" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  scrollToTopButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#D3D3D3',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});

export default ScrollToTopButton;