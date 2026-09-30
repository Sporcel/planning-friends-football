import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import type { ComponentProps, ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type TextProps,
  type ViewStyle,
} from 'react-native';
import { uriFoto } from '../lib/fotos';
import { crearEstilos, fuentePara, useColores, useTema } from '../lib/tema';

type Icono = ComponentProps<typeof Ionicons>['name'];

/**
 * Texto de la app: Open Sans con el grosor pedido y el color de texto del tema por defecto.
 * Para fragmentos anidados que deban heredar el estilo del padre usa `Text` de react-native.
 */
export function Texto({ style, ...props }: TextProps) {
  const colores = useColores();
  const { fontWeight, ...resto } = StyleSheet.flatten([{ color: colores.texto }, style]);
  return <Text {...props} style={[resto, { fontFamily: fuentePara(fontWeight) }]} />;
}

export function Tarjeta({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const estilos = useEstilos();
  return <View style={[estilos.tarjeta, style]}>{children}</View>;
}

export function Titulo({ children }: { children: ReactNode }) {
  const estilos = useEstilos();
  return <Texto style={estilos.titulo}>{children}</Texto>;
}

export function Boton({
  titulo,
  onPress,
  icono,
  variante = 'primario',
  deshabilitado,
  style,
}: {
  titulo: string;
  onPress: () => void;
  icono?: Icono;
  variante?: 'primario' | 'secundario' | 'peligro';
  deshabilitado?: boolean;
  style?: ViewStyle;
}) {
  const colores = useColores();
  const estilos = useEstilos();
  const fondo = variante === 'primario' ? colores.primario : variante === 'peligro' ? colores.roja : colores.tarjeta;
  const color = variante === 'secundario' ? colores.primario : colores.sobrePrimario;
  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitado}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!deshabilitado }}
      style={({ pressed }) => [
        estilos.boton,
        { backgroundColor: fondo, opacity: deshabilitado ? 0.4 : pressed ? 0.8 : 1 },
        variante === 'secundario' && estilos.botonSecundario,
        style,
      ]}
    >
      {icono && <Ionicons name={icono} size={18} color={color} />}
      <Texto style={[estilos.botonTexto, { color }]}>{titulo}</Texto>
    </Pressable>
  );
}

export function Campo({ etiqueta, ...props }: TextInputProps & { etiqueta: string }) {
  const colores = useColores();
  const estilos = useEstilos();
  const { tema } = useTema();
  return (
    <View style={{ marginBottom: 12 }}>
      <Texto style={estilos.etiqueta}>{etiqueta}</Texto>
      <TextInput
        placeholderTextColor={colores.textoSuave}
        keyboardAppearance={tema === 'oscuro' ? 'dark' : 'light'}
        {...props}
        style={[estilos.input, props.style]}
      />
    </View>
  );
}

export function Selector<T extends string>({
  opciones,
  valor,
  onCambio,
}: {
  opciones: { valor: T; texto: string }[];
  valor: T;
  onCambio: (v: T) => void;
}) {
  const colores = useColores();
  const estilos = useEstilos();
  return (
    <View style={estilos.selector}>
      {opciones.map((o) => {
        const activo = o.valor === valor;
        return (
          <Pressable
            key={o.valor}
            onPress={() => onCambio(o.valor)}
            accessibilityRole="button"
            accessibilityState={{ selected: activo }}
            style={[estilos.selectorOpcion, activo && { backgroundColor: colores.primario }]}
          >
            <Texto style={[estilos.selectorTexto, activo && { color: colores.sobrePrimario }]}>{o.texto}</Texto>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Estrellas({
  valor,
  onCambio,
  tamano = 18,
}: {
  valor: number;
  onCambio?: (v: number) => void;
  tamano?: number;
}) {
  const colores = useColores();
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const nombre: Icono = valor >= n ? 'star' : valor >= n - 0.5 ? 'star-half' : 'star-outline';
        const icono = <Ionicons name={nombre} size={tamano} color={colores.estrella} />;
        return onCambio ? (
          <Pressable key={n} onPress={() => onCambio(n)} hitSlop={4}>
            {icono}
          </Pressable>
        ) : (
          <View key={n}>{icono}</View>
        );
      })}
    </View>
  );
}

export function Contador({
  valor,
  onCambio,
  color,
  icono,
}: {
  valor: number;
  onCambio: (v: number) => void;
  color?: string;
  icono: Icono;
}) {
  const colores = useColores();
  const estilos = useEstilos();
  return (
    <View style={estilos.contador}>
      <Pressable onPress={() => onCambio(Math.max(0, valor - 1))} hitSlop={6}>
        <Ionicons name="remove-circle-outline" size={22} color={colores.textoSuave} />
      </Pressable>
      <Ionicons name={icono} size={16} color={color ?? colores.texto} />
      <Texto style={estilos.contadorValor}>{valor}</Texto>
      <Pressable onPress={() => onCambio(valor + 1)} hitSlop={6}>
        <Ionicons name="add-circle-outline" size={22} color={colores.primario} />
      </Pressable>
    </View>
  );
}

/** Foto del jugador o, si no tiene, un círculo con sus iniciales. */
export function Avatar({
  nombre,
  foto,
  color,
  tamano = 40,
}: {
  nombre: string;
  foto?: string | null;
  color?: string;
  tamano?: number;
}) {
  const colores = useColores();
  const circulo = { width: tamano, height: tamano, borderRadius: tamano / 2 };
  if (foto) {
    return (
      <Image
        source={{ uri: uriFoto(foto) }}
        style={[circulo, { backgroundColor: colores.borde }]}
        contentFit="cover"
        accessibilityLabel={`Foto de ${nombre}`}
      />
    );
  }
  const iniciales = nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
  return (
    <View style={[circulo, { backgroundColor: color ?? colores.primario, alignItems: 'center', justifyContent: 'center' }]}>
      <Texto style={{ color: colores.sobrePrimario, fontWeight: '700', fontSize: tamano * 0.38 }}>{iniciales || '?'}</Texto>
    </View>
  );
}

export function Vacio({ icono, texto, children }: { icono: Icono; texto: string; children?: ReactNode }) {
  const colores = useColores();
  const estilos = useEstilos();
  return (
    <View style={estilos.vacio}>
      <Ionicons name={icono} size={56} color={colores.borde} />
      <Texto style={estilos.vacioTexto}>{texto}</Texto>
      {children}
    </View>
  );
}

export function BotonFlotante({ onPress, icono = 'add' }: { onPress: () => void; icono?: Icono }) {
  const colores = useColores();
  const estilos = useEstilos();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [estilos.fab, pressed && { opacity: 0.85 }]}
    >
      <Ionicons name={icono} size={28} color={colores.sobrePrimario} />
    </Pressable>
  );
}

