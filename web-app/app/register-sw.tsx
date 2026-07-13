"use client";

import { useEffect } from "react";

export default function RegisterSW() {
    useEffect(() => {
        if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
            return;
        }

        void navigator.serviceWorker.register("/sw.js").catch(() => {
            // El navegador puede no soportar service workers o estar en un entorno restringido.
        });
    }, []);

    return null;
}
