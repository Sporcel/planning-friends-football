import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { View } from 'react-native';
import { Boton, Vacio, useEstilos } from './ui';

export function SinPena() {
  const estilos = useEstilos();
  return (
    <View style={[estilos.pantalla, { justifyContent: 'center' }]}>
      <Vacio icono="shield-outline" texto="Aún no tienes ninguna peña. Crea la primera para empezar a registrar jugadores y partidos.">
        <Boton titulo="Crear peña" icono="add" onPress={() => router.push('/pena/editar')} />
      </Vacio>
    </View>
  );
}

/** Ejecuta `cargar` cada vez que la pantalla gana el foco. `cargar` debe estar memorizada. */
export function useAlEnfocar(cargar: () => unknown) {
  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );
}