export function Resultado({ r }: { r: 'G' | 'E' | 'P' }) {
  const colores = useColores();
  const estilos = useEstilos();
  const color = r === 'G' ? colores.victoria : r === 'E' ? colores.empate : colores.derrota;
  return (
    <View style={[estilos.resultado, { backgroundColor: color }]}>
      <Texto style={estilos.resultadoTexto}>{r}</Texto>
    </View>
  );
}

/** Botón de la cabecera para cambiar entre modo claro y oscuro. */
export function BotonTema() {
  const { tema, alternarTema } = useTema();
  const colores = useColores();
  return (
    <Pressable
      onPress={alternarTema}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={tema === 'oscuro' ? 'Activar modo claro' : 'Activar modo oscuro'}
      style={({ pressed }) => ({ paddingHorizontal: 16, opacity: pressed ? 0.6 : 1 })}
    >
      <Ionicons name={tema === 'oscuro' ? 'sunny' : 'moon'} size={22} color={colores.sobrePrimario} />
    </Pressable>
  );
}

export const useEstilos = crearEstilos((c) => ({
  pantalla: { flex: 1, backgroundColor: c.fondo },
  contenido: { padding: 16, paddingBottom: 96 },
  tarjeta: {
    backgroundColor: c.tarjeta,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  titulo: {
    fontSize: 13,
    fontWeight: '700',
    color: c.textoSuave,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 4,
  },
  boton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  botonSecundario: { borderWidth: 1.5, borderColor: c.primario },
  botonTexto: { fontSize: 15, fontWeight: '700' },
  etiqueta: { fontSize: 13, color: c.textoSuave, marginBottom: 4, fontWeight: '600' },
  input: {
    backgroundColor: c.tarjeta,
    borderWidth: 1,
    borderColor: c.borde,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: c.texto,
    fontFamily: fuentePara('400'),
  },
  selector: { flexDirection: 'row', backgroundColor: c.primarioSuave, borderRadius: 10, padding: 3, marginBottom: 12 },
  selectorOpcion: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  selectorTexto: { fontSize: 13, fontWeight: '600', color: c.primarioOscuro },
  contador: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  contadorValor: { minWidth: 16, textAlign: 'center', fontWeight: '700', color: c.texto },
  vacio: { alignItems: 'center', padding: 32, gap: 12 },
  vacioTexto: { color: c.textoSuave, textAlign: 'center', fontSize: 15 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: c.primario,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  separador: { height: 1, backgroundColor: c.borde, marginVertical: 8 },
  texto: { color: c.texto, fontSize: 15 },
  textoSuave: { color: c.textoSuave, fontSize: 13 },
  negrita: { fontWeight: '700', color: c.texto, fontSize: 16 },
  resultado: { width: 20, height: 20, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  resultadoTexto: { color: c.sobrePrimario, fontSize: 11, fontWeight: '700' },
}));
