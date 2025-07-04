// Toggle content sections และจำ section ล่าสุด
window.showSection = function (sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.add('hidden');
    });
    document.getElementById(sectionId).classList.remove('hidden');
    localStorage.setItem('lastSection', sectionId);
    if (sectionId === 'activity') renderActivityGallery();
    if (sectionId === 'visitor') renderVisitorGallery(); // <<== เพิ่มบรรทัดนี้
    if (sectionId === 'editSchedule') loadEditSchedule();
    if (sectionId === 'schedule') loadScheduleSection();
};

// Function to add a newly uploaded item to the gallery
function addItemToGallery(galleryId, data) {
    if (!data || !data.imagePath || !data.detail) return;
    const card = document.createElement('div');
    card.className = 'activity-card';
    card.innerHTML = `
    <img src="http://localhost:3000${data.imagePath}" alt="รูปภาพ" class="activity-image">
    <div class="activity-info">
        ${data.name ? `<div><b>${data.name}</b></div>` : ""}
        ${data.detail}
    </div>
    <a href="#" class="activity-btn">ดูเพิ่มเติม</a>
`;
    gallery.prepend(card);
}

// Handle form submission

function handleSubmit(formId, uploadUrl, galleryId) {
    const form = document.getElementById(formId);
    const formData = new FormData(form);

    // เพิ่ม log เพื่อ debug ข้อมูลที่ส่งไป backend
    for (let [key, value] of formData.entries()) {
        console.log('ส่งไป backend:', key, value);
    }

    const loadingIndicator = document.getElementById('uploadLoading');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'flex';
    }
    fetch(uploadUrl, {
        method: 'POST',
        body: formData
    })
        .then(response => {
            if (!response.ok) {
                // แสดง error message จาก backend ถ้ามี
                return response.json().then(err => { throw new Error(err.error || 'Network response was not ok'); });
            }
            return response.json();
        })
        .then(data => {
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
            alert('อัพโหลดสำเร็จ!');
            form.reset();
            if (galleryId === 'activityGallery') {
                renderActivityGallery();
            } else if (galleryId) {
                addItemToGallery(galleryId, data.data);
            }
        })
        .catch(err => {
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
            console.error('Error:', err);
            alert('อัพโหลดไม่สำเร็จ! ' + err.message);
        });
    return false;
}

// โหลดกิจกรรมทั้งหมด
async function loadActivities() {
    const res = await fetch('http://localhost:3000/activities');
    return await res.json();
}

// แสดงกิจกรรมทั้งหมด
async function renderActivityGallery() {
    const gallery = document.getElementById('activityGallery');
    if (!gallery) return;
    gallery.innerHTML = '<div>กำลังโหลด...</div>';
    const res = await fetch('http://localhost:3000/activities');
    const activities = await res.json();
    gallery.innerHTML = '';
    activities.forEach(activity => {
        const imagesHtml = (activity.images || []).map(img =>
            `<img src="http://localhost:3000/uploads/activities/${img}" 
        alt="activity" 
        style="width:120px;max-width:120px;max-height:120px;object-fit:cover;border-radius:8px;margin:4px;cursor:pointer;"
        onclick="showActivityDetail('${activity.id}', '${img}')">`
        ).join('');
        const card = document.createElement('div');
        card.className = 'activity-card';
        card.innerHTML = `
      <div style="display:flex;gap:4px;flex-wrap:wrap;">${imagesHtml}</div>
      <div class="activity-desc">${activity.detail || ''}</div>
      <button onclick="editActivity('${activity.id}')">แก้ไข</button>
      <button onclick="deleteActivity('${activity.id}')">ลบ</button>
    `;
        gallery.appendChild(card);
    });
}

// ลบกิจกรรม
async function deleteActivity(id) {
    if (!confirm('ยืนยันการลบกิจกรรมนี้?')) return;
    await fetch(`http://localhost:3000/activities/${id}`, { method: 'DELETE' });
    renderActivityGallery();
}

