import { Redis } from "@upstash/redis";

const redis = new Redis({
    url: process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
});

export type Medicamento = {
    id: number;
    nombre: string;
    hora: number;
    minuto: number;
    casilla: number;
    dosis: string;
    activo: boolean;
    tomadoHoy: boolean;
};

export type EventoHistorial = {
    id: number;
    nombre: string;
    horaTexto: string;
    tomado: boolean;
    fecha: string;
};

export type Estadisticas = {
    tomados: number;
    olvidados: number;
};

export type Store = {
    medicamentos: Medicamento[];
    historial: EventoHistorial[];
    estadisticas: Estadisticas;
};

const STORE_KEY = "pastillero:store";

const DEFAULT_STORE: Store = {
    medicamentos: [
        { id: 1, nombre: "Vitamina C", hora: 8, minuto: 0, casilla: 1, dosis: "1 tableta", activo: true, tomadoHoy: false },
        { id: 2, nombre: "Amoxicilina", hora: 14, minuto: 0, casilla: 4, dosis: "500mg", activo: true, tomadoHoy: false },
        { id: 3, nombre: "Ibuprofeno", hora: 20, minuto: 0, casilla: 2, dosis: "400mg", activo: true, tomadoHoy: false },
    ],
    historial: [
        { id: 101, nombre: "Vitamina C", horaTexto: "08:00", tomado: true, fecha: new Date().toISOString() },
        { id: 102, nombre: "Amoxicilina", horaTexto: "14:00", tomado: false, fecha: new Date().toISOString() },
    ],
    estadisticas: {
        tomados: 1,
        olvidados: 1,
    },
};

export async function readStore(): Promise<Store> {
    const stored = await redis.get<Store>(STORE_KEY);

    if (!stored) {
        await redis.set(STORE_KEY, DEFAULT_STORE);
        return DEFAULT_STORE;
    }

    return {
        medicamentos: stored.medicamentos ?? DEFAULT_STORE.medicamentos,
        historial: stored.historial ?? DEFAULT_STORE.historial,
        estadisticas: {
            tomados: stored.estadisticas?.tomados ?? DEFAULT_STORE.estadisticas.tomados,
            olvidados: stored.estadisticas?.olvidados ?? DEFAULT_STORE.estadisticas.olvidados,
        },
    };
}

export async function writeStore(store: Store): Promise<void> {
    await redis.set(STORE_KEY, store);
}