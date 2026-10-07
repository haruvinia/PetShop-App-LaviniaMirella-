import { Alert, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button, Card, Heading, Notice, Screen, styles } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { useAction } from '../hooks/useAction';
import { clearUserNotifications } from '../services/notifications';
import { authErrorMessage } from '../utils/domain.mjs';
import { colors } from '../theme';

export function ProfileScreen() {
  const { user, logout } = useAuth();
  const { busy, run } = useAction();

  function exit() {
    void run(async () => {
      let cleanupFailed = false;
      try { await clearUserNotifications(user.uid); } catch { cleanupFailed = true; }
      await logout();
      if (cleanupFailed) Alert.alert('Você saiu da conta', 'Não foi possível remover todos os alertas da barra do celular. Você pode dispensá-los manualmente.');
    }, authErrorMessage);
  }

  return <Screen><Heading title="Seu perfil" subtitle="Bom ter você e seu pet por aqui." />
    <Card><View style={styles.row}><View style={styles.icon}><Ionicons name="person-outline" size={26} color={colors.purple} /></View>
      <View style={styles.grow}><Text style={styles.cardTitle}>{user.displayName || 'Tutor'}</Text><Text style={styles.small}>Conta do Pet Shop</Text></View></View>
      <Text style={styles.label}>E-mail</Text><Text selectable style={styles.body}>{user.email}</Text></Card>
    <Notice>Seus agendamentos, compras simuladas e avisos ficam salvos neste celular e vinculados à sua conta.</Notice>
    <Button title="Sair da conta" secondary busy={busy} onPress={exit} />
  </Screen>;
}
