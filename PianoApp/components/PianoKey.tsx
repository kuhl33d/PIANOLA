import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { Audio } from 'expo-av';

interface PianoKeyProps {
  note: string;
  octave: number;
  isBlack?: boolean;
  frequency: number;
  keyWidth: number;
  onKeyPress: (keyId: string, frequency: number) => void;
  onKeyRelease: () => void;
  isPressed?: boolean;
  keyboardKey?: string; // For computer keyboard mapping
}

const PianoKey: React.FC<PianoKeyProps> = ({ 
  note, 
  octave,
  isBlack = false, 
  frequency, 
  keyWidth,
  onKeyPress,
  onKeyRelease,
  isPressed = false,
  keyboardKey
}) => {
  const keyId = `${note}${octave}`;

  const handlePressIn = async () => {
    onKeyPress(keyId, frequency);
  };

  const handlePressOut = () => {
    onKeyRelease();
  };

  return (
    <TouchableOpacity
      style={[
        styles.key,
        isBlack ? styles.blackKey : styles.whiteKey,
        { width: keyWidth },
        isPressed && (isBlack ? styles.blackKeyPressed : styles.whiteKeyPressed)
      ]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.8}
    >
      <Text style={[
        styles.noteText, 
        isBlack && styles.blackKeyText,
        isPressed && styles.pressedText
      ]}>
        {note}
      </Text>
      {keyboardKey && (
        <Text style={[
          styles.keyboardKeyText,
          isBlack && styles.blackKeyboardKeyText
        ]}>
          {keyboardKey}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  key: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    position: 'relative',
  },
  whiteKey: {
    backgroundColor: '#fff',
    height: 180,
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  blackKey: {
    backgroundColor: '#000',
    height: 110,
    marginLeft: -12,
    marginRight: -12,
    zIndex: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  whiteKeyPressed: {
    backgroundColor: '#FFD700',
    transform: [{ scale: 0.98 }],
  },
  blackKeyPressed: {
    backgroundColor: '#FFA500',
    transform: [{ scale: 0.95 }],
  },
  noteText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  blackKeyText: {
    color: '#fff',
  },
  pressedText: {
    color: '#333',
    fontSize: 14,
  },
  keyboardKeyText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '600',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    overflow: 'hidden',
  },
  blackKeyboardKeyText: {
    color: '#ccc',
    backgroundColor: '#333',
  },
});

export default PianoKey;