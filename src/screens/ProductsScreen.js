import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button, Card, Heading, Notice, Screen, styles } from '../components/ui';
import { useLocalData } from '../contexts/LocalDataContext';
import { useAction } from '../hooks/useAction';
import { products } from '../data/catalog';
import { createOrder, money } from '../utils/domain.mjs';
import { colors } from '../theme';

export function ProductsScreen({ navigation }) {
  const [quantities, setQuantities] = useState({});
  const [saved, setSaved] = useState(null);
  const { saveOrder } = useLocalData();
  const { busy, run } = useAction();
  const total = products.reduce((sum, product) => sum + product.priceCents * (quantities[product.id] ?? 0), 0);

  function change(id, delta) {
    setQuantities((current) => ({ ...current, [id]: Math.min(99, Math.max(0, (current[id] ?? 0) + delta)) }));
  }

  function submit() {
    void run(async () => {
      const order = createOrder(products, quantities);
      const notice = await saveOrder(order);
      setSaved({ ...order, notice });
    });
  }

  if (saved) return <Screen><Heading title="Pedido registrado!" subtitle="Sua compra simulada foi salva." />
    <Card>{saved.items.map((item) => <Text style={styles.body} key={item.productId}>{item.quantity} × {item.name}</Text>)}
      <Text style={styles.cardTitle}>Total: {money(saved.totalCents)}</Text></Card>
    <Notice>{saved.notice} Nenhum pagamento foi realizado.</Notice>
    <Button title="Voltar para Home" onPress={() => navigation.goBack()} /></Screen>;

  return <Screen><Heading title="Mimos para seu pet" subtitle="Escolha os produtos e a quantidade." />
    <Notice>Compra de demonstração. Não há cobrança nem entrega de produtos.</Notice>
    {products.map((product) => <Card key={product.id}><View style={styles.row}>
      <View style={styles.icon}><Ionicons name={product.icon} size={26} color={colors.purple} /></View>
      <View style={styles.grow}><Text style={styles.cardTitle}>{product.name}</Text><Text style={styles.small}>{product.detail}</Text></View>
    </View><View style={styles.row}><Text style={[styles.cardTitle, styles.grow]}>{money(product.priceCents)}</Text>
      <QuantityButton icon="remove" label={`Diminuir quantidade de ${product.name}`} disabled={busy || !quantities[product.id]} onPress={() => change(product.id, -1)} />
      <Text accessibilityLabel={`Quantidade de ${product.name}`} style={productStyles.quantity}>{quantities[product.id] ?? 0}</Text>
      <QuantityButton icon="add" label={`Aumentar quantidade de ${product.name}`} disabled={busy || quantities[product.id] === 99} onPress={() => change(product.id, 1)} />
    </View></Card>)}
    <Text style={styles.sectionTitle}>Total: {money(total)}</Text>
    <Button title="Confirmar compra simulada" busy={busy} disabled={total === 0} onPress={submit} />
  </Screen>;
}

function QuantityButton({ icon, label, disabled, onPress }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }}
    disabled={disabled} onPress={onPress} style={({ pressed }) => [productStyles.control, disabled && styles.disabled, pressed && styles.pressed]}>
    <Ionicons name={icon} size={22} color={colors.purple} /></Pressable>;
}

const productStyles = StyleSheet.create({
  control: { width: 44, height: 44, backgroundColor: colors.purpleLight, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  quantity: { minWidth: 22, textAlign: 'center', color: colors.black, fontSize: 17, fontWeight: '700' },
});
