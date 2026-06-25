/**
 * Google Apps Script - IC Platform Backend
 * 
 * SETUP:
 * 1. Tạo hoặc mở Google Sheet của bạn, rồi vào Extensions > Apps Script.
 * 2. Dán toàn bộ file này, lưu lại và chạy setupSheets() một lần.
 *    Hàm này chỉ tạo sheet/cột còn thiếu; không xóa dữ liệu đang có.
 * 3. Trong sheet Users, thêm người dùng có các cột: email, name, role.
 * 4. Deploy > New deployment > Web app, Execute as: Me, Who has access: Anyone.
 * 5. Copy URL kết thúc bằng /exec vào VITE_GOOGLE_SHEETS_API_URL.
 */

const SHEET_NAMES = {
  PROJECTS: 'Projects',
  ACTIVITIES: 'Activities',
  CONTENTS: 'Contents',
  USERS: 'Users',
  WORKFLOW_TEMPLATES: 'WorkflowTemplates',
};

const SHEET_SCHEMAS = {
  [SHEET_NAMES.PROJECTS]: ['id', 'name', 'description', 'assignee', 'startDate', 'deadline', 'status', 'notes', 'objective', 'audience', 'keyMessage', 'cta', 'channels', 'toneOfVoice', 'stakeholder', 'successMetric', 'mandatoryInfo'],
  [SHEET_NAMES.ACTIVITIES]: ['id', 'projectId', 'name', 'description', 'assignee', 'startDate', 'deadline', 'priority', 'status', 'channel', 'attachmentLink', 'notes', 'approver', 'reviewDueDate', 'reviewNotes', 'checklist'],
  [SHEET_NAMES.CONTENTS]: ['id', 'title', 'contentType', 'projectId', 'projectName', 'activityId', 'activityName', 'prompt', 'content', 'createdAt', 'status', 'approver', 'reviewNotes', 'publishedAt'],
  // Users deliberately keeps the original email/name/role schema so existing sheets do not break.
  // CRUD uses email as the stable identifier when an id column is not present.
  [SHEET_NAMES.USERS]: ['email', 'name', 'role'],
  [SHEET_NAMES.WORKFLOW_TEMPLATES]: ['id', 'name', 'description', 'category', 'estimatedWeeks', 'steps'],
};

/**
 * Creates missing sheets and adds missing columns without deleting existing data.
 * Run this after pasting a new version of this script.
 */
function setupSheets() {
  Object.entries(SHEET_SCHEMAS).forEach(([sheetName, headers]) => ensureSheet(sheetName, headers));
  SpreadsheetApp.getUi().alert('Setup hoàn tất. Dữ liệu hiện có đã được giữ nguyên.');
}

function ensureSheet(sheetName, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);

  const lastColumn = sheet.getLastColumn();
  const existingHeaders = lastColumn > 0
    ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(String)
    : [];

  if (existingHeaders.length === 0 || existingHeaders.every(header => !header)) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  } else {
    const missingHeaders = headers.filter(header => !existingHeaders.includes(header));
    if (missingHeaders.length > 0) {
      sheet.getRange(1, lastColumn + 1, 1, missingHeaders.length).setValues([missingHeaders]);
    }
  }

  const columnCount = Math.max(sheet.getLastColumn(), headers.length);
  if (columnCount > 0) sheet.setColumnWidths(1, columnCount, 150);
  sheet.getRange(1, 1, 1, sheet.getLastColumn())
    .setFontWeight('bold')
    .setBackground('#4f46e5')
    .setFontColor('#ffffff');
  sheet.setFrozenRows(1);
}

