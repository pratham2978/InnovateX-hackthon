const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const venvPath = path.join(__dirname, "venv");
const dotVenvPath = path.join(__dirname, ".venv");

let pipCmd = "";

if (process.platform === "win32") {
  if (fs.existsSync(path.join(venvPath, "Scripts", "pip.exe"))) {
    pipCmd = `"${path.join(venvPath, "Scripts", "pip.exe")}"`;
  } else if (fs.existsSync(path.join(dotVenvPath, "Scripts", "pip.exe"))) {
    pipCmd = `"${path.join(dotVenvPath, "Scripts", "pip.exe")}"`;
  } else {
    pipCmd = "pip";
  }
} else {
  if (fs.existsSync(path.join(venvPath, "bin", "pip"))) {
    pipCmd = `"${path.join(venvPath, "bin", "pip")}"`;
  } else if (fs.existsSync(path.join(dotVenvPath, "bin", "pip"))) {
    pipCmd = `"${path.join(dotVenvPath, "bin", "pip")}"`;
  } else {
    pipCmd = "pip3";
  }
}

console.log(`[Postinstall] Installing Python dependencies using: ${pipCmd}`);
try {
  execSync(`${pipCmd} install -r ../requirements.txt`, { stdio: "inherit" });
} catch (err) {
  console.warn("[Postinstall] Failed to install dependencies via primary pip command. Retrying with fallback...");
  try {
    const fallback = process.platform === "win32" ? "pip" : "pip3";
    execSync(`${fallback} install -r ../requirements.txt`, { stdio: "inherit" });
  } catch (fallbackErr) {
    console.error("[Postinstall] All pip installation attempts failed. Chatbot and resume analyzer might not work.");
  }
}
