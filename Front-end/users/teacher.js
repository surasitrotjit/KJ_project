// โหลดข้อมูลนักเรียนจาก backend
async function loadStudents() {
  const res = await fetch('students.json'); // ใช้ path สั้นสุด
  const data = await res.json();
  return data.students;
}

// แสดงกลุ่มนักเรียนแบบเดียวกับ admin
async function renderStudentGroups() {
  const students = (await loadStudents()).filter(stu => stu.class); // กรอง object ที่ไม่มี class
  const groups = {};
  students.forEach(stu => {
    if (!groups[stu.class]) groups[stu.class] = [];
    groups[stu.class].push(stu);
  });

  let html = '';
  Object.keys(groups).forEach(className => {
    html += `<h3>${className}</h3>
      <table class="student-table">
        <thead>
          <tr>
            <th>รหัส</th>
            <th>ชื่อ</th>
            <th>นามสกุล</th>
            <th>ชื่อเล่น</th>
          </tr>
        </thead>
        <tbody>`;
    groups[className].forEach(stu => {
      html += `<tr>
        <td>${stu.studentId || ''}</td>
        <td>${stu.firstName || ''}</td>
        <td>${stu.lastName || ''}</td>
        <td>${stu.nickname || ''}</td>
      </tr>`;
    });
    html += `</tbody></table>`;
  });

  // เปลี่ยน studentGroups เป็น studentListContainer
  document.getElementById('studentListContainer').innerHTML = html;
}

// เรียกเมื่อเปิด section viewStudents
function showSection(sectionId) {
  document.querySelectorAll('.content-section').forEach(sec => sec.classList.add('hidden'));
  document.getElementById(sectionId).classList.remove('hidden');
  // เปลี่ยน students เป็น viewStudents
  if (sectionId === 'viewStudents') renderStudentGroups();
}


document.getElementById('showTeacherScheduleBtn').addEventListener('click', async () => {
  const className = document.getElementById('teacherClassSelect').value;
  const day = document.getElementById('teacherDaySelect').value;
  const res = await fetch('schedule.json');
  const data = await res.json();
  const scheduleArr = data.schedule[className];

  if (!scheduleArr || scheduleArr.length === 0) {
    document.getElementById('teacherScheduleResult').innerHTML = '<p style="color:red;">ไม่พบข้อมูลตารางเรียนสำหรับชั้นนี้</p>';
    return;
  }

  let html = '<table class="student-table"><thead><tr>';
  html += '<th>วัน</th><th>08:00-09:00</th><th>09:00-10:00</th><th>10:00-11:00</th><th>11:00-12:00</th><th>12:00-13:00</th><th>13:00-14:00</th><th>14:00-15:00</th><th>15:00-16:00</th></tr></thead><tbody>';

  // ถ้าเลือก "ทุกวัน" ให้แสดงทั้งสัปดาห์, ถ้าเลือกวัน ให้แสดงเฉพาะวันนั้น
  const filtered = day ? scheduleArr.filter(row => row.day === day) : scheduleArr;
  filtered.forEach(row => {
    html += `<tr>
      <td>${row.day}</td>
      <td>${row.period1 || ''}</td>
      <td>${row.period2 || ''}</td>
      <td>${row.period3 || ''}</td>
      <td>${row.period4 || ''}</td>
      <td>${row.period5 || ''}</td>
      <td>${row.period6 || ''}</td>
      <td>${row.period7 || ''}</td>
      <td>${row.period8 || ''}</td>
    </tr>`;
  });
  html += '</tbody></table>';
  document.getElementById('teacherScheduleResult').innerHTML = html;
});


window.showSection = showSection;