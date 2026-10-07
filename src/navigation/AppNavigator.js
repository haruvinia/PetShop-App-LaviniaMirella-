import { useCallback } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../contexts/AuthContext';
import { LocalDataProvider } from '../contexts/LocalDataContext';
import { Loading, Problem } from '../components/ui';
import { auth, firebaseSetupError } from '../services/firebase';
import { CompleteProfileScreen, LoginScreen, RegisterScreen } from '../screens/AuthScreens';
import { HomeScreen } from '../screens/HomeScreen';
import { AppointmentScreen } from '../screens/AppointmentScreen';
import { ProductsScreen } from '../screens/ProductsScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { colors } from '../theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const navigationRef = createNavigationContainerRef();
let pendingNotificationOpen = false;
const headerOptions = {
  headerStyle: { backgroundColor: colors.purple },
  headerTintColor: colors.white,
  headerTitleStyle: { fontWeight: '700' },
  contentStyle: { backgroundColor: colors.white },
};

function MainTabs() {
  const icons = { Home: 'paw-outline', Notificações: 'notifications-outline', Perfil: 'person-outline' };
  return <Tab.Navigator screenOptions={({ route }) => ({
    ...headerOptions,
    tabBarActiveTintColor: colors.purple,
    tabBarInactiveTintColor: colors.muted,
    tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.border },
    tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
    tabBarIcon: ({ color, size }) => <Ionicons name={icons[route.name]} size={size} color={color} />,
  })}>
    <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Pet Shop', tabBarLabel: 'Home' }} />
    <Tab.Screen name="Notificações" component={NotificationsScreen} />
    <Tab.Screen name="Perfil" component={ProfileScreen} />
  </Tab.Navigator>;
}

export function AppNavigator() {
  const { user, loading, registering, profileRequired } = useAuth();
  const openNotifications = useCallback(() => {
    if (navigationRef.isReady()) navigationRef.navigate('Principal', { screen: 'Notificações' }, { pop: true });
    else pendingNotificationOpen = true;
  }, []);

  if (!auth) return <Problem title="Vamos conectar o Firebase" message={firebaseSetupError ||
    'Copie .env.example para .env, preencha a configuração do Firebase e reinicie o Expo. O README explica cada etapa.'} />;
  if (loading) return <Loading />;

  function onReady() {
    if (user && pendingNotificationOpen) {
      pendingNotificationOpen = false;
      openNotifications();
    }
  }

  const navigation = <NavigationContainer ref={navigationRef} onReady={onReady}>
    <Stack.Navigator screenOptions={headerOptions}>
      {user ? <>
        <Stack.Screen name="Principal" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="Agendamento" component={AppointmentScreen} options={{ title: 'Agendar cuidado' }} />
        <Stack.Screen name="Produtos" component={ProductsScreen} options={{ title: 'Nossos produtos' }} />
      </> : <>
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Cadastro" component={RegisterScreen} options={{ title: 'Criar conta' }} />
      </>}
    </Stack.Navigator>
  </NavigationContainer>;

  // Aguarda o nome do cadastro antes de abrir as telas autenticadas.
  if (registering) return <Loading message="Criando sua conta…" />;
  if (user && profileRequired) return <CompleteProfileScreen />;
  return user ? <LocalDataProvider key={user.uid} uid={user.uid} onNotificationOpen={openNotifications}>{navigation}</LocalDataProvider> : navigation;
}
