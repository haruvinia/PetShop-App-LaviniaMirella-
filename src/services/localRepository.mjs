export const emptyData = () => ({ appointments: [], orders: [], notifications: [] });

const textRequired = (value) => typeof value === 'string' && value.trim().length > 0;
const validDate = (value) => textRequired(value) && Number.isFinite(Date.parse(value));
const validRecord = (item) => item && textRequired(item.id) && validDate(item.createdAt);
const validItem = (item) => item && textRequired(item.productId) && textRequired(item.name) &&
  Number.isSafeInteger(item.priceCents) && item.priceCents >= 0 &&
  Number.isInteger(item.quantity) && item.quantity >= 1 && item.quantity <= 99;

function validateData(data) {
  const valid = data && ['appointments', 'orders', 'notifications'].every((field) => Array.isArray(data[field])) &&
    data.appointments.every((item) => validRecord(item) && textRequired(item.serviceId) &&
      textRequired(item.serviceName) && textRequired(item.petName) && validDate(item.scheduledAt)) &&
    data.orders.every((item) => validRecord(item) && Array.isArray(item.items) && item.items.length > 0 &&
      item.items.every(validItem) && Number.isSafeInteger(item.totalCents) &&
      item.totalCents === item.items.reduce((sum, product) => sum + product.priceCents * product.quantity, 0)) &&
    data.notifications.every((item) => validRecord(item) && ['appointment', 'order'].includes(item.type) &&
      textRequired(item.title) && textRequired(item.body) &&
      ['pending', 'scheduled', 'received', 'disabled', 'failed'].includes(item.status) &&
      (item.receivedAt == null || validDate(item.receivedAt)));
  if (!valid) throw new Error('Os dados locais estão incompletos ou inválidos.');
}

function limitNotifications(data) {
  return { ...data, notifications: [...data.notifications]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 5) };
}

export function notificationStatus(data, id, status, details = {}) {
  return {
    ...data,
    notifications: data.notifications.map((item) => {
      if (item.id !== id) return item;
      // A solicitação pode terminar depois do listener de recebimento.
      if (item.status === 'received' && status !== 'received') return item;
      return { ...item, ...details, status };
    }),
  };
}

export function createLocalRepository(storage, uid, onChange = () => {}) {
  const key = `@petshop/v1/${uid}`;
  let data = null;
  let loading = null;
  let queue = Promise.resolve();

  async function load() {
    if (data) return data;
    if (!loading) loading = (async () => {
      const raw = await storage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : emptyData();
      validateData(parsed);
      const normalized = limitNotifications(parsed);
      if (parsed.notifications.length > 5) await storage.setItem(key, JSON.stringify(normalized));
      data = normalized;
      onChange(data);
      return data;
    })();
    try { return await loading; }
    finally { loading = null; }
  }

  function update(transform) {
    const operation = queue.then(async () => {
      const current = await load();
      const transformed = transform(current);
      validateData(transformed);
      const next = limitNotifications(transformed);
      await storage.setItem(key, JSON.stringify(next));
      data = next;
      onChange(data);
      return data;
    });
    queue = operation.catch(() => {});
    return operation;
  }

  return { load, update };
}
