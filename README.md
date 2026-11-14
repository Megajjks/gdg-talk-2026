# Del prompt al sistema

Laboratorio interactivo para la charla **“Del prompt al sistema: cómo construir workflows con IA”**. Sitio estático en React, TypeScript y Vite. Todas las demostraciones y las trazas son simuladas y predefinidas; no se contacta ningún servicio de IA ni se requieren cuentas o claves.

El **recorrido guiado** sigue el hilo de la charla: primeros prompts → instrucciones y contexto del proyecto → límite de contexto, compactación y trazabilidad → MCP, loop, skills, subagentes y hooks → harness → metodologías SDD y ODD. El **atlas, laboratorio y mapa** quedan disponibles para explorar libremente. Los diagramas del harness y SDD permiten elegir un escenario, avanzar o animar cada etapa, inspeccionar nodos y leer el recorrido como lista. La secuencia es didáctica, no una cronología histórica ni una receta universal.

## Iniciar

Requiere Node.js 22 o superior y npm:

```bash
npm install
npm run dev
```

Abrí la URL que indica Vite (habitualmente `http://localhost:5173/`). Para verla desde un teléfono conectado a la misma red, usá la dirección de red que imprime Vite; permití el acceso local en el firewall solo si corresponde. La aplicación no envía progreso a un servidor; el avance se guarda en `localStorage` del navegador.

## Comprobar y compilar

```bash
npm test
npm run build
npm run preview
```

`npm test` comprueba estados y transiciones del motor de simulación. `npm run build` comprueba TypeScript y genera `dist/`. `npm run preview` sirve el resultado compilado para inspección local.

Con la vista previa ejecutándose en `http://127.0.0.1:4173/`, podés verificar controles y anchuras 1440, 390 y 320 con `npm run test:browser`. Necesita Chrome instalado; para otra ruta configurá `CHROME_PATH` y, para otra URL, `SITE_URL`. El script guarda capturas en el directorio temporal del sistema y elimina su perfil de prueba.

## Despliegue estático

Subí **el contenido de `dist/`** a un hosting estático (por ejemplo, GitHub Pages, Netlify o cualquier servidor de archivos). El proyecto usa `base: './'` para funcionar incluso en subdirectorios. Los enlaces a conceptos usan fragmentos (`#concepto-prompt`) y no requieren reglas especiales de rutas. No publiques `node_modules/` ni archivos de desarrollo. Los enlaces de la sección Fuentes abren documentación externa si la persona decide visitarlos; la web principal no descarga fuentes, scripts o datos de terceros.

## Editar contenido y simulaciones

- `src/content.ts`: definiciones, ejemplos, confusiones, demostraciones y fuentes. Los ejemplos comparten el caso del formulario de registro.
- `src/simulation.ts`: estados, transiciones y trazas predefinidas; no contiene llamadas reales a herramientas.
- `src/simulation.test.ts`: escenarios de éxito, fallo/corrección, aclaración y controles de salida.
- `src/main.tsx`: recorrido, atlas, simulador, mapa y enfoques de trabajo.
- `src/Story.tsx` y `src/narrative-data.ts`: capítulos del guion, ejemplos y datos de los diagramas.
- `src/Diagram.tsx`: reproductor accesible de flujos de harness y SDD, sin llamadas externas.
- `src/style.css`: sistema visual, responsive y movimiento reducido.

La sección ODD se basa en el artículo de Joaquín Ruiz enlazado en la web; su uso del formulario es una **adaptación didáctica**, no una etapa nueva del enfoque. Los hooks, skills, permisos y funciones del harness dependen de la plataforma.
