const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const app = express();
const schedulePath = path.join(__dirname, '../Back-end/data/schedule.json');
const PORT = 3000;

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

app.get('/activities', (req, res) => {
  fs.readFile(path.join(__dirname, '../Back-end/data/activities.json'), (err, data) => {
    if (err) return res.status(500).send('Error reading activities.json');
    res.json(JSON.parse(data));
  });
});

app.post('/activities', uploadActivity.single('image'), (req, res) => {
  const { detail } = req.body;
  const imagePath = '/uploads/activity/' + req.file.filename;
  const dataPath = path.join(__dirname, '../Back-end/data/activities.json');
  let activities = [];
  if (fs.existsSync(dataPath)) {
    activities = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  }
  const newItem = { detail, imagePath };
  activities.push(newItem);
  fs.writeFileSync(dataPath, JSON.stringify(activities, null, 2));
  res.json({ data: newItem });
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
    res.json(JSON.parse(data));
  });
});

app.post('/awards', uploadAward.single('image'), (req, res) => {
  const { detail, winner } = req.body;
  const imagePath = '/uploads/award/' + req.file.filename;
  const dataPath = path.join(__dirname, '../Back-end/data/awards.json');
  let awards = [];
  if (fs.existsSync(dataPath)) {
    awards = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  }
  // ต้องใช้ name: winner
  const newItem = { name: winner, detail, imagePath };
  awards.push(newItem);
  fs.writeFileSync(dataPath, JSON.stringify(awards, null, 2));
  res.json({ data: newItem });
});

// ----------------- นักเรียน (Students) -----------------
app.get('/students', (req, res) => {
  fs.readFile(path.join(__dirname, '../Front-end/users/students.json'), (err, data) => {
    if (err) return res.status(500).send('Error reading students.json');
    res.json(JSON.parse(data)); // ต้อง return เป็น { students: [...] }
  });
});

app.get('/students/:id', (req, res) => {
  fs.readFile(path.join(__dirname, '../Front-end/users/students.json'), (err, data) => {
    if (err) return res.status(500).send('Error reading students.json');
    const students = JSON.parse(data).students || [];
    const student = students.find(s => s.id === req.params.id);
    if (!student) return res.status(404).send('Student not found');
    res.json(student);
  });
});

app.put('/students/:id', (req, res) => {
  const studentsPath = path.join(__dirname, '../Front-end/users/students.json');
  fs.readFile(studentsPath, (err, data) => {
    if (err) return res.status(500).send('Error reading students.json');
    let students = JSON.parse(data).students || [];
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
  const studentsPath = path.join(__dirname, '../Front-end/users/students.json');
  fs.readFile(studentsPath, (err, data) => {
    if (err) return res.status(500).send('Error reading students.json');
    let students = JSON.parse(data).students || [];
    const newStudents = students.filter(s => s.id !== req.params.id);
    if (students.length === newStudents.length) return res.status(404).send('Student not found');
    fs.writeFile(studentsPath, JSON.stringify({ students: newStudents }, null, 2), (err) => {
      if (err) return res.status(500).send('Error saving students.json');
      res.json({ message: 'ลบข้อมูลสำเร็จ' });
    });
  });
});

app.post('/students', (req, res) => {
  const studentsPath = path.join(__dirname, '../Front-end/users/students.json');
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

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});