"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Medicamento = {
    id: number;
    nombre: string;
    hora: number;
    minuto: number;
    casilla: number;
    dosis: string;
    activo: boolean;
    tomadoHoy: boolean;
};

type EventoHistorial = {
    id: number;
    nombre: string;
    horaTexto: string;
    tomado: boolean;
    fecha: string;
};

type Estadisticas = {
    tomados: number;
    olvidados: number;
};

const medicamentosIniciales: Medicamento[] = [];

const historialInicial: EventoHistorial[] = [];

const estadisticasIniciales: Estadisticas = {
    tomados: 0,
    olvidados: 0,
};

function generarId() {
    return Date.now() + Math.floor(Math.random() * 1000);
}

function formatearHora(hora: number, minuto: number) {
    return `${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}`;
}

function crearEvento(nombre: string, tomado: boolean): EventoHistorial {
    return {
        id: generarId(),
        nombre,
        horaTexto: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false }),
        tomado,
        fecha: new Date().toISOString(),
    };
}

export default function HomePage() {
    const [medicamentos, setMedicamentos] = useState<Medicamento[]>(medicamentosIniciales);
    const [historial, setHistorial] = useState<EventoHistorial[]>(historialInicial);
    const [estadisticas, setEstadisticas] = useState<Estadisticas>(estadisticasIniciales);
    const [form, setForm] = useState({ nombre: "", hora: "08", minuto: "00", casilla: "1", dosis: "" });
    const [editandoId, setEditandoId] = useState<number | null>(null);
    const [mensaje, setMensaje] = useState<string>("");

    const cargarDatos = async () => {
        const respuesta = await fetch("/api/medicamentos");
        const datos = await respuesta.json();
        setMedicamentos(datos.medicamentos ?? []);
        setHistorial(datos.historial ?? []);
        setEstadisticas(datos.estadisticas ?? estadisticasIniciales);
    };

    useEffect(() => {
        void cargarDatos();
    }, []);

    const proximoMedicamento = useMemo(() => {
        const ahora = new Date();
        const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes();

        return [...medicamentos]
            .sort((a, b) => {
                const diferenciaA = (a.hora * 60 + a.minuto - minutosActuales + 24 * 60) % (24 * 60);
                const diferenciaB = (b.hora * 60 + b.minuto - minutosActuales + 24 * 60) % (24 * 60);
                return diferenciaA - diferenciaB;
            })
            .find((medicamento) => medicamento.activo);
    }, [medicamentos]);

    const porcentajeCumplimiento = useMemo(() => {
        const total = estadisticas.tomados + estadisticas.olvidados;
        if (total === 0) return 100;
        return Math.round((estadisticas.tomados / total) * 100);
    }, [estadisticas]);

    const resetearFormulario = () => {
        setForm({ nombre: "", hora: "08", minuto: "00", casilla: "1", dosis: "" });
        setEditandoId(null);
    };

    const handleAgregar = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const nombre = form.nombre.trim();
        const dosis = form.dosis.trim();
        const hora = Number(form.hora);
        const minuto = Number(form.minuto);
        const casilla = Number(form.casilla);

        if (!nombre || !dosis || Number.isNaN(hora) || Number.isNaN(minuto) || Number.isNaN(casilla)) {
            setMensaje("Completa nombre, dosis, hora, minuto y casilla.");
            return;
        }

        if (hora < 0 || hora > 23 || minuto < 0 || minuto > 59 || casilla <= 0) {
            setMensaje("La hora debe estar entre 00 y 23, el minuto entre 00 y 59, y la casilla debe ser mayor a 0.");
            return;
        }

        if (editandoId !== null) {
            const respuesta = await fetch("/api/medicamentos", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: editandoId, nombre, hora, minuto, casilla, dosis }),
            });

            if (respuesta.ok) {
                await cargarDatos();
                setMensaje("Medicamento actualizado correctamente.");
                resetearFormulario();
                return;
            }

            setMensaje("No se pudo actualizar el medicamento.");
            return;
        }

        const respuesta = await fetch("/api/medicamentos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre, hora, minuto, casilla, dosis }),
        });

        if (respuesta.ok) {
            await cargarDatos();
            setMensaje("Medicamento agregado correctamente.");
            resetearFormulario();
            return;
        }

        setMensaje("No se pudo agregar el medicamento.");
    };

    const handleEditar = (id: number) => {
        const medicamento = medicamentos.find((item) => item.id === id);
        if (!medicamento) return;

        setForm({
            nombre: medicamento.nombre,
            hora: String(medicamento.hora),
            minuto: String(medicamento.minuto),
            casilla: String(medicamento.casilla),
            dosis: medicamento.dosis,
        });
        setEditandoId(id);
        setMensaje("Editando medicamento...");
    };

    const handleEliminar = async (id: number) => {
        const medicamento = medicamentos.find((item) => item.id === id);
        if (!medicamento) return;

        const respuesta = await fetch(`/api/medicamentos?id=${id}`, {
            method: "DELETE",
        });

        if (respuesta.ok) {
            await cargarDatos();
            setMensaje("Medicamento eliminado.");
            if (editandoId === id) {
                resetearFormulario();
            }
            return;
        }

        setMensaje("No se pudo eliminar el medicamento.");
    };

    const marcarTomado = async (id: number) => {
        const medicamento = medicamentos.find((item) => item.id === id);
        if (!medicamento) return;

        const respuesta = await fetch("/api/medicamentos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "mark-taken", id }),
        });

        if (respuesta.ok) {
            await cargarDatos();
            setMensaje(`${medicamento.nombre} marcado como tomado.`);
            return;
        }

        setMensaje("No se pudo marcar como tomado.");
    };

    const marcarOlvidado = async (id: number) => {
        const medicamento = medicamentos.find((item) => item.id === id);
        if (!medicamento) return;

        const respuesta = await fetch("/api/medicamentos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "mark-skipped", id }),
        });

        if (respuesta.ok) {
            await cargarDatos();
            setMensaje(`${medicamento.nombre} marcado como no tomado.`);
            return;
        }

        setMensaje("No se pudo marcar como no tomado.");
    };

    return (
        <main className="page-shell">
            <header className="hero-card">
                <div>
                    <p className="eyebrow">Web app usable</p>
                    <h1>Pastillero Inteligente</h1>
                    <p className="subtitle">Gestiona tus medicamentos, revisa el historial y controla tu cumplimiento desde un solo lugar.</p>
                </div>

                <div className="hero-stat">
                    <span>Próximo</span>
                    <strong>{proximoMedicamento ? `${proximoMedicamento.nombre} · ${formatearHora(proximoMedicamento.hora, proximoMedicamento.minuto)}` : "Sin medicamentos"}</strong>
                </div>
            </header>

            <section className="dashboard-grid">
                <article className="card">
                    <div className="section-title">
                        <span className="section-icon">✚</span>
                        <h2>Registrar medicamento</h2>
                    </div>
                    <form className="form-grid" onSubmit={handleAgregar}>
                        <label>
                            Nombre
                            <input value={form.nombre} onChange={(event) => setForm((prev) => ({ ...prev, nombre: event.target.value }))} placeholder="Vitamina C" required />
                        </label>

                        <label>
                            Hora
                            <input type="number" min="0" max="23" value={form.hora} onChange={(event) => setForm((prev) => ({ ...prev, hora: event.target.value }))} required />
                        </label>

                        <label>
                            Minuto
                            <input type="number" min="0" max="59" value={form.minuto} onChange={(event) => setForm((prev) => ({ ...prev, minuto: event.target.value }))} required />
                        </label>

                        <label>
                            Casilla
                            <input type="number" min="1" value={form.casilla} onChange={(event) => setForm((prev) => ({ ...prev, casilla: event.target.value }))} required />
                        </label>

                        <label className="full-width">
                            Dosis
                            <input value={form.dosis} onChange={(event) => setForm((prev) => ({ ...prev, dosis: event.target.value }))} placeholder="500mg" required />
                        </label>

                        <div className="form-actions">
                            <button className="primary-button" type="submit">{editandoId !== null ? "Guardar cambios" : "Agregar medicamento"}</button>
                            {editandoId !== null && (
                                <button className="secondary-button" type="button" onClick={resetearFormulario}>Cancelar edición</button>
                            )}
                        </div>

                        {mensaje && <p className="feedback-message">{mensaje}</p>}
                    </form>
                </article>

                <article className="card">
                    <div className="section-title">
                        <span className="section-icon">💊</span>
                        <h2>Lista de medicamentos</h2>
                    </div>
                    <div className="stack">
                        {medicamentos.length === 0 ? (
                            <p className="empty-state">Todavía no hay medicamentos registrados.</p>
                        ) : (
                            medicamentos.map((medicamento) => (
                                <div key={medicamento.id} className="medicine-item">
                                    <div className="item-main">
                                        <span className="item-icon">💊</span>
                                        <div>
                                            <strong>{medicamento.nombre}</strong>
                                            <div className="muted">{formatearHora(medicamento.hora, medicamento.minuto)} · Casilla {medicamento.casilla} · {medicamento.dosis}</div>
                                        </div>
                                    </div>
                                    <div className="action-row">
                                        <button className="soft-button" onClick={() => marcarTomado(medicamento.id)}>Tomado</button>
                                        <button className="soft-button warn" onClick={() => marcarOlvidado(medicamento.id)}>No tomado</button>
                                        <button className="soft-button" onClick={() => handleEditar(medicamento.id)}>Editar</button>
                                        <button className="soft-button danger" onClick={() => handleEliminar(medicamento.id)}>Eliminar</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </article>

                <article className="card">
                    <div className="section-title">
                        <span className="section-icon">🕘</span>
                        <h2>Historial</h2>
                    </div>
                    <div className="stack">
                        {historial.map((evento) => (
                            <div key={evento.id} className="history-item">
                                <div className="item-main">
                                    <span className={evento.tomado ? "badge ok" : "badge fail"}>{evento.tomado ? "✔" : "✖"}</span>
                                    <div>
                                        <strong>{evento.nombre}</strong>
                                        <div className="muted">{evento.horaTexto}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </article>

                <article className="card">
                    <div className="section-title">
                        <span className="section-icon">📈</span>
                        <h2>Estadísticas</h2>
                    </div>
                    <div className="stats-grid">
                        <div className="stat-box">
                            <div className="stat-head">
                                <span className="stat-icon">✅</span>
                                <span>Tomados</span>
                            </div>
                            <strong>{estadisticas.tomados}</strong>
                        </div>
                        <div className="stat-box">
                            <div className="stat-head">
                                <span className="stat-icon">⏳</span>
                                <span>Olvidados</span>
                            </div>
                            <strong>{estadisticas.olvidados}</strong>
                        </div>
                        <div className="stat-box wide">
                            <div className="stat-head">
                                <span className="stat-icon">📊</span>
                                <span>Cumplimiento</span>
                            </div>
                            <strong>{porcentajeCumplimiento}%</strong>
                        </div>
                    </div>
                </article>
            </section>
        </main>
    );
}
