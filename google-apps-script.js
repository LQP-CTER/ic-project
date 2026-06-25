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
  STYLE_REFERENCES: 'StyleReferences',
};

const SHEET_SCHEMAS = {
  [SHEET_NAMES.PROJECTS]: ['id', 'name', 'description', 'assignee', 'startDate', 'deadline', 'status', 'notes', 'objective', 'audience', 'keyMessage', 'cta', 'channels', 'toneOfVoice', 'stakeholder', 'successMetric', 'mandatoryInfo'],
  [SHEET_NAMES.ACTIVITIES]: ['id', 'projectId', 'name', 'description', 'assignee', 'startDate', 'deadline', 'priority', 'status', 'channel', 'attachmentLink', 'notes', 'approver', 'reviewDueDate', 'reviewNotes', 'checklist'],
  [SHEET_NAMES.CONTENTS]: ['id', 'title', 'contentType', 'projectId', 'projectName', 'activityId', 'activityName', 'prompt', 'content', 'createdAt', 'status', 'approver', 'reviewNotes', 'publishedAt'],
  // Users deliberately keeps the original email/name/role schema so existing sheets do not break.
  // CRUD uses email as the stable identifier when an id column is not present.
  [SHEET_NAMES.USERS]: ['email', 'name', 'role'],
  [SHEET_NAMES.WORKFLOW_TEMPLATES]: ['id', 'name', 'description', 'category', 'estimatedWeeks', 'steps'],
  [SHEET_NAMES.STYLE_REFERENCES]: ['id', 'title', 'channel', 'purpose', 'tone', 'content', 'isActive', 'createdAt'],
};
const DEFAULT_STYLE_REFERENCES = [
  {
    id: 'style_gtalk_mail_feedback',
    title: 'GTalk Mail - Kêu gọi góp ý và đăng ký chuyển đổi',
    channel: 'GTalk',
    purpose: 'Reminder / Feedback',
    tone: 'Chuyên nghiệp, rõ CTA, hỗ trợ chuyển đổi',
    isActive: 'true',
    createdAt: '2026-06-22',
    content: `Anh/Chị đã sử dụng GTalk Mail chưa?

Sau những ngày đầu trải nghiệm, chúng tôi rất mong nhận được chia sẻ từ Anh/Chị về những điểm đang hoạt động tốt cũng như các nội dung cần cải thiện. Mỗi góp ý đều góp phần giúp GTalk Mail đáp ứng tốt hơn với nhu cầu làm việc thực tế.

Hãy gửi phản hồi của Anh/Chị tại đây: [Link góp ý]

Đồng thời, hôm nay (22/06) cũng là ngày cuối cùng nhận đăng ký chuyển đổi mail. Nếu chưa đăng ký, Anh/Chị vui lòng hoàn tất tại đây: [Link đăng ký]

Hỗ trợ: HRBP hoặc anh Nguyễn Trí Cang (3088585).

Chuyển đổi hôm nay, sẵn sàng cho ngày mai.

Trân trọng,
Đội ngũ triển khai GTalk.`
  },
  {
    id: 'style_ees_thank_you',
    title: 'EES 2026 - Trân trọng sự đồng hành',
    channel: 'GTalk',
    purpose: 'Thank you / Recap',
    tone: 'Cảm xúc, trân trọng, gắn kết',
    isActive: 'true',
    createdAt: '2026-06-22',
    content: `TRÂN TRỌNG SỰ ĐỒNG HÀNH

Mỗi ý kiến đóng góp đều bắt đầu từ sự quan tâm và mong muốn xây dựng một môi trường làm việc tốt hơn.

Thông qua EES 2026, hàng ngàn chia sẻ chân thành từ Anh/Chị đã được gửi gắm đến GHN. Đó không chỉ là những phản hồi, mà còn là niềm tin, sự đồng hành và tinh thần trách nhiệm dành cho tập thể mà chúng ta đang cùng nhau vun đắp.

GHN luôn trân trọng từng tiếng nói, bởi chính những chia sẻ ấy đã và đang góp phần tạo nên những thay đổi tích cực mỗi ngày.

Cảm ơn bạn vì đã luôn tận tâm và đồng hành cùng GHN.

GHN hỏi - Ngại gì không nói?`
  },
  {
    id: 'style_gtalk_mail_last_call',
    title: 'GTalk Mail - Nhắc hạn vài giờ cuối',
    channel: 'GTalk',
    purpose: 'Urgent reminder',
    tone: 'Khẩn trương, rõ mốc thời gian, có hướng dẫn',
    isActive: 'true',
    createdAt: '2026-06-18',
    content: `CHỈ CÒN VÀI GIỜ NỮA!

Từ 00:00 ngày 19/06/2026, tính năng Mail HRW sẽ chính thức dừng hoạt động.

Nếu chưa chuyển sang GTalk Mail, Anh/Chị hãy thực hiện ngay hôm nay để công việc không bị gián đoạn nhé.

Các mốc thời gian cần lưu ý

• 19/06/2026: Dữ liệu email sẽ được chuyển từ HRW Mail sang GTalk Mail.
• 22/06/2026: Hạn cuối đăng ký chuyển email lịch sử: [Link]

Hướng dẫn sử dụng GTalk Mail: [Link]
Hỗ trợ: HRBP hoặc anh Nguyễn Trí Cang (3088585).

Chuyển đổi ngay hôm nay để sẵn sàng cho ngày mai.

Trân trọng,
Đội ngũ triển khai GTalk.`
  },
  {
    id: 'style_ees_listening',
    title: 'EES 2026 - Mỗi ý kiến đều được lắng nghe',
    channel: 'GTalk',
    purpose: 'Recap / Appreciation',
    tone: 'Ấm áp, ghi nhận, truyền cảm hứng',
    isActive: 'true',
    createdAt: '2026-06-22',
    content: `MỖI Ý KIẾN ĐỀU ĐƯỢC LẮNG NGHE

EES 2026 đã hoàn thành giai đoạn ghi nhận ý kiến từ Anh/Chị/Em trên toàn hệ thống. Những chia sẻ chân thành này sẽ tiếp tục đồng hành cùng GHN trên hành trình cải thiện và phát triển môi trường làm việc mỗi ngày.

307 phần quà tri ân đã được trao tận tay đến những Chiến Binh may mắn trên khắp cả nước. Đây là món quà tinh thần mà GHN muốn gửi đến Anh/Chị/Em vì đã dành thời gian tham gia khảo sát, chia sẻ suy nghĩ và đóng góp ý kiến.

Mỗi phản hồi đều đáng trân trọng, bởi phía sau đó là sự quan tâm, kỳ vọng và mong muốn cùng GHN ngày một tốt hơn.

Cảm ơn bạn vì đã luôn tận tâm và đồng hành cùng GHN.

GHN hỏi - Ngại gì không nói?`
  },
  {
    id: 'style_gtalk_mail_guide',
    title: 'GTalk Mail - Hướng dẫn sử dụng',
    channel: 'GTalk',
    purpose: 'Guide / Announcement',
    tone: 'Hướng dẫn rõ ràng, chuyên nghiệp, hỗ trợ',
    isActive: 'true',
    createdAt: '2026-06-18',
    content: `HƯỚNG DẪN SỬ DỤNG GTALK MAIL

Để hỗ trợ Anh/Chị làm quen và sử dụng GTalk Mail thuận tiện hơn, đội ngũ triển khai đã tổng hợp các tính năng quan trọng giúp tối ưu việc trao đổi và quản lý email hằng ngày.

Xem hướng dẫn sử dụng GTalk Mail tại: [Link]

Lưu ý chuyển đổi dữ liệu

• 19/06/2026: Chuyển dữ liệu email từ HRW Mail sang GTalk Mail.
• 22/06/2026: Hạn cuối đăng ký chuyển email lịch sử tại [Link]
• 30/08/2026: HRW Mail ngừng duy trì dữ liệu sau thời gian hỗ trợ tra cứu.

Chuyển sang GTalk Mail ngay hôm nay để không gián đoạn công việc.

Hỗ trợ: HRBP hoặc anh Nguyễn Trí Cang – 3088585.

Trân trọng,
Đội ngũ triển khai GTalk.`
  }
];
/**
 * Creates missing sheets and adds missing columns without deleting existing data.
 * Run this after pasting a new version of this script.
 */
function setupSheets() {
  Object.entries(SHEET_SCHEMAS).forEach(([sheetName, headers]) => ensureSheet(sheetName, headers));
  seedDefaultStyleReferences();
  SpreadsheetApp.getUi().alert('Setup hoàn tất. Dữ liệu hiện có đã được giữ nguyên.');
}


function seedDefaultStyleReferences() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.STYLE_REFERENCES);
  if (!sheet || sheet.getLastRow() > 1) return;

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const rows = DEFAULT_STYLE_REFERENCES.map(reference => headers.map(header => reference[header] !== undefined ? reference[header] : ''));
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
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
    styleReferences: getSheetData(SHEET_NAMES.STYLE_REFERENCES),
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
          : sheetName === SHEET_NAMES.STYLE_REFERENCES
            ? 'style'
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