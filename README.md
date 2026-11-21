# 🕰️ Línea de Tiempo — Juego de Mesa Multijugador (2 a 20+ jugadores)

Aplicación web multijugador en tiempo real inspirada en **Timeline**, diseñada con la estética clásica de pergamino y bordes dorados fiel a las cartas originales del PDF **Línea de Tiempo Testigos de Jehová** (`1870–2024`), optimizada para jugar desde celulares o PC compartiendo pantalla.

## ✨ Características Principales
- **60 cartas oficiales extraídas del PDF** (`server/src/data/tjCards.json`) con todas sus ilustraciones originales (`client/public/cards/`).
- **64 cartas adicionales** de Historia Universal, Inventos, Ciencia y Chile/Latinoamérica (`server/src/data/generalCards.json`) + opción de **Mazo Combinado (124 cartas)** ideal para 15–20+ jugadores.
- **Salas instantáneas**: código corto de 5 letras + enlace directo + **código QR real** con detección automática de IP Wi-Fi local.
- **Dos modos de juego**:
  - **Clásico (Por turnos)**: Gana el primero en quedarse sin cartas, con cierre de ronda justa y **Muerte Súbita** con 1 carta extra si hay empate.
  - **Supervivencia / Puntos (Simultáneo)**: Todos juegan a la vez cada ronda con 3 vidas y bonos por velocidad (ideal para 10–20+ jugadores).
- **Volteo 3D con suspenso**, validación automática (`prevYear <= year <= nextYear`), efectos de sonido Web Audio API, reacciones en vivo con emojis, historial rápido de jugadas y botón **"Volver a jugar"** manteniendo la misma sala.

## 🚀 Cómo Ejecutar

### Opción 1 — Modo Producción / Listo para Jugar (1 solo comando, ideal Wi-Fi / LAN)
```powershell
npm.cmd start
```
Luego abre en tu navegador:
- **En tu PC**: `http://localhost:3001`
- **En celulares (mismo Wi-Fi)**: la URL `http://<tu-IP-local>:3001` que aparece en consola (o escaneando el **código QR** desde el Lobby).

### Opción 2 — Modo Desarrollo (Hot Reload)
```powershell
npm.cmd run dev
```
- Frontend Vite: `http://localhost:5173`
- Backend Socket.io: `http://localhost:3001`

> **Nota para Windows PowerShell**: si ves un error de política de ejecución al escribir `npm`, usa `npm.cmd` (por ejemplo, `npm.cmd start`).
