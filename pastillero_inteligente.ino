/*
  Base limpia para convertir el proyecto en una web-app.
  Se conserva solo la lógica de negocio del pastillero:
  - registro de medicamentos
  - lista de medicamentos
  - historial
  - porcentaje de cumplimiento

  Se eliminan dependencias de ESP32, WiFi, OLED, buzzer,
  sensores magnéticos, Blynk y cualquier código específico de hardware.
*/

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <cstdio>
#include <string>

#define MAX_MEDICAMENTOS 10
#define MAX_HISTORIAL 10

static std::string trim(const std::string &value)
{
  auto inicio = std::find_if_not(value.begin(), value.end(), [](unsigned char ch)
                                 { return std::isspace(ch) != 0; });
  auto fin = std::find_if_not(value.rbegin(), value.rend(), [](unsigned char ch)
                              { return std::isspace(ch) != 0; })
                 .base();

  if (inicio >= fin)
    return "";

  return std::string(inicio, fin);
}

struct Medicamento
{
  std::string nombre;
  std::uint8_t hora;
  std::uint8_t minuto;
  std::uint8_t casilla;
  std::string dosis;
  bool activo;
  bool tomadoHoy;
  int ultimoDiaChequeado;
};

struct EventoHistorial
{
  std::string nombre;
  std::string horaTexto;
  bool tomado;
};

Medicamento medicamentos[MAX_MEDICAMENTOS];
int totalMedicamentos = 0;

EventoHistorial historial[MAX_HISTORIAL];
int totalHistorial = 0;

int contadorTomados = 0;
int contadorOlvidados = 0;

bool agregarMedicamento(std::string nombre, std::uint8_t hora, std::uint8_t minuto, std::uint8_t casilla, std::string dosis)
{
  nombre = trim(nombre);
  dosis = trim(dosis);

  if (nombre.empty() || dosis.empty())
    return false;
  if (hora > 23 || minuto > 59)
    return false;
  if (casilla == 0)
    return false;
  if (totalMedicamentos >= MAX_MEDICAMENTOS)
    return false;

  Medicamento &m = medicamentos[totalMedicamentos];
  m.nombre = nombre;
  m.hora = hora;
  m.minuto = minuto;
  m.casilla = casilla;
  m.dosis = dosis;
  m.activo = true;
  m.tomadoHoy = false;
  m.ultimoDiaChequeado = -1;
  totalMedicamentos++;
  return true;
}

bool eliminarMedicamento(int idx)
{
  if (idx < 0 || idx >= totalMedicamentos)
    return false;

  for (int i = idx; i < totalMedicamentos - 1; i++)
  {
    medicamentos[i] = medicamentos[i + 1];
  }

  totalMedicamentos--;
  return true;
}

std::string obtenerListaComoTexto()
{
  std::string salida;

  for (int i = 0; i < totalMedicamentos; i++)
  {
    const Medicamento &m = medicamentos[i];
    char buf[128];
    std::snprintf(buf, sizeof(buf), "%d: %s %02d:%02d C%d - %s", i, m.nombre.c_str(), m.hora, m.minuto, m.casilla, m.dosis.c_str());
    salida += buf;

    if (i < totalMedicamentos - 1)
      salida += "\n";
  }

  if (salida.empty())
    salida = "(sin medicamentos)";

  return salida;
}

void registrarHistorial(const std::string &nombre, bool tomado, const std::string &horaTexto)
{
  int limite = totalHistorial < MAX_HISTORIAL ? totalHistorial : MAX_HISTORIAL - 1;

  for (int i = limite; i > 0; i--)
  {
    historial[i] = historial[i - 1];
  }

  historial[0] = {nombre, horaTexto, tomado};

  if (totalHistorial < MAX_HISTORIAL)
    totalHistorial++;
}

float obtenerPorcentajeCumplimiento()
{
  int total = contadorTomados + contadorOlvidados;
  if (total == 0)
    return 100.0f;

  return (contadorTomados * 100.0f) / total;
}

void marcarComoTomado(int idx)
{
  if (idx < 0 || idx >= totalMedicamentos)
    return;

  medicamentos[idx].tomadoHoy = true;
  registrarHistorial(medicamentos[idx].nombre, true, "--:--");
  contadorTomados++;
}

void marcarComoNoTomado(int idx)
{
  if (idx < 0 || idx >= totalMedicamentos)
    return;

  medicamentos[idx].tomadoHoy = true;
  registrarHistorial(medicamentos[idx].nombre, false, "--:--");
  contadorOlvidados++;
}
