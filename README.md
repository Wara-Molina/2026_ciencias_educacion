# Portal Web Institucional 2026

Proyecto web desarrollado con Next.js, TypeScript y Tailwind CSS para la gestión y difusión de información institucional, eventos, cursos y publicaciones de las carreras universitarias.

## Carreras asociadas

Este sistema está modularizado y configurado mediante variables de entorno para dar soporte a las carreras de:
- Ciencias de la Educación
- Medicina Veterinaria y Zootecnia

## Descripción

Esta aplicación permite mostrar información relevante, comunicados, eventos, cursos, gacetas, publicaciones y videos institucionales consumidos directamente desde la API centralizadora de la universidad. Incluye páginas públicas, componentes reutilizables y una arquitectura moderna orientada a la escalabilidad y mantenibilidad.

## Estructura del proyecto

- `/app` — Páginas principales y rutas dinámicas (App Router)
- `/components` — Componentes reutilizables UI y de dominio
- `/context` — Contextos globales de React
- `/hooks` — Hooks personalizados
- `/lib` — Utilidades y helpers
- `/public` — Imágenes y recursos estáticos
- `/styles` — Hojas de estilo globales

## Instalación

```bash
# Clona el repositorio
git clone <URL-del-repositorio>

# Instala las dependencias
npm install
# o si prefieres npm
npm install

# Copia y configura las variables de entorno reales
cp .env.copy .env

# Inicia el entorno de desarrollo
npm dev
# o
pm run dev

Scripts principales
npm dev — Inicia el servidor en modo desarrollo

npm build — Compila la aplicación para producción

npm start — Inicia el servidor en producción

npm lint — Ejecuta el linter para verificación de código

# Variables de entorno
Ajusta las variables en tu archivo .env según la carrera que vayas a desplegar.

#  Dependencias clave
next — Framework principal con soporte nativo para .mjs

react y react-dom — Librería base UI

tailwindcss — Estilos utilitarios y configuración de PostCSS

typescript — Tipado estático para robustez del código

shadcn/ui / @radix-ui/* — Componentes accesibles configurados mediante components.json

# Optimización y Seguridad (Next Config)
El proyecto cuenta con una configuración estricta en next.config.mjs para garantizar el rendimiento y la protección de los datos:

1. Optimización de Imágenes (next/image)
Se permite la carga optimizada de recursos multimedia en formato WebP desde los servidores oficiales:

archivosminio.upea.bo (Ruta: /archivospaginasnode/imagenes/)

apiadministrador.upea.bo (Ruta total: /)

2. Cabeceras de Seguridad HTTP
Todas las rutas (/:path*) implementan los siguientes headers de protección activa:

X-Content-Type-Options: nosniff — Previene el sniffing de tipos MIME.

X-Frame-Options: DENY — Protege la aplicación contra ataques de Clickjacking.

X-XSS-Protection: 1; mode=block — Filtro básico contra Cross-Site Scripting.

Referrer-Policy: strict-origin-when-cross-origin — Controla el envío de información de origen en peticiones de terceros.

# Notas adicionales

Configuración por carrera: Para cambiar el portal entre Ciencias de la Educación y Veterinaria, solo debes comentar/descomentar el NEXT_PUBLIC_INSTITUCION_ID correspondiente en el .env y reiniciar el servidor de desarrollo.

Para producción, revisa la configuración en next.config.mjs y ajusta correctamente los orígenes permitidos de las imágenes si se añaden nuevos servidores de almacenamiento.

Desarrollado por el equipo UTIC — 2026.