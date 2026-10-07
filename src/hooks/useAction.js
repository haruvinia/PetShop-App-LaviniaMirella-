import { useRef, useState } from 'react';
import { Alert } from 'react-native';

export function useAction() {
  const running = useRef(false);
  const [busy, setBusy] = useState(false);
  async function run(action, errorMessage = (error) => error.message) {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    try { await action(); }
    catch (error) { Alert.alert('Não foi possível concluir', errorMessage(error)); }
    finally { running.current = false; setBusy(false); }
  }
  return { busy, run };
}
