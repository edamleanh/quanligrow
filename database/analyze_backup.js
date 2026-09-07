const fs = require('fs');

const rawData = fs.readFileSync('database/backups/ds_tong_backup.json', 'utf8');
const backupData = JSON.parse(rawData);

const subjectCodeMap = {
  'TOÁN': { code: 'TOAN', name: 'Toán' },
  'Lý': { code: 'LY', name: 'Vật Lý' },
  'Hóa': { code: 'HOA', name: 'Hóa Học' },
  'VĂN': { code: 'VAN', name: 'Ngữ Văn' },
  'AV': { code: 'AV', name: 'Anh Văn' }
};

const classesMap = new Map(); // key: "SUBJECT_CODE|GRADE|GROUP" -> class_name

backupData.forEach(item => {
  let gradeStr = (item['LỚP'] || '').trim();
  if (!gradeStr) return;

  // Normalize grade string (e.g. "12N26" -> 12)
  let gradeNum = parseInt(gradeStr, 10);
  if (isNaN(gradeNum) || gradeNum < 1 || gradeNum > 12) return;

  for (const subKey in subjectCodeMap) {
    const val = (item[subKey] || '').trim();
    if (val) {
      const classKey = `${subKey}_${gradeNum}_${val}`;
      const subInfo = subjectCodeMap[subKey];
      const className = `${subInfo.name} ${gradeNum}${val}`;
      
      if (!classesMap.has(classKey)) {
        classesMap.set(classKey, {
          class_key: classKey,
          class_name: className,
          grade: gradeNum,
          subject_key: subKey,
          subject_code: subInfo.code,
          group: val,
          student_count: 0
        });
      }
      classesMap.get(classKey).student_count++;
    }
  }
});

console.log('Total unique classes identified:', classesMap.size);
console.log('Sample classes:');
let count = 0;
for (const [key, cls] of classesMap) {
  if (count < 15) {
    console.log(`- ${cls.class_name} (Grade ${cls.grade}, Subject: ${cls.subject_code}, Section: ${cls.group}) -> ${cls.student_count} students enrolled`);
    count++;
  }
}
