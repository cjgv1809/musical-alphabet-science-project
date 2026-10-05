# Alfabeto Musical Tocado 🎶

**Habla con música: cada letra es un acorde de dos notas.**
Proyecto de ciencias — Física (Acústica), nivel secundaria.

Escribes un mensaje (ej. `HOLA COMO ESTAS`), la app lo *toca* como una
secuencia de tonos —cada letra codificada como un **par de frecuencias**,
igual que los teléfonos de teclas (DTMF)—, y otro dispositivo (o el mismo)
lo *escucha* con el micrófono y lo decodifica de vuelta a texto.

La app es también un laboratorio: muestra el espectro en tiempo real, el
umbral dinámico de ruido y la relación señal-ruido (SNR), con explicaciones
de ondas, frecuencia, análisis de Fourier, DTMF y SNR.

> Fase 1 (WebApp): React 18 + TypeScript + Vite. Fase 2 (futura): migración
> a React Native + Expo — ver [notas de migración](#-migración-a-react-native-expo-fase-2).

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
npm run test     # tests unitarios (Vitest, 44 tests)
npm run typecheck # TypeScript estricto
npm run build    # compilación de producción
```

## Probarlo en el móvil 📱

1. Conecta el móvil a tu **misma WiFi** y ejecuta `npm run dev:lan`.
2. Abre en el móvil la URL **Network** que muestra la terminal
   (ej. `https://192.168.1.35:5173`). El HTTPS es necesario: el micrófono
   no funciona por `http` en red local.
3. Acepta el aviso de certificado autofirmado (Android: *Avanzado → Continuar*;
   en iPhone puede no bastar — en ese caso usa un túnel como `ngrok http 5173`).
4. Listo: un aparato *toca* y el otro *escucha*.

## Si no decodifica (diagnóstico en 3 pasos) 🔧

1. **¿Llega sonido al micro?** Con *Escuchar* activo, aplaude cerca del móvil:
   la barra *Señal* y el espectro deben moverse. Si no, revisa permiso de
   micro y HTTPS.
2. **¿Llegan los tonos?** Toca la nota A en la tabla y abre *🔧 Diagnóstico*:
   deberías ver **400 y 1350 Hz** destacados. Si salen otras frecuencias o
   todo bajo, sube el volumen al máximo y acerca a 20–50 cm.
3. **Causas típicas**: volumen bajo, demasiada distancia, funda que tapa el
   micro, o el móvil con *supresión de ruido* agresiva (la app ya pide audio
   en crudo, pero algunos fabricantes la fuerzan igual: prueba con otro móvil).
4. **Si solo llegan algunas letras** (ej. la O sí, la H no): tu altavoz
   reproduce flojos los graves. La app ya compensa con pre-énfasis y margen
   por grupo, pero ayuda no usar el volumen al máximo (distorsiona y crea
   armónicos): prueba al 70–80 % y a 20–40 cm, o con un altavoz externo.

## Cómo usarla

1. **Codificar y tocar** 🎹: escribe el mensaje y pulsa *Tocar mensaje*
   (500 ms por letra). La letra que suena se resalta en grande. Los
   caracteres sin nota (ñ, tildes, `#`…) se avisan y se saltan.
2. **Escuchar y decodificar** 🎧: pulsa *Escuchar* (permite el micrófono),
   acerca el altavoz que está tocando y mira cómo aparece el texto letra
   por letra, con el medidor de señal/ruido y la SNR en dB.
3. **Espectro en vivo** 🔬: la curva verde es el sonido ambiente; las líneas
   azules/naranjas son las 13 notas del alfabeto (dorado = detectada); la
   línea roja es el **umbral dinámico**: lo que quede debajo se ignora.
4. **Tabla de notas + física** 🎼📚: cada fila suena su acorde, y las 5
   tarjetas explican ondas, frecuencia, Fourier/Goertzel, DTMF y SNR.

## Modo instrumento (prototipo) 🎸

Una **nota musical por letra** en escala cromática desde **LA3 (220 Hz)**:
cada semitono multiplica por 2^(1/12). El detector estima el tono
fundamental (YIN simplificado) y lo redondea a la letra más cercana
(tolerancia ±45 cents), **sin importar el timbre**: seno, guitarra,
flauta o voz dan la misma letra (probado en `melodia.test.ts` con
armónicos sintéticos). Espacio = silencio. Sin dígitos (prototipo).

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

**Cómo probarlo con guitarra real**: afina con afinador (nombres en la
tabla desplegable del panel), toca **una nota cada vez**, sostenida
(~500 ms) y con pausas, en un lugar callado. Empieza por HOLA con el
emisor sintetizado para validar la cadena, luego repite con la guitarra.

**Limitaciones honestas del prototipo**: monofónico (acordes no),
afinación dentro de ±45 cents, sin dígitos ni signos, y ventanas fijas
de 40 ms (exigen tempo sostenido; la segmentación por ataques queda
como mejora futura). El error clásico a vigilar: **octavas** (el armónico
confunde) — el YIN lo mitiga eligiendo el primer valle, no el mínimo.

## La física en 5 ideas

- **Ondas sonoras**: el sonido es aire vibrando; cada vibración completa por
  segundo es 1 hercio (Hz).
- **Frecuencia**: trabajamos en **300–3000 Hz** (banda de voz): los móviles
  responden bien ahí y evitamos el ruido grave (<300 Hz: ventiladores, pasos).
- **Fourier y Goertzel**: todo sonido es suma de notas. La FFT halla *todas*;
  **Goertzel** solo pregunta por nuestras 13 notas: 13 preguntas en vez de
  miles (`src/audio/goertzel.ts`).
- **DTMF extendido**: dos tonos simultáneos por símbolo. Un ruido de una sola
  frecuencia (un silbido) jamás forma el par completo, y el control de
  *twist* exige que ambos tonos suenen equilibrados.
- **SNR (dB)**: `20·log₁₀(señal/ruido)`. Más de 20 dB = mensaje clarísimo;
  menos de 10 dB = dudoso. Los dB son logarítmicos: +20 dB = 10× más señal.

## Mapeo de frecuencias (DTMF extendido)

Parrilla de **6 filas × 7 columnas = 42 combinaciones** (41 usadas + 1 libre
de reserva: `1150 + 2250`). Separación de 150 Hz entre notas vecinas y hueco
de 200 Hz entre grupos. Fuente de verdad: `src/audio/frequencies.ts`.

| Símbolo | Nota baja (Hz) | Nota alta (Hz) |
|---|---|---|
| `A` | 400 | 1350 |
| `B` | 400 | 1500 |
| `C` | 400 | 1650 |
| `D` | 400 | 1800 |
| `E` | 400 | 1950 |
| `F` | 400 | 2100 |
| `G` | 400 | 2250 |
| `H` | 550 | 1350 |
| `I` | 550 | 1500 |
| `J` | 550 | 1650 |
| `K` | 550 | 1800 |
| `L` | 550 | 1950 |
| `M` | 550 | 2100 |
| `N` | 550 | 2250 |
| `O` | 700 | 1350 |
| `P` | 700 | 1500 |
| `Q` | 700 | 1650 |
| `R` | 700 | 1800 |
| `S` | 700 | 1950 |
| `T` | 700 | 2100 |
| `U` | 700 | 2250 |
| `V` | 850 | 1350 |
| `W` | 850 | 1500 |
| `X` | 850 | 1650 |
| `Y` | 850 | 1800 |
| `Z` | 850 | 1950 |
| `0` | 850 | 2100 |
| `1` | 850 | 2250 |
| `2` | 1000 | 1350 |
| `3` | 1000 | 1500 |
| `4` | 1000 | 1650 |
| `5` | 1000 | 1800 |
| `6` | 1000 | 1950 |
| `7` | 1000 | 2100 |
| `8` | 1000 | 2250 |
| `9` | 1150 | 1350 |
| `ESPACIO` | 1150 | 1500 |
| `.` | 1150 | 1650 |
| `,` | 1150 | 1800 |
| `?` | 1150 | 1950 |
| `!` | 1150 | 2100 |

## Arquitectura

```text
src/
├── audio/
│   ├── frequencies.ts   # Mapeo símbolo → par de frecuencias (+ tests)
│   ├── toneGenerator.ts # Emisor: dos osciladores Tone.js por símbolo
│   ├── goertzel.ts      # Detector de frecuencias concretas (+ tests)
│   ├── decoder.ts       # Par + umbral + twist + suavizado (+ tests E2E)
│   ├── noiseFilter.ts   # Pasa-banda 300–3000 Hz, umbral dinámico, SNR
│   ├── escucha.ts       # Motor en vivo: micrófono → Goertzel cada 40 ms
│   │                     # (detector intercambiable: DTMF o melodía)
│   ├── cromatico.ts     # Alfabeto A–Z en semitonos desde LA3 (+ tests)
│   ├── tonoFundamental.ts # Estimador YIN del tono fundamental (+ tests)
│   ├── melodia.ts       # DetectorMelodia + E2E seno/guitarra (+ tests)
│   └── instrumento.ts   # Emisor de melodías (una nota por letra)
├── components/          # Encoder, Decoder, Spectrum, FrequencyTable,
│                         # EducationalInfo, InstrumentoPanel (+ tests de humo)
├── store/useAppStore.ts # Estado global (Zustand)
├── types/ + utils/      # Tipos y constantes calibradas (ver abajo)
```

Defensa contra el ruido (4 capas): pasa-banda → umbral dinámico
(`ruido × 3`, mínimo 8) → duración mínima (50 ms) → 2 ventanas
consecutivas → par equilibrado (twist ≤ 4×).

### Calibración

Parámetros verificados por el test E2E (`flujoCompleto.test.ts`), que
sintetiza mensajes y los decodifica de punta a punta:

| Parámetro | Valor |
|---|---|
| Ventana / tick | 1024 muestras / 40 ms |
| Umbral | ruido × 3 (mín. 8) |
| Duración mínima | 50 ms |
| Ventanas seguidas | 2 |
| Emisión | 500 ms por letra |

Si en tu aula hay falsos positivos: sube `FACTOR_UMBRAL` o `UMBRAL_MINIMO`
en `src/utils/constants.ts`. Tras cada cambio, exige `npm run test` en verde.

## Decisiones técnicas (justificadas)

- **CSS Modules (no Tailwind)**: cero dependencias, funciona offline en la
  feria y clases legibles para estudiantes.
- **Goertzel propio (no `goertzeljs`)**: valor educativo (la matemática a la
  vista), sin dependencia externa y tipado estricto.
- **Zustand**: estado global mínimo sin boilerplate.

## Migración a React Native + Expo (fase 2)

### Se reutiliza tal cual (lógica pura, sin APIs web)

| Módulo | Estado |
|---|---|
| `audio/frequencies.ts` | ✅ 100 % reutilizable |
| `audio/goertzel.ts` | ✅ 100 % reutilizable |
| `audio/decoder.ts` | ✅ reutilizable (los `Float32Array` existen en Hermes) |
| `audio/noiseFilter.ts` (umbral/SNR) | ✅ reutilizable; solo `crearCadenaAntiRuido` cambia |
| `utils/constants.ts`, `types/` | ✅ reutilizables |
| `store/useAppStore.ts` | ✅ Zustand funciona en RN |
| Tests Vitest | ✅ se ejecutan igual (lógica sin DOM) |

### Qué cambia (APIs de plataforma)

| Web (actual) | React Native + Expo |
|---|---|
| `toneGenerator.ts` (Tone.js + Web Audio) | `expo-av` / `expo-audio`: dos osciladores → dos `Audio.Sound` con tonos generados, o mejor, **síntesis PCM propia** (generar el buffer del acorde y reproducirlo: control total de envolvente y timing) |
| `escucha.ts` (`getUserMedia` + `AudioContext` + `AnalyserNode`) | `expo-av` grabación en PCM (`Recording` con `sampleRate: 44100`), leer los bytes del buffer y pasarlos a `DecodificadorSuavizado`; el filtro pasa-banda se aplica **por software** (biquad propio o librería DSP) en vez de `BiquadFilterNode` |
| `SpectrumVisualizer` (Canvas 2D) | `react-native-svg` o `@shopify/react-native-skia` para el espectro; los datos salen del mismo buffer PCM (FFT ligera o el propio Goertzel sobre las 13 notas) |
| CSS Modules | `StyleSheet` de RN (los diseños se trasladan 1:1) |
| Permisos (`DOMException`) | `expo-audio`/`expo-av` + `usePermissions`; mensajes amigables ya redactados en `mensajeAmigableErrorMic` |
| `performance.now` / `setInterval` | Disponibles en RN; el tick de 40 ms se mantiene |

### Recomendaciones para la fase 2

1. Empezar por la lógica: copiar `audio/` (menos `toneGenerator`/`escucha`),
   `utils/`, `types/` y `store/` a la app Expo y correr `npm run test`.
2. Emisor: generar el acorde como PCM (`Float32Array` → WAV en memoria) con
   la misma envolvente de 20–30 ms; así el timing es idéntico al validado.
3. Receptor: grabar PCM mono 44100 Hz, ventanas de 1024 cada 40 ms,
   reutilizar `DecodificadorSuavizado` sin cambios.
4. Ojo con el *sampleRate* real del hardware (algunos móviles usan 48000):
   Goertzel recibe `sampleRate` como parámetro, así que basta con leerlo del
   sistema, sin recodificar nada.
5. Permisos: micrófono en `app.json` (`NSMicrophoneUsageDescription` en iOS,
   `RECORD_AUDIO` en Android) y probar en dispositivo físico (el emulador
   distorsiona el audio).
