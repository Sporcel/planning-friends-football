import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { useAlEnfocar } from '../../components/SinPena';
import { Boton, Tarjeta, Texto, useEstilos } from '../../components/ui';
import { listarPenas } from '../../db/repositorio';
import { usePena } from '../../lib/PenaActiva';
import { useColores } from '../../lib/tema';
import { MODALIDADES, type Pena } from '../../lib/tipos';

export default function ListaPenas() {
  const db = useSQLiteContext();
  const colores = useColores();
  const estilos = useEstilos();
  const { pena: activa, seleccionarPena } = usePena();
  const [penas, setPenas] = useState<Pena[]>([]);

  const cargar = useCallback(async () => setPenas(await listarPenas(db)), [db]);
  useAlEnfocar(cargar);

  return (
    <FlatList
      style={estilos.pantalla}
      contentContainerStyle={estilos.contenido}
      data={penas}
      keyExtractor={(p) => String(p.id)}
      renderItem={({ item: p }) => (
        <Pressable
          onPress={async () => {
            await seleccionarPena(p.id);
            router.back();
          }}
        >
          <Tarjeta style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Ionicons name="shield" size={32} color={colores.primario} />
            <View style={{ flex: 1 }}>
              <Texto style={estilos.negrita}>{p.nombre}</Texto>
              <Texto style={estilos.textoSuave}>{MODALIDADES[p.modalidad].nombre}</Texto>
            </View>
            {activa?.id === p.id && <Ionicons name="checkmark-circle" size={24} color={colores.primario} />}
          </Tarjeta>
        </Pressable>
      )}
      ListFooterComponent={<Boton titulo="Nueva peña" icono="add" onPress={() => router.push('/pena/editar')} />}
    />
  );
}
