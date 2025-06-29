import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width: screenWidth } = Dimensions.get('window');

interface AudioVisualizerProps {
  isPlaying: boolean;
  frequency?: number;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isPlaying, frequency = 440 }) => {
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const animationRef = useRef<number | null>(null);
  const phaseRef = useRef(0);

  useEffect(() => {
    const generateWaveform = () => {
      const points = 100;
      const amplitude = isPlaying ? 40 : 5;
      const waveFreq = frequency / 100; // Scale frequency for visualization
      
      const newData = Array.from({ length: points }, (_, i) => {
        const x = (i / points) * Math.PI * 4;
        const baseWave = Math.sin(x * waveFreq + phaseRef.current) * amplitude;
        
        // Add some harmonics for richer visualization
        const harmonic1 = Math.sin(x * waveFreq * 2 + phaseRef.current * 1.5) * (amplitude * 0.3);
        const harmonic2 = Math.sin(x * waveFreq * 3 + phaseRef.current * 0.7) * (amplitude * 0.1);
        
        // Add some noise when not playing
        const noise = isPlaying ? 0 : (Math.random() - 0.5) * 2;
        
        return baseWave + harmonic1 + harmonic2 + noise;
      });
      
      setWaveformData(newData);
      
      if (isPlaying) {
        phaseRef.current += 0.2;
      } else {
        phaseRef.current += 0.02;
      }
      
      animationRef.current = requestAnimationFrame(generateWaveform);
    };

    generateWaveform();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, frequency]);

  const createWaveformPath = () => {
    if (waveformData.length === 0) return '';

    const centerY = 60;
    const width = screenWidth - 40;
    const stepX = width / (waveformData.length - 1);

    let path = `M 0 ${centerY + waveformData[0]}`;
    
    for (let i = 1; i < waveformData.length; i++) {
      const x = i * stepX;
      const y = centerY + waveformData[i];
      path += ` L ${x} ${y}`;
    }

    return path;
  };

  return (
    <View style={styles.container}>
      <View style={styles.visualizerContainer}>
        <Svg width={screenWidth - 40} height={120} style={styles.svg}>
          <Defs>
            <LinearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={isPlaying ? "#4CAF50" : "#666"} stopOpacity="0.8" />
              <Stop offset="50%" stopColor={isPlaying ? "#2196F3" : "#888"} stopOpacity="0.6" />
              <Stop offset="100%" stopColor={isPlaying ? "#9C27B0" : "#999"} stopOpacity="0.4" />
            </LinearGradient>
          </Defs>
          
          {/* Grid lines */}
          {Array.from({ length: 5 }, (_, i) => (
            <Path
              key={`grid-${i}`}
              d={`M 0 ${i * 30} L ${screenWidth - 40} ${i * 30}`}
              stroke="#333"
              strokeWidth="0.5"
              opacity="0.3"
            />
          ))}
          
          {/* Waveform */}
          <Path
            d={createWaveformPath()}
            stroke="url(#waveGradient)"
            strokeWidth={isPlaying ? 3 : 1.5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 140,
    backgroundColor: '#1a1a1a',
    margin: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  visualizerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  svg: {
    backgroundColor: 'transparent',
  },
});

export default AudioVisualizer;