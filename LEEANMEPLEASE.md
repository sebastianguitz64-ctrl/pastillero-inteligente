# 💊 Pastillero Inteligente

Un pastillero que te avisa cuándo tomar tu medicamento (con sonido, en pantalla, y en el celular), y lleva el registro de si lo tomaste o no.

Este documento es para armar y configurar el proyecto paso a paso. Si algo no queda claro, pregúntenle a Sebas.

---

## 1. ¿Qué necesitan tener listo?

### Hardware (las piezas físicas)
- Una placa **ESP32**
- Una pantalla **OLED** (la pequeña, de 128x64)
- Un **buzzer** (el que hace el sonido de alarma)
- 2 **sensores magnéticos KY-025** (detectan si el pastillero se abrió)
- Un módulo **TP4056** (solo carga la batería, no hay que programarlo)

### Software (lo que hay que instalar en la compu)
- **Arduino IDE** → se descarga gratis desde [arduino.cc/en/software](https://www.arduino.cc/en/software)
- Una cuenta gratis en **Blynk** → se crea desde [blynk.cloud](https://blynk.cloud)

---

## 2. Los archivos del proyecto

Todos estos archivos deben estar **juntos, dentro de una misma carpeta** llamada `pastillero_inteligente`:

```
pastillero_inteligente/
  ├── pastillero_inteligente.ino   → el "cerebro" del pastillero
  ├── registroMedicamentos.ino     → conecta con la app del celular
  └── secretos.h                   → aquí van tu WiFi y tus claves de Blynk
```

⚠️ **No cambien los nombres de estos archivos** ni los muevan a carpetas distintas — Arduino IDE necesita que estén exactamente así para reconocerlos como un solo proyecto.

---

## 3. Configurar `secretos.h` (paso obligatorio)

Abran el archivo `secretos.h`. Va a verse así:

```cpp
#define WIFI_SSID "TU_WIFI"
#define WIFI_PASSWORD "TU_PASSWORD"

#define SECRET_BLYNK_TEMPLATE_ID "TMPLxxxxxx"
#define SECRET_BLYNK_TEMPLATE_NAME "Pastillero Inteligente"
#define SECRET_BLYNK_AUTH_TOKEN "TU_TOKEN_AQUI"
```

Tienen que reemplazar esos valores de ejemplo por los suyos:

| Reemplaza esto...       | ...por esto                                    |
|--------------------------|------------------------------------------------|
| `TU_WIFI`                | El nombre de su red WiFi (debe ser de 2.4GHz, el ESP32 no soporta 5GHz) |
| `TU_PASSWORD`             | La contraseña de esa red WiFi                  |
| `TMPLxxxxxx`               | El Template ID que les da Blynk (ver paso 4)   |
| `TU_TOKEN_AQUI`             | El Auth Token que les da Blynk (ver paso 4)    |

Sin este paso, el pastillero **no** va a poder conectarse a internet ni mandar notificaciones al celular (sí va a seguir sonando la alarma y funcionando la pantalla, pero sin avisos al celular).

---

## 4. Configurar Blynk (la app del celular)

Blynk es la app que les va a dejar agregar medicamentos desde el celular, sin tener que tocar el código.

1. Creen una cuenta gratis en [blynk.cloud](https://blynk.cloud)
2. Creen un **Template** nuevo (le pueden poner el nombre que quieran, ej. "Pastillero")
3. Dentro de ese Template, agreguen estos **Datastreams** (son como "canales" de información):

| Canal | Para qué sirve                          | Tipo                      |
|-------|------------------------------------------|---------------------------|
| V1    | Nombre del medicamento                   | Texto                     |
| V2    | Hora (0-23)                              | Número                    |
| V3    | Minuto (0-59)                            | Número                    |
| V4    | Casilla                                  | Número                    |
| V5    | Dosis                                    | Texto                     |
| V6    | Botón "Guardar medicamento"              | Botón                     |
| V7    | Índice a eliminar                        | Número                    |
| V8    | Botón "Eliminar medicamento"             | Botón                     |
| V9    | Mensajes de estado                       | Texto (solo lectura)      |
| V10   | Lista de medicamentos                    | Terminal                  |
| V11   | Botón "Actualizar lista"                 | Botón                     |

4. Además, creen un **Event** llamado exactamente `recordatorio_medicamento` — es lo que dispara la notificación push al celular.
5. Creen un **Device** dentro del Template. Ahí Blynk les va a dar el **Auth Token** que necesitan para `secretos.h`.
6. Instalen la app de **Blynk IoT** en su celular y agreguen los widgets correspondientes a cada canal (un campo de texto para V1, un botón para V6, etc.) — así es como van a interactuar con el pastillero desde el teléfono.

Si algo de esto no queda claro, hay tutoriales en YouTube buscando "Blynk template datastreams tutorial".

---

## 5. Instalar el proyecto en Arduino IDE

1. Abran Arduino IDE.
2. Vayan a **Herramientas → Placa → esp32** e instalen el paquete de ESP32 si no lo tienen (Espressif Systems, desde el Gestor de Placas).
3. Vayan a **Herramientas → Gestionar Bibliotecas** e instalen:
   - `Adafruit GFX Library`
   - `Adafruit SSD1306`
   - `Blynk` (by Volodymyr Shymanskyy)
4. Abran el archivo `pastillero_inteligente.ino` desde **Archivo → Abrir**.
5. En **Herramientas → Placa**, elijan su modelo de ESP32 (si no saben cuál, "ESP32 Dev Module" funciona para la mayoría).
6. Conecten el ESP32 a la compu por USB.
7. En **Herramientas → Puerto**, elijan el puerto donde apareció el ESP32.
8. Denle clic al botón de flecha (→) para **subir** el código a la placa.

---

## 6. Conectar el hardware (cableado)

| Componente         | Se conecta al pin |
|---------------------|-------------------|
| Buzzer               | Pin 25             |
| Sensor magnético 1    | Pin 32             |
| Sensor magnético 2    | Pin 33             |
| Pantalla OLED (I2C)    | Pines SDA / SCL del ESP32 |

La pantalla OLED normalmente usa la dirección `0x3C` — si al encenderla se queda en negro, puede que la de ustedes use `0x3D` en vez de `0x3C` (avísenle a Sebas si pasa esto).

---

## 7. Problemas comunes

| Problema                                    | Qué revisar                                                        |
|-----------------------------------------------|---------------------------------------------------------------------|
| No conecta al WiFi                             | Que la red sea de 2.4GHz, y que el nombre/contraseña en `secretos.h` estén bien escritos |
| Conecta a WiFi pero no llegan notificaciones     | Que el Auth Token esté bien copiado, y que el Event `recordatorio_medicamento` exista en Blynk |
| La pantalla no enciende                          | Revisar cableado SDA/SCL, y probar cambiar la dirección I2C a `0x3D` |
| El buzzer suena todo el tiempo, no en pulsos       | Confirmar que esté conectado al pin 25 y no directo a alimentación |
| No compila / no encuentra `secretos.h`             | Confirmar que el archivo se llame exactamente `secretos.h` y esté en la misma carpeta que los `.ino` |

---

## 8. ¿Qué NO hace todavía este pastillero?

Para que no esperen algo que no está incluido:

- No distingue **qué casilla específica** se abrió, solo que el pastillero se abrió en general.
- No se puede **editar** un medicamento ya guardado — solo agregar o borrar.
- No mide el **nivel de batería**.
- Si se desconecta el WiFi a medio día, no se reconecta solo — hay que reiniciar el ESP32.

---

Cualquier duda, me preguntan
