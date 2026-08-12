# Invitación · Brune cumple 17

Invitación de una sola página con confirmación de asistencia.
Sitio estático, sin backend propio. Los registros se guardan en una
hoja de cálculo de Google mediante Apps Script.

## Estructura

```
index.html            invitación (tres secciones)
admin/index.html      lista de invitados, protegida con PIN
assets/               fotos recortadas (ver LEEME.txt)
apps-script/          código del backend, ya desplegado
```

## Rutas

| URL | Qué muestra |
|---|---|
| `/` | La invitación |
| `/admin/` | La lista de confirmados (pide PIN) |

## Publicar en GitHub Pages

1. Sube el contenido de esta carpeta a la raíz del repositorio.
2. `Settings` → `Pages` → Source: `Deploy from a branch`, rama `main`, carpeta `/ (root)`.
3. Espera 1-2 minutos.

## Probar en local

No lo abras con doble clic: como `file://` el navegador bloquea la
conexión con Apps Script por CORS y parecerá que el registro falla.

```bash
python3 -m http.server 8000
```

Luego entra a `http://localhost:8000` y `http://localhost:8000/admin/`.

## Configuración

Ambos archivos ya apuntan al endpoint desplegado.

- `index.html` → constante `CONFIG`
  - `endpoint` URL del Apps Script
  - `fechaFiesta` destino de la cuenta regresiva
- `admin/index.html` → constante `ENDPOINT`
- `apps-script/Codigo.gs` → constante `PIN_ADMIN`

Si editas el Apps Script, vuelve a implementar con
`Implementar` → `Administrar implementaciones` → lápiz → `Nueva versión`.
La URL no cambia.

## Control de duplicados

Cada navegador genera un identificador que se guarda en `localStorage` y
viaja con el registro. Si ese identificador ya está en la hoja, el botón
aparece en verde y no deja registrar de nuevo. También se rechazan
nombres repetidos.

El candado no es infalible: modo incógnito, otro navegador o borrar los
datos del sitio generan un identificador nuevo. Para una invitación es
suficiente.
