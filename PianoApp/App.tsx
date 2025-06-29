import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, StatusBar, TouchableOpacity, Alert } from 'react-native';
// Cross-platform slider: use native for mobile, input[type=range] for web
const Slider = (props: any) => {
  if (typeof window !== 'undefined' && window.document) {
    // Web: use input[type=range]
    return (
      <input
        type="range"
        min={props.minimumValue}
        max={props.maximumValue}
        step={props.step}
        value={props.value}
        onChange={e => props.onValueChange(Number(e.target.value))}
        style={{ width: '100%' }}
      />
    );
  } else {
    // Native: fallback to nothing or a placeholder
    return null;
  }
};
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import synth from './components/webAudioSynth';
import Piano from './components/Piano';
import FullPiano from './components/FullPiano';
import AudioVisualizer from './components/AudioVisualizer';

export default function App() {
  const [currentOctave, setCurrentOctave] = useState(4);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [pressedKey, setPressedKey] = useState<string | undefined>(); // for highlight
  const [currentFrequency, setCurrentFrequency] = useState<number>(440);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [volume, setVolume] = useState(0.15);
  const [visibleNotes, setVisibleNotes] = useState(14); // default 2 octaves
  const [numOctaves, setNumOctaves] = useState(10); // dynamic octaves for full piano

  useEffect(() => {
    // Configure audio session
    const configureAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          interruptionModeIOS: InterruptionModeIOS.DoNotMix,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
          shouldDuckAndroid: false,
        });
      } catch (error) {
        console.error('Failed to configure audio:', error);
      }
    };

    configureAudio();

    // Cleanup sound on unmount
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  // Computer keyboard support
  useEffect(() => {
    const keyboardMappings: { [key: string]: { note: string; octave: number } } = {
      'a': { note: 'C', octave: currentOctave },
      'w': { note: 'C#', octave: currentOctave },
      's': { note: 'D', octave: currentOctave },
      'e': { note: 'D#', octave: currentOctave },
      'd': { note: 'E', octave: currentOctave },
      'f': { note: 'F', octave: currentOctave },
      't': { note: 'F#', octave: currentOctave },
      'g': { note: 'G', octave: currentOctave },
      'y': { note: 'G#', octave: currentOctave },
      'h': { note: 'A', octave: currentOctave },
      'u': { note: 'A#', octave: currentOctave },
      'j': { note: 'B', octave: currentOctave },
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const mapping = keyboardMappings[event.key.toLowerCase()];
      if (mapping && !event.repeat) {
        const keyId = `${mapping.note}${mapping.octave}`;
        // Calculate frequency
        const baseFrequency = 261.63; // C4
        const octaveMultiplier = Math.pow(2, mapping.octave - 4);
        const noteOffsets: { [key: string]: number } = {
          'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
          'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
        };
        const frequency = baseFrequency * octaveMultiplier * Math.pow(2, noteOffsets[mapping.note] / 12);
        
        handleKeyPress(keyId, frequency);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const mapping = keyboardMappings[event.key.toLowerCase()];
      if (mapping) {
        const keyId = `${mapping.note}${mapping.octave}`;
        handleKeyRelease(keyId);
      }
    };

    // Note: Web keyboard events won't work in React Native
    // This is included for reference if you run this in a web environment
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
      };
    }
  }, [currentOctave]);

  const handleKeyPress = (keyId: string, frequency: number) => {
    setPressedKey(keyId); // for highlight
    setCurrentFrequency(frequency);
    setIsPlaying(true);
    setPressedKeys(prev => {
      if (!prev.has(keyId)) {
        if (typeof window !== 'undefined') {
          synth.play(keyId, frequency);
        }
        const next = new Set(prev);
        next.add(keyId);
        return next;
      }
      return prev;
    });
  };

  // Volume control
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synth.setVolume(volume);
    }
  }, [volume]);

  const handleKeyRelease = (keyId?: string) => {
    if (keyId) {
      setPressedKeys(prev => {
        const next = new Set(prev);
        next.delete(keyId);
        if (typeof window !== 'undefined') {
          synth.stop(keyId);
        }
        return next;
      });
    } else if (pressedKey) {
      setPressedKeys(prev => {
        const next = new Set(prev);
        next.delete(pressedKey);
        if (typeof window !== 'undefined') {
          synth.stop(pressedKey);
        }
        return next;
      });
    }
    setPressedKey(undefined);
    setIsPlaying(false);
    if (sound) {
      sound.unloadAsync();
      setSound(null);
    }
  };

  const handleOctaveChange = (newOctave: number) => {
    setCurrentOctave(newOctave);
    handleKeyRelease(); // Stop any currently playing sound
  };

  const changeOctave = (direction: 'up' | 'down') => {
    const newOctave = direction === 'up' 
      ? Math.min(currentOctave + 1, 7) 
      : Math.max(currentOctave - 1, 1);
    handleOctaveChange(newOctave);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0f0f0" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Advanced Piano</Text>
        <Text style={styles.subtitle}>
          {isPlaying ? `Playing ${pressedKey} (${currentFrequency.toFixed(1)}Hz)` : 'Ready to play'}
        </Text>
      </View>

      {/* Audio Visualizer */}
      <AudioVisualizer 
        isPlaying={isPlaying} 
        frequency={currentFrequency}
      />

      {/* Volume Control */}
      <View style={{marginHorizontal: 20, marginBottom: 10}}>
        <Text style={{fontSize: 14, fontWeight: 'bold'}}>Volume</Text>
        <Slider
          minimumValue={0}
          maximumValue={1}
          value={volume}
          onValueChange={setVolume}
          step={0.01}
        />
      </View>

      {/* Visible Notes Control for Main Piano */}
      <View style={{marginHorizontal: 20, marginBottom: 10}}>
        <Text style={{fontSize: 14, fontWeight: 'bold'}}>
          Visible Keys (Main Piano): {visibleNotes}
        </Text>
        <Slider
          minimumValue={7}
          maximumValue={numOctaves * 7}
          value={visibleNotes}
          onValueChange={(v: number) => setVisibleNotes(Math.round(v))}
          step={1}
        />
        <Text style={{fontSize: 10, color: '#888'}}>
          (White keys: 7 per octave × {numOctaves} octaves)
        </Text>
      </View>

      {/* Number of Octaves Control for Full Piano */}
      <View style={{marginHorizontal: 20, marginBottom: 10}}>
        <Text style={{fontSize: 14, fontWeight: 'bold'}}>Number of Octaves (Full Piano): {numOctaves}</Text>
        <Slider
          minimumValue={1}
          maximumValue={15}
          value={numOctaves}
          onValueChange={(v: number) => setNumOctaves(Math.round(v))}
          step={1}
        />
      </View>

      {/* Full Piano Overview (dynamic octaves) */}
      <FullPiano 
        currentOctave={currentOctave}
        highlightedKey={pressedKey}
        onOctaveSelect={handleOctaveChange}
        numOctaves={numOctaves}
      />

      {/* Octave Controls */}
      <View style={styles.octaveControls}>
        <TouchableOpacity 
          style={[styles.octaveButton, currentOctave <= 1 && styles.disabledButton]}
          onPress={() => changeOctave('down')}
          disabled={currentOctave <= 1}
        >
          <Text style={[styles.octaveButtonText, currentOctave <= 1 && styles.disabledText]}>
            ← Octave {currentOctave - 1}
          </Text>
        </TouchableOpacity>

        <View style={styles.currentOctaveDisplay}>
          <Text style={styles.currentOctaveText}>Current: {currentOctave}</Text>
        </View>

        <TouchableOpacity 
          style={[styles.octaveButton, currentOctave >= 7 && styles.disabledButton]}
          onPress={() => changeOctave('up')}
          disabled={currentOctave >= 7}
        >
          <Text style={[styles.octaveButtonText, currentOctave >= 7 && styles.disabledText]}>
            Octave {currentOctave + 1} →
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Piano (visible notes controlled by slider) */}
      <Piano 
        currentOctave={currentOctave}
        onKeyPress={handleKeyPress}
        onKeyRelease={handleKeyRelease}
        pressedKey={pressedKey}
        pressedKeys={pressedKeys}
        visibleNotes={visibleNotes}
        numOctaves={numOctaves}
      />

      {/* Footer Info */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          🎹 Tap keys to play • Use octave buttons to change range
        </Text>
        <Text style={styles.footerText}>
          🎵 Full piano shows all octaves with current selection highlighted
        </Text>
        <Text style={styles.footerText}>
          📊 Real-time audio visualization shows waveform patterns
        </Text>
      </View>

    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingTop: 50,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 15,
    backgroundColor: '#fff',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  octaveControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#fff',
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  octaveButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  octaveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  disabledText: {
    color: '#999',
  },
  currentOctaveDisplay: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  currentOctaveText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  footer: {
    padding: 15,
    backgroundColor: '#fff',
    marginTop: 10,
    marginHorizontal: 10,
    borderRadius: 10,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
    textAlign: 'center',
  },
});