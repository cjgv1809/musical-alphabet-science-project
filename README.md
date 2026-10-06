# Notas que hablan 🎸

**De la guitarra a las palabras**: tocas una melodía (una nota por letra)
y la app la convierte en texto y voz. Proyecto de Física (Acústica) con
enfoque **accesible**: comunicación sin barreras a través de instrumentos.

Tocas `HOLA` (MI4–SI4–SOL5–LA3) y la app escribe HOLA; si completas una
frase esencial (AGUA, AYUDA, ME DUELE…), la muestra en grande y **la dice
en voz alta**.

---

## Requisitos

- Node.js 18+ y npm.
- Navegador moderno: **Chrome, Edge o Firefox** (Web Audio API + micrófono).
- El micrófono exige **contexto seguro**: `https://` o `http://localhost`
  (`npm run dev` ya sirve en localhost).

## Puesta en marcha

```bash
npm install
npm run dev      # desarrollo (abre http://localhost:5173)
npm run dev:lan  # desarrollo + HTTPS en tu red WiFi (para el móvil, ver abajo)
npm run test     # tests unitarios (Vitest, 28 tests)
npm run typecheck # TypeScript estricto
npm run build    # compilación de producción
```

## Cómo usarla

1. **Tocar melodía** 🎹: escribe el mensaje (A–Z y signos . , ? ! ¿ ¡) y pulsa *Tocar
   melodía*. Cada letra suena 500 ms como un seno puro en su nota
   cromática; la nota actual se muestra en grande con su nombre y Hz.
2. **Escuchar melodía** 🎧: pulsa *Escuchar melodía* y toca las notas con
   la guitarra, flauta o voz (una cada vez, sostenida ~500 ms, afinada).
   Las letras aparecen en vivo con la SNR en dB.
3. **Frases que hablan** 🔊: al deletrear una frase esencial (HOLA, SÍ, NO,
   GRACIAS, POR FAVOR, AGUA, AYUDA, BAÑO, ME DUELE, ADIÓS) aparece en
   grande y suena en voz alta. El botón 🔊 Hablar lee cualquier texto, y
   la parrilla de frases las dice al pulsarlas (cada una muestra sus
   notas para aprenderla). La guitarra no emite espacios: "MEDUELE" vale
   por "ME DUELE". Mientras la app habla o toca, pausa la transcripción
   para no oírse a sí misma por el micrófono.
4. **Tabla de 26 notas**: A = LA3 (220 Hz) … Z = LA#5 (932 Hz), con Hz y
   nombres para afinar con afinador.

## Probarlo en el móvil 📱

1. Conecta el móvil a tu **misma WiFi** y ejecuta `npm run dev:lan`.
2. Abre en el móvil la URL **Network** que muestra la terminal
   (ej. `https://192.168.1.35:5173`). El HTTPS es necesario: el micrófono
   no funciona por `http` en red local.
3. Acepta el aviso de certificado autofirmado (Android: *Avanzado → Continuar*;
   en iPhone puede no bastar — en ese caso usa un túnel como `ngrok http 5173`).
4. Listo: un aparato *toca* y el otro *escucha*. Sin guitarra: silba o
   tararea notas sostenidas, o usa un generador de tonos (440 Hz = M).

## Si no transcribe (diagnóstico en 5 pasos) 🔧

1. **¿Llega sonido al micro?** Con *Escuchar melodía* activo, aplaude cerca
   del móvil: la SNR debe moverse. Si no, revisa permiso de micro y HTTPS.
2. **¿Llegan las notas?** Genera 440 Hz en otro móvil: debe aparecer la M.
   Si no, sube el volumen y acerca a 20–50 cm.
3. **¿Afinación?** Cada nota debe caer a ±45 cents de su objetivo (casi medio
   semitono). Usa un afinador para comprobar tu emisión.
4. **¿Saliste de la app y ya no oye?** Los móviles suspenden el audio en
   segundo plano; al volver, la app reanuda sola. Si no revive, pulsa
   *Dejar de escuchar* y *Escuchar melodía* de nuevo.
5. **¿Rasgueas acordes o tocas muy rápido?** La app es monofónica (como una
   flauta): una sola cuerda por vez, sostenida ~0.5 s, con pequeña pausa
   entre notas. Un acorde simultáneo no da letras falsas —da silencio— y
   la app te avisa para que toques de a una cuerda.

## La física en 4 ideas

- **Ondas y frecuencia**: el sonido es aire vibrando; Hz = vibraciones por
  segundo. Trabajamos entre 220 y 932 Hz, donde oído y micros rinden bien.
- **Escala cromática**: en temperamento igual cada semitono multiplica por
  2^(1/12) (≈ 6 % más agudo). 100 cents = 1 semitono.
- **YIN (tono fundamental)**: una cuerda vibra en f, 2f, 3f… El algoritmo
  compara la onda consigo misma desplazada y halla el periodo real, así
  da igual el timbre (seno, guitarra, voz): todos comparten la fundamental.
  El truco anti-errores de octava: elegir el PRIMER valle, no el mínimo.
- **SNR (dB)**: `20·log₁₀(señal/ruido)`. Más de 20 dB = transcripción
  fiable; menos de 10 dB = dudoso.

## Tabla de notas (LA3 = 220 Hz)

