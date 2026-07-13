Pastillero Inteligente — Documentación

¿Qué es esto?

Un pastillero automatizado, construido sobre un microcontrolador ESP32, que:


Muestra la hora y el próximo medicamento en una pantalla.
Avisa (con sonido, en pantalla, y con notificación al celular) cuando toca tomar un medicamento.
Detecta si el pastillero se abrió para saber si el medicamento sí se tomó.
Guarda un historial de lo tomado / no tomado.
Calcula un porcentaje de cumplimiento.


Todo el registro de medicamentos (agregar, borrar, ver la lista) se hace desde el celular, usando una app llamada Blynk — no hay que reprogramar el ESP32 cada vez que se quiere agregar un medicamento nuevo.


1. Componentes físicos (hardware)

ComponentePara qué sirveESP32El "cerebro" del proyecto. Tiene WiFi integrado, que es lo que le permite hablar con Blynk.Pantalla OLED 128x64 (I2C)Muestra la hora, el próximo medicamento, el historial y las estadísticas.Buzzer activoHace sonar la alarma cuando toca tomar un medicamento.2x Sensor magnético KY-025Detectan si el pastillero se abrió (funcionan como un sensor de puerta: un imán se aleja del sensor y eso se detecta como "abierto").Módulo TP4056Solo carga la batería del pastillero. No participa en el código — es puramente eléctrico.


2. ¿Cómo está organizado el código?

El proyecto son 3 archivos, que deben estar juntos dentro de una misma carpeta llamada pastillero_inteligente:

pastillero_inteligente/
  ├── pastillero_inteligente.ino   → toda la lógica del pastillero
  ├── registro_medicamentos.ino    → conexión con la app Blynk para registrar medicamentos
  └── secretos.h                   → tu WiFi y tus claves de Blynk (privado, no se comparte)


Nota: el código hace #include "secretos.h", así que el archivo de credenciales debe llamarse exactamente secretos.h (con "o", no secrets.h) para que compile.




3. Cómo funciona, paso a paso

3.1 Al encender el pastillero


Prepara la pantalla y el buzzer.
Recupera de la memoria del ESP32 (que no se borra al apagarlo) cuántos medicamentos se han tomado, cuántos se han olvidado, y el historial de los últimos 10 eventos.
Se conecta al WiFi (si no logra conectarse en 10 segundos, sigue funcionando "offline": no manda notificaciones, pero la alarma y la pantalla sí trabajan).
Sincroniza la hora exacta por internet (protocolo NTP), ajustada a la zona horaria de Guatemala.
Se conecta a Blynk.
Carga 3 medicamentos de ejemplo (esto es temporal, para pruebas — lo normal es que tú los agregues desde la app).


3.2 Todo el tiempo, en segundo plano (el "loop")

El ESP32 repite constantemente estas tareas:


Revisa si presionaste el botón físico (para cambiar de pantalla).
Revisa si es hora de algún medicamento.
Revisa si el pastillero se abrió (solo importa mientras hay una alarma sonando).
Hace parpadear el buzzer si hay una alarma activa.
Actualiza lo que se ve en pantalla, una vez por segundo.


3.3 Cuando llega la hora de un medicamento

En vez de exigir el minuto exacto, el sistema da una ventana de tolerancia de 3 minutos. Por ejemplo, si un medicamento está programado a las 8:00, la alarma se activará si son las 8:00, 8:01 o 8:02 (no necesita ser exactamente 8:00:00).

Cuando se activa la alarma:


El buzzer empieza a sonar en pulsos (medio segundo prendido, medio segundo apagado).
La pantalla cambia automáticamente a una vista de alarma: muestra el nombre del medicamento, la dosis, el número de casilla, y una cuenta regresiva en segundos.
Si hay conexión a internet, se manda una notificación push al celular a través de Blynk.


La alarma se detiene de dos formas posibles:


Se abre el pastillero → se marca como "tomado", se registra en el historial, y se suma 1 al contador de medicamentos tomados.
Pasan 15 minutos sin abrirse → se marca automáticamente como "no tomado", se registra en el historial, y se suma 1 al contador de olvidados. Esto evita que la alarma quede sonando para siempre.


3.4 Los sensores magnéticos

Solo se revisan mientras hay una alarma sonando (no todo el tiempo) — así, abrir el pastillero fuera de horario de medicación no genera falsos registros.

Para evitar que un pequeño golpe o vibración se confunda con una apertura real, hay un "tiempo de espera" de medio segundo entre una detección y la siguiente (esto se llama debounce, o antirrebote).

3.5 El historial y las estadísticas

Cada vez que un medicamento se marca como tomado o no tomado, se guarda un registro con: nombre del medicamento, hora, y si se tomó o no. Se guardan los últimos 10 eventos, y —a diferencia de la primera versión— ahora sí sobreviven a un reinicio o apagón, porque se guardan en la memoria interna permanente del ESP32 (no se pierden como pasaría si solo estuvieran en la memoria temporal).

Las estadísticas son simples: cuentan cuántas veces se tomó el medicamento a tiempo contra cuántas veces se olvidó, y sacan un porcentaje.

Cumplimiento = (medicamentos tomados / total de medicamentos programados) × 100

3.6 Las 4 pantallas

Con el botón físico del ESP32 (el mismo que se usa para programarlo, llamado botón "BOOT") se rota entre 4 vistas:


Inicio — nombre del usuario, hora actual, próximo medicamento y su casilla.
Lista — todos los medicamentos programados.
Historial — los últimos eventos (tomado ✔ / no tomado ✖).
Estadísticas — contador de tomados, olvidados, y porcentaje de cumplimiento.


Si hay una alarma sonando, la pantalla de alarma tiene prioridad sobre cualquiera de estas 4 — no puedes "navegar" fuera de ella hasta que se resuelva.


