document.addEventListener("DOMContentLoaded", () => {
  loadStudentData();
  setupFormHandlers();
  setupAddStudentForm();
});

// โหลดรายชื่อนักเรียน
function loadStudentData() {
  fetch("http://localhost:3000/students")
    .then((response) => {
      if (!response.ok) {
        throw new Error("ไม่สามารถโหลดข้อมูลนักเรียนได้");
      }
      return response.json();
    })
    .then((data) => {
      const students = data.students || [];
      const tbody = document.querySelector("#studentTable tbody");
      tbody.innerHTML = "";

      if (students.length === 0) {
        const row = document.createElement("tr");
        row.innerHTML = `<td colspan="3" style="text-align:center;">ไม่มีข้อมูลนักเรียน</td>`;
        tbody.appendChild(row);
        return;
      }

      students.forEach((student) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${student.firstName}</td>
          <td>${student.lastName}</td>
          <td>${student.class}</td>
        `;
        tbody.appendChild(row);
      });
    })
    .catch((error) => {
      console.error("เกิดข้อผิดพลาด:", error);
      const tbody = document.querySelector("#studentTable tbody");
      tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:red;">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>`;
    });
}

// จัดการการเปลี่ยน section
function showSection(id) {
  document.querySelectorAll(".content-section").forEach((section) => {
    section.classList.add("hidden");
  });
  const target = document.getElementById(id);
  if (target) {
    target.classList.remove("hidden");
  }
}

// จัดการส่งฟอร์มข่าวสาร (ไม่ใช้ในหน้า Licensee แต่คงไว้เผื่ออนาคต)
function setupFormHandlers() {
  const newsForm = document.getElementById("newsForm");
  if (newsForm) {
    newsForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const title = newsForm.title.value.trim();
      const detail = newsForm.detail.value.trim();

      if (!title || !detail) {
        alert("กรุณากรอกข้อมูลให้ครบ");
        return;
      }

      fetch("http://localhost:3000/news", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, detail }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("ไม่สามารถบันทึกข่าวสารได้");
          }
          return response.json();
        })
        .then(() => {
          newsForm.reset();
          alert("บันทึกข่าวสารเรียบร้อยแล้ว");
        })
        .catch((error) => {
          console.error("บันทึกข่าวล้มเหลว:", error);
          alert("เกิดข้อผิดพลาดในการบันทึกข่าวสาร");
        });
    });
  }
}

// ฟังก์ชันสำหรับจัดการการเพิ่มนักเรียน
function setupAddStudentForm() {
  const form = document.getElementById("addStudentForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const studentId = form.querySelector("#studentId").value.trim();
    const firstName = form.querySelector("#firstName").value.trim();
    const lastName = form.querySelector("#lastName").value.trim();
    const nickname = form.querySelector("#nickname").value.trim();
    const className = form.querySelector("#class").value;

    if (!studentId || !firstName || !lastName || !nickname || !className) {
      alert("กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }

    const studentData = {
      studentId,
      firstName,
      lastName,
      nickname,
      class: className
    };

    fetch("http://localhost:3000/students", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(studentData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("ไม่สามารถเพิ่มนักเรียนได้");
        }
        return response.json();
      })
      .then(() => {
        alert("เพิ่มนักเรียนสำเร็จแล้ว");
        form.reset();
        loadStudentData();
        showSection("overview");
      })
      .catch((error) => {
        console.error("เกิดข้อผิดพลาด:", error);
        alert("เกิดข้อผิดพลาดในการเพิ่มนักเรียน");
      });
  });
}
