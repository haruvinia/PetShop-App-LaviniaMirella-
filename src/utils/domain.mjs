export function validateRegistration({ name, email, password, confirmation }) {
  if (!name.trim()) return 'Informe seu nome.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Informe um e-mail válido.';
  if (password.length < 6) return 'A senha deve ter pelo menos 6 caracteres.';
  if (password !== confirmation) return 'As senhas não coincidem.';
  return null;
}

export function parseAppointment(dateText, timeText, now = new Date()) {
  const date = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dateText.trim());
  const time = /^(\d{2}):(\d{2})$/.exec(timeText.trim());
  if (!date || !time) throw new Error('Use a data no formato DD/MM/AAAA e o horário HH:MM.');
  const [, day, month, year] = date.map(Number);
  const [, hour, minute] = time.map(Number);
  const scheduled = new Date(year, month - 1, day, hour, minute);
  if (scheduled.getFullYear() !== year || scheduled.getMonth() !== month - 1 ||
      scheduled.getDate() !== day || hour > 23 || minute > 59) {
    throw new Error('Informe uma data e um horário válidos.');
  }
  if (scheduled <= now) throw new Error('Escolha uma data e um horário futuros.');
  return scheduled.toISOString();
}

export function createOrder(catalog, quantities) {
  const items = catalog.filter((product) => (quantities[product.id] ?? 0) > 0).map((product) => {
    const quantity = quantities[product.id];
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      throw new Error('Escolha entre 1 e 99 unidades de cada produto.');
    }
    return { productId: product.id, name: product.name, priceCents: product.priceCents, quantity };
  });
  if (!items.length) throw new Error('Selecione pelo menos um produto.');
  return { items, totalCents: items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0) };
}

export function money(cents) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function dateTime(iso) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function authErrorMessage(error) {
  const messages = {
    'auth/invalid-email': 'Informe um e-mail válido.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/wrong-password': 'E-mail ou senha incorretos.',
    'auth/user-not-found': 'E-mail ou senha incorretos.',
    'auth/email-already-in-use': 'Este e-mail já está cadastrado. Faça login.',
    'auth/weak-password': 'A senha não atende aos requisitos do Firebase. Use uma senha mais forte.',
    'auth/password-does-not-meet-requirements': 'A senha não atende aos requisitos do Firebase. Use uma senha mais forte.',
    'auth/network-request-failed': 'Não foi possível conectar. Verifique sua internet.',
    'auth/too-many-requests': 'Muitas tentativas. Aguarde um pouco e tente novamente.',
    'auth/user-disabled': 'Esta conta está desativada.',
    'auth/operation-not-allowed': 'Habilite E-mail/senha no Firebase Authentication.',
    'auth/invalid-api-key': 'Confira a configuração do Firebase no arquivo .env.',
  };
  return messages[error?.code] ?? 'Não foi possível concluir. Tente novamente.';
}
