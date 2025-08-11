// startup-info.js
import childProcess from "child_process";
import fs from "fs";
import os from "os";

function safeExec(cmd: string) {
  try {
    return childProcess.execSync(cmd, { encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

function readFileIfExists(file: string) {
  try {
    return fs.readFileSync(file, "utf8").trim();
  } catch {
    return null;
  }
}

function getDockerInfo() {
  const hostname = os.hostname();
  const cgroup = readFileIfExists("/proc/1/cgroup") || "";
  const inDocker = cgroup.includes("docker") || fs.existsSync("/.dockerenv");

  return {
    inDocker,
    containerId: inDocker ? hostname : null,
    dockerImage: process.env.DOCKER_IMAGE || null,
    dockerImageDigest: process.env.DOCKER_IMAGE_DIGEST || null,
    buildTimestamp: process.env.CREATED_AT || null,
    memLimit: readFileIfExists("/sys/fs/cgroup/memory/memory.limit_in_bytes"),
    cpuQuota: readFileIfExists("/sys/fs/cgroup/cpu/cpu.cfs_quota_us"),
    cpuPeriod: readFileIfExists("/sys/fs/cgroup/cpu/cpu.cfs_period_us"),
  };
}

function getAppInfo() {
  return {
    gitCommit: process.env.COMMIT_ID || safeExec("git rev-parse HEAD"),
    gitBranch: process.env.COMMIT_REF || safeExec("git rev-parse --abbrev-ref HEAD"),
  };
}

function getRuntimeInfo() {
  return {
    nodeVersion: process.version,
    packageManagerVersion: safeExec("npm --version") || safeExec("yarn --version"),
    arch: process.arch,
    platform: process.platform,
    execArgs: process.execArgv,
    pid: process.pid,
    cwd: process.cwd(),
    uptime: process.uptime(),
    ulimits: safeExec("ulimit -a"),
  };
}

function getSystemInfo() {
  return {
    osType: os.type(),
    osRelease: os.release(),
    osVersion: os.version(),
    hostname: os.hostname(),
    cpus: os.cpus().map((c) => c.model),
    cpuCount: os.cpus().length,
    totalMem: os.totalmem(),
    freeMem: os.freemem(),
    networkInterfaces: os.networkInterfaces(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    dnsConfig: readFileIfExists("/etc/resolv.conf"),
  };
}

const startTimestamp = new Date().toISOString();

export function collectApplicationInfo() {
  return {
    startTimestamp,
    timestamp: new Date().toISOString(),
    app: getAppInfo(),
    docker: getDockerInfo(),
    runtime: getRuntimeInfo(),
    system: getSystemInfo(),
  };
}
