import { StyleSheet, View, ViewProps } from 'react-native';
import { Radius, Spacing } from '@/constants/appTheme';
import { useTheme } from '@/contexts/ThemeContext';

export default function ThemedCard({ style, children, ...rest }: ViewProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: colors.forest800,
          borderRadius: Radius.lg,
          padding: Spacing.lg,
          borderWidth: 1,
          borderColor: colors.forest700,
        },
        style,
      ]}
      {...rest}>
      {children}
    </View>
  );
}