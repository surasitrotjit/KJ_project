document.addEventListener("DOMContentLoaded", () => {
  loadStudentData();
});

function loadStudentData() {
  fetch('http://localhost:3000/students')
    .then(response => {
      if (!response.ok) {
        throw new Error('ไม่สามารถโหลดข้อมูลนักเรียนได้');
      }
      return response.json();
    })
    .then(data => {
      const students = data.students || [];
      const tbody = document.querySelector("#studentTable tbody");
      tbody.innerHTML = ""; // เคลียร์ตารางก่อน

      if (students.length === 0) {
        const row = document.createElement("tr");
        row.innerHTML = `<td colspan="3" style="text-align:center;">ไม่มีข้อมูลนักเรียน</td>`;
        tbody.appendChild(row);
        return;
      }

      students.forEach(student => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${student.firstName}</td>
          <td>${student.lastName}</td>
          <td>${student.class}</td>
        `;
        tbody.appendChild(row);
      });
    })
    .catch(error => {
      console.error("เกิดข้อผิดพลาด:", error);
      const tbody = document.querySelector("#studentTable tbody");
      tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:red;">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>`;
    });
}
