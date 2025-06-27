const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

// กำหนด path สำหรับไฟล์ข้อมูล
const scheduleFile = path.join(__dirname, '../Front-end/users/schedule.json');
const studentsPath = path.join(__dirname, '../Front-end/users/students.json');
const activitiesFile = path.join(__dirname, '../Back-end/data/activities.json');

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Static path สำหรับรูป
app.use('/uploads', express.static(path.join(__dirname, '../Back-end/uploads')));

// ----------------- กิจกรรม (Activity) -----------------
const activityStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../Back-end/uploads/activity'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const uploadActivity = multer({ storage: activityStorage });

// GET กิจกรรมทั้งหมด
app.get('/activities', (req, res) => {
  console.log('ใช้ไฟล์ activities:', activitiesFile);
  fs.readFile(activitiesFile, (err, data) => {
    if (err) return res.status(500).send('Error reading activities.json');
    try {
      res.json(JSON.parse(data));
    } catch (e) {
      res.status(500).send('Error parsing activities.json');
    }
  });
});

// POST เพิ่มกิจกรรม
app.post('/activities', uploadActivity.single('image'), (req, res) => {
  console.log('ใช้ไฟล์ activities:', activitiesFile);
  const { detail } = req.body;
  const imagePath = '/uploads/activity/' + req.file.filename;
  let activities = [];
  if (fs.existsSync(activitiesFile)) {
    try {
      activities = JSON.parse(fs.readFileSync(activitiesFile, 'utf8'));
    } catch (e) {
      activities = [];
    }
  }
  // สร้าง id ใหม่
  let newId;
  do {
    newId = Date.now().toString() + Math.floor(Math.random() * 1000);
  } while (activities.some(a => a.id === newId));
  const newItem = { id: newId, detail, imagePath };
  activities.push(newItem);

  // Log path และ error
  console.log('จะเขียนไฟล์ activities ที่:', activitiesFile);
  try {
    fs.writeFileSync(activitiesFile, JSON.stringify(activities, null, 2));
    console.log('เขียนไฟล์ activities.json สำเร็จ');
  } catch (e) {
    console.error('เขียนไฟล์ activities.json ไม่สำเร็จ:', e);
    return res.status(500).json({ error: 'บันทึกไฟล์ไม่ได้', detail: e.message });
  }
  res.json({ data: newItem });
});

// PUT แก้ไขกิจกรรม
app.put('/activities/:id', (req, res) => {
  console.log('ใช้ไฟล์ activities:', activitiesFile);
  fs.readFile(activitiesFile, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'อ่านไฟล์ไม่ได้' });
    let arr = [];
    try {
      arr = JSON.parse(data);
    } catch (e) {
      return res.status(500).json({ error: 'ไฟล์ activities.json ไม่ถูกต้อง' });
    }
    const idx = arr.findIndex(a => a.id == req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'ไม่พบกิจกรรม' });
    arr[idx] = { ...arr[idx], ...req.body, id: arr[idx].id };
    fs.writeFile(activitiesFile, JSON.stringify(arr, null, 2), err2 => {
      if (err2) return res.status(500).json({ error: 'บันทึกไฟล์ไม่ได้' });
      res.json({ success: true });
    });
  });
});

// DELETE กิจกรรม (ลบข้อมูลและไฟล์ภาพ)
app.delete('/activities/:id', (req, res) => {
  console.log('ใช้ไฟล์ activities:', activitiesFile);
  fs.readFile(activitiesFile, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'อ่านไฟล์ไม่ได้' });
    let arr = [];
    try {
      arr = JSON.parse(data);
    } catch (e) {
      return res.status(500).json({ error: 'ไฟล์ activities.json ไม่ถูกต้อง' });
    }
    const activity = arr.find(a => a.id === req.params.id);
    if (!activity) {
      return res.status(404).json({ error: 'ไม่พบกิจกรรม' });
    }
    // ลบไฟล์ภาพถ้ามี
    if (activity.imagePath) {
      const imgPath = path.join(__dirname, '../Back-end', activity.imagePath.replace(/^\//, ''));
      console.log('จะลบไฟล์ภาพ:', imgPath);
      fs.unlink(imgPath, err => {
        if (err) {
          console.error('ลบไฟล์ภาพไม่สำเร็จ:', imgPath, err);
        } else {
          console.log('ลบไฟล์ภาพสำเร็จ:', imgPath);
        }
      });
    }
    arr = arr.filter(a => a.id !== req.params.id);
    fs.writeFile(activitiesFile, JSON.stringify(arr, null, 2), err2 => {
      if (err2) return res.status(500).json({ error: 'บันทึกไฟล์ไม่ได้' });
      res.json({ success: true });
    });
  });
});

// ----------------- รางวัล (Award) -----------------
const awardStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../Back-end/uploads/award'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const uploadAward = multer({ storage: awardStorage });

app.get('/awards', (req, res) => {
  fs.readFile(path.join(__dirname, '../Back-end/data/awards.json'), (err, data) => {
    if (err) return res.status(500).send('Error reading awards.json');
    try {
      res.json(JSON.parse(data));
    } catch (e) {
      res.status(500).send('Error parsing awards.json');
    }
  });
});

