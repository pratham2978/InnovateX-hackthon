const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

// Load .env file manually if exists
if (fs.existsSync(path.join(__dirname, ".env"))) {
  const env = fs.readFileSync(path.join(__dirname, ".env"), "utf8");
  env.split("\n").forEach((line) => {
    const parts = line.split("=");
    if (parts.length > 1) {
      const key = parts[0].trim();
      const val = parts.slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");
      process.env[key] = val;
    }
  });
}

const app = express();

const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("./models/user");
const JWT_SECRET = process.env.JWT_SECRET || "synapse_super_secret_auth_key";

const getPythonPath = () => {
  if (process.platform === "win32") {
    const localVenv = path.join(__dirname, "venv", "Scripts", "python.exe");
    const localDotVenv = path.join(__dirname, ".venv", "Scripts", "python.exe");
    if (fs.existsSync(localVenv)) return localVenv;
    if (fs.existsSync(localDotVenv)) return localDotVenv;
    return "python";
  } else {
    const renderVenv = path.join(__dirname, "venv", "bin", "python");
    const renderDotVenv = path.join(__dirname, ".venv", "bin", "python");
    if (fs.existsSync(renderVenv)) return renderVenv;
    if (fs.existsSync(renderDotVenv)) return renderDotVenv;
    return "python3";
  }
};

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || "mongodb+srv://prathammishra067_db_user:rtGiwx0Sh1bMmpiM@cluster0.qlgknnj.mongodb.net/?appName=Cluster0";
mongoose.connect(mongoUri)
  .then(() => console.log("Connected to MongoDB successfully to Cluster0"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Define Schema & Model
const ResumeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  fileName: { type: String, required: true },
  role: { type: String, required: true },
  confidence: { type: Number, required: true },
  score: { type: Number, required: true },
  top_roles: [{ role: String, confidence: Number }],
  skills: [String],
  missing_skills: [String],
  suggestions: [String],
  analyzedAt: { type: Date, default: Date.now }
});

const Resume = mongoose.model("Resume", ResumeSchema);

app.use((req, res, next) => {
  console.log(`[HTTP Request] ${req.method} ${req.url}`);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "*");
  if (req.headers['access-control-request-private-network'] || req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
  }
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../f")));

const upload = multer({
  dest: "uploads/",
});

app.post("/upload", upload.single("resume"), (req, res) => {
  console.log("[Upload API] Incoming file:", req.file ? req.file.originalname : "none");
  const filePath = req.file.path;

  // Extract user authorization token if present
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  let userId = null;
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.id;
    } catch (e) {
      console.warn("Upload called with invalid token:", e.message);
    }
  }

  const pythonBin = getPythonPath();
  exec(
    `"${pythonBin}" python/resume_analyzer.py "${filePath}"`,
    async (error, stdout, stderr) => {
      if (error) {
        console.error(error);

        return res.status(500).json({
          success: false,
          error: error.message,
        });
      }

      try {
        const result = JSON.parse(stdout);

        // Save to MongoDB if connection is ready
        if (mongoose.connection.readyState === 1) {
          try {
            const dbResult = new Resume({
              userId,
              fileName: req.file.originalname,
              role: result.role,
              confidence: result.confidence,
              score: result.score,
              top_roles: result.top_roles,
              skills: result.skills,
              missing_skills: result.missing_skills,
              suggestions: result.suggestions
            });
            await dbResult.save();
          } catch (dbErr) {
            console.error("Failed to save analysis to MongoDB:", dbErr);
          }
        }

        res.json({
          success: true,
          role: result.role,
          confidence: result.confidence,
          score: result.score,
          top_roles: result.top_roles,
          skills: result.skills,
          missing_skills: result.missing_skills,
          suggestions: result.suggestions,
        });
      } catch (err) {
        console.error(err);

        res.status(500).json({
          success: false,
          error: "Invalid JSON from Python",
        });
      }
    }
  );
});

