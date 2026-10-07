import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '../theme';

export function Screen({ children, topInset = false }) {
  return (
    <SafeAreaView style={styles.safe} edges={topInset ? ['top', 'left', 'right', 'bottom'] : ['left', 'right', 'bottom']}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={90}>
        <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function Button({ title, onPress, busy = false, disabled = false, secondary = false, accessibilityLabel }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: busy || disabled, busy }} disabled={busy || disabled} onPress={onPress}
      style={({ pressed }) => [styles.button, secondary && styles.secondary, (busy || disabled) && styles.disabled, pressed && styles.pressed]}>
      {busy ? <ActivityIndicator color={secondary ? colors.purple : colors.white} /> :
        <Text style={[styles.buttonText, secondary && styles.secondaryText]}>{title}</Text>}
    </Pressable>
  );
}

export function Field({ label, ...props }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text>
    <TextInput accessibilityLabel={label} placeholderTextColor={colors.muted} style={styles.input} {...props} />
  </View>;
}

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Heading({ title, subtitle }) {
  return <View style={styles.heading}><Text style={styles.title}>{title}</Text>
    {subtitle && <Text style={styles.body}>{subtitle}</Text>}</View>;
}

export function Notice({ children }) {
  return <View style={styles.notice}><Text style={styles.noticeText}>{children}</Text></View>;
}

export function Empty({ icon = 'paw-outline', title, message }) {
  return <Card style={styles.center}><Ionicons name={icon} size={34} color={colors.purple} />
    <Text style={styles.cardTitle}>{title}</Text><Text style={styles.body}>{message}</Text></Card>;
}

export function Loading({ message = 'Carregando…' }) {
  return <SafeAreaView style={[styles.safe, styles.center]}><ActivityIndicator size="large" color={colors.purple} />
    <Text style={styles.body}>{message}</Text></SafeAreaView>;
}

export function Problem({ title, message }) {
  return <Screen topInset><Empty icon="alert-circle-outline" title={title} message={message} /></Screen>;
}

export const styles = StyleSheet.create({
  fill: { flex: 1 },
  safe: { flex: 1, backgroundColor: colors.white },
  screen: { padding: 24, gap: 16, flexGrow: 1 },
  heading: { gap: 8, marginBottom: 4 },
  title: { fontSize: 28, fontWeight: '800', color: colors.black },
  body: { fontSize: 15, lineHeight: 23, color: colors.muted },
  small: { fontSize: 13, lineHeight: 20, color: colors.muted },
  cardTitle: { fontSize: 18, fontWeight: '700', color: colors.black },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: colors.black, marginTop: 8 },
  card: { padding: 20, gap: 10, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  grow: { flex: 1, gap: 6 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  icon: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.purpleLight, alignItems: 'center', justifyContent: 'center' },
  field: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: colors.black },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: colors.black, backgroundColor: colors.white, minHeight: 52 },
  button: { minHeight: 52, padding: 15, borderRadius: 14, backgroundColor: colors.purple, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 16, fontWeight: '700', color: colors.white },
  secondary: { backgroundColor: colors.purpleLight },
  secondaryText: { color: colors.purple },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.8 },
  notice: { backgroundColor: colors.yellow, padding: 16, borderRadius: 14 },
  noticeText: { color: colors.black, fontSize: 14, lineHeight: 21 },
});
