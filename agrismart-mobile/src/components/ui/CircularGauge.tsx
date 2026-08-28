import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export default function CircularGauge({
  percentage,
  size = 90,
  strokeWidth = 8,
  color,
  bgColor,
  label,
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  bgColor: string;
  label?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circonference = 2 * Math.PI * radius;
  const progres = circonference - (Math.min(percentage, 100) / 100) * circonference;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circonference}
          strokeDashoffset={progres}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={StyleSheet.absoluteFillObject}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: size * 0.22, fontWeight: 'bold', color }}>{Math.round(percentage)}%</Text>
          {label && <Text style={{ fontSize: size * 0.1, color, opacity: 0.7 }}>{label}</Text>}
        </View>
      </View>
    </View>
  );
}