4. El registro de medicamentos, desde el celular

Esto vive en el segundo archivo, registro_medicamentos.ino, y usa Blynk, una plataforma que conecta al ESP32 con una app en tu celular sin que tengas que programar la app tú mismo. Blynk actúa como intermediario:

[ESP32]  <--WiFi-->  [Servidor de Blynk]  <--Internet-->  [App en tu celular]

Desde la app puedes:


Escribir el nombre, hora, minuto, casilla y dosis de un medicamento nuevo, y guardarlo.
Ver la lista completa de medicamentos registrados.
Borrar un medicamento indicando su número en la lista.
Recibir notificaciones push cuando toca un medicamento.



5. Cómo personalizarlo

Quiero cambiar...DóndeMi WiFi o mis claves de Blynksecretos.hEl nombre que aparece en pantallaVariable nombreUsuario, en pastillero_inteligente.inoCuántos minutos de tolerancia tiene la alarmaConstante VENTANA_TOMA_MINCuánto tiempo espera antes de marcar "no tomado"Constante TIEMPO_ESPERA_MSLos pines donde están conectados el buzzer, los sensores o el botónConstantes BUZZER_PIN, SENSOR1_PIN, SENSOR2_PIN, BOTON_PINCuántos medicamentos caben como máximoConstante MAX_MEDICAMENTOS


6. Lo que todavía no hace el sistema

Para tener una idea clara de los límites actuales:


No distingue qué casilla específica se abrió — solo detecta que el pastillero se abrió en general (esto fue una decisión de diseño, no un error).
No se puede editar un medicamento ya guardado — solo agregar o eliminar.
Si el WiFi o Blynk se desconectan a medio día, el sistema no intenta reconectarse solo — sigue funcionando localmente (alarma y pantalla), pero sin notificaciones, hasta que se reinicie.
No mide el nivel de batería.



7. Solución de problemas comunes

ProblemaCausas probablesQué revisarLa pantalla OLED no enciende / se queda en negroDirección I2C incorrecta, cableado SDA/SCL invertido, o falla de alimentaciónConfirma que la pantalla use la dirección 0x3C (algunas vienen en 0x3D). Revisa que SDA y SCL no estén cruzados. Verifica 3.3V y GND.El ESP32 no logra conectarse al WiFiContraseña incorrecta en secretos.h, red de 5GHz (el ESP32 solo soporta 2.4GHz), o señal débilRevisa WIFI_SSID/WIFI_PASSWORD. Confirma que la red sea de 2.4GHz. Prueba acercando el pastillero al router.Conecta a WiFi pero no llegan notificacionesToken de Blynk incorrecto, o falta configurar el Event recordatorio_medicamento en Blynk.CloudRevisa BLYNK_AUTH_TOKEN. Confirma en el dashboard de Blynk que el Event exista y esté habilitado.La hora se muestra como --:--:--Aún no sincroniza por NTP (tarda unos segundos tras conectar el WiFi), o no hay conexión a internetEspera unos segundos tras encender. Si persiste, revisa la conexión WiFi.La alarma no se apaga al abrir el pastilleroEl sensor KY-025 está invertido (según cómo esté ajustado su potenciómetro, puede activarse en HIGH en vez de LOW), o el imán no pasa lo suficientemente cercaEn el código, la condición está en LOW = activado; si tu sensor funciona al revés, cambia esa condición en verificarSensorApertura(). Ajusta el potenciómetro azul del módulo KY-025.El buzzer suena todo el tiempo, no en pulsosConexión directa a 3.3V/5V en vez de al pin de señal, o pin equivocadoConfirma que el buzzer esté conectado a BUZZER_PIN (25) y no directo a alimentación.Los medicamentos registrados por Blynk desaparecen al reiniciarEs el comportamiento actual — solo el historial y los contadores se guardan de forma permanente, la lista de medicamentos vive en memoria temporalSi necesitas que los medicamentos también persistan, hay que guardarlos en Preferences, igual que se hizo con el historial.El compilador no encuentra secretos.hEl archivo no existe, está mal nombrado, o no está en la misma carpeta que los .inoConfirma que el archivo se llame exactamente secretos.h y esté dentro de la carpeta pastillero_inteligente/, junto a los otros dos archivos.Error de compilación relacionado a BLYNK_TEMPLATE_IDEl #include "secretos.h" está después de otros #include, o las macros de Blynk se definen en el orden incorrectoEl #include "secretos.h" y las macros BLYNK_TEMPLATE_ID/BLYNK_TEMPLATE_NAME/BLYNK_AUTH_TOKEN deben ir antes de #include <BlynkSimpleEsp32.h>.


8. Glosario rápido


ESP32: una placa pequeña de computadora con WiFi y Bluetooth integrados, usada para proyectos electrónicos.
Blynk: una plataforma gratuita que da una app lista para usar y conecta dispositivos como el ESP32 con el celular, sin tener que programar la app desde cero.
Virtual Pin (V0, V1, V2...): un "canal" de datos dentro de Blynk. Cada widget de la app (un botón, un campo de texto) se conecta a uno de estos canales para mandar o recibir información del ESP32.
NTP: el protocolo que usa el ESP32 para preguntarle la hora exacta a internet, en vez de depender de un reloj propio que se puede desajustar.
Debounce (antirrebote): una pequeña pausa que se le agrega a la lectura de un botón o sensor para evitar que un solo toque o vibración se cuente como varios eventos.
Preferences: la memoria interna del ESP32 que no se borra al apagarlo — se usa aquí para guardar el historial y las estadísticas de forma permanente.

NI creas que esto lo escribí todo yo, 55% fue chatGPT, pero creo que está bueno, capaz aquí encontrás algo útil.