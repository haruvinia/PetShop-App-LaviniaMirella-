import test from 'node:test';
import assert from 'node:assert/strict';
import { authErrorMessage, createOrder, parseAppointment, validateRegistration } from '../src/utils/domain.mjs';

test('cadastro exige nome, e-mail válido, senha e confirmação coerentes', () => {
  const input = { name: 'Lavínia', email: 'lavinia@example.com', password: 'abc123', confirmation: 'abc123' };
  assert.equal(validateRegistration(input), null);
  for (const invalid of [{ name: ' ' }, { email: 'email' }, { password: '123' }, { confirmation: 'outra' }]) {
    assert.ok(validateRegistration({ ...input, ...invalid }));
  }
});

test('agendamento usa data e hora locais e rejeita datas impossíveis ou passadas', () => {
  const now = new Date(2026, 9, 6, 12);
  const future = parseAppointment('07/10/2026', '14:30', now);
  const date = new Date(future);
  assert.equal(date.getDate(), 7);
  assert.equal(date.getHours(), 14);
  assert.equal(date.getMinutes(), 30);
  for (const [day, hour] of [
    ['31/02/2027', '10:00'], ['29/02/2027', '10:00'], ['01/13/2027', '10:00'],
    ['07/10/2026', '24:00'], ['07/10/2026', '10:60'], ['06/10/2026', '12:00'],
    ['05/10/2026', '15:00'], ['2026-10-07', '10:00'],
  ]) assert.throws(() => parseAppointment(day, hour, now));
  assert.doesNotThrow(() => parseAppointment('29/02/2028', '10:00', now));
});

test('pedido calcula em centavos, guarda preço do momento e rejeita carrinho vazio', () => {
  const catalog = [{ id: 'a', name: 'Ração', priceCents: 3490 }, { id: 'b', name: 'Bolinha', priceCents: 1590 }];
  const order = createOrder(catalog, { a: 2, b: 3 });
  assert.equal(order.totalCents, 11750);
  catalog[0].priceCents = 1;
  assert.equal(order.items[0].priceCents, 3490);
  assert.throws(() => createOrder(catalog, {}));
  assert.throws(() => createOrder(catalog, { a: 1.5 }));
  assert.throws(() => createOrder(catalog, { a: 100 }));
});

test('erros comuns do Firebase são traduzidos sem expor mensagens técnicas', () => {
  assert.match(authErrorMessage({ code: 'auth/invalid-credential' }), /incorretos/);
  assert.match(authErrorMessage({ code: 'auth/email-already-in-use' }), /cadastrado/);
  assert.match(authErrorMessage({ code: 'auth/network-request-failed' }), /internet/);
  assert.match(authErrorMessage({ code: 'desconhecido' }), /Tente novamente/);
});
