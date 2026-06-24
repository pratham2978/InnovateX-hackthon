const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("[Postinstall] Starting Python dependency verification/installation...");

const venvPath = path.join(__dirname, "venv");
const dotVenvPath = path.join(__dirname, ".venv");
const reqPath = fs.existsSync(path.join(__dirname, "requirements.txt"))
  ? path.join(__dirname, "requirements.txt")
  : path.join(__dirname, "../requirements.txt");

console.log(`[Postinstall] Using requirements file: ${reqPath}`);

let pipCmd = "";
let useBreakSystemPackages = false;

if (process.platform === "win32") {
  if (fs.existsSync(path.join(venvPath, "Scripts", "pip.exe"))) {
    pipCmd = `"${path.join(venvPath, "Scripts", "pip.exe")}"`;
  } else if (fs.existsSync(path.join(dotVenvPath, "Scripts", "pip.exe"))) {
    pipCmd = `"${path.join(dotVenvPath, "Scripts", "pip.exe")}"`;
  } else {
    pipCmd = "pip";
  }
} else {
  // Linux / macOS (e.g. Render)
  if (fs.existsSync(path.join(venvPath, "bin", "pip"))) {
    pipCmd = `"${path.join(venvPath, "bin", "pip")}"`;
  } else if (fs.existsSync(path.join(dotVenvPath, "bin", "pip"))) {
    pipCmd = `"${path.join(dotVenvPath, "bin", "pip")}"`;
  } else {
    pipCmd = "pip3";
    useBreakSystemPackages = true; // Use system pip on Render, needs PEP 668 bypass
  }
}

const installFlags = useBreakSystemPackages ? "--break-system-packages" : "";
console.log(`[Postinstall] Installing packages via: ${pipCmd} install ${installFlags} -r "${reqPath}"`);

try {
  execSync(`${pipCmd} install ${installFlags} -r "${reqPath}"`, { stdio: "inherit" });
  console.log("[Postinstall] Python dependencies installed successfully.");
} catch (err) {
  console.warn("[Postinstall] Primary installation failed. Retrying with --user --break-system-packages...");
  try {
    execSync(`${pipCmd} install --user --break-system-packages -r "${reqPath}"`, { stdio: "inherit" });
    console.log("[Postinstall] Python dependencies installed successfully (with user/break system packages flags).");
  } catch (fallbackErr) {
    console.error("[Postinstall] All attempts to install Python dependencies failed:", fallbackErr.message);
  }
}

