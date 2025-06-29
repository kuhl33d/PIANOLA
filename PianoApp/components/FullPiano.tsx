import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Text } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface FullPianoProps {
  currentOctave: number;
  highlightedKey?: string;
  onOctaveSelect: (octave: number) => void;
  numOctaves?: number;
}

const FullPiano: React.FC<FullPianoProps> = ({ 
  currentOctave, 
  highlightedKey, 
  onOctaveSelect, 
  numOctaves = 10
}) => {
  // Generate N octaves (C1 to Cn)
  const octaves = Array.from({ length: numOctaves }, (_, i) => i + 1);
  
  // Start keys from A, then A#, B, C, ... G#
  const generateFullPianoKeys = () => {
    const allKeys: Array<{ note: string; octave: number; isBlack: boolean; keyId: string }> = [];
    octaves.forEach(octave => {
      const octaveKeys = [
        { note: 'A', isBlack: false },
        { note: 'A#', isBlack: true },
        { note: 'B', isBlack: false },
        { note: 'C', isBlack: false },
        { note: 'C#', isBlack: true },
        { note: 'D', isBlack: false },
        { note: 'D#', isBlack: true },
        { note: 'E', isBlack: false },
        { note: 'F', isBlack: false },
        { note: 'F#', isBlack: true },
        { note: 'G', isBlack: false },
        { note: 'G#', isBlack: true },
      ];
      octaveKeys.forEach(key => {
        allKeys.push({
          ...key,
          octave,
          keyId: `${key.note}${octave}`
        });
      });
    });
    return allKeys;
  };

  const allKeys = generateFullPianoKeys();
  const whiteKeys = allKeys.filter(key => !key.isBlack);
  const blackKeys = allKeys.filter(key => key.isBlack);
  
  // Make keys fill the full screen width
  const keyWidth = (screenWidth - 20) / 14; // show 14 keys at a time visually
  const totalWidth = whiteKeys.length * keyWidth;

  const getOctaveStartPosition = (octave: number) => {
    const whiteKeysPerOctave = 7;
    return (octave - 1) * whiteKeysPerOctave * keyWidth;
  };

  const isKeyHighlighted = (keyId: string) => {
    return highlightedKey === keyId;
  };

  const isKeyInCurrentOctave = (octave: number) => {
    return octave === currentOctave;
  };

  // Track scroll position to update octave selection
  const scrollRef = React.useRef<ScrollView>(null);
  const [scrollX, setScrollX] = React.useState(0);

  // When scrolling, update the current octave based on the center of the visible window
  const visibleWindow = 14; // match the keyWidth calculation
  const handleScroll = (event: any) => {
    const x = event.nativeEvent.contentOffset.x;
    setScrollX(x);
    // Find the center key index
    const centerIndex = Math.round((x + (visibleWindow * keyWidth) / 2) / keyWidth);
    const centerKey = whiteKeys[centerIndex];
    if (centerKey && centerKey.octave !== currentOctave) {
      onOctaveSelect(centerKey.octave);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Full Piano - Octave {currentOctave} Selected</Text>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={[styles.pianoContainer, { width: totalWidth }]}> 
          {/* Octave indicators */}
          <View style={styles.octaveIndicators}>
            {octaves.map(octave => (
              <View
                key={`octave-${octave}`}
                style={[
                  styles.octaveIndicator,
                  { 
                    left: getOctaveStartPosition(octave),
                    backgroundColor: octave === currentOctave ? '#4CAF50' : '#666'
                  }
                ]}
              >
                <Text style={styles.octaveText}>C{octave}</Text>
              </View>
            ))}
          </View>

          {/* White keys */}
          <View style={styles.whiteKeysContainer}>
            {whiteKeys.map((key, index) => (
              <View
                key={key.keyId}
                style={[
                  styles.whiteKey,
                  { 
                    width: keyWidth,
                    left: index * keyWidth,
                    backgroundColor: isKeyHighlighted(key.keyId) 
                      ? '#FFD700' 
                      : isKeyInCurrentOctave(key.octave) 
                        ? '#fff' 
                        : '#e0e0e0'
                  }
                ]}
              />
            ))}
          </View>

          {/* Black keys */}
          <View style={styles.blackKeysContainer}>
            {blackKeys.map(key => {
              // Calculate position for black keys
              const whiteKeyIndex = whiteKeys.findIndex(wk => 
                wk.octave === key.octave && 
                ['C', 'D', 'F', 'G', 'A'].includes(key.note.charAt(0))
              );
              let blackKeyOffset = 0;
              const octaveStart = (key.octave - 1) * 7;
              switch (key.note) {
                case 'C#': blackKeyOffset = octaveStart + 0.7; break;
                case 'D#': blackKeyOffset = octaveStart + 1.7; break;
                case 'F#': blackKeyOffset = octaveStart + 3.7; break;
                case 'G#': blackKeyOffset = octaveStart + 4.7; break;
                case 'A#': blackKeyOffset = octaveStart + 5.7; break;
              }
              return (
                <View
                  key={key.keyId}
                  style={[
                    styles.blackKey,
                    { 
                      left: blackKeyOffset * keyWidth,
                      backgroundColor: isKeyHighlighted(key.keyId) 
                        ? '#FFD700' 
                        : isKeyInCurrentOctave(key.octave) 
                          ? '#000' 
                          : '#666'
                    }
                  ]}
                />
              );
            })}
          </View>

          {/* Selection window */}
          <View
            style={[
              styles.selectionWindow,
              { 
                left: scrollX,
                width: visibleWindow * keyWidth 
              }
            ]}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 120,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    margin: 10,
    padding: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  scrollView: {
    flex: 1,
  },
  pianoContainer: {
    height: 80,
    position: 'relative',
  },
  octaveIndicators: {
    position: 'absolute',
    top: -5,
    left: 0,
    right: 0,
    height: 15,
  },
  octaveIndicator: {
    position: 'absolute',
    height: 15,
    width: 56, // 7 keys * 8 width
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  octaveText: {
    fontSize: 8,
    color: '#fff',
    fontWeight: 'bold',
  },
  whiteKeysContainer: {
    position: 'relative',
    height: 60,
    top: 15,
  },
  whiteKey: {
    position: 'absolute',
    height: 60,
    borderWidth: 0.5,
    borderColor: '#ccc',
  },
  blackKeysContainer: {
    position: 'absolute',
    top: 15,
    height: 35,
  },
  blackKey: {
    position: 'absolute',
    width: 5,
    height: 35,
    borderWidth: 0.5,
    borderColor: '#333',
  },
  selectionWindow: {
    position: 'absolute',
    top: 12,
    height: 66,
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 4,
    backgroundColor: 'transparent',
  },
});

export default FullPiano;