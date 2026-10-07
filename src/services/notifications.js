import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const channelId = 'petshop-confirmacoes';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function notificationPermission(request = false) {
  if (Platform.OS === 'web') return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(channelId, {
      name: 'Confirmações do Pet Shop',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 100, 200],
      lightColor: '#6226A5',
      sound: 'default',
    });
  }
  let permission = await Notifications.getPermissionsAsync();
  if (request && !permission.granted && permission.canAskAgain) {
    permission = await Notifications.requestPermissionsAsync();
  }
  return permission.granted || permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

export async function sendLocalNotification(uid, event) {
  const allowed = await notificationPermission(true);
  if (!allowed) return { status: 'disabled' };
  const systemId = await Notifications.scheduleNotificationAsync({
    content: {
      title: event.title,
      body: event.body,
      sound: 'default',
      data: { uid, eventId: event.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 1,
      repeats: false,
      channelId,
    },
  });
  return { status: 'scheduled', systemId };
}

export function watchNotifications(uid, onReceived, onOpen, onError) {
  const received = Notifications.addNotificationReceivedListener((notification) => {
    if (notification.request.content.data.uid === uid) onReceived(notification);
  });
  const response = Notifications.addNotificationResponseReceivedListener(({ notification }) => {
    if (notification.request.content.data.uid === uid) {
      onReceived(notification);
      onOpen();
      Notifications.clearLastNotificationResponse();
    }
  });

  async function reconcile() {
    try {
      const presented = await Notifications.getPresentedNotificationsAsync();
      for (const notification of presented) {
        if (notification.request.content.data.uid === uid) await onReceived(notification);
      }
      const last = Notifications.getLastNotificationResponse();
      if (last?.notification.request.content.data.uid === uid) {
        await onReceived(last.notification);
        onOpen();
        Notifications.clearLastNotificationResponse();
      }
    } catch (error) {
      onError(error);
    }
  }

  return { reconcile, remove: () => { received.remove(); response.remove(); } };
}

export async function clearUserNotifications(uid) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduled) {
    if (notification.content.data?.uid === uid) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
  const presented = await Notifications.getPresentedNotificationsAsync();
  for (const notification of presented) {
    if (notification.request.content.data.uid === uid) {
      await Notifications.dismissNotificationAsync(notification.request.identifier);
    }
  }
  Notifications.clearLastNotificationResponse();
}
