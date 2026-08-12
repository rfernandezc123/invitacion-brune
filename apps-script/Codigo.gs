/**
 * Cumple Brune - RSVP backend
 * Google Apps Script Web App. Deploy: Execute as "Me", Access "Anyone".
 */

// PIN de ejemplo: el real solo esta en el script desplegado en Google.
const PIN_ADMIN = '2808';
const SHEET_NAME = 'Invitados';
const HEADERS = [
  'Fecha', 'Nombre', 'Acompanante', 'Nombre acompanante',
  'Regalo', 'Mensaje', 'Device ID'
];

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    const header = sheet.getRange(1, 1, 1, HEADERS.length);
    header.setFontWeight('bold');
    header.setBackground('#DEB0F4');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 160);
    sheet.setColumnWidth(2, 220);
    sheet.setColumnWidth(6, 300);
  }

  return sheet;
}

function json(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function readAll() {
  const sheet = getSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();

  return values.map(function (row, i) {
    return {
      fila: i + 2,
      fecha: row[0] instanceof Date ? row[0].toISOString() : String(row[0]),
      nombre: String(row[1] || ''),
      acompanante: String(row[2] || ''),
      nombreAcompanante: String(row[3] || ''),
      regalo: String(row[4] || ''),
      mensaje: String(row[5] || ''),
      deviceId: String(row[6] || '')
    };
  });
}

function normalizar(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * GET
 *   ?accion=estado&deviceId=xxx  -> revisa si ese dispositivo ya se registro
 *   ?accion=lista&pin=xxxx       -> devuelve todos los registros (requiere PIN)
 */
function doGet(e) {
  try {
    const params = e && e.parameter ? e.parameter : {};
    const accion = params.accion || 'estado';

    if (accion === 'lista') {
      if (params.pin !== PIN_ADMIN) {
        return json({ ok: false, error: 'PIN incorrecto' });
      }
      const registros = readAll();
      return json({ ok: true, total: registros.length, registros: registros });
    }

    const deviceId = params.deviceId || '';
    if (!deviceId) return json({ ok: true, registrado: false });

    const encontrado = readAll().filter(function (r) {
      return r.deviceId === deviceId;
    })[0];

    return json({
      ok: true,
      registrado: !!encontrado,
      registro: encontrado || null
    });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

/**
 * POST -> registra un invitado.
 * El body llega como text/plain para evitar el preflight CORS.
 */
function doPost(e) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(20000);

    const data = JSON.parse(e.postData.contents);
    const nombre = String(data.nombre || '').trim();
    const deviceId = String(data.deviceId || '').trim();

    if (!nombre) {
      return json({ ok: false, error: 'Falta el nombre' });
    }

    const registros = readAll();

    const porDevice = registros.filter(function (r) {
      return deviceId && r.deviceId === deviceId;
    })[0];

    if (porDevice) {
      return json({
        ok: false,
        duplicado: 'device',
        error: 'Este dispositivo ya confirmo asistencia',
        registro: porDevice
      });
    }

    const porNombre = registros.filter(function (r) {
      return normalizar(r.nombre) === normalizar(nombre);
    })[0];

    if (porNombre) {
      return json({
        ok: false,
        duplicado: 'nombre',
        error: 'Ese nombre ya esta en la lista',
        registro: porNombre
      });
    }

    const sheet = getSheet();
    sheet.appendRow([
      new Date(),
      nombre,
      data.acompanante ? 'Si' : 'No',
      String(data.nombreAcompanante || '').trim(),
      String(data.regalo || '').trim(),
      String(data.mensaje || '').trim(),
      deviceId
    ]);

    return json({
      ok: true,
      mensaje: 'Registro guardado',
      total: sheet.getLastRow() - 1
    });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}
