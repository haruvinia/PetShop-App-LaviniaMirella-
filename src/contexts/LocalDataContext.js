import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Alert, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { createLocalRepository, emptyData, notificationStatus } from '../services/localRepository.mjs';
import { clearUserNotifications, sendLocalNotification, watchNotifications } from '../services/notifications';
import { dateTime, money } from '../utils/domain.mjs';
import { Button, Heading, Loading, Notice, Screen } from '../components/ui';
import { useAuth } from './AuthContext';
import { useAction } from '../hooks/useAction';

const LocalDataContext = createContext(null);

export function LocalDataProvider({ uid, onNotificationOpen, children }) {
  const [data, setData] = useState(emptyData);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const { logout } = useAuth();
  const { busy, run } = useAction();
  const repository = useMemo(() => createLocalRepository(AsyncStorage, uid, setData), [uid]);

  useEffect(() => {
    let active = true;
    const reportError = () => {
      if (active) Alert.alert('Histórico', 'Não foi possível atualizar o histórico de alertas.');
    };
    const watcher = watchNotifications(uid, async (notification) => {
      if (!active) return;
      const id = notification.request.content.data.eventId;
      try {
        await repository.update((current) => notificationStatus(current, id, 'received', {
          receivedAt: new Date(notification.date || Date.now()).toISOString(),
        }));
      } catch { reportError(); }
    }, () => { if (active) onNotificationOpen(); }, reportError);

    repository.load().then(async () => {
      if (!active) return;
      setLoading(false);
      await watcher.reconcile();
    }).catch(() => {
      if (active) { setLoadError(true); setLoading(false); }
    });
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void watcher.reconcile();
    });
    return () => { active = false; watcher.remove(); subscription.remove(); };
  }, [repository, uid, onNotificationOpen]);

  async function saveEvent(collection, record, title, body, type) {
    const id = Crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const event = { id, type, title, body, createdAt, status: 'pending', receivedAt: null };
    await repository.update((current) => ({
      ...current,
      [collection]: [{ ...record, id, createdAt }, ...current[collection]],
      notifications: [event, ...current.notifications],
    }));

    let result;
    try {
      result = await sendLocalNotification(uid, event);
    } catch {
      result = { status: 'failed' };
    }
    try {
      await repository.update((current) => notificationStatus(current, id, result.status, {
        systemId: result.systemId ?? null,
      }));
    } catch {
      return 'Os dados foram salvos, mas o status do alerta não pôde ser atualizado.';
    }
    if (result.status === 'disabled') return 'Salvo no histórico. Os alertas do celular estão desativados.';
    if (result.status === 'failed') return 'Salvo no histórico, mas não foi possível enviar o alerta.';
    return 'Salvo no histórico. O alerta foi solicitado ao celular.';
  }

  const value = {
    ...data,
    saveAppointment: (record) => saveEvent('appointments', record, 'Agendamento confirmado',
      `${record.serviceName} de ${record.petName}: ${dateTime(record.scheduledAt)}.`, 'appointment'),
    saveOrder: (record) => saveEvent('orders', record, 'Compra simulada confirmada',
      `Seu pedido de ${money(record.totalCents)} foi registrado. Nenhum pagamento foi realizado.`, 'order'),
  };

  if (loading) return <Loading message="Carregando seus dados…" />;
  if (loadError) return <Screen topInset><Heading title="Não foi possível ler seus dados" />
    <Notice>Seus dados não foram apagados. Tente novamente ou saia da conta.</Notice>
    <Button title="Tentar novamente" busy={busy} onPress={() => { void run(async () => {
      await repository.load();
      setLoadError(false);
    }); }} />
    <Button title="Sair da conta" secondary disabled={busy} onPress={() => { void run(async () => {
      try { await clearUserNotifications(uid); } catch { /* O logout continua disponível mesmo sem acesso aos alertas. */ }
      await logout();
    }); }} />
  </Screen>;
  return <LocalDataContext.Provider value={value}>{children}</LocalDataContext.Provider>;
}

export const useLocalData = () => useContext(LocalDataContext);
