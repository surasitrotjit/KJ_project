// โหลดข้อมูลนักเรียนจาก backend
async function loadStudents() {
  const res = await fetch('students.json'); // ใช้ path สั้นสุด
  const data = await res.json();
  return data.students;
}

// แสดงกลุ่มนักเรียนแบบเดียวกับ admin
async function renderStudentGroups() {
  const students = await loadStudents();
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

window.showSection = showSection;