app.post("/api/chat", async (req, res) => {
  const userTranscript = req.body.message;
  const userName = req.body.userName || "";

  if (!userTranscript) {
    return res.status(400).json({ error: "No message provided" });
  }

  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!geminiApiKey || geminiApiKey === "YOUR_GEMINI_API_KEY_HERE" || geminiApiKey === "") {
    // Generate simulated interviewer replies based on candidate message to make it interactive
    const msg = userTranscript.toLowerCase();
    let reply = "That's an interesting point. Can you talk about the time complexity of that approach?";
    if (msg.includes("myself") || msg.includes("education") || msg.includes("study") || msg.includes("university") || msg.includes("college") || msg.includes("student") || msg.includes("degree") || msg.includes("background") || msg.includes("major") || msg.includes("bachelor") || msg.includes("name") || msg.includes("hi") || msg.includes("hello") || msg.includes("yes") || msg.includes("ready") || msg.includes("start")) {
      const thankYouName = userName ? `, ${userName}` : "";
      reply = `Thank you for sharing your background${thankYouName}! It sounds like you have a solid foundation. Let's move to the technical coding part. How would you solve the 'Two Sum' problem in linear time?`;
    } else if (msg.includes("hashmap") || msg.includes("map") || msg.includes("hash table") || msg.includes("hashing")) {
      reply = "Exactly! Utilizing a hash map allows us to check for complements in O(1) time. What would be the space complexity of this approach?";
    } else if (msg.includes("linear") || msg.includes("o(n)") || msg.includes("o (n)") || msg.includes("space")) {
      reply = "That's correct! Since we store elements in the hash map, the space complexity is O(N). Go ahead and type your implementation in the editor and run it to test!";
    } else if (msg.includes("done") || msg.includes("finish") || msg.includes("written") || msg.includes("complete")) {
      reply = "Your code looks excellent and covers all edge cases! Try running it to compile and execute it on our sandbox server.";
    }
    return res.json({ reply });
  }

  try {
    const thankYouNameText = userName ? `The candidate's name is ${userName}. Address the candidate by name (e.g. thank them using their name: "Thank you for sharing your background, ${userName}!") when they introduce themselves/share their background.` : "";
    const body = {
      contents: [
        {
          role: "user",
          parts: [{ text: userTranscript }]
        }
      ],
      systemInstruction: {
        parts: [
          { text: `Role: Alex, SWE Interviewer. Topic: Mock Interview. Start with candidate's profile/introduction/education, then transition to the Two Sum coding challenge. ${thankYouNameText} Speak naturally and concisely (1-3 sentences). Do not use markdown, asterisks, or emojis.` }
        ]
      },
      generationConfig: {
        maxOutputTokens: 100
      }
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${geminiApiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API Error:", errText);
      return res.json({
        reply: "I'm sorry, I'm having trouble connecting to my neural network right now. Please check the backend console."
      });
    }

    const data = await response.json();
    let aiReply = data.candidates[0].content.parts[0].text;

    // Strip markdown symbols
    aiReply = aiReply.replace(/[*#_`~]/g, "");

    res.json({ reply: aiReply });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ reply: "Sorry, my brain encountered a server error processing that." });
  }
});

// Code compilation and sandbox runner endpoint
app.post("/api/run-code", (req, res) => {
  let { code, language } = req.body;
  if (!code) {
    return res.status(400).json({ success: false, error: "No code provided" });
  }

  const tempDir = path.join(__dirname, "temp_run");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  const lang = language ? language.toLowerCase() : "java";

  if (lang === "java") {
    // Strip package declarations to avoid class loading errors
    code = code.replace(/^\s*package\s+[\w.]+;\s*/g, "");

    // Dynamically identify the main class name
    const classMatch = code.match(/class\s+(\w+)/);
    const className = classMatch ? classMatch[1] : "Solution";

    const filePath = path.join(tempDir, `${className}.java`);
    fs.writeFileSync(filePath, code, "utf8");

    exec(`javac "${filePath}"`, (compileErr, compileStdout, compileStderr) => {
      if (compileErr) {
        try { fs.unlinkSync(filePath); } catch(e){}
        return res.json({ success: false, output: compileStderr || compileErr.message });
      }

      exec(`java -cp "${tempDir}" ${className}`, (runErr, runStdout, runStderr) => {
        // Clean up files in temp_run
        try {
          fs.unlinkSync(filePath);
          const files = fs.readdirSync(tempDir);
          files.forEach(f => {
            if (f.startsWith(className) && f.endsWith(".class")) {
              fs.unlinkSync(path.join(tempDir, f));
            }
          });
        } catch(e){}

        if (runErr) {
          return res.json({ success: false, output: runStderr || runErr.message });
        }
        res.json({ success: true, output: runStdout });
      });
    });
  } else if (lang === "python") {
    const filePath = path.join(tempDir, "solution.py");
    fs.writeFileSync(filePath, code, "utf8");

    const pythonCmd = process.platform === "win32" ? "python" : "python3";
    exec(`${pythonCmd} "${filePath}"`, (runErr, runStdout, runStderr) => {
      try { fs.unlinkSync(filePath); } catch(e){}
      if (runErr) {
        return res.json({ success: false, output: runStderr || runErr.message });
      }
      res.json({ success: true, output: runStdout });
    });
  } else {
    res.status(400).json({ success: false, error: "Unsupported language" });
  }
});

