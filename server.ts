import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

const DEFAULT_SPREADSHEET_ID = process.env.SPREADSHEET_ID || '1M5KLlJCb5eFq_9CooCZTpF_p88QxoeMsDT5thjYy2sU';

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Normalize hospital number (removes spaces, maps Arabic-Indic digits to Latin)
function normalizeHospitalNumber(input: any): string {
  if (input === undefined || input === null) return '';
  let str = String(input).trim();
  const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
  str = str.replace(/[٠-٩]/g, (d) => arabicDigits.indexOf(d).toString());
  return str.replace(/\s+/g, '');
}

// Flexible number matching
function isNumberMatch(cellVal: string, searchVal: string): boolean {
  const normCell = normalizeHospitalNumber(cellVal);
  const normSearch = normalizeHospitalNumber(searchVal);
  if (!normCell || !normSearch) return false;
  if (normCell === normSearch) return true;
  const pureCell = normCell.replace(/[^\d]/g, '');
  const pureSearch = normSearch.replace(/[^\d]/g, '');
  if (pureSearch.length >= 4 && pureCell === pureSearch) return true;
  return false;
}

// Normalize column header strings
function cleanHeader(header: any): string {
  return String(header || '').trim().toLowerCase();
}

// Check if a value is truthy / checked for checkbox column
function isChecked(val: any): boolean {
  if (val === true || val === 1) return true;
  if (!val) return false;
  const s = String(val).trim().toUpperCase();
  return s === 'TRUE' || s === '1' || s === 'YES' || s === 'نعم' || s === 'صح' || s === '✓' || s === '✔';
}

// Check if a cell contains a non-empty value/time
function hasValue(val: any): boolean {
  if (val === undefined || val === null) return false;
  const s = String(val).trim();
  if (s === '' || s === '-' || s === '--' || s === '0' || s.toUpperCase() === 'FALSE') return false;
  return true;
}

// Find header row and column mappings
function findColumns(rows: any[][]) {
  for (let r = 0; r < Math.min(rows.length, 10); r++) {
    const row = rows[r];
    if (!row || !Array.isArray(row)) continue;

    let hospitalNumIdx = -1;
    let patientNameIdx = -1;
    let dayCareIdx = -1;
    let checkingIdx = -1;
    let falseCheckboxIdx = -1;
    let mixingIdx = -1;
    let listNumIdx = -1;

    for (let c = 0; c < row.length; c++) {
      const col = cleanHeader(row[c]);
      if (col.includes('رقم المستشفى') || col.includes('المستشفى') || col.includes('hospital')) {
        hospitalNumIdx = c;
      } else if (col.includes('اسم المريض') || col.includes('المريض') || col.includes('patient')) {
        patientNameIdx = c;
      } else if (col.includes('day care') || col.includes('daycare') || col.includes('داي كير') || col.includes('الداي كير')) {
        dayCareIdx = c;
      } else if (col.includes('التشييك') || col.includes('تشييك') || col.includes('checking')) {
        checkingIdx = c;
      } else if (col.includes('false') || col.includes('checkbox') || col.includes('الصرف') || col.includes('dispens')) {
        falseCheckboxIdx = c;
      } else if (col.includes('mixing') || col.includes('خلط')) {
        mixingIdx = c;
      } else if (col.includes('رقم اللستة') || col.includes('اللستة') || col.includes('list')) {
        listNumIdx = c;
      }
    }

    // Default column layout if row 0 has the standard oncology sheet format
    if (hospitalNumIdx !== -1) {
      return {
        headerRowIndex: r,
        hospitalNumIdx,
        patientNameIdx: patientNameIdx !== -1 ? patientNameIdx : 5,
        dayCareIdx: dayCareIdx !== -1 ? dayCareIdx : 0,
        checkingIdx: checkingIdx !== -1 ? checkingIdx : 1,
        falseCheckboxIdx: falseCheckboxIdx !== -1 ? falseCheckboxIdx : 3,
        mixingIdx: mixingIdx !== -1 ? mixingIdx : 2,
        listNumIdx: listNumIdx !== -1 ? listNumIdx : 4
      };
    }
  }

  // Fallback default layout based on the hospital sheet structure
  return {
    headerRowIndex: 0,
    hospitalNumIdx: 6,
    patientNameIdx: 5,
    listNumIdx: 4,
    falseCheckboxIdx: 3,
    mixingIdx: 2,
    checkingIdx: 1,
    dayCareIdx: 0
  };
}

