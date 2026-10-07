import { useState } from 'react';
import { Alert, Text } from 'react-native';
import { Button, Card, Field, Heading, Notice, Problem, Screen, styles } from '../components/ui';
import { useLocalData } from '../contexts/LocalDataContext';
import { useAction } from '../hooks/useAction';
import { services } from '../data/catalog';
import { dateTime, parseAppointment } from '../utils/domain.mjs';

export function AppointmentScreen({ route, navigation }) {
  const service = services.find((item) => item.id === route.params?.serviceId);
  const [petName, setPetName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [saved, setSaved] = useState(null);
  const { saveAppointment } = useLocalData();
  const { busy, run } = useAction();
  if (!service) return <Problem title="Serviço não encontrado" message="Volte à Home e escolha um serviço." />;

  function submit() {
    if (!petName.trim()) return Alert.alert('Confira os campos', 'Informe o nome do seu pet.');
    void run(async () => {
      const scheduledAt = parseAppointment(date, time);
      const notice = await saveAppointment({ serviceId: service.id, serviceName: service.name, petName: petName.trim(), scheduledAt });
      setSaved({ petName: petName.trim(), scheduledAt, notice });
    });
  }

  if (saved) return <Screen><Heading title="Cuidado agendado!" subtitle="Seu agendamento simulado foi salvo." />
    <Card><Text style={styles.cardTitle}>{service.name} · {saved.petName}</Text>
      <Text style={styles.body}>{dateTime(saved.scheduledAt)}</Text></Card>
    <Notice>{saved.notice}</Notice><Button title="Voltar para Home" onPress={() => navigation.goBack()} /></Screen>;

  return <Screen><Heading title={service.title} subtitle={service.description} />
    <Field label="Nome do pet" value={petName} onChangeText={setPetName} placeholder="Ex.: Luna" maxLength={60} editable={!busy} />
    <Field label="Data" value={date} onChangeText={setDate} placeholder="DD/MM/AAAA" keyboardType="numbers-and-punctuation" maxLength={10} editable={!busy} />
    <Field label="Horário" value={time} onChangeText={setTime} placeholder="HH:MM" keyboardType="numbers-and-punctuation" maxLength={5} editable={!busy} />
    <Notice>Escolha uma data futura. O agendamento é uma simulação, sem reserva em uma clínica real.</Notice>
    <Button title="Confirmar agendamento" busy={busy} onPress={submit} />
  </Screen>;
}