// Proxy routes for StudyForge AI Chatbot
app.post("/chat", async (req, res) => {
  console.log("[Backend] Inside POST /chat route handler, req.body:", req.body);
  try {
    const response = await fetch("http://localhost:5002/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });
    if (!response.ok) {
      const errText = await response.text();
      console.error("Chatbot Flask server error:", errText);
      return res.status(response.status).json({ error: errText });
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Chatbot proxy error:", error);
    res.status(500).json({ error: "Could not reach the StudyForge AI chatbot backend." });
  }
});

app.post("/generate-timetable", async (req, res) => {
  try {
    const response = await fetch("http://localhost:5002/generate-timetable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });
    if (!response.ok) {
      const errText = await response.text();
      console.error("Timetable Flask server error:", errText);
      return res.status(response.status).json({ error: errText });
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Timetable proxy error:", error);
    res.status(500).json({ error: "Could not reach the StudyForge AI timetable backend." });
  }
});

app.get("/api/resumes/history", async (req, res) => {
  console.log("[History API] Request received");
  try {
    if (mongoose.connection.readyState !== 1) {
      console.error("[History API] DB not connected");
      return res.status(503).json({ success: false, error: "Database not connected" });
    }

    // Check Authorization header for user token
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      // Return empty history list for unauthenticated requests
      return res.json({ success: true, history: [] });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const history = await Resume.find({ userId: decoded.id }).sort({ analyzedAt: -1 }).limit(10);
      res.json({ success: true, history });
    } catch (jwtErr) {
      return res.status(401).json({ success: false, error: "Invalid session. Please login again." });
    }
  } catch (error) {
    console.error("Fetch history error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- Global Ranking API ---

// GET /api/ranking — public leaderboard (top 50 users by avg resume score)
app.get("/api/ranking", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, error: "DB not connected" });
    }

    // Aggregate: for each user, pick their best resume score
    const pipeline = [
      { $match: { userId: { $ne: null } } },
      { $sort: { score: -1 } },
      {
        $group: {
          _id: "$userId",
          bestScore: { $max: "$score" },
          avgScore: { $avg: "$score" },
          totalAnalyses: { $sum: 1 },
          latestAt: { $max: "$analyzedAt" },
          role: { $first: "$role" }
        }
      },
      { $sort: { bestScore: -1 } },
      { $limit: 50 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo"
        }
      },
      { $unwind: { path: "$userInfo", preserveNullAndEmpty: true } }
    ];

    const results = await Resume.aggregate(pipeline);

    // Check if current request is authenticated — to show "you" badge
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    let currentUserId = null;
    if (token) {
      try { currentUserId = jwt.verify(token, JWT_SECRET).id; } catch {}
    }

    const leaderboard = results.map((entry, idx) => {
      const name = entry.userInfo?.name || "Anonymous";
      const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
      const pts = Math.round((entry.bestScore || 0) * 12.6);
      const streak = Math.min(entry.totalAnalyses * 2, 21);
      return {
        rank: idx + 1,
        userId: entry._id?.toString(),
        name,
        initials,
        pts,
        role: entry.role || "Student",
        streak,
        totalAnalyses: entry.totalAnalyses,
        isCurrentUser: currentUserId && entry._id?.toString() === currentUserId.toString()
      };
    });

    res.json({ success: true, leaderboard, currentUserId });
  } catch (err) {
    console.error("Ranking error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Authentication Endpoints ---

// Register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: "Please enter all fields" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, error: "User already exists with this email" });
    }

    // Create user (password is automatically hashed by pre-save hook)
    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password
    });
    await newUser.save();

    // Generate JWT
    const token = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email
      }
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Please enter all fields" });
    }

    // Check for existing user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ success: false, error: "Invalid credentials" });
    }

    // Validate password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: "Invalid credentials" });
    }

    // Generate JWT
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Social Login Mock Endpoint
app.post("/api/auth/social", async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!email || !name) {
      return res.status(400).json({ success: false, error: "Missing details" });
    }
    
    // Find or create user
    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      user = new User({
        name,
        email: email.toLowerCase(),
        password: Math.random().toString(36).slice(-8)
      });
      await user.save();
    }
    
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error("Social login error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get User Profile (from token)
app.get("/api/auth/me", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ success: false, error: "No token, authorization denied" });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error("Auth check error:", err);
    res.status(401).json({ success: false, error: "Token is not valid" });
  }
});

// --- College Study Feature Endpoints ---

const pdfParse = require("pdf-parse");

async function extractTextFromPdfs(paths) {
  if (!paths || paths.length === 0) {
    return "";
  }
  let extractedText = "";
  for (const filePath of paths) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      extractedText += (data.text || "") + "\n--- END OF FILE ---\n";
    } catch (err) {
      console.error(`Error parsing PDF file ${filePath}:`, err);
      throw err;
    }
  }
  return extractedText;
}

// Helper to read text files and extract PDF text
async function getFileText(files) {
  if (!files || files.length === 0) return "";
  const pdfPaths = [];
  let txtText = "";
  
  for (const file of files) {
    if (file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf")) {
      pdfPaths.push(file.path);
    } else if (file.mimetype === "text/plain" || file.originalname.toLowerCase().endsWith(".txt")) {
      try {
        txtText += fs.readFileSync(file.path, "utf8") + "\n";
      } catch (err) {
        console.error("Error reading txt file:", err);
      }
    }
  }
  
  let pdfText = "";
  if (pdfPaths.length > 0) {
    try {
      pdfText = await extractTextFromPdfs(pdfPaths);
    } catch (err) {
      console.error("Failed to extract PDF text:", err);
    }
  }
  
  return txtText + "\n" + pdfText;
}