app.post('/awards', uploadAward.single('image'), (req, res) => {
  const { detail, winner } = req.body;
  const imagePath = '/uploads/award/' + req.file.filename;
  const dataPath = path.join(__dirname, '../Back-end/data/awards.json');
  let awards = [];
  if (fs.existsSync(dataPath)) {
    try {
      awards = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    } catch (e) {
      awards = [];
    }
  }
  const newItem = { name: winner, detail, imagePath };
  awards.push(newItem);
  try {
    fs.writeFileSync(dataPath, JSON.stringify(awards, null, 2));
    console.log('เขียนไฟล์ awards.json สำเร็จ');
  } catch (e) {
    console.error('เขียนไฟล์ awards.json ไม่สำเร็จ:', e);
    return res.status(500).json({ error: 'บันทึกไฟล์ไม่ได้', detail: e.message });
  }
  res.json({ data: newItem });
});

// ----------------- นักเรียน (Students) -----------------
app.get('/students', (req, res) => {
  fs.readFile(studentsPath, (err, data) => {
    if (err) return res.status(500).send('Error reading students.json');
    try {
      res.json(JSON.parse(data));
    } catch (e) {
      res.status(500).send('Error parsing students.json');
    }
  });
});

app.get('/students/:id', (req, res) => {
  fs.readFile(studentsPath, (err, data) => {
    if (err) return res.status(500).send('Error reading students.json');
    let students = [];
    try {
      students = JSON.parse(data).students || [];
    } catch (e) {
      students = [];
    }
    const student = students.find(s => s.id === req.params.id);
    if (!student) return res.status(404).send('Student not found');
    res.json(student);
  });
});

app.put('/students/:id', (req, res) => {
  fs.readFile(studentsPath, (err, data) => {
    if (err) return res.status(500).send('Error reading students.json');
    let students = [];
    try {
      students = JSON.parse(data).students || [];
    } catch (e) {
      students = [];
    }
    const idx = students.findIndex(s => s.id === req.params.id);
    if (idx === -1) return res.status(404).send('Student not found');
    students[idx] = { ...students[idx], ...req.body, id: students[idx].id };
    fs.writeFile(studentsPath, JSON.stringify({ students }, null, 2), (err) => {
      if (err) return res.status(500).send('Error saving students.json');
      res.json({ message: 'แก้ไขข้อมูลสำเร็จ', student: students[idx] });
    });
  });
});

app.delete('/students/:id', (req, res) => {
  fs.readFile(studentsPath, (err, data) => {
    if (err) return res.status(500).send('Error reading students.json');
    let students = [];
    try {
      students = JSON.parse(data).students || [];
    } catch (e) {
      students = [];
    }
    const newStudents = students.filter(s => s.id !== req.params.id);
    if (students.length === newStudents.length) return res.status(404).send('Student not found');
    fs.writeFile(studentsPath, JSON.stringify({ students: newStudents }, null, 2), (err) => {
      if (err) return res.status(500).send('Error saving students.json');
      res.json({ message: 'ลบข้อมูลสำเร็จ' });
    });
  });
});

app.post('/students', (req, res) => {
  fs.readFile(studentsPath, (err, data) => {
    if (err) return res.status(500).send('Error reading students.json');
    let students = [];
    try {
      students = JSON.parse(data).students || [];
    } catch {
      students = [];
    }
    const newStudent = req.body;
    // ตรวจสอบข้อมูลก่อนเพิ่ม
    if (
      !newStudent.studentId ||
      !newStudent.firstName ||
      !newStudent.lastName ||
      !newStudent.nickname ||
      !newStudent.class
    ) {
      return res.status(400).send('ข้อมูลไม่ครบถ้วน');
    }
    let newId;
    do {
      newId = Math.random().toString(16).slice(2, 6);
    } while (students.some(s => s.id === newId));
    newStudent.id = newId;
    students.push(newStudent);
    fs.writeFile(studentsPath, JSON.stringify({ students }, null, 2), (err) => {
      if (err) return res.status(500).send('Error saving students.json');
      res.json({ message: 'เพิ่มข้อมูลนักเรียนสำเร็จ', student: newStudent });
    });
  });
});

// ----------------- ตารางเรียน (Schedule) -----------------

// GET ตารางเรียน
app.get('/schedule', (req, res) => {
  fs.readFile(scheduleFile, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'อ่านไฟล์ schedule ไม่ได้' });
    try {
      const json = JSON.parse(data);
      res.json(json.schedule);
    } catch (e) {
      res.status(500).json({ error: 'ไฟล์ schedule.json ไม่ถูกต้อง' });
    }
  });
});

// PUT อัปเดตตารางเรียน
app.put('/schedule', (req, res) => {
  fs.readFile(scheduleFile, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'อ่านไฟล์ schedule ไม่ได้' });
    let json;
    try {
      json = JSON.parse(data);
    } catch (e) {
      json = { schedule: {} };
    }
    json.schedule = req.body;
    fs.writeFile(scheduleFile, JSON.stringify(json, null, 2), (err) => {
      if (err) return res.status(500).json({ error: 'บันทึกไฟล์ schedule ไม่ได้' });
      res.json({ message: 'อัปเดตตารางเรียนสำเร็จ' });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});