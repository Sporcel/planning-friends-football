# Planning Friends Football

App para Android e iOS (Expo + React Native) para gestionar peñas de fútbol y generar equipos igualados.

## Ejecutar

```bash
npm install
npx expo start
```

Escanea el QR con la app **Expo Go** del móvil (mismo Wi-Fi que el ordenador).

## Instalar en Android (APK)

```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile preview
```

Al terminar, abre el enlace o QR en el móvil e instala el `.apk`.

## Estructura

- `src/app/(tabs)/` — las 4 pestañas: Peña, Partidos, Jugadores, Estadísticas.
- `src/app/` — pantallas de formulario y detalle (peña, jugador, nuevo partido, partido, ficha).
- `src/db/esquema.ts` — tablas SQLite y migraciones.
- `src/db/repositorio.ts` — consultas.
- `src/lib/equipos.ts` — valoración de jugadores y generador de equipos.

## Cómo se hacen los equipos

1. **Valoración (0-100)** de cada jugador: media de estrellas × 20, combinada con su rendimiento real
   (puntos por partido, forma de los últimos 5 y goles por partido). El rendimiento pesa más cuantos más
   partidos haya jugado, hasta un 50%.
2. **Reparto**: 60 repartos aleatorios mejorados intercambiando jugadores entre equipos, minimizando la
   diferencia de valoración total, la diferencia en cada habilidad, el reparto de porteros y el de
   defensas/delanteros. "Regenerar" elige al azar entre los repartos casi óptimos.
3. Se pueden intercambiar jugadores a mano antes de guardar.
