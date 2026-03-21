import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Page not found</Text>
      <Link href="/(tabs)/logbook" style={styles.link}>
        <Text style={styles.linkText}>Go to Logbook</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#424242',
  },
  link: {
    padding: 12,
  },
  linkText: {
    fontSize: 15,
    color: '#2D6A4F',
    fontWeight: '600',
  },
});