| Letra | Nota | Hz | Letra | Nota | Hz |
|---|---|---|---|---|---|
| `A` | LA3 | 220.00 | `N` | LA#4 | 466.16 |
| `B` | LA#3 | 233.08 | `O` | SI4 | 493.88 |
| `C` | SI3 | 246.94 | `P` | DO5 | 523.25 |
| `D` | DO4 | 261.63 | `Q` | DO#5 | 554.37 |
| `E` | DO#4 | 277.18 | `R` | RE5 | 587.33 |
| `F` | RE4 | 293.66 | `S` | RE#5 | 622.25 |
| `G` | RE#4 | 311.13 | `T` | MI5 | 659.26 |
| `H` | MI4 | 329.63 | `U` | FA5 | 698.46 |
| `I` | FA4 | 349.23 | `V` | FA#5 | 739.99 |
| `J` | FA#4 | 369.99 | `W` | SOL5 | 783.99 |
| `K` | SOL4 | 392.00 | `X` | SOL#5 | 830.61 |
| `L` | SOL#4 | 415.30 | `Y` | LA5 | 880.00 |
| `M` | LA4 | 440.00 | `Z` | LA#5 | 932.33 |

**Signos de puntuación** (grave, posiciones fáciles: cuerdas al aire y
trastes 1–7). Se tocan como **nota sola** (ej. `.` = cuerda SOL al aire).
Ojo probado en laboratorio: un acorde rasgueado simultáneo NO se lee
(el detector monofónico no ve tono claro y la app avisa); si quieres
arpegiar, hazlo lento cuerda por cuerda o apaga las demás con la palma:

| Signo | Nota (bajo) | Hz |
|---|---|---|
| `.` | RE#3 | 155.56 |
| `,` | MI3 | 164.81 |
| `?` | FA3 | 174.61 |
| `!` | FA#3 | 185.00 |
| `¿` | SOL3 | 196.00 |
| `¡` | SOL#3 | 207.65 |

**Espacio = RE3 (146.83 Hz, cuerda RE al aire).** El silencio no se oye,
así que el espacio tiene nota propia; sin ella las palabras se pegaban
("HOLACOMO"). Es la nota más fácil de la guitarra.

## Arquitectura

```text
src/
├── audio/
│   ├── cromatico.ts      # Alfabeto A–Z en semitonos desde LA3 (+ tests)
│   ├── tonoFundamental.ts# Estimador YIN del tono fundamental (+ tests)
│   ├── melodia.ts        # DetectorMelodia + E2E seno/guitarra (+ tests)
│   ├── instrumento.ts    # Emisor de melodías (una nota por letra)
│   ├── escucha.ts        # Motor en vivo: micrófono → detector cada 40 ms
│   ├── noiseFilter.ts    # Pasa-banda 300–3000 Hz + SNR en dB
│   ├── frases.ts         # Fraseario esencial (ignora espacios) (+ tests)
│   └── voz.ts            # Síntesis de voz en español (+ tests)
├── components/
│   └── InstrumentoPanel.tsx # Todo el flujo en un panel (+ test de humo)
├── types/ + utils/      # NivelSenal y constantes calibradas
```

Defensa contra el ruido: pasa-banda → puerta de silencio (RMS) →
periodicidad YIN → redondeo con tolerancia ±45 cents → 2 ventanas + 50 ms
mínimos → una emisión por nota sostenida.

### Calibración

| Parámetro | Valor |
|---|---|
| Ventana / tick | 1024 muestras / 40 ms |
| Búsqueda YIN | 150–1500 Hz, umbral 0.15, RMS mín. 0.01 |
| Tolerancia | ±45 cents |
| Confirmación | 2 ventanas + 50 ms |
| Emisión | 500 ms por nota + 60 ms de pausa |

## Decisiones técnicas (justificadas)

- **Una nota por letra (no DTMF)**: cualquier instrumento monofónico puede
  "hablar"; el timbre lo absorbe el detector de fundamental.
- **YIN propio**: la matemática a la vista, sin dependencias, tipado estricto.
- **Sin estado global**: un solo panel autosuficiente (sin Zustand).
- **CSS Modules**: cero dependencias, funciona offline.
- **Voz con Web Speech API**: gratis, sin backend, sin red.

## Migración a React Native + Expo (fase futura)

| Módulo | Estado |
|---|---|
| `cromatico.ts`, `tonoFundamental.ts`, `melodia.ts` | ✅ 100 % reutilizables (`Float32Array` existe en Hermes) |
| `frases.ts`, `utils/`, `types/` | ✅ reutilizables |
| Tests Vitest | ✅ se ejecutan igual |

| Web (actual) | React Native + Expo |
|---|---|
| `instrumento.ts` (Tone.js) | `expo-audio`: generar el buffer PCM de la nota (envolvente incluida) |
| `escucha.ts` (`getUserMedia` + `AudioContext`) | grabación PCM mono 44100 Hz → ventanas de 1024 cada 40 ms → `DetectorMelodia` sin cambios |
| `voz.ts` (SpeechSynthesis) | `expo-speech` (misma idea, una línea por frase) |
| CSS Modules | `StyleSheet` de RN |

Recomendaciones: copiar `audio/` (menos `instrumento`/`escucha`), correr
`npm run test`, y probar en dispositivo físico (el emulador distorsiona
el audio). Permisos: micrófono en `app.json` (`NSMicrophoneUsageDescription`
en iOS, `RECORD_AUDIO` en Android).
