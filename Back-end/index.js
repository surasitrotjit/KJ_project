const jwt = require('jsonwebtoken'); 
const blacklistedTokens = new Set(); // เก็บ token ที่ถูก logout 
const SECRET_KEY = '555'; 
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const users = require('./user');
const app = express();
const PORT = 3000;
const { v4: uuidv4 } = require('uuid'); 



// กำหนด path สำหรับไฟล์ข้อมูล
const scheduleFile = path.join(__dirname, '../Front-end/users/schedule.json');
const studentsPath = path.join(__dirname, '../Front-end/users/students.json');
const activitiesFile = path.join(__dirname, '../Back-end/data/activities.json');
const newsFile = path.join(__dirname, '../Back-end/data/news.json');
const awardsFile = path.join(__dirname, '../Back-end/data/awards.json');
const paJiabNewsFile = path.join(__dirname, '../Back-end/data/pajiabnews.json');

// Middleware
app.use(cors({
    origin: 'http://localhost:5500',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Static path สำหรับรูป
app.use('/uploads', express.static(path.join(__dirname, '../Back-end/uploads')));

// JWT ตรวจสอบ Token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token ไม่ถูกต้องหรือหมดอายุ' });

    // เช็คว่า token อยู่ใน blacklist หรือไม่
    if (blacklistedTokens.has(token)) {
        return res.status(401).json({ message: 'Token หมดอายุแล้ว (ถูก logout)' });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ message: 'Token ไม่ถูกต้องหรือหมดอายุ' });
        req.user = user;
        next();
    });
}


// --------- LOGIN API ---------
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users[username];

    if (!user) {
        return res.status(401).json({ message: 'ไม่พบผู้ใช้' });
    }
    if (user.password !== password) {
        return res.status(401).json({ message: 'รหัสผ่านไม่ถูกต้อง' });
    }

    const token = jwt.sign({ username, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token, role: user.role });
});
app.post('/verify-token', authenticateToken, (req, res) => {
    res.json({ success: true, user: req.user });
});
app.get('/verify-token', authenticateToken, (req, res) => {
    res.json({ valid: true, role: req.user.role });
});
app.post('/logout', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
        blacklistedTokens.add(token);
    }
    res.json({ message: 'ออกจากระบบเรียบร้อยแล้ว' });
});

