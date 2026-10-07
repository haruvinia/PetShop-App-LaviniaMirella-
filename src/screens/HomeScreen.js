import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Card, Empty, Heading, Notice, Screen, styles } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { useLocalData } from '../contexts/LocalDataContext';
import { services } from '../data/catalog';
import { dateTime, money } from '../utils/domain.mjs';
import { colors } from '../theme';

export function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { appointments, orders } = useLocalData();
  const firstName = user.displayName?.split(' ')[0] || 'tutor';
  const upcoming = appointments.filter((item) => new Date(item.scheduledAt) > new Date())
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));

  return <Screen><Heading title={`Olá, ${firstName}!`} subtitle="O que seu pet precisa hoje?" />
    <View style={homeStyles.hero}><Ionicons name="paw" size={40} color={colors.yellow} />
      <Text style={homeStyles.heroTitle}>Pequenos cuidados.{ '\n' }Muito amor.</Text>
      <Text style={homeStyles.heroBody}>Banho, tosa e saúde em um só lugar.</Text></View>
    <Text style={styles.sectionTitle}>Cuide do seu pet</Text>
    {services.map((service) => <ActionCard key={service.id} icon={service.icon} title={service.title}
      description={service.description} onPress={() => navigation.navigate('Agendamento', { serviceId: service.id })} />)}
    <ActionCard icon="bag-handle-outline" title="Compre nossos produtos" description="Mimos e itens para o dia a dia."
      onPress={() => navigation.navigate('Produtos')} />
    <Notice>Este é um app de demonstração: agendamentos e compras são simulações salvas neste celular.</Notice>
    <Text style={styles.sectionTitle}>Seus próximos cuidados</Text>
    {!upcoming.length ? <Empty title="Tudo tranquilo por aqui" message="Seus próximos agendamentos aparecerão aqui." /> :
      upcoming.map((item) => <Card key={item.id}><Text style={styles.cardTitle}>{item.serviceName} · {item.petName}</Text>
        <Text style={styles.body}>{dateTime(item.scheduledAt)}</Text><Text style={styles.small}>Agendamento simulado</Text></Card>)}
    {orders.length > 0 && <><Text style={styles.sectionTitle}>Suas compras simuladas</Text>
      {orders.map((order) => <Card key={order.id}><Text style={styles.cardTitle}>{money(order.totalCents)}</Text>
        <Text style={styles.body}>{order.items.map((item) => `${item.quantity} × ${item.name}`).join('\n')}</Text>
        <Text style={styles.small}>{dateTime(order.createdAt)} · Sem pagamento</Text></Card>)}</>}
  </Screen>;
}

function ActionCard({ icon, title, description, onPress }) {
  return <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={title}
    style={({ pressed }) => pressed && styles.pressed}><Card><View style={styles.row}>
      <View style={styles.icon}><Ionicons name={icon} size={25} color={colors.purple} /></View>
      <View style={styles.grow}><Text style={styles.cardTitle}>{title}</Text><Text style={styles.small}>{description}</Text></View>
      <Ionicons name="chevron-forward" size={20} color={colors.purple} />
    </View></Card></Pressable>;
}

const homeStyles = StyleSheet.create({
  hero: { backgroundColor: colors.purple, borderRadius: 24, padding: 24, gap: 12 },
  heroTitle: { color: colors.white, fontSize: 26, lineHeight: 32, fontWeight: '800' },
  heroBody: { color: colors.white, fontSize: 15, lineHeight: 22 },
});
