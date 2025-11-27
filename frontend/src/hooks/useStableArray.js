import { useRef, useEffect } from 'react';

export function useStableArray(value) {
  // 1. Armazena a referência anterior e seu valor serializado (JSON string)
  const ref = useRef({
    value: value,
    serialized: JSON.stringify(value),
  });

  // 2. Calcula a nova serialização
  const newSerialized = JSON.stringify(value);

  // 3. Efeito que compara
  useEffect(() => {
    // Se a nova serialização for diferente da serialização anterior,
    // atualize a referência.
    if (newSerialized !== ref.current.serialized) {
      ref.current.value = value;
      ref.current.serialized = newSerialized;
    }
  }, [newSerialized, value]); // Dependências do efeito: o valor e a serialização.

  // Retorna o valor armazenado na referência (o valor mais estável)
  return ref.current.value;
}