import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, ScrollView, Text } from 'react-native';
import PianoKey from './PianoKey';

const { width: screenWidth } = Dimensions.get('window');

interface Note {
  note: string;
  octave: number;
  frequency: number;
  isBlack: boolean;
  keyboardKey?: string;
}

interface PianoProps {
  currentOctave: number;
  onKeyPress: (keyId: string, frequency: number) => void;
  onKeyRelease: (keyId?: string) => void;
  pressedKey?: string;
  pressedKeys?: Set<string>;
  visibleNotes?: number;
  numOctaves?: number;
}

const Piano: React.FC<PianoProps> = ({ 
  currentOctave, 
  onKeyPress, 
  onKeyRelease, 
  pressedKey, 
  pressedKeys,
  visibleNotes = 14,
  numOctaves = 7
}) => {
  // Generate notes for all octaves
  const keyboardMappings = [
    'A', 'W', 'S', 'E', 'D', 'F', 'T', 'G', 'Y', 'H', 'U', 'J'
  ];
  const notePatterns = [
    { note: 'C', isBlack: false },
    { note: 'C#', isBlack: true },
    { note: 'D', isBlack: false },
    { note: 'D#', isBlack: true },
    { note: 'E', isBlack: false },
    { note: 'F', isBlack: false },
    { note: 'F#', isBlack: true },
    { note: 'G', isBlack: false },
    { note: 'G#', isBlack: true },
    { note: 'A', isBlack: false },
    { note: 'A#', isBlack: true },
    { note: 'B', isBlack: false },
  ];
  const notes: Note[] = [];
  for (let octave = 1; octave <= numOctaves; octave++) {
    const baseFrequency = 261.63; // C4
    const octaveMultiplier = Math.pow(2, octave - 4);
    notePatterns.forEach((pattern, index) => {
      const semitoneOffset = index;
      const frequency = baseFrequency * octaveMultiplier * Math.pow(2, semitoneOffset / 12);
      notes.push({
        ...pattern,
        octave,
        frequency,
        keyboardKey: keyboardMappings[index]
      });
    });
  }
  const whiteKeys = notes.filter(note => !note.isBlack);
  const blackKeys = notes.filter(note => note.isBlack);

  // Allow horizontal scrolling over all white keys
  const [scrollIndex, setScrollIndex] = useState(0);
  const maxScroll = Math.max(0, whiteKeys.length - visibleNotes);
  const handleScroll = (event: any) => {
    const x = event.nativeEvent.contentOffset.x;
    const keyWidth = (screenWidth - 40) / visibleNotes;
    const idx = Math.round(x / keyWidth);
    setScrollIndex(Math.min(Math.max(idx, 0), maxScroll));
  };
  const visibleWhiteKeys = whiteKeys.slice(scrollIndex, scrollIndex + visibleNotes);
  const visibleBlackKeys = blackKeys.filter(bk => {
    const idx = whiteKeys.findIndex(wk => wk.note === bk.note && wk.octave === bk.octave);
    return idx >= scrollIndex && idx < scrollIndex + visibleNotes;
  });

  // Calculate key width based on visible notes
  const keyWidth = (screenWidth - 40) / visibleWhiteKeys.length;

  // Helper to get key id
  const getKeyId = (note: Note) => `${note.note}${note.octave}`;

  // (removed duplicate getKeyId)

  // Render white and black keys
  const whiteKeyElements = visibleWhiteKeys.map((note, index) => (
    <PianoKey
      key={getKeyId(note)}
      note={note.note}
      octave={note.octave}
      isBlack={false}
      frequency={note.frequency}
      keyWidth={keyWidth}
      onKeyPress={onKeyPress}
      onKeyRelease={() => onKeyRelease(getKeyId(note))}
      isPressed={pressedKeys ? pressedKeys.has(getKeyId(note)) : pressedKey === getKeyId(note)}
      keyboardKey={note.keyboardKey}
    />
  ));

  // Black key positions relative to white keys
  const blackKeyOffsets = [0.65, 1.65, 3.15, 4.15, 5.15];
  const blackKeyElements = visibleBlackKeys.map((note, idx) => {
    // Find the position of the black key in the visible window
    const whiteIdx = whiteKeys.findIndex(wk => wk.note === note.note.replace('#','') && wk.octave === note.octave);
    let offset = 0;
    switch (note.note) {
      case 'C#': offset = 0.65; break;
      case 'D#': offset = 1.65; break;
      case 'F#': offset = 3.15; break;
      case 'G#': offset = 4.15; break;
      case 'A#': offset = 5.15; break;
      default: offset = 0;
    }
    // Position relative to the visible window
    const relIdx = whiteKeys.findIndex((wk, i) => i >= scrollIndex && wk.note === note.note.replace('#','') && wk.octave === note.octave) - scrollIndex;
    return (
      <View
        key={`black-${getKeyId(note)}`}
        style={[
          styles.blackKeyWrapper,
          { left: (relIdx + offset) * keyWidth }
        ]}
      >
        <PianoKey
          note={note.note}
          octave={note.octave}
          isBlack={true}
          frequency={note.frequency}
          keyWidth={keyWidth * 0.6}
          onKeyPress={onKeyPress}
          onKeyRelease={() => onKeyRelease(getKeyId(note))}
          isPressed={pressedKeys ? pressedKeys.has(getKeyId(note)) : pressedKey === getKeyId(note)}
          keyboardKey={note.keyboardKey}
        />
      </View>
    );
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.octaveTitle}>Octave {currentOctave}</Text>
        <Text style={styles.instruction}>Tap keys or use keyboard: A W S E D F T G Y H U J</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.pianoContainer}>
          {/* White keys layer */}
          <View style={styles.whiteKeysContainer}>
            {whiteKeyElements}
          </View>
          {/* Black keys layer */}
          <View style={styles.blackKeysContainer}>
            {blackKeyElements}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f8f8',
    borderRadius: 15,
    margin: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 15,
  },
  octaveTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  instruction: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  pianoContainer: {
    position: 'relative',
    height: 200,
  },
  whiteKeysContainer: {
    flexDirection: 'row',
    height: 180,
  },
  blackKeysContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 110,
    flexDirection: 'row',
  },
  blackKeyWrapper: {
    position: 'absolute',
  },
});

export default Piano;