function doGet(e) {
  const action = e.parameter.action;
  const sheet = e.parameter.sheet;
  const email = e.parameter.email;

  try {
    if (action === 'getAll') {
      return jsonResponse(getAllData());
    }
    if (action === 'get' && sheet) {
      return jsonResponse(getSheetData(sheet));
    }
    if (action === 'checkUser' && email) {
      return jsonResponse(checkUser(email));
    }
    return jsonResponse({ error: 'Invalid action. Use ?action=getAll or ?action=get&sheet=Projects or ?action=checkUser&email=xxx' });
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const { action, sheet, data, id } = body;

    switch (action) {
      case 'add':
        return jsonResponse(addRow(sheet, data));
      case 'update':
        return jsonResponse(updateRow(sheet, id, data));
      case 'delete':
        return jsonResponse(deleteRow(sheet, id));
      case 'deleteRelated':
        return jsonResponse(deleteRelatedRows(body.targetSheet, body.foreignKeyField, body.foreignKeyValue));
      default:
        return jsonResponse({ error: 'Invalid action. Use add, update, delete, or deleteRelated' });
    }
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

function getAllData() {
  return {
    projects: getSheetData(SHEET_NAMES.PROJECTS),
    activities: getSheetData(SHEET_NAMES.ACTIVITIES),
    contents: getSheetData(SHEET_NAMES.CONTENTS),
    users: getSheetData(SHEET_NAMES.USERS),
    workflowTemplates: getSheetData(SHEET_NAMES.WORKFLOW_TEMPLATES),
  };
}

function getSheetData(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data[0];
  const rows = [];

  for (let i = 1; i < data.length; i++) {
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      let val = data[i][j];
      if (val instanceof Date) {
        val = Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      }
      row[headers[j]] = val;
    }
    if (sheetName === SHEET_NAMES.USERS && !row.id && row.email) {
      row.id = normalizeEmail(row.email);
    }
    rows.push(row);
  }
  return rows;
}

function getIdentityConfig(sheetName, headers) {
  const idCol = headers.indexOf('id');
  if (idCol !== -1) return { field: 'id', column: idCol };

  if (sheetName === SHEET_NAMES.USERS) {
    const emailCol = headers.indexOf('email');
    if (emailCol !== -1) return { field: 'email', column: emailCol };
  }

  throw new Error('Sheet must contain an id column: ' + sheetName);
}

function normalizeIdentity(field, value) {
  if (field === 'email') return normalizeEmail(value);
  return String(value || '').trim();
}

function normalizeEmail(value) {
  return String(value || '').toLowerCase().trim();
}

function addRow(sheetName, data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) throw new Error('Sheet not found: ' + sheetName);

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const identity = getIdentityConfig(sheetName, headers);
  const generatedId = data.id ? String(data.id) : generateId(sheetName);
  const rawIdentity = identity.field === 'email' ? data.email : generatedId;
  const identityValue = normalizeIdentity(identity.field, rawIdentity);
  if (!identityValue) throw new Error('Missing required identity field: ' + identity.field);

  const existingValues = sheet.getLastRow() > 1
    ? sheet.getRange(2, identity.column + 1, sheet.getLastRow() - 1, 1).getValues().flat()
    : [];
  if (existingValues.some(existingValue => normalizeIdentity(identity.field, existingValue) === identityValue)) {
    throw new Error('Duplicate ' + identity.field + ': ' + identityValue);
  }

  const row = headers.map(h => {
    if (h === 'id') return generatedId;
    if (h === 'createdAt') return new Date().toISOString();
    return data[h] !== undefined ? data[h] : '';
  });

  sheet.appendRow(row);
  return { success: true, id: identity.field === 'email' ? identityValue : generatedId };
}

function updateRow(sheetName, id, data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) throw new Error('Sheet not found: ' + sheetName);

  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  const identity = getIdentityConfig(sheetName, headers);
  const targetIdentity = normalizeIdentity(identity.field, id);

  for (let i = 1; i < allData.length; i++) {
    if (normalizeIdentity(identity.field, allData[i][identity.column]) === targetIdentity) {
      for (const [key, value] of Object.entries(data)) {
        const colIdx = headers.indexOf(key);
        if (colIdx !== -1) {
          sheet.getRange(i + 1, colIdx + 1).setValue(value);
        }
      }
      return { success: true };
    }
  }
  return { success: false, error: 'Row not found' };
}

function deleteRow(sheetName, id) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) throw new Error('Sheet not found: ' + sheetName);

  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  const identity = getIdentityConfig(sheetName, headers);
  const targetIdentity = normalizeIdentity(identity.field, id);

  for (let i = 1; i < allData.length; i++) {
    if (normalizeIdentity(identity.field, allData[i][identity.column]) === targetIdentity) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false, error: 'Row not found' };
}

function deleteRelatedRows(targetSheetName, foreignKeyField, foreignKeyValue) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(targetSheetName);
  if (!sheet) return { success: true, deleted: 0 };

  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  const fkCol = headers.indexOf(foreignKeyField);
  if (fkCol === -1) return { success: true, deleted: 0 };

  const rowsToDelete = [];
  for (let i = 1; i < allData.length; i++) {
    if (String(allData[i][fkCol]) === String(foreignKeyValue)) {
      rowsToDelete.push(i + 1);
    }
  }

  for (let i = rowsToDelete.length - 1; i >= 0; i--) {
    sheet.deleteRow(rowsToDelete[i]);
  }

  return { success: true, deleted: rowsToDelete.length };
}

function generateId(sheetName) {
  const prefix = sheetName === SHEET_NAMES.PROJECTS
    ? 'p'
    : sheetName === SHEET_NAMES.ACTIVITIES
      ? 'a'
      : sheetName === SHEET_NAMES.USERS
        ? 'u'
        : sheetName === SHEET_NAMES.WORKFLOW_TEMPLATES
          ? 'wf'
          : 'c';
  return prefix + '_' + Utilities.getUuid().substring(0, 9);
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function checkUser(email) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.USERS);
  if (!sheet) return { authorized: false, error: 'Users sheet not found' };

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const emailCol = headers.indexOf('email');
  const nameCol = headers.indexOf('name');
  const roleCol = headers.indexOf('role');
  if (emailCol === -1) return { authorized: false, error: 'Users sheet must contain an email column' };

  const normalizedEmail = normalizeEmail(email);

  for (let i = 1; i < data.length; i++) {
    if (normalizeEmail(data[i][emailCol]) === normalizedEmail) {
      return {
        authorized: true,
        user: {
          email: data[i][emailCol],
          name: nameCol !== -1 ? data[i][nameCol] : data[i][emailCol],
          role: roleCol !== -1 ? data[i][roleCol] : 'member',
        }
      };
    }
  }

  return { authorized: false };
}


