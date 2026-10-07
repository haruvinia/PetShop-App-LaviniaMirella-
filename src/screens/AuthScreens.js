import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button, Field, Heading, Notice, Screen, styles } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { useAction } from '../hooks/useAction';
import { authErrorMessage, validateRegistration } from '../utils/domain.mjs';
import { colors } from '../theme';

function Brand() {
  return <View style={brandStyles.container}><View style={brandStyles.mark}>
    <Ionicons name="paw" size={42} color={colors.purpleDark} /></View>
    <Text style={brandStyles.name}>Pet Shop</Text><Text style={styles.body}>Um carinho a mais para o seu pet.</Text></View>;
}

export function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const { busy, run } = useAction();

  function submit() {
    if (!email.trim() || !password) return Alert.alert('Confira os campos', 'Informe seu e-mail e sua senha.');
    void run(() => login(email, password), authErrorMessage);
  }

  return <Screen topInset><Brand /><Heading title="Bem-vindo de volta" subtitle="Entre para cuidar do seu melhor amigo." />
    <Field label="E-mail" value={email} onChangeText={setEmail} placeholder="voce@exemplo.com" keyboardType="email-address"
      autoCapitalize="none" autoCorrect={false} autoComplete="email" editable={!busy} />
    <Field label="Senha" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none"
      autoComplete="current-password" editable={!busy} onSubmitEditing={submit} />
    <Button title="Entrar" busy={busy} onPress={submit} />
    <Button title="Criar minha conta" secondary disabled={busy} onPress={() => navigation.navigate('Cadastro')} />
  </Screen>;
}

export function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const { register } = useAuth();
  const { busy, run } = useAction();

  function submit() {
    const error = validateRegistration({ name, email, password, confirmation });
    if (error) return Alert.alert('Confira os campos', error);
    void run(() => register(name, email, password), (error) => error.code ? authErrorMessage(error) : error.message);
  }

  return <Screen><Heading title="Vamos nos conhecer?" subtitle="Crie sua conta e traga seu pet para perto." />
    <Field label="Seu nome" value={name} onChangeText={setName} placeholder="Como podemos chamar você?" autoComplete="name" maxLength={80} editable={!busy} />
    <Field label="E-mail" value={email} onChangeText={setEmail} placeholder="voce@exemplo.com" keyboardType="email-address"
      autoCapitalize="none" autoCorrect={false} autoComplete="email" editable={!busy} />
    <Field label="Senha" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoComplete="new-password" editable={!busy} />
    <Field label="Confirme a senha" value={confirmation} onChangeText={setConfirmation} secureTextEntry autoCapitalize="none" autoComplete="new-password" editable={!busy} onSubmitEditing={submit} />
    <Notice>Use uma senha com pelo menos 6 caracteres.</Notice>
    <Button title="Criar conta" busy={busy} onPress={submit} />
  </Screen>;
}

export function CompleteProfileScreen() {
  const [name, setName] = useState('');
  const { completeProfile, logout } = useAuth();
  const { busy, run } = useAction();

  return <Screen topInset><Heading title="Complete seu cadastro" subtitle="Seu nome é obrigatório para continuar." />
    <Field label="Seu nome" value={name} onChangeText={setName} autoComplete="name" maxLength={80} editable={!busy} />
    <Button title="Salvar nome e continuar" busy={busy} onPress={() => { void run(() => completeProfile(name)); }} />
    <Button title="Sair da conta" secondary disabled={busy} onPress={() => { void run(logout, authErrorMessage); }} />
  </Screen>;
}

const brandStyles = StyleSheet.create({
  container: { alignItems: 'center', gap: 10, paddingVertical: 28 },
  mark: { backgroundColor: colors.yellow, width: 84, height: 84, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  name: { color: colors.purple, fontSize: 34, fontWeight: '800' },
});
