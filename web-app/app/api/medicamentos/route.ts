import { NextResponse } from "next/server";

import { readStore, writeStore, type Medicamento, type Store } from "@/lib/store";

const STORE_LIMIT = 10;

function generarId(): number {
    return Date.now() + Math.floor(Math.random() * 1000);
}

function obtenerHoraTexto(): string {
    return new Date().toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
}

function crearEvento(nombre: string, tomado: boolean) {
    return {
        id: generarId(),
        nombre,
        horaTexto: obtenerHoraTexto(),
        tomado,
        fecha: new Date().toISOString(),
    };
}

function obtenerDeviceIdFromRequest(request: Request) {
    return request.headers.get("x-device-id")?.trim() ?? "";
}

function normalizarMedicamento(payload: Partial<Medicamento>): Medicamento | null {
    const nombre = String(payload.nombre ?? "").trim();
    const dosis = String(payload.dosis ?? "").trim();
    const hora = Number(payload.hora);
    const minuto = Number(payload.minuto);
    const casilla = Number(payload.casilla);

    if (!nombre || !dosis || Number.isNaN(hora) || Number.isNaN(minuto) || Number.isNaN(casilla)) {
        return null;
    }

    if (hora < 0 || hora > 23 || minuto < 0 || minuto > 59 || casilla <= 0) {
        return null;
    }

    return {
        id: payload.id ?? generarId(),
        nombre,
        hora,
        minuto,
        casilla,
        dosis,
        activo: payload.activo ?? true,
        tomadoHoy: payload.tomadoHoy ?? false,
    };
}

export async function GET(request: Request) {
    const deviceId = obtenerDeviceIdFromRequest(request);
    const store = await readStore(deviceId);
    return NextResponse.json(store);
}

export async function POST(request: Request) {
    const deviceId = obtenerDeviceIdFromRequest(request);
    const payload = (await request.json()) as {
        action?: "create" | "mark-taken" | "mark-skipped";
        id?: number;
        nombre?: string;
        hora?: number;
        minuto?: number;
        casilla?: number;
        dosis?: string;
    };

    const store = await readStore(deviceId);

    if (payload.action === "mark-taken" || payload.action === "mark-skipped") {
        const medicamento = store.medicamentos.find((item) => item.id === payload.id);
        if (!medicamento) {
            return NextResponse.json({ error: "Medicamento no encontrado" }, { status: 404 });
        }

        medicamento.tomadoHoy = true;
        store.historial = [crearEvento(`${medicamento.nombre} ${payload.action === "mark-taken" ? "tomado" : "no tomado"}`, payload.action === "mark-taken"), ...store.historial].slice(0, STORE_LIMIT);
        store.estadisticas = {
            ...store.estadisticas,
            tomados: payload.action === "mark-taken" ? store.estadisticas.tomados + 1 : store.estadisticas.tomados,
            olvidados: payload.action === "mark-skipped" ? store.estadisticas.olvidados + 1 : store.estadisticas.olvidados,
        };

        await writeStore(store, deviceId);
        return NextResponse.json(store);
    }

    const medicamento = normalizarMedicamento(payload);
    if (!medicamento) {
        return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    store.medicamentos = [...store.medicamentos, medicamento];
    store.historial = [crearEvento(`${medicamento.nombre} registrado`, true), ...store.historial].slice(0, STORE_LIMIT);

    await writeStore(store, deviceId);
    return NextResponse.json(store);
}

export async function PUT(request: Request) {
    const deviceId = obtenerDeviceIdFromRequest(request);
    const payload = (await request.json()) as {
        id?: number;
        nombre?: string;
        hora?: number;
        minuto?: number;
        casilla?: number;
        dosis?: string;
    };

    const store = await readStore(deviceId);
    const medicamento = normalizarMedicamento(payload);

    if (!medicamento || medicamento.id !== payload.id) {
        return NextResponse.json({ error: "Datos inválidos para edición" }, { status: 400 });
    }

    const idx = store.medicamentos.findIndex((item) => item.id === payload.id);
    if (idx === -1) {
        return NextResponse.json({ error: "Medicamento no encontrado" }, { status: 404 });
    }

    store.medicamentos[idx] = {
        ...store.medicamentos[idx],
        ...medicamento,
    };
    store.historial = [crearEvento(`${medicamento.nombre} actualizado`, true), ...store.historial].slice(0, STORE_LIMIT);

    await writeStore(store, deviceId);
    return NextResponse.json(store);
}

export async function DELETE(request: Request) {
    const deviceId = obtenerDeviceIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get("id");
    const historyIdParam = searchParams.get("historyId");

    if (historyIdParam) {
        const historyId = Number(historyIdParam);
        if (Number.isNaN(historyId)) {
            return NextResponse.json({ error: "ID de historial no válido" }, { status: 400 });
        }

        const store = await readStore(deviceId);
        const historialLength = store.historial.length;
        store.historial = store.historial.filter((item) => item.id !== historyId);

        if (store.historial.length === historialLength) {
            return NextResponse.json({ error: "Entrada de historial no encontrada" }, { status: 404 });
        }

        await writeStore(store, deviceId);
        return NextResponse.json(store);
    }

    const id = Number(idParam);
    if (Number.isNaN(id)) {
        return NextResponse.json({ error: "ID no válido" }, { status: 400 });
    }

    const store = await readStore(deviceId);
    const medicamento = store.medicamentos.find((item) => item.id === id);

    if (!medicamento) {
        return NextResponse.json({ error: "Medicamento no encontrado" }, { status: 404 });
    }

    store.medicamentos = store.medicamentos.filter((item) => item.id !== id);
    store.historial = [crearEvento(`${medicamento.nombre} eliminado`, false), ...store.historial].slice(0, STORE_LIMIT);

    await writeStore(store, deviceId);
    return NextResponse.json(store);
}
