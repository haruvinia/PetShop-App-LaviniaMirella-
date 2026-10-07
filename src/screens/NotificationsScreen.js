import { useCallback, useState } from 'react';
import { Alert, Linking, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button, Card, Empty, Heading, Notice, Screen, styles } from '../components/ui';
import { useLocalData } from '../contexts/LocalDataContext';
import { useAction } from '../hooks/useAction';
import { notificationPermission } from '../services/notifications';
import { dateTime } from '../utils/domain.mjs';
import { colors } from '../theme';

const statusLabels = {
  pending: 'Envio ainda não confirmado',
  scheduled: 'Alerta solicitado ao celular',
  received: 'Alerta recebido',
  disabled: 'Alerta desativado · evento salvo',
  failed: 'Falha ao enviar alerta · evento salvo',
};

export function NotificationsScreen() {
  const { notifications } = useLocalData();
  const [allowed, setAllowed] = useState(null);
  const { busy, run } = useAction();

  useFocusEffect(useCallback(() => {
    let active = true;
    notificationPermission().then((result) => { if (active) setAllowed(result); }).catch(() => { if (active) setAllowed(false); });
    return () => { active = false; };
  }, []));

  function enable() {
    void run(async () => {
      const result = await notificationPermission(true);
      setAllowed(result);
      if (!result) Alert.alert('Alertas desativados', 'Você pode habilitar os alertas nas configurações do celular. No Expo Go, procure as permissões do Expo Go.',
        [{ text: 'Agora não', style: 'cancel' }, { text: 'Abrir configurações', onPress: () => {
          Linking.openSettings().catch(() => Alert.alert('Configurações', 'Abra as configurações do celular e habilite as notificações do Expo Go.'));
        } }]);
    });
  }

  return <Screen><Heading title="Fique por dentro" subtitle="Confirmações dos cuidados e das compras do seu pet." />
    {allowed === false && <><Notice>Os alertas do celular estão desativados ou indisponíveis. Os eventos continuam salvos abaixo.</Notice>
      <Button title="Habilitar alertas" secondary busy={busy} onPress={enable} /></>}
    {!notifications.length ? <Empty icon="notifications-outline" title="Nenhum aviso por enquanto" message="Agende um cuidado ou simule uma compra para receber um aviso." /> :
      notifications.map((item) => <Card key={item.id}><View style={styles.row}>
        <View style={styles.icon}><Ionicons name={item.type === 'appointment' ? 'calendar-outline' : 'bag-handle-outline'} size={24} color={colors.purple} /></View>
        <View style={styles.grow}><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.small}>{dateTime(item.createdAt)}</Text></View>
      </View><Text style={styles.body}>{item.body}</Text><Text style={styles.label}>{statusLabels[item.status] ?? statusLabels.pending}</Text>
        {item.receivedAt && <Text style={styles.small}>Recebido em {dateTime(item.receivedAt)}</Text>}</Card>)}
  </Screen>;
}