// แก้ไขกิจกรรม (ตัวอย่าง: เปิด prompt ให้แก้ไข detail)
async function editActivity(id) {
    const activities = await loadActivities();
    const act = activities.find(a => a.id === id);
    if (!act) return;
    const newDetail = prompt('แก้ไขรายละเอียดกิจกรรม', act.detail);
    if (newDetail !== null) {
        act.detail = newDetail;
        await fetch(`http://localhost:3000/activities/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(act)
        });
        renderActivityGallery();
    }
}
async function showActivityDetail(id) {
    const activities = await loadActivities();
    const act = activities.find(a => a.id == id); // ใช้ == เผื่อ id เป็น string/number
    if (!act) return;
    document.getElementById('activityModalImg').src = `http://localhost:3000${act.imagePath}`;
    document.getElementById('activityModalDetail').innerHTML = act.detail.replace(/\r?\n/g, '<br>');
    // สร้างปุ่มแก้ไข/ลบใน modal
    document.getElementById('activityModalActions').innerHTML = `
      <button onclick="editActivity('${act.id}')">แก้ไข</button>
      <button onclick="deleteActivity('${act.id}')">ลบ</button>
    `;
    document.getElementById('activityModal').style.display = 'block';
}

document.getElementById('closeActivityModal').onclick = function () {
    document.getElementById('activityModal').style.display = 'none';
};
window.onclick = function (event) {
    const modal = document.getElementById('activityModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
};
// Auto assign submit handlers
window.onload = () => {
    const activityForm = document.getElementById('activityForm');
    if (activityForm) {
        activityForm.onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(activityForm);
            document.getElementById('uploadLoading').style.display = 'inline';
            try {
                const res = await fetch('http://localhost:3000/activities', {
                    method: 'POST',
                    body: formData
                });
                if (!res.ok) throw new Error('Upload failed');
                await res.json();
                activityForm.reset();
                renderActivityGallery();
            } catch (err) {
                alert('อัพโหลดกิจกรรมไม่สำเร็จ: ' + err.message);
            }
            document.getElementById('uploadLoading').style.display = 'none';
        };
    }
    const awardForm = document.getElementById('awardForm');
    if (awardForm) {
        awardForm.onsubmit = (event) => {
            event.preventDefault();
            handleSubmit('awardForm', 'http://localhost:3000/awards', 'awardGallery');
        };
    }
    const visitorForm = document.getElementById('visitorForm');
    if (visitorForm) {
        visitorForm.onsubmit = (event) => {
            event.preventDefault();
            handleSubmit('visitorForm', 'http://localhost:3000/visitors', 'visitorGallery');
        };
    }
};

async function renderVisitorGallery() {
    const gallery = document.getElementById('visitorGallery');
    if (!gallery) return;
    gallery.innerHTML = '<div>กำลังโหลด...</div>';
    const res = await fetch('http://localhost:3000/visitors');
    const visitors = await res.json();
    gallery.innerHTML = '';
    visitors.forEach(visitor => {
        const imagesHtml = (visitor.images || []).map(img =>
            `<img src="http://localhost:3000/uploads/visitors/${img}" 
        alt="visitor" 
        style="width:120px;max-width:120px;max-height:120px;object-fit:cover;border-radius:8px;margin:4px;cursor:pointer;"
        onclick="showVisitorModal('${visitor.id}', '${img}')">`
        ).join('');
        const card = document.createElement('div');
        card.className = 'visitor-card';
        card.innerHTML = `
      <div style="display:flex;gap:4px;flex-wrap:wrap;">${imagesHtml}</div>
      <div class="visitor-desc">${visitor.detail || ''}</div>
      <button onclick="editVisitor('${visitor.id}')">แก้ไข</button>
      <button onclick="deleteVisitor('${visitor.id}')">ลบ</button>
    `;
        gallery.appendChild(card);
    });
}

// เพิ่ม visitor (handleSubmit)
const visitorForm = document.getElementById('visitorForm');
if (visitorForm) {
    visitorForm.onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(visitorForm);
        const res = await fetch('http://localhost:3000/visitors', {
            method: 'POST',
            body: formData
        });
        if (res.ok) {
            visitorForm.reset();
            renderVisitorGallery();
            alert('เพิ่มข้อมูลผู้เยี่ยมชมสำเร็จ');
        } else {
            alert('เกิดข้อผิดพลาดในการเพิ่มข้อมูล');
        }
    };
}

// ลบ visitor
window.deleteVisitor = async function (id) {
    if (!confirm('ยืนยันการลบ?')) return;
    const res = await fetch(`http://localhost:3000/visitors/${id}`, { method: 'DELETE' });
    if (res.ok) {
        renderVisitorGallery();
    } else {
        alert('ลบไม่สำเร็จ');
    }
};

// แก้ไข visitor (popup แบบ prompt)
window.editVisitor = async function (id) {
    const res = await fetch('http://localhost:3000/visitors');
    const visitors = await res.json();
    const visitor = visitors.find(v => v.id === id);
    const newDetail = prompt('แก้ไขรายละเอียด:', visitor.detail);
    if (newDetail !== null && newDetail !== visitor.detail) {
        const updateRes = await fetch(`http://localhost:3000/visitors/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ detail: newDetail })
        });
        if (updateRes.ok) {
            renderVisitorGallery();
        } else {
            alert('แก้ไขไม่สำเร็จ');
        }
    }
};

// โหลด visitor เมื่อเปิด section
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('visitorGallery')) {
        renderVisitorGallery();
    }
});


// ข่าวสาร: จัดการข่าว (เพิ่มข่าวใหม่ในหน้า)
const newsForm = document.getElementById('newsForm');
const newsList = document.getElementById('newsList');
if (newsForm && newsList) {
    newsForm.onsubmit = (e) => {
        e.preventDefault();
        const title = newsForm.title.value.trim();
        const detail = newsForm.detail.value.trim();
        if (!title || !detail) return alert('กรุณากรอกข้อมูลให้ครบถ้วน');
        const li = document.createElement('li');
        li.textContent = `${title}: ${detail}`;
        newsList.prepend(li);
        newsForm.reset();
    };
}

// นักเรียน: โหลดข้อมูลนักเรียนจาก JSON Server และแสดงแบบกลุ่มตามชั้นและครู
document.addEventListener("DOMContentLoaded", () => {
    const studentGroupsDiv = document.getElementById("studentGroups");

    // กำหนดข้อมูลครูประจำชั้น (ตัวอย่าง)
    const classTeachers = {
        "อนุบาล 1": {
            name: "นางสาวสุภาพร แก้วชูทอง",
            img: "../users/imguser/Toon.png"
        },
        "อนุบาล 2": {
            name: "นางสาวสิริวรรณ นาคศรี",
            img: "../users/imguser/Oil.png"
        },
        "อนุบาล 3": {
            name: "นางนุชรี กิตต์ธนาฒย์",
            img: "../users/imguser/Ta.png"
        },
        "ป.1": {
            name: "นายสมชาย ใจดี",
            img: "../users/imguser/TeacherP1.png"
        },
        "ป.2": {
            name: "นางสาวพรทิพย์ สายใจ",
            img: "../users/imguser/TeacherP2.png"
        },
        "ป.3": {
            name: "นายประเสริฐ มั่นคง",
            img: "../users/imguser/TeacherP3.png"
        }
    };

    function groupByClass(students) {
        const groups = {};
        students.forEach(stu => {
            if (!groups[stu.class]) groups[stu.class] = [];
            groups[stu.class].push(stu);
        });
        return groups;
    }

    function renderStudentGroups(students) {
        const groups = groupByClass(students);
        studentGroupsDiv.innerHTML = "";
        if (!students.length) {
            studentGroupsDiv.innerHTML = "<p>ไม่พบข้อมูลนักเรียน</p>";
            return;
        }
        Object.keys(groups).forEach(className => {
            const teacher = classTeachers[className] || {};
            const studentsInClass = groups[className];

            // กรองข้อมูลที่ไม่ครบ
            const validStudents = studentsInClass.filter(stu =>
                stu.studentId && stu.firstName && stu.lastName && stu.nickname && stu.class
            );
            if (!validStudents.length) return;

            // สร้างตาราง
            const table = document.createElement("table");
            table.className = "student-table";
            table.border = "1";
            table.cellPadding = "10";
            table.innerHTML = `
<thead>
    <tr>
        <th>รหัสนักเรียน</th>
        <th>ชื่อ - สกุลนักเรียน<br>(ชื่อเล่น)</th>
        <th>การจัดการ</th>
        <th>ครูประจำชั้น</th>
    </tr>
</thead>
<tbody>
    ${validStudents.map((stu, idx) => `
        <tr>
            <td>${stu.studentId || "-"}</td>
            <td>
              ${stu.firstName || "-"} ${stu.lastName || "-"}
              <span class="nickname">(${stu.nickname || "-"})</span>
            </td>
            <td>
                <button class="action-btn edit" data-id="${stu.id}">
                  <span class="icon">🖊️</span>แก้ไข
                </button>
                <button class="action-btn delete" data-id="${stu.id}">
                  <span class="icon">🗑️</span>ลบ
                </button>
                <button class="action-btn view" onclick="window.location.href='student-detail.html?id=${stu.id}'">
                  <span class="icon">🔍</span>ดูข้อมูลเพิ่ม
                </button>
            </td>
            ${idx === 0 ? `
                <td rowspan="${validStudents.length}" style="text-align:center;">
                    <img src="${teacher.img || "#"}" alt="ครูประจำชั้น" width="80"><br>
                    ${teacher.name || "-"}<br>(ครูประจำชั้น)
                </td>
            ` : ""}
        </tr>
    `).join("")}
</tbody>
`;
            // ชื่อกลุ่ม
            const groupTitle = document.createElement("h3");
            groupTitle.textContent = className;
            // ใส่ลง div
            const groupDiv = document.createElement("div");
            groupDiv.className = "student-group";
            groupDiv.appendChild(groupTitle);
            groupDiv.appendChild(table);
            studentGroupsDiv.appendChild(groupDiv);
        });
    }

    function loadStudents() {
        fetch("http://localhost:3000/students")
            .then(res => {
                if (!res.ok) throw new Error("ไม่สามารถโหลดข้อมูลนักเรียนได้: " + res.status);
                return res.json();
            })
            .then(data => renderStudentGroups(Array.isArray(data) ? data : data.students || []))
            .catch(err => {
                studentGroupsDiv.innerHTML = "<p>เกิดข้อผิดพลาดในการโหลดข้อมูลนักเรียน</p>";
                console.error("Student fetch error:", err);
            });
    }

    loadStudents();

    // เพิ่มนักเรียนใหม่
    document.getElementById("addStudentForm").addEventListener("submit", function (event) {
        event.preventDefault();
        const studentId = document.getElementById("studentId").value.trim();
        const firstName = document.getElementById("studentFirstName").value.trim();
        const lastName = document.getElementById("studentLastName").value.trim();
        const nickname = document.getElementById("studentNickname").value.trim();
        const studentClass = document.getElementById("studentClass").value;
        if (!studentId || !firstName || !lastName || !nickname || !studentClass) {
            alert("กรุณากรอกข้อมูลให้ครบถ้วน");
            return;
        }
        const studentData = {
            studentId,
            firstName,
            lastName,
            nickname,
            class: studentClass,
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
                    throw new Error("ไม่สามารถบันทึกข้อมูลได้");
                }
                return response.json();
            })
            .then(() => {
                alert("บันทึกข้อมูลสำเร็จ!");
                loadStudents();
                event.target.reset();
            })
            .catch((error) => {
                console.error("Error:", error);
                alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
            });
    });

    // ลบข้อมูลนักเรียน
    studentGroupsDiv.addEventListener("click", (event) => {
        if (event.target.classList.contains("action-btn") && event.target.classList.contains("delete")) {
            const studentId = event.target.getAttribute("data-id");
            if (!confirm("คุณต้องการลบข้อมูลนักเรียนนี้ใช่หรือไม่?")) return;
            fetch(`http://localhost:3000/students/${studentId}`, {
                method: "DELETE",
            })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error("ไม่สามารถลบข้อมูลได้");
                    }
                    alert("ลบข้อมูลสำเร็จ!");
                    loadStudents();
                })
                .catch((error) => {
                    console.error("Error:", error);
                    alert("เกิดข้อผิดพลาดในการลบข้อมูล");
                });
        }
    });

    // ฟังก์ชันแสดง modal แก้ไข
    function showEditModal(student) {
        document.getElementById("editStudentId").value = student.id;
        document.getElementById("editStudentIdInput").value = student.studentId || "";
        document.getElementById("editStudentFirstName").value = student.firstName;
        document.getElementById("editStudentLastName").value = student.lastName;
        document.getElementById("editStudentNickname").value = student.nickname || "";
        document.getElementById("editStudentClass").value = student.class;
        document.getElementById("editStudentModal").style.display = "block";
    }

    // ปิด modal
    document.getElementById("closeEditModal").onclick = function () {
        document.getElementById("editStudentModal").style.display = "none";
    };

    // ปิด modal เมื่อคลิกนอกกล่อง
    window.onclick = function (event) {
        const modal = document.getElementById("editStudentModal");
        if (event.target === modal) {
            modal.style.display = "none";
        }
    };

    // เมื่อกดปุ่ม "แก้ไข"
    studentGroupsDiv.addEventListener("click", (event) => {
        if (event.target.classList.contains("action-btn") && event.target.classList.contains("edit")) {
            const studentId = event.target.getAttribute("data-id");
            fetch(`http://localhost:3000/students/${studentId}`)
                .then((response) => {
                    if (!response.ok) throw new Error("ไม่สามารถโหลดข้อมูลนักเรียนได้");
                    return response.json();
                })
                .then((student) => {
                    showEditModal(student);
                })
                .catch(() => {
                    alert("เกิดข้อผิดพลาดในการโหลดข้อมูลสำหรับแก้ไข");
                });
        }
    });

    // เมื่อ submit ฟอร์มแก้ไข
    document.getElementById("editStudentForm").onsubmit = function (e) {
        e.preventDefault();
        const id = document.getElementById("editStudentId").value;
        const updatedStudent = {
            studentId: document.getElementById("editStudentIdInput").value.trim(),
            firstName: document.getElementById("editStudentFirstName").value.trim(),
            lastName: document.getElementById("editStudentLastName").value.trim(),
            nickname: document.getElementById("editStudentNickname").value.trim(),
            class: document.getElementById("editStudentClass").value,
        };
        fetch(`http://localhost:3000/students/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedStudent),
        })
            .then((response) => {
                if (!response.ok) throw new Error("ไม่สามารถแก้ไขข้อมูลได้");
                return response.json();
            })
            .then(() => {
                alert("แก้ไขข้อมูลสำเร็จ!");
                document.getElementById("editStudentModal").style.display = "none";
                loadStudents();
            })
            .catch(() => {
                alert("เกิดข้อผิดพลาดในการแก้ไขข้อมูล");
            });
    };

    // โหลดข้อมูลล่าสุดเมื่อโหลดหน้าเว็บ (กิจกรรม/รางวัล/ผู้มาเยี่ยมชม)
    function loadLatestItems(endpoint, galleryId) {
        fetch(`${endpoint}?_sort=id&_order=desc&_limit=3`)
            .then(response => {
                if (!response.ok) throw new Error("ไม่สามารถโหลดข้อมูลได้");
                return response.json();
            })
            .then(items => {
                items.forEach(item => {
                    addItemToGallery(galleryId, item);
                });
            })
            .catch(err => {
                console.error(`เกิดข้อผิดพลาดในการโหลดข้อมูลจาก ${galleryId}:`, err);
            });
    }

    loadLatestItems('http://localhost:3000/activities', 'activityGallery');
    loadLatestItems('http://localhost:3000/award', 'awardGallery');
    loadLatestItems('http://localhost:3000/visitor', 'visitorGallery');
});

// นักเรียน: แสดงตารางนักเรียน (แบบสรุป)
async function renderStudentTableSimple() {
    const container = document.getElementById('studentTableContainer');
    if (!container) return;
    try {
        const res = await fetch('http://localhost:3000/students');
        const data = await res.json();
        const students = Array.isArray(data) ? data : data.students || [];
        // กรองเฉพาะที่มีข้อมูลสำคัญ
        const validStudents = students.filter(s => s.studentId && s.firstName && s.lastName && s.class);
        if (!validStudents.length) {
            container.innerHTML = "<p>ไม่พบข้อมูลนักเรียน</p>";
            return;
        }
        // เรียงตามลำดับชั้นที่ต้องการ
        const classOrder = ["อนุบาล 1", "อนุบาล 2", "อนุบาล 3", "ป.1", "ป.2", "ป.3"];
        validStudents.sort((a, b) => {
            const idxA = classOrder.indexOf(a.class);
            const idxB = classOrder.indexOf(b.class);
            if (idxA === -1 && idxB === -1) return (a.class || '').localeCompare(b.class || '', 'th');
            if (idxA === -1) return 1;
            if (idxB === -1) return -1;
            return idxA - idxB;
        });
        let html = `
      <table class="student-table">
        <thead>
          <tr>
            <th>รหัสนักเรียน</th>
            <th>ชื่อ - สกุล</th>
            <th>ระดับชั้น</th>
          </tr>
        </thead>
        <tbody>
          ${validStudents.map(s => `
            <tr>
              <td>${s.studentId}</td>
              <td>${s.firstName} ${s.lastName}</td>
              <td>${s.class}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
        container.innerHTML = html;
    } catch (e) {
        container.innerHTML = '<p style="color:red;">ไม่สามารถโหลดข้อมูลนักเรียนได้</p>';
    }
}

// เรียกใช้เมื่อโหลดหน้า
window.addEventListener('DOMContentLoaded', function () {
    renderStudentTableSimple();
    // เพิ่มเติม: ให้แสดง section ตารางนักเรียนเป็นค่าเริ่มต้นถ้าไม่มี lastSection
    const lastSection = localStorage.getItem('lastSection');
    showSection(lastSection ? lastSection : 'studentTableSection');
});

const scheduleDays = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์"];
const schedulePeriods = [
    "08:00-09:00", "09:00-10:00", "10:00-11:00", "11:00-12:00",
    "12:00-13:00", "13:00-14:00", "14:00-15:00", "15:00-16:00"
];

// ฟังก์ชันสีพื้นหลังแต่ละวัน
function getDayColor(day) {
    switch (day) {
        case "จันทร์": return "#ffe066";
        case "อังคาร": return "#ffb3b3";
        case "พุธ": return "#b3e6e6";
        case "พฤหัสบดี": return "#ffd699";
        case "ศุกร์": return "#b3c6ff";
        default: return "#fff";
    }
}

// โหลดข้อมูลตารางเรียนจาก backend
async function loadSchedule() {
    const res = await fetch('http://localhost:3000/schedule');
    return await res.json();
}

// แปลง object { "จันทร์": [ ... ], ... } เป็น array [{day: "จันทร์", period1: ..., ...}, ...]
function convertScheduleArrayToObject(scheduleArr) {
    const result = {};
    Object.keys(scheduleArr).forEach(className => {
        result[className] = {};
        scheduleArr[className].forEach(dayObj => {
            const day = dayObj.day;
            result[className][day] = [];
            for (let i = 1; i <= 8; i++) {
                result[className][day].push(dayObj[`period${i}`] || "");
            }
        });
    });
    return result;
}

// แก้ไข saveSchedule ให้แปลงก่อนส่ง
async function saveSchedule(schedule) {
    const converted = convertScheduleObjectToArray(schedule);
    await fetch('http://localhost:3000/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(converted)
    });
}

// ฟอร์มเพิ่ม/แก้ไขตารางเรียน "เฉพาะวัน"
function renderEditScheduleDayForm(scheduleData, className, day, updateForm) {
    const formDiv = document.getElementById('editScheduleFormContainer');
    let html = `<form id="editScheduleDayForm"><table class="schedule-table" style="width:100%;background:#ffe4e1;">
    <thead>
      <tr>
        <th>คาบ</th>
        <th>เวลา</th>
        <th>${day}</th>
      </tr>
    </thead>
    <tbody>`;
    schedulePeriods.forEach((period, i) => {
        const val = (scheduleData[className] && scheduleData[className][day] && scheduleData[className][day][i]) || '';
        html += `<tr>
          <td>${i + 1}</td>
          <td>${period}</td>
          <td><input type="text" name="period_${i}" value="${val}" style="width:90%"></td>
        </tr>`;
    });
    html += `</tbody></table>
    <button type="submit" style="margin-top:10px;">บันทึกตารางเรียน</button>
  </form>`;
    formDiv.innerHTML = html;

    document.getElementById('editScheduleDayForm').onsubmit = async function (e) {
        e.preventDefault();
        const formData = new FormData(this);
        if (!scheduleData[className]) scheduleData[className] = {};
        if (!scheduleData[className][day]) scheduleData[className][day] = [];
        schedulePeriods.forEach((_, i) => {
            scheduleData[className][day][i] = formData.get(`period_${i}`) || '';
        });
        await saveSchedule(scheduleData);
        alert('บันทึกตารางเรียนสำเร็จ');
        // refresh ฟอร์มเดิม ไม่เปลี่ยน section
        if (typeof updateForm === "function") updateForm();
    };
}

// แสดงตารางเรียนรวมทุกวัน
function renderScheduleTable(scheduleData, className) {
    scheduleData = convertScheduleArrayToObject(scheduleData);
    const container = document.getElementById('scheduleTableContainer');
    if (!container) return;
    if (!scheduleData[className]) {
        container.innerHTML = '<p style="color:red;">ยังไม่มีข้อมูลตารางเรียนสำหรับชั้นนี้</p>';
        return;
    }
    let html = `<table class="schedule-table" border="1" style="width:100%;background:#eaf6fb;text-align:center;">
      <thead>
        <tr>
          <th style="background:#b2e0f7;">เวลา</th>
          ${schedulePeriods.map(period => `<th style="background:#b2e0f7;">${period}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${scheduleDays.map(day => `
          <tr>
            <td style="background:${getDayColor(day)};font-weight:bold;">${day}</td>
            ${schedulePeriods.map((_, i) => `<td>${(scheduleData[className][day] && scheduleData[className][day][i]) || ""}</td>`).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>`;
    container.innerHTML = html;
}

// ฟังก์ชันแสดงตารางเรียน (เลือกวัน/ทุกวัน)
function renderScheduleTableView(scheduleData, className, day) {
    const container = document.getElementById('showScheduleTableContainer');
    if (!scheduleData[className]) {
        container.innerHTML = '<p style="color:red;">ยังไม่มีข้อมูลตารางเรียนสำหรับชั้นนี้</p>';
        return;
    }
    let html = `<table class="schedule-table" border="1" style="width:100%;background:#eaf6fb;text-align:center;">`;
    if (!day) {
        // แสดงทั้งสัปดาห์
        html += `<thead>
            <tr>
                <th style="background:#b2e0f7;">เวลา</th>
                ${schedulePeriods.map(period => `<th style="background:#b2e0f7;">${period}</th>`).join('')}
            </tr>
        </thead>
        <tbody>
            ${scheduleDays.map(d => `
                <tr>
                    <td style="background:${getDayColor(d)};font-weight:bold;">${d}</td>
                    ${schedulePeriods.map((_, i) => `<td>${(scheduleData[className][d] && scheduleData[className][d][i]) || ""}</td>`).join('')}
                </tr>
            `).join('')}
        </tbody>`;
    } else {
        // แสดงเฉพาะวันเดียว
        html += `<thead>
            <tr>
                <th style="background:#b2e0f7;">เวลา</th>
                ${schedulePeriods.map(period => `<th style="background:#b2e0f7;">${period}</th>`).join('')}
            </tr>
        </thead>
        <tbody>
            <tr>
                <td style="background:${getDayColor(day)};font-weight:bold;">${day}</td>
                ${schedulePeriods.map((_, i) => `<td>${(scheduleData[className][day] && scheduleData[className][day][i]) || ""}</td>`).join('')}
            </tr>
        </tbody>`;
    }
    html += `</table>`;
    container.innerHTML = html;
}

// โหลดและแสดงฟอร์มแก้ไขตารางเรียนเฉพาะวัน
async function loadEditSchedule() {
    let scheduleData = await loadSchedule();
    scheduleData = convertScheduleArrayToObject(scheduleData);
    const classSelect = document.getElementById('editScheduleClassSelect');
    const daySelect = document.getElementById('editScheduleDaySelect');
    const showTableBtn = document.getElementById('showScheduleTableBtn');
    // ประกาศ updateForm ให้ส่งเข้า renderEditScheduleDayForm
    function updateForm() {
        document.getElementById('scheduleTableContainer').innerHTML = '';
        if (classSelect.value && daySelect.value) {
            renderEditScheduleDayForm(scheduleData, classSelect.value, daySelect.value, updateForm);
        } else {
            document.getElementById('editScheduleFormContainer').innerHTML = '';
        }
    }
    classSelect.onchange = updateForm;
    daySelect.onchange = updateForm;
    showTableBtn.onclick = function () {
        if (classSelect.value) {
            renderScheduleTable(scheduleData, classSelect.value);
        } else {
            alert('กรุณาเลือกชั้นเรียน');
        }
    };
    updateForm();
}

// โหลดและแสดงตารางเรียน (เลือกวัน/ทุกวัน)
async function loadScheduleSection() {
    let scheduleData = await loadSchedule();
    scheduleData = convertScheduleArrayToObject(scheduleData);
    const classSelect = document.getElementById('scheduleClassSelect');
    const daySelect = document.getElementById('scheduleDaySelect');
    const showBtn = document.getElementById('showScheduleBtn');
    showBtn.onclick = function () {
        if (classSelect.value) {
            renderScheduleTableView(scheduleData, classSelect.value, daySelect.value);
        } else {
            alert('กรุณาเลือกชั้นเรียน');
        }
    };
}

window.editActivity = editActivity;
window.deleteActivity = deleteActivity;
window.showActivityDetail = showActivityDetail;
window.showVisitorModal = async function (visitorId, imgName) {
    const res = await fetch('http://localhost:3000/visitors');
    const visitors = await res.json();
    const visitor = visitors.find(v => v.id === visitorId);
    if (!visitor) return;
    document.getElementById('visitorModalImg').src = `http://localhost:3000/uploads/visitors/${imgName}`;
    document.getElementById('visitorModalDetail').innerHTML = visitor.detail || '';
    document.getElementById('visitorModal').style.display = 'block';
};
document.getElementById('closeVisitorModal').onclick = function () {
    document.getElementById('visitorModal').style.display = 'none';
};
window.onclick = function (event) {
    const modal = document.getElementById('visitorModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
};