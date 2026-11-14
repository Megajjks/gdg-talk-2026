# Laboratorio interactivo para la charla “Del prompt al sistema: cómo construir workflows con IA”
Branch: feature/laboratorio-charla · Delivery: local static site · Runner: npm test / npm run build
Strategy: single local delivery; no publishing. Forecast: substantial interactive application, >400 authored lines.

## Specs
S1. “Pedir algo → proporcionar contexto → conectar herramientas → organizar el trabajo → verificar resultados → construir un sistema.” Recorrido guiado y exploración libre, sin sincronización entre dispositivos.
S2. “Agregar un formulario de registro a una aplicación web, con validaciones, integración con una API y pruebas”. Ejemplo compartido en toda la experiencia; contenido en español.
S3. Atlas con Prompt, Contexto, Modelo de lenguaje, Herramientas, Agente, Loop, Workflow, Skills, Hooks, MCP, Harness, Estado y memoria, Validaciones y evaluaciones, Permisos y revisión humana; cada concepto incluye definición, función, piezas, ejemplo, interacción, relaciones y confusión frecuente.
S4. Laboratorio con “Ejecutar simulación · Siguiente paso · Pausar · Reiniciar”, configuración de ocho controles y límite de iteraciones; tres escenarios: éxito, fallo y corrección, aclaración. Todos los resultados “simulados y predefinidos”, sin API ni claves.
S5. Mapa interactivo con conexiones etiquetadas, nodos seleccionables, animación paso a paso, leyenda, vistas simple/detallada y alternativa legible en lista.
S6. SDD y ODD explicados con fuente atribuida, artefactos, iteración y validación; ODD según https://jokiruiz.com/inteligencia-artificial/que-es-odd-organic-driven-development/ sin presentarlo como estándar universal.
S7. Diseño responsive móvil y proyección, navegación por teclado, foco visible, movimiento reducido, progreso local, glosario y enlaces directos.
S8. React + TypeScript + Vite, contenido separado, simulación con transiciones explícitas, compilación y pruebas verificadas, instrucciones de ejecución y despliegue estático.

## Tasks
T1 [S1-S3,S7] inline — done; npm run test:browser — interfaz, contenido y microinteracciones; commit: work-unit.
T2 [S4,S8] inline — done; npm test 7/7, npm run build, npm run test:browser — motor de simulación y pruebas; commit: work-unit.
T3 [S5-S8] inline — done; browser S5 regression and independent recheck passed — mapa, enfoques, accesibilidad y entrega; commit: work-unit.

## Log
L1. El usuario solicitó implementar una web educativa completa para “Del prompt al sistema: cómo construir workflows con IA”, guardada en una carpeta nueva con el nombre de su charla; incluye recorrido, atlas interactivo, simulador de tres escenarios, mapa, SDD/ODD, accesibilidad, responsive y despliegue estático. El mensaje original completo permanece en la conversación; las frases literales de aceptación están citadas arriba.
L2. Fuente ODD consultada directamente: artículo de Joaquín Ruiz, 06/11/2026; distingue ODD de gentle-ai de SDD con Spec Kit y describe entender, clasificar e implementar con pruebas. Fuente primaria MCP consultada en modelcontextprotocol.io/docs/learn/architecture. Vite oficial consultado mediante Context7.
L3. Motor RED observado al faltar el módulo; GREEN: 7 pruebas de Node pasan. Instalación offline no disponible: caché local no contiene @types/react. Build y pruebas de navegador pendientes hasta tener dependencias instaladas. UI usa tipografías del sistema, sin recursos externos en tiempo de ejecución.
L4. Bloqueo de verificación: `npm run build` no encuentra `tsc`; `npm install --offline` falla con ENOTCACHED para @types/react. Pendiente autorización explícita para descargar dependencias públicas de registry.npmjs.org sin credenciales; no se publicó ni desplegó nada. Mirror Engram pendiente: el proyecto nuevo aún figura como unknown_project en el almacén.
L5. Usuario autorizó descargar dependencias públicas de registry.npmjs.org sin credenciales. `npm install`, `npm run build`, `npm test` (7/7) y `npm run test:browser` pasaron; capturas y ausencia de desbordamiento horizontal comprobadas a 1440, 390 y 320 px, sin errores de consola. Revisión independiente detectó S5: en modo simple se seleccionaba un nodo oculto al llegar a “Contexto”. Se observó RED en paso 6; se corrigió filtrando la ruta según la vista y reiniciando el recorrido al cambiarla; build y prueba de navegador en GREEN. Recheck independiente limitado a S5 en curso.
L6. Recheck independiente S5: resuelto. Vista simple: 8 nodos visibles; detallada: 11; animación llega a Resultado sin seleccionar nodos ocultos. PRODUCT.md y DESIGN.md fueron escritos por el padre mientras el verificador rechecaba; no son mutaciones externas. Checks actuales completos; publicación no solicitada.
