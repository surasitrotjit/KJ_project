function getQueryParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

// ดึงข้อมูลจาก students.json แล้วค้นหาตาม id
async function fetchStudentDetail(id) {
  const response = await fetch('students.json');
  if (!response.ok) throw new Error("ไม่พบข้อมูลนักเรียน");
  const data = await response.json();
  // รองรับทั้งกรณี students เป็น array หรือ object ที่มี students
  const students = Array.isArray(data) ? data : data.students || [];
  const student = students.find(s => String(s.id) === String(id));
  if (!student) throw new Error("ไม่พบข้อมูลนักเรียน");
  return student;
}

function renderStudentSection(student, section) {
  if (!student || typeof student !== 'object') {
    return '<p>ไม่พบข้อมูลนักเรียน</p>';
  }
  switch (section) {
    case 'general-info':
      return `
        <div class="student-info">
          <img src="${student.photo || '../Image/student-placeholder.jpg'}" alt="รูปนักเรียน" class="student-photo">
          <div class="info-details">
            <p><strong>รหัสนักเรียน:</strong> ${student.studentId || '-'}</p>
            <p><strong>ชื่อ-นามสกุล:</strong> ${student.firstName || '-'} ${student.lastName || '-'}</p>
            <p><strong>ชื่อเล่น:</strong> ${student.nickname || '-'}</p>
            <p><strong>ชั้นเรียน:</strong> ${student.class || '-'}</p>
            <p><strong>อายุ:</strong> ${student.age ? student.age + ' ปี' : '-'}</p>
            <p><strong>วันเกิด:</strong> ${student.birthDate || '-'}</p>
            <p><strong>เพศ:</strong> ${student.gender || '-'}</p>
            <p><strong>ที่อยู่:</strong> ${student.address || '-'}</p>
            <p><strong>ผู้ปกครอง:</strong> ${student.parent || '-'}</p>
            <p><strong>เบอร์ติดต่อ:</strong> ${student.parentPhone || '-'}</p>
            <p><strong>โรคประจำตัว:</strong> ${student.congenitalDisease || '-'}</p>
            <p><strong>แพ้ยา/อาหาร:</strong> ${student.allergy || '-'}</p>
            <p><strong>หมายเหตุ:</strong> ${student.note || '-'}</p>
          </div>
        </div>
      `;
    case 'behavior':
      return `
        <div class="behavior-assessment">
          <h3>การประเมินพฤติกรรมเบื้องต้น</h3>
          <ul>
            ${(student.behavior && student.behavior.length)
              ? student.behavior.map(item => `<li>${item}</li>`).join('')
              : '<li>-</li>'}
          </ul>
          <p><strong>วันที่ประเมิน:</strong> ${student.behaviorDate || '-'}</p>
          <p><strong>ผู้ประเมิน:</strong> ${student.behaviorBy || '-'}</p>
        </div>
      `;
    case 'treatment':
      return `
        <div class="treatment-plan">
          <h3>แผนการรักษาและพัฒนา</h3>
          <ol>
            ${(student.treatment && student.treatment.length)
              ? student.treatment.map(item => `<li>${item}</li>`).join('')
              : '<li>-</li>'}
          </ol>
        </div>
      `;
    case 'doctor':
      return `
        <div class="doctor-info">
          <h3>แพทย์ที่ดูแล</h3>
          <p><strong>ชื่อแพทย์:</strong> ${student.doctorName || '-'}</p>
          <p><strong>หมายเหตุ:</strong> ${student.doctorNote || '-'}</p>
        </div>
      `;
    case 'medication':
      return `
        <div class="medication-info">
          <h3>ยาที่รับประทาน</h3>
          <ul>
            ${(student.medications && student.medications.length)
              ? student.medications.map(item => `<li>${item}</li>`).join('')
              : '<li>-</li>'}
          </ul>
        </div>
      `;
    default:
      return '<p>ไม่พบข้อมูลในส่วนนี้</p>';
  }
}

async function showStudentDetail(section = 'general-info') {
  const id = getQueryParam("id");
  const div = document.getElementById("studentDetail");
  try {
    const student = await fetchStudentDetail(id);
    let sectionTitle = '';
    switch (section) {
      case 'general-info':
        sectionTitle = 'ประวัตินักเรียน';
        break;
      case 'behavior':
        sectionTitle = 'พฤติกรรมแรกเข้า';
        break;
      case 'treatment':
        sectionTitle = 'แนวทางการแก้ไข';
        break;
      case 'doctor':
        sectionTitle = 'แพทย์ที่ดูแล';
        break;
      case 'medication':
        sectionTitle = 'ยาที่รับประทาน';
        break;
      default:
        sectionTitle = '';
    }
    div.innerHTML = `
      <div class="content-section ${section}">
        <h2>${sectionTitle}</h2>
        ${renderStudentSection(student, section)}
      </div>
    `;
  } catch {
    div.innerHTML = "<p>ไม่พบข้อมูลนักเรียน</p>";
  }
}

document.addEventListener("DOMContentLoaded", function() {
  showStudentDetail();

  const sidebar = document.getElementById('sidebar');
  const sidebarCollapse = document.getElementById('sidebarCollapse');

  // ไม่ต้องซ่อน sidebar ใน JS เพราะ HTML มี collapsed อยู่แล้ว

  sidebarCollapse.addEventListener('click', function() {
    sidebar.classList.toggle('collapsed');
  });

  sidebar.addEventListener('click', (e) => {
    if (e.target.tagName === 'A' && e.target.getAttribute('href').startsWith('#')) {
      e.preventDefault();
      const section = e.target.getAttribute('href').replace('#', '');
      showStudentDetail(section);
    }
  });
});