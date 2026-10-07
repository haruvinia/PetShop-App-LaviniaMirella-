import test from 'node:test';
import assert from 'node:assert/strict';
import { createLocalRepository, emptyData, notificationStatus } from '../src/services/localRepository.mjs';

const createdAt = '2026-10-06T12:00:00.000Z';
const order = (id) => ({ id, createdAt, items: [{ productId: 'a', name: 'Ração', priceCents: 100, quantity: 1 }], totalCents: 100 });
const notification = (id, date = createdAt) => ({ id, createdAt: date, type: 'order', title: 'Pedido', body: 'Pedido salvo', status: 'pending', receivedAt: null });

function memoryStorage() {
  const values = new Map();
  return {
    values,
    getItem: async (key) => values.get(key) ?? null,
    setItem: async (key, value) => { values.set(key, value); },
  };
}

test('contas distintas têm dados isolados e reabrir restaura o histórico', async () => {
  const storage = memoryStorage();
  const first = createLocalRepository(storage, 'first');
  await first.update((data) => ({ ...data, orders: [order('pedido')] }));
  assert.deepEqual(await createLocalRepository(storage, 'second').load(), emptyData());
  assert.equal((await createLocalRepository(storage, 'first').load()).orders[0].id, 'pedido');
});

test('operações concorrentes não perdem eventos nem confirmações de recebimento', async () => {
  const repository = createLocalRepository(memoryStorage(), 'user');
  await Promise.all([
    repository.load(),
    repository.update((data) => ({ ...data, notifications: [notification('one'), ...data.notifications] })),
    repository.update((data) => ({ ...data, notifications: [notification('two'), ...data.notifications] })),
    repository.update((data) => notificationStatus(data, 'one', 'received', { receivedAt: '2026-10-06T12:00:00.000Z' })),
    repository.update((data) => notificationStatus(data, 'one', 'scheduled')),
  ]);
  const data = await repository.load();
  assert.equal(data.notifications.length, 2);
  assert.equal(data.notifications.find((item) => item.id === 'one').status, 'received');
});

test('receber ou reconciliar o mesmo alerta não duplica o histórico', () => {
  const initial = { ...emptyData(), notifications: [{ id: 'event', status: 'scheduled' }] };
  const received = notificationStatus(initial, 'event', 'received', { receivedAt: '2026-10-06T12:00:00.000Z' });
  const repeated = notificationStatus(received, 'event', 'received', { receivedAt: '2026-10-06T12:00:00.000Z' });
  assert.equal(repeated.notifications.length, 1);
  assert.deepEqual(received, repeated);
  assert.equal(initial.notifications[0].status, 'scheduled');
});

test('falha na gravação não altera os dados publicados e permite nova tentativa', async () => {
  const storage = memoryStorage();
  const published = [];
  const repository = createLocalRepository(storage, 'user', (data) => published.push(data));
  await repository.load();
  const originalSet = storage.setItem;
  storage.setItem = async () => { throw new Error('Disco indisponível'); };
  await assert.rejects(repository.update((data) => ({ ...data, orders: [order('lost')] })));
  assert.equal(published.at(-1).orders.length, 0);
  storage.setItem = originalSet;
  await repository.update((data) => ({ ...data, orders: [order('saved')] }));
  assert.equal((await repository.load()).orders[0].id, 'saved');
});

test('dados inválidos não são apagados ou silenciosamente substituídos', async () => {
  const storage = memoryStorage();
  storage.values.set('@petshop/v1/user', '{invalid');
  await assert.rejects(createLocalRepository(storage, 'user').load());
  assert.equal(storage.values.get('@petshop/v1/user'), '{invalid');
  storage.values.set('@petshop/v1/user', JSON.stringify({ orders: [] }));
  await assert.rejects(createLocalRepository(storage, 'user').load());
});

test('campos obrigatórios são validados na leitura e antes de gravar', async () => {
  const storage = memoryStorage();
  const malformed = [
    { ...emptyData(), orders: [{}] },
    { ...emptyData(), orders: [{ ...order('bad'), totalCents: 999 }] },
    { ...emptyData(), appointments: [{ id: 'bad', createdAt, petName: ' ' }] },
    { ...emptyData(), notifications: [{ ...notification('bad'), title: '' }] },
    { ...emptyData(), notifications: [null] },
  ];
  for (const data of malformed) {
    const raw = JSON.stringify(data);
    storage.values.set('@petshop/v1/user', raw);
    await assert.rejects(createLocalRepository(storage, 'user').load());
    assert.equal(storage.values.get('@petshop/v1/user'), raw);
  }
  const repository = createLocalRepository(storage, 'new');
  await assert.rejects(repository.update((data) => ({ ...data, orders: [{}] })));
  assert.deepEqual(await repository.load(), emptyData());
  assert.equal(storage.values.has('@petshop/v1/new'), false);
});

test('a sexta notificação remove a mais antiga e mantém cinco após reabrir', async () => {
  const storage = memoryStorage();
  const repository = createLocalRepository(storage, 'user');
  for (let index = 1; index <= 6; index++) {
    await repository.update((data) => ({ ...data, notifications: [
      notification(String(index), `2026-10-06T12:00:0${index}.000Z`), ...data.notifications,
    ] }));
  }
  const reopened = await createLocalRepository(storage, 'user').load();
  assert.deepEqual(reopened.notifications.map((item) => item.id), ['6', '5', '4', '3', '2']);
  await repository.update((data) => notificationStatus(data, '1', 'received', { receivedAt: createdAt }));
  assert.equal((await repository.load()).notifications.length, 5);
});

test('histórico existente é reduzido às cinco mais recentes e salvo no armazenamento', async () => {
  const storage = memoryStorage();
  const notifications = Array.from({ length: 7 }, (_, index) => notification(String(index), `2026-10-06T12:00:0${index}.000Z`));
  storage.values.set('@petshop/v1/user', JSON.stringify({ ...emptyData(), orders: [order('saved')], notifications }));
  const data = await createLocalRepository(storage, 'user').load();
  assert.deepEqual(data.notifications.map((item) => item.id), ['6', '5', '4', '3', '2']);
  assert.equal(JSON.parse(storage.values.get('@petshop/v1/user')).notifications.length, 5);
  assert.equal(data.orders[0].id, 'saved');
});
