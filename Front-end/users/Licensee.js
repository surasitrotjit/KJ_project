document.addEventListener("DOMContentLoaded", () => {
  loadStudentData();
  loadNews();
  setupFormHandlers();
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

// โหลดข่าวสารจาก API
function loadNews() {
  fetch("http://localhost:3000/news")
    .then((response) => response.json())
    .then((data) => {
      const newsList = document.getElementById("newsList");
      newsList.innerHTML = "";

      if (data.news && data.news.length > 0) {
        data.news.forEach((item) => {
          const li = document.createElement("li");
          li.innerHTML = `<strong>${item.title}</strong><br>${item.detail}`;
          newsList.appendChild(li);
        });
      } else {
        newsList.innerHTML = "<li>ยังไม่มีข่าวสาร</li>";
      }
    })
    .catch((error) => {
      console.error("โหลดข่าวไม่สำเร็จ:", error);
    });
}

// จัดการส่งฟอร์มข่าวสาร
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
          loadNews();
          alert("บันทึกข่าวสารเรียบร้อยแล้ว");
        })
        .catch((error) => {
          console.error("บันทึกข่าวล้มเหลว:", error);
          alert("เกิดข้อผิดพลาดในการบันทึกข่าวสาร");
        });
    });
  }
}