// Mock data generator for fallback
function getMockData(mode, userInputText) {
  let subject = "Data Communication Networks";
  if (userInputText) {
    const lines = userInputText.split("\n");
    for (const line of lines) {
      if (line.toLowerCase().includes("subject:") || line.toLowerCase().includes("course:") || line.toLowerCase().includes("syllabus:")) {
        const parts = line.split(":");
        if (parts[1] && parts[1].trim().length > 3) {
          subject = parts[1].trim();
          break;
        }
      }
    }
  }

  if (mode === "mode1") {
    return {
      subjectName: subject,
      scopeSummary: `Comprehensive breakdown of ${subject} curriculum focusing on core concepts and high-probability exam topics.`,
      totalUnits: 2,
      units: [
        {
          unitName: "Unit 1: Fundamentals & Physical Layer",
          topics: [
            {
              topicId: "1.1",
              topicName: "OSI vs TCP/IP Protocol Suites",
              priority: "High",
              notes: {
                overview: "Comparison of the seven-layer OSI model and the four-layer TCP/IP suite, detailing how data flows through encapsulation and decapsulation.",
                keyConcepts: [
                  "OSI Model: Physical, Data Link, Network, Transport, Session, Presentation, Application layers.",
                  "TCP/IP Model: Link, Internet, Transport, Application layers.",
                  "Encapsulation: Header addition at each layer down the stack.",
                  "Decapsulation: Header removal and payload extraction up the stack."
                ],
                formulasOrDiagrams: "Diagram: [Application] -> [Transport (TCP Header)] -> [Network (IP Header)] -> [Data Link (Frame Header/Trailer)] -> [Physical (Bits)]",
                examAngle: "Examiners love asking to compare the OSI and TCP/IP models, or tracing a packet's encapsulation journey. Common trap: Confusing layer numbers between the two models.",
                memoryAid: "OSI Layers mnemonic: Please Do Not Touch Steve's Pet Alligator (Physical, Data Link, Network, Transport, Session, Presentation, Application)"
              }
            },
            {
              topicId: "1.2",
              topicName: "Transmission Media & Nyquist/Shannon Theorems",
              priority: "Medium",
              notes: {
                overview: "Explores guided (copper, fiber) and unguided (wireless) media, along with mathematical limits of channel capacity in noisy and noiseless channels.",
                keyConcepts: [
                  "Guided Media: Twisted pair, coaxial cable, fiber optic cable (highest bandwidth, immune to EMI).",
                  "Nyquist Bit Rate: Capacity limit for noiseless channels. Formula: BitRate = 2 * B * log2(L).",
                  "Shannon Capacity: Capacity limit for noisy channels. Formula: Capacity = B * log2(1 + SNR).",
                  "SNR (Signal-to-Noise Ratio): Ratio of signal power to noise power, often converted to decibels (dB) via SNR_dB = 10 * log10(SNR)."
                ],
                formulasOrDiagrams: "Formulas:\nNyquist: C = 2 * B * log2(L)\nShannon: C = B * log2(1 + S/N)\nSNR_dB = 10 * log10(S/N)",
                examAngle: "Numerical problems calculating maximum bit rate or channel capacity. Trap: Forgetting to convert SNR from dB to linear ratio before applying Shannon's formula.",
                memoryAid: "Nyquist is for Noiseless (both start with N), Shannon is for Sound/Noise (both start with S)."
              }
            },
            {
              topicId: "1.3",
              topicName: "Line Coding Schemes",
              priority: "Low",
              notes: null
            }
          ]
        },
        {
          unitName: "Unit 2: Data Link Layer Control",
          topics: [
            {
              topicId: "2.1",
              topicName: "Error Detection: CRC (Cyclic Redundancy Check)",
              priority: "High",
              notes: {
                overview: "A powerful mathematical error detection mechanism that uses polynomial division to append a redundant checksum to data frames.",
                keyConcepts: [
                  "Generator Polynomial (G(x)): The divisor used in the binary modulo-2 division.",
                  "Frame Redundancy: Appending 'r' zeros to the data (where 'r' is the degree of G(x)) before dividing.",
                  "Modulo-2 Division: Binary division using exclusive OR (XOR) operations instead of subtraction.",
                  "Verification: The receiver divides the incoming frame by G(x); a remainder of zero indicates no detected error."
                ],
                formulasOrDiagrams: "Math representation:\nData D(x) shifted by r bits: D(x) * x^r\nRemainder R(x) = (D(x) * x^r) mod G(x)\nTransmitted Frame T(x) = (D(x) * x^r) + R(x)",
                examAngle: "Almost always appears as a derivation or numerical division problem. Traps: Performing standard subtraction instead of XOR in division, or forgetting to append zeros first.",
                memoryAid: "CRC is just long division where you XOR instead of subtract. No carries, no borrows!"
              }
            },
            {
              topicId: "2.2",
              topicName: "Flow Control: Sliding Window Protocols",
              priority: "Medium",
              notes: {
                overview: "Flow control techniques that allow multiple outstanding frames to be sent before receiving an acknowledgment, optimizing link utilization.",
                keyConcepts: [
                  "Stop-and-Wait: Sender transmits one frame and waits for ACK before sending the next.",
                  "Go-Back-N (GBN): Sender has a window size N. If a frame is lost, that frame and all subsequent sent frames are retransmitted.",
                  "Selective Repeat (SR): Sender retransmits ONLY the specific frame that was lost/corrupted. Requires receiver buffering.",
                  "Bandwidth-Delay Product (BDP): Key factor in determining optimal window size."
                ],
                formulasOrDiagrams: "Formulas:\nLink Efficiency (Stop-and-Wait): U = 1 / (1 + 2*a) where a = Propagation Time / Transmission Time\nGo-Back-N Window Size: W_s <= 2^m - 1\nSelective Repeat Window Size: W_s <= 2^(m-1)",
                examAngle: "Questions typically ask to compare GBN and SR protocols or calculate link utilization/efficiency. Trap: Confusing sender and receiver window sizes for GBN vs. SR.",
                memoryAid: "Go-Back-N is stubborn (forces replay of everything), Selective Repeat is precise (only fixes what's broken)."
              }
            }
          ]
        }
      ],
      roadmap: [
        {
          topicId: "1.1",
          topicName: "OSI vs TCP/IP Protocol Suites",
          sequence: 1,
          timeEstimate: "~45 mins",
          reason: "Foundational topic. Must master this layer structure before studying specific protocols."
        },
        {
          topicId: "2.1",
          topicName: "Error Detection: CRC (Cyclic Redundancy Check)",
          sequence: 2,
          timeEstimate: "~1.5 hrs",
          reason: "High-yield topic. Requires numerical practice. Essential for exam marks."
        },
        {
          topicId: "1.2",
          topicName: "Transmission Media & Nyquist/Shannon Theorems",
          sequence: 3,
          timeEstimate: "~1 hr",
          reason: "Math heavy but straightforward. Best studied after the core physical concepts are clear."
        },
        {
          topicId: "2.2",
          topicName: "Flow Control: Sliding Window Protocols",
          sequence: 4,
          timeEstimate: "~1.5 hrs",
          reason: "Secondary conceptually-heavy topic. Good to study after completing error detection."
        }
      ]
    };
  } else if (mode === "mode2") {
    return {
      papers: [
        { subject: subject, year: "2024", examType: "End-Sem" },
        { subject: subject, year: "2023", examType: "Mid-Sem" }
      ],
      repeatedTopics: [
        { topic: "Cyclic Redundancy Check (CRC)", frequency: 3, weight: "High" },
        { topic: "IP Subnetting and Masking", frequency: 2, weight: "High" },
        { topic: "Sliding Window Protocol Efficiency", frequency: 2, weight: "Medium" }
      ],
      questionTypes: [
        { type: "Numerical / Calculation", percentage: 45, details: "Solving CRC division, subnet allocation, and sliding window efficiency." },
        { type: "Differences / Comparison", percentage: 30, details: "Comparing GBN vs SR, IPv4 vs IPv6, and OSI vs TCP/IP." },
        { type: "Short Definitions", percentage: 25, details: "Defining terms like attenuation, baud rate, and flow control." }
      ],
      pyqSummaryTable: [
        { topic: "Cyclic Redundancy Check (CRC)", timesAsked: 3, totalMarks: 25, questionTypes: "Numerical, Derivation", priority: "High" },
        { topic: "IP Subnetting", timesAsked: 2, totalMarks: 20, questionTypes: "Numerical, Application", priority: "High" },
        { topic: "OSI vs TCP/IP Models", timesAsked: 2, totalMarks: 12, questionTypes: "Comparison, Long Answer", priority: "Medium" },
        { topic: "Baud Rate vs Bit Rate", timesAsked: 1, totalMarks: 5, questionTypes: "Short Answer", priority: "Low" }
      ],
      practiceQuestions: {
        shortAnswer: [
          { question: "Differentiate between Baud Rate and Bit Rate.", marks: 3, topic: "Physical Layer Fundamentals", difficulty: "Easy", hint: "Bit rate is the number of bits transmitted per second. Baud rate is the number of signal units (symbols) transmitted per second. Bit rate = Baud rate * number of bits per symbol." },
          { question: "Why is Fiber Optic cable immune to Electromagnetic Interference (EMI)?", marks: 3, topic: "Transmission Media", difficulty: "Easy", hint: "Fiber optic cables transmit data using light (photons) through silica glass, rather than electrical signals through copper, making them completely unaffected by electromagnetic fields." }
        ],
        longAnswer: [
          { question: "Explain the working of Selective Repeat Sliding Window Protocol with a neat sequence diagram.", marks: 8, topic: "Flow Control", difficulty: "Medium", hint: "Detail sender and receiver window sizes (both equal to 2^(m-1)). Show that receiver buffers out-of-order packets and sends NAK for missing packet. Draw transmission timeline showing packet drop, NAK, retransmission, and slide of window." }
        ],
        numerical: [
          { question: "A bit stream 1101011011 is transmitted using the generator polynomial x^4 + x + 1. Find the transmitted CRC frame.", marks: 7, topic: "Error Detection", difficulty: "Hard", hint: "1. Generator polynomial G(x) = x^4 + x + 1 corresponds to binary divisor 10011. 2. Degree of G(x) is 4, so append four zeros to data: 11010110110000. 3. Perform Modulo-2 division. Remainder is 1110. 4. Transmitted frame is 11010110111110." }
        ],
        diagramOrDerivation: [
          { question: "Derive the maximum link efficiency (utilization) formula for the Stop-and-Wait Flow Control Protocol.", marks: 6, topic: "Flow Control", difficulty: "Medium", hint: "1. Link utilization U = T_tx / (T_tx + 2 * T_prop). 2. Divide numerator and denominator by T_tx to get U = 1 / (1 + 2 * a), where a = T_prop / T_tx." }
        ]
      },
      predictedQuestions: [
        { question: "Given a network IP address of 192.168.1.0/24, design a subnet scheme to create 4 subnets. State the subnet masks and host IP ranges.", reason: "Subnetting was not asked in the 2024 End-Sem but appeared in 2023 Mid-Sem. It's a high-weighted topic likely to reappear in the next main exam." },
        { question: "Compare Go-Back-N and Selective Repeat sliding window protocols under high error rates.", reason: "Appeared 3 times in the last 4 semesters. Extremely conceptual topic that examiners use to test flow control limits." }
      ]
    };
  } else if (mode === "mode3") {
    return {
      crossReferenceAnalysis: "We crossed the syllabus of this course against 2 past papers. The analysis reveals that while the physical layer media topics occupy 30% of the syllabus, they only account for 8% of exam marks. Conversely, Network Layer routing and subnets represent 20% of the portion but make up over 45% of exam marks. Focus your preparation on numericals rather than text descriptions.",
      reprioritizedTopics: [
        { topicName: "Cyclic Redundancy Check Modulo-2 Division", priority: "High", examFrequency: "Asked every year", tag: "Asked Every Year" },
        { topicName: "IP Addressing & Subnet Mask Design", priority: "High", examFrequency: "Asked every year", tag: "Asked Every Year" },
        { topicName: "Distance Vector Routing & Count-to-Infinity Problem", priority: "High", examFrequency: "Asked every year", tag: "Asked Every Year" },
        { topicName: "OSI vs TCP/IP Comparison", priority: "Medium", examFrequency: "Occasionally asked", tag: "Normal" },
        { topicName: "Fiber Optic Refraction and Reflection Physics", priority: "Low", examFrequency: "Never asked", tag: "Never Asked" }
      ],
      examFocusedNotes: [
        {
          topicName: "IP Addressing & Subnet Mask Design",
          overview: "Classless Inter-Domain Routing (CIDR) uses variable-length subnet masking (VLSM) to divide IP address ranges into hierarchical blocks, denoted as IP/Prefix.",
          keyConcepts: [
            "Prefix length /N indicates N bits are reserved for network identity, leaving 32-N bits for hosts.",
            "Total IP addresses in subnet = 2^(32-N). Usable host IPs = 2^(32-N) - 2 (subtracting network address and broadcast address).",
            "Subnet Mask: Constructed by setting first N bits to 1 and remaining to 0 (e.g. /26 is 255.255.255.192)."
          ],
          examTips: "Examiners will ask you to split a block like 192.168.1.0/24 into subnets of varying sizes. Trap: Always allocate the largest subnet first to avoid overlap, and remember that host addresses cannot end with the subnet network ID or broadcast ID."
        },
        {
          topicName: "Cyclic Redundancy Check (CRC)",
          overview: "Error detection via binary polynomial division. The sender divides the padded message by a generator divisor, appends the remainder, and the receiver checks if the received message divides evenly.",
          keyConcepts: [
            "Modulo-2 division is equivalent to repeated bitwise XOR operations.",
            "Degree of divisor G(x) is the number of padding bits appended.",
            "Catches all burst errors of length equal to or less than the checksum size."
          ],
          examTips: "Do not use normal division or decimal arithmetic! Write out the binary division step-by-step. Double-check your XOR math at each level (1 XOR 1 = 0, 0 XOR 0 = 0, 1 XOR 0 = 1)."
        }
      ],
      cheatSheet: [
        {
          topicName: "Nyquist Bit Rate",
          summary: "Calculates maximum bit rate of a noiseless channel based on bandwidth and discrete signal levels.",
          keyFormulaOrConcept: "BitRate = 2 * Bandwidth * log2(L)",
          likelyQuestionType: "Simple 2-mark or 5-mark numerical calculation"
        },
        {
          topicName: "Shannon Channel Capacity",
          summary: "Finds the theoretical maximum data rate for a channel with random thermal noise.",
          keyFormulaOrConcept: "Capacity = Bandwidth * log2(1 + S/N)",
          likelyQuestionType: "Numerical. Remember: convert SNR_dB to linear ratio (S/N) first: S/N = 10^(SNR_dB/10)"
        },
        {
          topicName: "Sliding Window Efficiency",
          summary: "Defines maximum utilization of a transmission channel utilizing flow control window.",
          keyFormulaOrConcept: "U_max = W / (1 + 2*a), where a = T_prop / T_tx",
          likelyQuestionType: "Comparison question or optimization numerical"
        }
      ]
    };
  }
  return {};
}