// ----------------- กิจกรรม (Activity) -----------------
const activityStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../Back-end/uploads/activity')); // เปลี่ยนเป็น activities (เติม s)
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
app.post('/activities', uploadActivity.array('images', 10), (req, res) => {
    fs.readFile(activitiesFile, 'utf8', (err, data) => {
        let activities = [];
        if (!err && data) activities = JSON.parse(data);
        const newActivity = {
            id: Date.now().toString(),
            detail: req.body.detail,
            images: req.files ? req.files.map(f => f.filename) : []
        };
        activities.push(newActivity);
        fs.writeFile(activitiesFile, JSON.stringify(activities, null, 2), () => {
            res.json({ success: true, activity: newActivity });
        });
    });
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

// DELETE กิจกรรม 
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

const visitorStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../Back-end/uploads/visitors')); // เปลี่ยนเป็น visitor
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const uploadVisitor = multer({ storage: visitorStorage });

const visitorsFile = path.join(__dirname, '../Back-end/data/visitors.json');

// GET: ดึง visitor 
app.get('/visitors', (req, res) => {
    fs.readFile(visitorsFile, 'utf8', (err, data) => {
        if (err) return res.json([]);
        res.json(JSON.parse(data || '[]'));
    });
});

// POST: เพิ่ม visitor (รองรับหลายรูป)
app.post('/visitors', uploadVisitor.array('images', 10), (req, res) => {
    fs.readFile(visitorsFile, 'utf8', (err, data) => {
        let visitors = [];
        if (!err && data) visitors = JSON.parse(data);
        const newVisitor = {
            id: Date.now().toString(),
            detail: req.body.detail,
            images: req.files ? req.files.map(f => f.filename) : []
        };
        visitors.push(newVisitor);
        fs.writeFile(visitorsFile, JSON.stringify(visitors, null, 2), () => {
            res.json({ success: true, visitor: newVisitor });
        });
    });
});

// PUT: แก้ไข visitor
app.put('/visitors/:id', express.json(), (req, res) => {
    fs.readFile(visitorsFile, 'utf8', (err, data) => {
        if (err) return res.status(500).end();
        let visitors = JSON.parse(data);
        const idx = visitors.findIndex(v => v.id === req.params.id);
        if (idx !== -1) {
            visitors[idx].detail = req.body.detail;
            fs.writeFile(visitorsFile, JSON.stringify(visitors, null, 2), () => {
                res.json({ success: true });
            });
        } else {
            res.status(404).end();
        }
    });
});

// DELETE: ลบ visitor
app.delete('/visitors/:id', (req, res) => {
    fs.readFile(visitorsFile, 'utf8', (err, data) => {
        if (err) return res.status(500).end();
        let visitors = JSON.parse(data);
        const idx = visitors.findIndex(v => v.id === req.params.id);
        if (idx !== -1) {
            // ลบไฟล์ภาพ
            if (visitors[idx].images && visitors[idx].images.length > 0) {
                visitors[idx].images.forEach(img => {
                    const imgPath = path.join(__dirname, '../Back-end/uploads/visitors', img); // <-- ต้องเติม s
                    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
                });
            }
            visitors.splice(idx, 1);
            fs.writeFile(visitorsFile, JSON.stringify(visitors, null, 2), () => {
                res.json({ success: true });
            });
        } else {
            res.status(404).end();
        }
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

// GET รางวัลทั้งหมด
app.get('/awards', (req, res) => {
    fs.readFile(awardsFile, (err, data) => {
        if (err) return res.status(500).send('Error reading awards.json');
        try {
            res.json(JSON.parse(data));
        } catch (e) {
            res.status(500).send('Error parsing awards.json');
        }
    });
});

// POST เพิ่มรางวัล (รองรับ winner, awardName, detail)
app.post('/awards', uploadAward.single('image'), (req, res) => {
    const { winner, awardName, detail } = req.body;
    const force = req.body.force === 'true' || req.body.force === true;
    let awards = [];
    if (fs.existsSync(awardsFile)) {
        try {
            awards = JSON.parse(fs.readFileSync(awardsFile, 'utf8'));
        } catch (e) {
            awards = [];
        }
    }
    const isDuplicate = awards.some(item =>
        item.winner === winner &&
        item.awardName === awardName &&
        item.detail === detail
    );
    if (isDuplicate && !force) {
        return res.status(409).json({ error: 'ข้อมูลซ้ำ', duplicate: true });
    }
    const imagePath = req.file ? '/uploads/award/' + req.file.filename : '';
    const newItem = {
        id: Date.now().toString(),
        winner,
        awardName,
        detail,
        imagePath
    };
    awards.push(newItem);
    try {
        fs.writeFileSync(awardsFile, JSON.stringify(awards, null, 2));
        if (!fs.existsSync(awardsFile)) {
            console.warn('Warning: awards.json ไม่ถูกบันทึก ตรวจสอบ path:', awardsFile);
        } else {
            console.log('บันทึกลง awards.json ที่:', awardsFile);
        }
    } catch (e) {
        console.error('เกิดข้อผิดพลาดขณะบันทึกไฟล์ awards.json:', e);
        return res.status(500).json({ error: 'บันทึกไฟล์ไม่ได้', detail: e.message, filePath: awardsFile });
    }
    res.json({ data: newItem });
});

// PUT แก้ไขรางวัล (รองรับ name)
app.put('/awards/:id', express.json(), (req, res) => {
    fs.readFile(awardsFile, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'อ่านไฟล์ไม่ได้' });
        let awards = [];
        try {
            awards = JSON.parse(data);
        } catch (e) {
            return res.status(500).json({ error: 'ไฟล์ awards.json ไม่ถูกต้อง' });
        }
        const idx = awards.findIndex(a => a.id == req.params.id);
        if (idx === -1) return res.status(404).json({ error: 'ไม่พบรางวัล' });
        awards[idx] = { ...awards[idx], ...req.body, id: awards[idx].id };
        fs.writeFile(awardsFile, JSON.stringify(awards, null, 2), err2 => {
            if (err2) return res.status(500).json({ error: 'บันทึกไฟล์ไม่ได้' });
            res.json({ success: true, award: awards[idx] });
        });
    });
});

// DELETE รางวัล
app.delete('/awards/:id', (req, res) => {
    fs.readFile(awardsFile, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'อ่านไฟล์ไม่ได้' });
        let awards = [];
        try {
            awards = JSON.parse(data);
        } catch (e) {
            return res.status(500).json({ error: 'ไฟล์ awards.json ไม่ถูกต้อง' });
        }
        const idx = awards.findIndex(a => a.id == req.params.id);
        if (idx === -1) return res.status(404).json({ error: 'ไม่พบรางวัล' });
        // ลบไฟล์ภาพถ้ามี
        if (awards[idx].imagePath) {
            const imgPath = path.join(__dirname, '../Back-end', awards[idx].imagePath.replace(/^\//, ''));
            if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
        }
        awards.splice(idx, 1);
        fs.writeFile(awardsFile, JSON.stringify(awards, null, 2), err2 => {
            if (err2) return res.status(500).json({ error: 'บันทึกไฟล์ไม่ได้' });
            res.json({ success: true });
        });
    });
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

app.get('/news', (req, res) => {
    fs.readFile(newsFile, 'utf8', (err, data) => {
        if (err) return res.status(500).send('อ่านไฟล์ news.json ไม่ได้');
        try {
            const news = JSON.parse(data || '[]');
            res.json(news);
        } catch {
            res.status(500).send('แปลงข้อมูล news.json ไม่ได้');
        }
    });
});

app.post('/news', (req, res) => {
    const { title, detail } = req.body;
    console.log('Received POST /news:', req.body); // ✅ บรรทัดนี้คุณมีแล้ว

    if (!title || !detail) {
        return res.status(400).json({ error: 'กรุณาระบุ title และ detail' });
    }

    fs.readFile(newsFile, 'utf8', (err, data) => {
        let news = [];
        if (!err && data) news = JSON.parse(data);
        const newItem = {
            id: Date.now().toString(), // ✅ มี id แล้ว
            title,
            detail
        };
        news.push(newItem);

        // ✅ เพิ่ม log ตรวจสอบตรงนี้ด้วย
        console.log('เขียนลงไฟล์ news.json:', newItem);

        fs.writeFile(newsFile, JSON.stringify(news, null, 2), (err) => {
            if (err) {
                console.error('❌ เขียนไฟล์ไม่สำเร็จ:', err);
                return res.status(500).json({ error: 'ไม่สามารถเขียนไฟล์ได้' });
            }

            res.json({ success: true, news: newItem });
        });
    });
});
app.put('/news/:id', express.json(), (req, res) => {
    fs.readFile(newsFile, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading newsFile:', err);
            return res.status(500).send('อ่านไฟล์ไม่ได้');
        }
        let news = [];
        try {
            news = JSON.parse(data);
        } catch (parseErr) {
            console.error('Error parsing news JSON:', parseErr);
            return res.status(500).send('ไฟล์ news.json ไม่ถูกต้อง');
        }
        const idx = news.findIndex(n => n.id === req.params.id);
        if (idx === -1) return res.status(404).send('ไม่พบข่าวสาร');

        // อัปเดตเฉพาะ field ที่ต้องการ (optional)
        news[idx] = { ...news[idx], ...req.body, id: news[idx].id };

        fs.writeFile(newsFile, JSON.stringify(news, null, 2), (writeErr) => {
            if (writeErr) {
                console.error('Error writing newsFile:', writeErr);
                return res.status(500).send('ไม่สามารถบันทึกไฟล์ได้');
            }
            res.json({ success: true });
        });
    });
});

app.delete('/news/:id', (req, res) => {
  fs.readFile(newsFile, 'utf8', (err, data) => {
    if (err) return res.status(500).send('อ่านไฟล์ไม่ได้');
    let news = JSON.parse(data || '[]');
    const newNews = news.filter(item => item.id !== req.params.id);
    if (newNews.length === news.length) {
      return res.status(404).send('ไม่พบข่าว');
    }
    fs.writeFile(newsFile, JSON.stringify(newNews, null, 2), (err) => {
      if (err) return res.status(500).send('เขียนไฟล์ไม่ได้');
      res.json({ success: true });
    });
  });
});

app.get('/pajiabnews', (req, res) => {
  fs.readFile(paJiabNewsFile, 'utf8', (err, data) => {
    if (err) {
      console.error('อ่านไฟล์ pajiabnews.json ไม่ได้:', err);
      return res.status(500).send('อ่านไฟล์ pajiabnews.json ไม่ได้');
    }
    try {
      const news = JSON.parse(data || '[]');
      res.json(news);
    } catch (parseErr) {
      console.error('แปลงข้อมูล pajiabnews.json ไม่ได้:', parseErr);
      res.status(500).send('แปลงข้อมูล pajiabnews.json ไม่ได้');
    }
  });
});

// POST เพิ่มข่าวสาร
app.post('/pajiabnews', (req, res) => {
  const { title, detail } = req.body;
  console.log('รับค่าจาก form:', title, detail);

  if (!title || !detail) {
    return res.status(400).json({ error: 'กรุณาระบุ title และ detail' });
  }

  fs.readFile(paJiabNewsFile, 'utf8', (err, data) => {
    if (err) {
      // ถ้าไฟล์ไม่มี ให้เริ่มด้วย array เปล่า
      if (err.code === 'ENOENT') {
        data = '[]';
      } else {
        console.error('อ่านไฟล์ pajiabnews.json ไม่ได้:', err);
        return res.status(500).send('อ่านไฟล์ pajiabnews.json ไม่ได้');
      }
    }

    let news = [];
    try {
      news = JSON.parse(data);
    } catch (parseErr) {
      console.error('แปลง JSON pajiabnews.json ไม่ได้:', parseErr);
      return res.status(500).send('แปลงข้อมูล pajiabnews.json ไม่ได้');
    }

    const newItem = {
      id: Date.now().toString(),
      title,
      detail
    };
    news.push(newItem);

    fs.writeFile(paJiabNewsFile, JSON.stringify(news, null, 2), (writeErr) => {
      if (writeErr) {
        console.error('เขียนไฟล์ pajiabnews.json ไม่สำเร็จ:', writeErr);
        return res.status(500).send('ไม่สามารถเขียนไฟล์ได้');
      }
      res.json({ success: true, news: newItem });
    });
  });
});

// DELETE ลบข่าวสาร
app.delete('/pajiabnews/:id', (req, res) => {
  fs.readFile(paJiabNewsFile, 'utf8', (err, data) => {
    if (err) {
      console.error('อ่านไฟล์ pajiabnews.json ไม่ได้:', err);
      return res.status(500).send('อ่านไฟล์ไม่ได้');
    }
    let news = [];
    try {
      news = JSON.parse(data);
    } catch {
      return res.status(500).send('ไฟล์ pajiabnews.json ไม่ถูกต้อง');
    }

    const filtered = news.filter(n => n.id !== req.params.id);
    if (filtered.length === news.length) return res.status(404).send('ไม่พบข่าว');

    fs.writeFile(paJiabNewsFile, JSON.stringify(filtered, null, 2), (err) => {
      if (err) {
        console.error('เขียนไฟล์ pajiabnews.json ไม่สำเร็จ:', err);
        return res.status(500).send('เขียนไฟล์ไม่ได้');
      }
      res.json({ success: true });
    });
  });
});