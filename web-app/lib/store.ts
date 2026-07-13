import { promises as fs } from "fs";
import path from "path";

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

const STORE_PATH = path.join(process.cwd(), "data", "store.json");

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
    await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });

    try {
        const raw = await fs.readFile(STORE_PATH, "utf8");
        const parsed = JSON.parse(raw) as Partial<Store>;

        return {
            medicamentos: parsed.medicamentos ?? DEFAULT_STORE.medicamentos,
            historial: parsed.historial ?? DEFAULT_STORE.historial,
            estadisticas: {
                tomados: parsed.estadisticas?.tomados ?? DEFAULT_STORE.estadisticas.tomados,
                olvidados: parsed.estadisticas?.olvidados ?? DEFAULT_STORE.estadisticas.olvidados,
            },
        };
    } catch {
        await fs.writeFile(STORE_PATH, JSON.stringify(DEFAULT_STORE, null, 2), "utf8");
        return DEFAULT_STORE;
    }
}

export async function writeStore(store: Store): Promise<void> {
    await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
    await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}