// Fetch spreadsheet data directly from Google Sheets (via Google Visualization API)
async function fetchSheetData(spreadsheetId: string) {
  try {
    const gvizUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json`;
    const res = await fetch(gvizUrl);
    if (res.ok) {
      const text = await res.text();
      const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]+)\);/);
      if (match) {
        const data = JSON.parse(match[1]);
        const tableRows = data.table?.rows || [];
        const rows: any[][] = [];
        for (const tr of tableRows) {
          if (!tr || !tr.c) continue;
          const rowVals = tr.c.map((cell: any) => {
            if (!cell) return '';
            if (cell.f !== undefined && cell.f !== null) return cell.f;
            return cell.v !== undefined && cell.v !== null ? cell.v : '';
          });
          rows.push(rowVals);
        }
        return {
          status: 200,
          sheetTitle: 'Sheet1',
          rows
        };
      }
    }
  } catch (err: any) {
    console.error('Google Sheets fetch error:', err.message);
  }

  return {
    status: 502,
    error: 'SHEET_UNREACHABLE',
    errorMessage: 'واجهنا صعوبة مؤقتة في مراجعة سجلات المستشفى. يرجى إعادة المحاولة بعد لحظات. 🌷'
  };
}

// Connection test endpoint
app.get('/api/connection-status', async (req, res) => {
  try {
    const spreadsheetId = (req.query.spreadsheetId as string) || DEFAULT_SPREADSHEET_ID;
    const result = await fetchSheetData(spreadsheetId);
    if (result.status === 200) {
      res.json({ connected: true, sheetTitle: result.sheetTitle, count: result.rows?.length });
    } else {
      res.json({ connected: false, error: result.error });
    }
  } catch (err: any) {
    res.json({ connected: false, error: err.message });
  }
});

// Primary status lookup endpoint
app.post('/api/check-status', async (req, res) => {
  try {
    const { hospitalNumber, spreadsheetId = DEFAULT_SPREADSHEET_ID } = req.body;

    const normalizedSearch = normalizeHospitalNumber(hospitalNumber);
    if (!normalizedSearch) {
      return res.json({
        success: false,
        found: false,
        message: 'من فضلك اكتب رقم المستشفى بشكل صحيح لمتابعة البحث. 🌷'
      });
    }

    const sheetResult = await fetchSheetData(spreadsheetId);

    if (sheetResult.status !== 200 || !sheetResult.rows) {
      return res.json({
        success: false,
        found: false,
        error: 'SHEET_ERROR',
        message: sheetResult.errorMessage || 'واجهنا صعوبة مؤقتة في الوصول إلى بيانات المستشفى. يرجى المحاولة مرة أخرى بعد لحظات. 🌷'
      });
    }

    const rows = sheetResult.rows;
    if (rows.length === 0) {
      return res.json({
        success: true,
        found: false,
        message: 'سجلات المستشفى فارغة حاليًا. يرجى التأكد من الموظف المسؤول. 🌷'
      });
    }

    const colMap = findColumns(rows);
    const matchingRows: { rowIndex: number; rowData: any[] }[] = [];

    // Search all rows after header
    for (let r = colMap.headerRowIndex + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;
      const cellVal = row[colMap.hospitalNumIdx];

      if (isNumberMatch(cellVal, normalizedSearch)) {
        matchingRows.push({ rowIndex: r, rowData: row });
      }
    }

    // Check match count
    if (matchingRows.length === 0) {
      return res.json({
        success: true,
        found: false,
        message: `مش قادر ألاقي الرقم ده في البيانات المتاحة عندي حاليًا.
ممكن تتأكد من رقم المستشفى وتبعتهولي مرة تانية؟ 🌷`
      });
    }

    // Check duplicates: "If duplicate hospital numbers are found, do NOT randomly choose a patient. Return a safe message asking the user to contact the hospital team for verification."
    if (matchingRows.length > 1) {
      // Check if patient names are identical or distinct
      const names = matchingRows.map(m => String(m.rowData[colMap.patientNameIdx] || '').trim()).filter(Boolean);
      const uniqueNames = Array.from(new Set(names));
      if (uniqueNames.length > 1) {
        return res.json({
          success: true,
          found: true,
          isDuplicate: true,
          message: `عذرًا، تم العثور على أكثر من سجل مسجل بنفس رقم المستشفى.
حرصًا على خصوصيتك وسلامتك، يرجى التكرم بالتواصل مباشرة مع فريق الرعاية أو الاستقبال في المستشفى لتأكيد بياناتك. 🌷`
        });
      }
    }

    // Single exact match (or identical duplicated row)
    const targetRow = matchingRows[0].rowData;
    const patientName = String(targetRow[colMap.patientNameIdx] || '').trim() || 'المريض';

    const dayCareVal = colMap.dayCareIdx !== -1 ? targetRow[colMap.dayCareIdx] : null;
    const checkingVal = colMap.checkingIdx !== -1 ? targetRow[colMap.checkingIdx] : null;
    const falseCheckboxVal = colMap.falseCheckboxIdx !== -1 ? targetRow[colMap.falseCheckboxIdx] : null;

    const dayCareHasValue = hasValue(dayCareVal);
    const checkingHasValue = hasValue(checkingVal);
    const checkboxIsChecked = isChecked(falseCheckboxVal);

    // EXACT STATUS PRIORITY ORDER:
    // 1. Day care
    // 2. التشييك
    // 3. FALSE checkbox
    // 4. Patient exists but no previous stage indicator exists
    // 5. Patient does not exist (handled earlier)

    // STATUS 1 — DAY CARE
    if (dayCareHasValue) {
      const statusTitle = 'العلاج موجود حاليًا في الـDay Care.';
      const message = `أهلًا بيك يا ${patientName} 🌷

راجعت لحضرتك آخر تحديث عن العلاج.

🔵 **علاجك موجود حاليًا في الـDay Care.**

أتمنى لك جلسة هادية ومريحة، وربنا يتم شفاك على خير ويطمّنك. 🌷
خد بالك من نفسك، وفريق الرعاية موجود لمساعدتك.

ولو حابب تستعلم عن رقم مستشفى تاني، اكتبلي الرقم وأنا أراجعهولك. 🌷`;

      return res.json({
        success: true,
        found: true,
        patientName,
        hospitalNumber: normalizedSearch,
        statusPriority: 1,
        statusTitle,
        statusBadgeColor: 'blue',
        message
      });
    }

    // STATUS 2 — PREPARED / BEING DELIVERED
    if (!dayCareHasValue && checkingHasValue) {
      const statusTitle = 'العلاج تم تحضيره وجاري توصيله للـDay Care.';
      const message = `أهلًا بيك يا ${patientName} 🌷

راجعت لحضرتك آخر تحديث عن العلاج.

🟢 **علاجك تم تحضيره، وحاليًا جاري توصيله للـDay Care.**

فاهم إن الانتظار ممكن يكون مقلق، خصوصًا وإنت مستني علاجك.
أنا معاك وبراجع لك آخر حالة مسجلة عندنا. 🌷

ولو حابب تستعلم عن رقم مستشفى تاني، اكتبلي الرقم وأنا أراجعهولك. 🌷`;

      return res.json({
        success: true,
        found: true,
        patientName,
        hospitalNumber: normalizedSearch,
        statusPriority: 2,
        statusTitle,
        statusBadgeColor: 'green',
        message
      });
    }

    // STATUS 3 — PREPARATION
    if (!dayCareHasValue && !checkingHasValue && checkboxIsChecked) {
      const statusTitle = 'تم استلام الصرف والعلاج جاري التحضير.';
      const message = `أهلًا بيك يا ${patientName} 🌷

راجعت لحضرتك آخر تحديث عن العلاج.

🟡 **تم استلام الصرف، وعلاجك حاليًا في مرحلة التحضير.**

متفهم إن الانتظار ممكن يكون مقلق، وخصوصًا وإنت مستني تبدأ علاجك.
أنا معاك وهساعدك تعرف آخر حالة مسجلة عندنا. 🌷

ولو حابب تستعلم عن رقم مستشفى تاني، اكتبلي الرقم وأنا أراجعهولك. 🌷`;

      return res.json({
        success: true,
        found: true,
        patientName,
        hospitalNumber: normalizedSearch,
        statusPriority: 3,
        statusTitle,
        statusBadgeColor: 'amber',
        message
      });
    }

    // STATUS 4 — DISPENSING
    if (!dayCareHasValue && !checkingHasValue && !checkboxIsChecked) {
      const statusTitle = 'تمت مراجعة ملفك في الصيدلية الإكلينيكية، والعلاج حاليًا في مرحلة الصرف.';
      const message = `أهلًا بيك يا ${patientName} 🌷

راجعت لحضرتك آخر تحديث عن العلاج.

🟠 **تمت مراجعة ملفك في الصيدلية الإكلينيكية، والعلاج حاليًا في مرحلة الصرف.**

متفهم إن الانتظار ممكن يكون مقلق، وخصوصًا وإنت مستني علاجك.
إن شاء الله مع تحديث الخطوات القادمة هتظهر حالة العلاج الجديدة عندنا. 🌷

ولو حابب تستعلم عن رقم مستشفى تاني، اكتبلي الرقم وأنا أراجعهولك. 🌷`;

      return res.json({
        success: true,
        found: true,
        patientName,
        hospitalNumber: normalizedSearch,
        statusPriority: 4,
        statusTitle,
        statusBadgeColor: 'orange',
        message
      });
    }

    // STATUS 5 — NO CLEAR UPDATE
    const message = `أهلًا بيك يا ${patientName} 🌷

راجعت لحضرتك البيانات المتاحة، لكن لسه مش ظاهر عندي تحديث واضح عن حالة العلاج.

لو حابب، ممكن تتأكد من رقم المستشفى أو تواصل مع فريق الرعاية في المستشفى لمعرفة آخر تحديث.

أنا موجود لو حابب تستعلم عن رقم تاني. 🌷`;

    return res.json({
      success: true,
      found: true,
      patientName,
      hospitalNumber: normalizedSearch,
      statusPriority: 5,
      statusTitle: 'لا يوجد تحديث واضح حاليًا',
      statusBadgeColor: 'slate',
      message
    });

  } catch (error: any) {
    console.error('Check status error:', error);
    return res.status(500).json({
      success: false,
      found: false,
      error: error.message,
      message: 'حدث خطأ غير متوقع أثناء معالجة الطلب. يرجى المحاولة مرة أخرى.'
    });
  }
});

// Chat intent classifier & safety responses
app.post('/api/chat-intent', (req, res) => {
  const { userMessage } = req.body;
  const text = String(userMessage || '').trim();

  // 1. Emergency Detection
  const emergencyKeywords = [
    'طوارئ', 'تعب شديد', 'ألم شديد', 'ألم حاد', 'إغماء', 'اغماء', 'نزيف', 'ضيق تنفس', 'حرارة عالية',
    'سخونية شديدة', 'تشنج', 'غيبوبة', 'صدمة', 'emergency', 'severe', 'ambulance', 'إسعاف'
  ];
  if (emergencyKeywords.some(kw => text.includes(kw))) {
    return res.json({
      type: 'EMERGENCY',
      message: `لو عندك أعراض شديدة أو حالة طارئة، من فضلك اطلب المساعدة من فريق الرعاية فورًا أو توجّه للطوارئ حسب تعليمات المستشفى.

أنا أقدر أساعدك في معرفة حالة العلاج، لكن ماقدرش أقيّم الحالة الطبية. 🌷`
    });
  }

  // 2. Medical advice or diagnosis detection
  const medicalKeywords = [
    'جرعة', 'جرعات', 'تشخيص', 'دواء', 'ادوية', 'أدوية', 'كيماوي', 'إشعاعي', 'علاج طبيعي',
    'أعراض جانبية', 'اعراض جانبية', 'هل أقدر آكل', 'هل اشرب', 'مرضي', 'ورم', 'سرطان',
    'تحليل', 'نسبة الدم', 'الصفائح', 'كرات الدم', 'استفراغ', 'قيء', 'دوخة'
  ];
  if (medicalKeywords.some(kw => text.includes(kw))) {
    return res.json({
      type: 'MEDICAL_QUESTION',
      message: `أنا دوري هنا أساعدك تعرف حالة العلاج وآخر تحديث مسجل عندنا. 🌷
لو عندك سؤال طبي، الأفضل تسأل فريق العلاج مباشرة.`
    });
  }

  // 3. Request for another number
  if (text.includes('رقم تاني') || text.includes('استعلام عن رقم') || text.includes('بحث جديد') || text.includes('رقم آخر')) {
    return res.json({
      type: 'SEARCH_ANOTHER',
      message: `طبعًا 🌷
اكتبلي رقم المستشفى الجديد وأنا أراجع لحضرتك حالته.`
    });
  }

  // 4. End conversation
  if (text.includes('إنهاء') || text.includes('انهاء') || text.includes('مع السلامة') || text.includes('شكرا') || text.includes('شكرًا')) {
    return res.json({
      type: 'END_CONVERSATION',
      message: `على الرحب والسعة، وفي أمان الله وحفظه. 🌷
أتمنى لك دوام العافية والسلامة، وأنا موجود دايمًا لمساعدتك وقت ما تحب.`
    });
  }

  // 5. Check if user typed a number
  const extractedNumber = normalizeHospitalNumber(text);
  if (extractedNumber && extractedNumber.length >= 2) {
    return res.json({
      type: 'HOSPITAL_NUMBER',
      hospitalNumber: extractedNumber
    });
  }

  // 6. General greeting / introductory prompt
  return res.json({
    type: 'GENERAL',
    message: `أهلًا بحضرتك 🌷
أنا هنا لمساعدتك في متابعة حالة علاجك ومعرفة أحدث المستجدات.
من فضلك اكتبلي رقم المستشفى عشان أراجع لحضرتك الحالة مباشرة.`
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