// College Study endpoint
app.post("/api/college/analyze", (req, res, next) => {
  upload.fields([
    { name: "syllabusFiles", maxCount: 10 },
    { name: "pyqFiles", maxCount: 10 }
  ])(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ success: false, error: `Upload error: ${err.message} (Max 10 files per field)` });
      }
      return res.status(500).json({ success: false, error: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    const { mode, syllabusText: manualSyllabus, pyqText: manualPyq } = req.body;
    
    // Extract text from files
    const syllabusFilesText = await getFileText(req.files ? req.files["syllabusFiles"] : null);
    const pyqFilesText = await getFileText(req.files ? req.files["pyqFiles"] : null);
    
    const finalSyllabus = ((manualSyllabus || "") + "\n" + syllabusFilesText).trim();
    const finalPyq = ((manualPyq || "") + "\n" + pyqFilesText).trim();
    
    // Clean up uploaded files after reading
    if (req.files) {
      Object.values(req.files).forEach((fileArr) => {
        fileArr.forEach((file) => {
          fs.unlink(file.path, (err) => {
            if (err) console.error("Error deleting temp file:", file.path, err);
          });
        });
      });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    const isMock = !geminiApiKey || geminiApiKey === "YOUR_GEMINI_API_KEY_HERE" || geminiApiKey === "";

    if (isMock) {
      // Return simulated mock data if Gemini API key is missing
      const mockResult = getMockData(mode, mode === "mode2" ? finalPyq : finalSyllabus);
      return res.json({ success: true, isSimulated: true, data: mockResult });
    }

    let prompt = "";
    
    if (mode === "mode1") {
      if (!finalSyllabus) {
        return res.status(400).json({ success: false, error: "Please provide a syllabus or study material." });
      }
      prompt = `You are an academic intelligence engine built into the College Study module of Synapse.
Analyze this college syllabus/notes study material and provide a structured JSON response.

Material Text:
${finalSyllabus}

Respond with a JSON object that has this exact schema (no markdown block wrapper around the JSON, just the raw JSON text):
{
  "subjectName": "Subject Name",
  "scopeSummary": "1-line summary of the subject scope",
  "totalUnits": 3,
  "units": [
    {
      "unitName": "Unit 1: Introduction",
      "topics": [
        {
          "topicId": "1.1",
          "topicName": "Topic Name",
          "priority": "High" | "Medium" | "Low",
          "notes": {
            "overview": "2-3 sentence overview explanation in plain academic language",
            "keyConcepts": ["Concept 1 details...", "Concept 2 details...", "Concept 3 details..."],
            "formulasOrDiagrams": "Key formulas formatted clearly or textual description of diagrams",
            "examAngle": "What examiners typically ask, question framing, common traps",
            "memoryAid": "A mnemonic, analogy, or shortcut"
          }
        }
      ]
    }
  ],
  "roadmap": [
    {
      "topicId": "1.1",
      "topicName": "Topic Name",
      "sequence": 1,
      "timeEstimate": "~45 mins",
      "reason": "Why this sequence works"
    }
  ]
}`;
    } else if (mode === "mode2") {
      if (!finalPyq) {
        return res.status(400).json({ success: false, error: "Please provide at least one past paper." });
      }
      prompt = `You are an academic intelligence engine built into the College Study module of Synapse.
Analyze the following previous year question papers (up to 3 papers) and provide a structured JSON response.

PYQ Papers Text:
${finalPyq}

Respond with a JSON object that has this exact schema (no markdown block wrapper around the JSON, just the raw JSON text):
{
  "papers": [
    {
      "subject": "Subject Name",
      "year": "e.g. 2024",
      "examType": "e.g. End-Sem"
    }
  ],
  "repeatedTopics": [
    {
      "topic": "Topic Name",
      "frequency": 3,
      "weight": "High"
    }
  ],
  "questionTypes": [
    {
      "type": "Short Answer",
      "percentage": 40,
      "details": "Explanation of typical short answer questions"
    }
  ],
  "pyqSummaryTable": [
    {
      "topic": "Topic Name",
      "timesAsked": 3,
      "totalMarks": 30,
      "questionTypes": "Short Answer, Numerical",
      "priority": "High" | "Medium" | "Low"
    }
  ],
  "practiceQuestions": {
    "shortAnswer": [
      {
        "question": "Question text...",
        "marks": 5,
        "topic": "Topic Name",
        "difficulty": "Easy" | "Medium" | "Hard",
        "hint": "Hint/answer outline..."
      }
    ],
    "longAnswer": [
      {
        "question": "Question text...",
        "marks": 10,
        "topic": "Topic Name",
        "difficulty": "Medium" | "Hard",
        "hint": "Hint/answer outline..."
      }
    ],
    "numerical": [
      {
        "question": "Question text...",
        "marks": 8,
        "topic": "Topic Name",
        "difficulty": "Medium" | "Hard",
        "hint": "Hint/answer outline..."
      }
    ],
    "diagramOrDerivation": [
      {
        "question": "Question text...",
        "marks": 10,
        "topic": "Topic Name",
        "difficulty": "Hard",
        "hint": "Hint/answer outline..."
      }
    ]
  },
  "predictedQuestions": [
    {
      "question": "Question text...",
      "reason": "Why it is predicted (e.g. asked every alternate year, highly weighted)"
    }
  ]
}`;
    } else if (mode === "mode3") {
      if (!finalSyllabus || !finalPyq) {
        return res.status(400).json({ success: false, error: "Please provide both syllabus/study material AND past papers for combined analysis." });
      }
      prompt = `You are an academic intelligence engine built into the College Study module of Synapse.
Cross-reference the syllabus/portion with the previous year question papers (PYQs) provided.

Syllabus Text:
${finalSyllabus}

PYQ Papers Text:
${finalPyq}

Respond with a JSON object that has this exact schema (no markdown block wrapper around the JSON, just the raw JSON text):
{
  "crossReferenceAnalysis": "Match syllabus topics with exam frequency. State which topics appear most in exams vs which are never asked.",
  "reprioritizedTopics": [
    {
      "topicName": "Topic Name",
      "priority": "High" | "Medium" | "Low",
      "examFrequency": "Asked every year" | "Never asked" | "Rarely asked" | "Occasionally asked",
      "tag": "Never Asked" | "Asked Every Year" | "Normal"
    }
  ],
  "examFocusedNotes": [
    {
      "topicName": "Topic Name",
      "overview": "Tighter and more exam-targeted overview",
      "keyConcepts": ["Concept 1...", "Concept 2..."],
      "examTips": "Crucial exam tip/trap for this topic"
    }
  ],
  "cheatSheet": [
    {
      "topicName": "Topic Name",
      "summary": "3-line condensed summary of the topic",
      "keyFormulaOrConcept": "Key formula or concept core details",
      "likelyQuestionType": "Typical question type expected"
    }
  ]
}`;
    }

    const body = {
      contents: [{ parts: [{ text: prompt }] }]
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${geminiApiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API Error details:", errText);
      return res.status(502).json({ success: false, error: "Error communicating with Gemini AI." });
    }

    const data = await response.json();
    let replyText = data.candidates[0].content.parts[0].text;
    
    // Strip markdown code block wrapper if present
    replyText = replyText.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
    
    try {
      const parsedData = JSON.parse(replyText);
      res.json({ success: true, isSimulated: false, data: parsedData });
    } catch (parseErr) {
      console.error("Failed to parse JSON from Gemini:", replyText);
      res.status(500).json({ success: false, error: "Failed to parse a structured response from the AI. Please try again." });
    }
  } catch (error) {
    console.error("College analyze error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const port = process.env.PORT || 5000;
const server = app.listen(port, "0.0.0.0", () => {
  console.log(`Server Running On Port ${port}`);

  // Spawn Flask Chatbot Backend automatically in background
  const { spawn } = require("child_process");
  const pythonCmd = getPythonPath();
  const flaskPath = path.join(__dirname, "chatbot/app.py");

  console.log(`[Backend] Spawning Flask Chatbot server: ${pythonCmd} ${flaskPath}`);
  const flaskProcess = spawn(pythonCmd, [flaskPath], {
    cwd: path.join(__dirname, "chatbot"),
    stdio: "inherit"
  });

  flaskProcess.on("error", (err) => {
    console.error("CRITICAL: Failed to spawn Flask chatbot server process:", err);
  });

  flaskProcess.on("exit", (code, signal) => {
    console.warn(`[Backend] Flask chatbot server exited with code ${code} and signal ${signal}`);
  });

  // Ensure Flask process terminates when Node exits
  process.on("exit", () => {
    flaskProcess.kill();
  });
  process.on("SIGINT", () => {
    flaskProcess.kill();
    process.exit();
  });
  process.on("SIGTERM", () => {
    flaskProcess.kill();
    process.exit();
  });
});