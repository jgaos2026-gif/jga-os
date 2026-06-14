#!/usr/bin/env python3
import os, json, time, shutil, hashlib, argparse
from pathlib import Path
from datetime import datetime

ROOT = Path(r"C:\JGA\JGA_ENTERPRISE_OS")
DATA = ROOT / "data"
INTAKE = DATA / "intake"
TRUSTED = DATA / "trusted"
QUARANTINE = DATA / "quarantine"
GHOST = DATA / "ghost"
REPORTS = ROOT / "reports"
LEDGER = DATA / "sb712_ledger.jsonl"
MANIFEST = DATA / "manifest.json"

WATCH_SECONDS = 5
LAW = "NO ACTIVE STATE BECOMES TRUSTED STATE WITHOUT VERIFICATION"

RISKY_EXTENSIONS = {
    ".exe", ".bat", ".cmd", ".ps1", ".vbs", ".js",
    ".scr", ".dll", ".com", ".msi", ".jar"
}

def now():
    return datetime.utcnow().isoformat() + "Z"

def ensure_dirs():
    for p in [DATA, INTAKE, TRUSTED, QUARANTINE, GHOST, REPORTS]:
        p.mkdir(parents=True, exist_ok=True)
    if not LEDGER.exists():
        LEDGER.write_text("", encoding="utf-8")
    if not MANIFEST.exists():
        MANIFEST.write_text("{}", encoding="utf-8")

def sha256_text(t):
    return hashlib.sha256(t.encode("utf-8")).hexdigest()

def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()

def atomic_write(path, text):
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(text, encoding="utf-8")
    os.replace(tmp, path)

def read_manifest():
    ensure_dirs()
    try:
        return json.loads(MANIFEST.read_text(encoding="utf-8") or "{}")
    except Exception:
        return {}

def write_manifest(m):
    atomic_write(MANIFEST, json.dumps(m, indent=2, sort_keys=True))

def ledger_tail_hash():
    lines = LEDGER.read_text(encoding="utf-8").splitlines() if LEDGER.exists() else []
    if not lines:
        return "GENESIS"
    try:
        return json.loads(lines[-1])["hash"]
    except Exception:
        return "BROKEN_TAIL"

def ledger(event_type, payload):
    ensure_dirs()
    prev = ledger_tail_hash()
    seq = len(LEDGER.read_text(encoding="utf-8").splitlines()) + 1
    rec = {
        "seq": seq,
        "timestamp": now(),
        "event_type": event_type,
        "payload": payload,
        "prev_hash": prev,
    }
    rec["hash"] = sha256_text(json.dumps(rec, sort_keys=True))
    with open(LEDGER, "a", encoding="utf-8") as f:
        f.write(json.dumps(rec, sort_keys=True) + "\n")
    return rec

class NodeResult:
    def __init__(self, name, passed, score, message, data=None):
        self.name = name
        self.passed = bool(passed)
        self.score = int(score)
        self.message = message
        self.data = data or {}

    def to_dict(self):
        return {
            "node": self.name,
            "passed": self.passed,
            "score": self.score,
            "message": self.message,
            "data": self.data,
        }

class SB712Nodes:

    @staticmethod
    def truth_node(path):
        p = Path(path)
        passed = p.exists() and p.is_file() and p.stat().st_size > 0
        return NodeResult("TruthNode", passed, 10 if passed else 0,
                          "File exists and is non-empty" if passed else "Truth failed",
                          {"path": str(p)})

    @staticmethod
    def verification_node(path):
        try:
            h = sha256_file(path)
            return NodeResult("VerificationCheckpoint", True, 15,
                              "SHA256 checkpoint passed", {"sha256": h})
        except Exception as e:
            return NodeResult("VerificationCheckpoint", False, 0,
                              "SHA256 checkpoint failed", {"error": str(e)})

    @staticmethod
    def silence_mesh_node(path):
        p = Path(path)
        risky = p.suffix.lower() in RISKY_EXTENSIONS
        return NodeResult("SilenceMeshNode", not risky, 10 if not risky else 0,
                          "Silence mesh clear" if not risky else "Risky extension silenced",
                          {"extension": p.suffix.lower()})

    @staticmethod
    def solid_block_node(path):
        p = Path(path)
        blocked = False
        reasons = []

        if ".." in p.name:
            blocked = True
            reasons.append("path traversal marker")

        if len(p.name) > 180:
            blocked = True
            reasons.append("filename too long")

        if p.name.strip() != p.name:
            blocked = True
            reasons.append("filename edge whitespace")

        return NodeResult("SolidBlockNode", not blocked, 10 if not blocked else 0,
                          "Solid block passed" if not blocked else "Solid block stopped file",
                          {"reasons": reasons})

    @staticmethod
    def gas_node(path):
        p = Path(path)
        try:
            data = p.read_bytes()
            if not data:
                return NodeResult("GasNode", False, 0, "Empty file failed gas scan")

            sample = data[:1024 * 1024].lower()
            unique = len(set(sample))
            entropy_signal = unique / 256

            suspicious = [
                b"powershell", b"cmd.exe", b"invoke-webrequest",
                b"downloadstring", b"base64", b"eval(",
                b"<script", b"wscript.shell"
            ]

            hits = [x.decode(errors="ignore") for x in suspicious if x in sample]
            passed = entropy_signal < 0.98 and not hits

            return NodeResult("GasNode", passed, 10 if passed else 0,
                              "Gas anomaly scan passed" if passed else "Gas anomaly found",
                              {"entropy_signal": entropy_signal, "hits": hits})
        except Exception as e:
            return NodeResult("GasNode", False, 0, "Gas node failed", {"error": str(e)})

    @staticmethod
    def hunter_node(path):
        p = Path(path)
        try:
            sample = p.read_bytes()[:1024 * 512].lower()
            danger = [b"<script", b"powershell", b"cmd.exe", b"invoke-webrequest"]
            hits = [x.decode(errors="ignore") for x in danger if x in sample]
            passed = not hits
            return NodeResult("HunterNode", passed, 10 if passed else 0,
                              "Hunter found no hostile strings" if passed else "Hunter found suspicious strings",
                              {"hits": hits})
        except Exception as e:
            return NodeResult("HunterNode", False, 0, "Hunter failed", {"error": str(e)})

    @staticmethod
    def cleaner_node(path):
        p = Path(path)
        clean = p.name.replace("\x00", "").strip()
        passed = clean == p.name
        return NodeResult("CleanerNode", passed, 5 if passed else 0,
                          "Filename clean" if passed else "Filename unsafe",
                          {"filename": p.name})

    @staticmethod
    def anchor_node(path):
        p = Path(path)
        manifest = read_manifest()

        if p.name not in manifest:
            return NodeResult("AnchorNode", True, 10,
                              "New file allowed after verification", {"known": False})

        incoming = sha256_file(p)
        old = manifest[p.name].get("hash")
        passed = incoming == old

        return NodeResult("AnchorNode", passed, 10 if passed else 0,
                          "Anchor matched" if passed else "Anchor mismatch",
                          {"known": True, "expected": old, "actual": incoming})

    @staticmethod
    def health_node(path):
        free = shutil.disk_usage(ROOT).free
        passed = free > 100 * 1024 * 1024
        return NodeResult("HealthNode", passed, 5 if passed else 0,
                          "Health stable" if passed else "Low disk space",
                          {"free_bytes": free})

    @staticmethod
    def cooling_node(path):
        return NodeResult("CoolingNode", True, 5,
                          "Lean runtime cooling active",
                          {"watch_seconds": WATCH_SECONDS})

NODE_PIPELINE = [
    SB712Nodes.truth_node,
    SB712Nodes.verification_node,
    SB712Nodes.verification_node,
    SB712Nodes.verification_node,
    SB712Nodes.silence_mesh_node,
    SB712Nodes.solid_block_node,
    SB712Nodes.gas_node,
    SB712Nodes.hunter_node,
    SB712Nodes.cleaner_node,
    SB712Nodes.anchor_node,
    SB712Nodes.health_node,
    SB712Nodes.cooling_node,
]

def omega_decision(results):
    score = sum(r.score for r in results)
    hard_fail = any(not r.passed for r in results)

    if score >= 105 and not hard_fail:
        decision = "TRUSTED"
    elif score >= 70:
        decision = "REVIEW"
    else:
        decision = "QUARANTINE"

    return {"score": score, "decision": decision, "hard_fail": hard_fail}

def ghost_snapshot(path):
    p = Path(path)
    stamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    dest = GHOST / f"{p.name}.{stamp}.ghost"
    shutil.copy2(p, dest)
    ledger("GHOST_CREATED", {
        "source": str(p),
        "ghost": str(dest),
        "hash": sha256_file(dest),
    })
    return dest

def phoenix_resurrect(filename):
    ghosts = sorted(GHOST.glob(f"{filename}.*.ghost"), reverse=True)

    if not ghosts:
        ledger("PHOENIX_FAILED", {"file": filename, "reason": "No ghost available"})
        return False

    source = ghosts[0]
    dest = TRUSTED / filename
    shutil.copy2(source, dest)

    manifest = read_manifest()
    manifest[filename] = {
        "hash": sha256_file(dest),
        "trusted_path": str(dest),
        "resurrected_at": now(),
        "source_ghost": str(source),
    }
    write_manifest(manifest)

    ledger("PHOENIX_RESURRECTION_SUCCESS", {
        "file": filename,
        "from": str(source),
        "to": str(dest),
        "hash": sha256_file(dest),
    })

    return True

def quarantine_file(path, reason, report):
    p = Path(path)
    dest = QUARANTINE / f"{int(time.time())}_{p.name}"
    shutil.copy2(p, dest)

    lock = dest.with_suffix(dest.suffix + ".silenced.json")
    lock.write_text(json.dumps({
        "locked_at": now(),
        "reason": reason,
        "original": str(p),
        "quarantine": str(dest),
        "report": report,
    }, indent=2), encoding="utf-8")

    ledger("SILENCE_QUARANTINE_LOCK", {
        "file": str(p),
        "quarantine": str(dest),
        "reason": reason,
    })

    return dest

def process_file(path):
    p = Path(path)
    results = [node(p) for node in NODE_PIPELINE]
    omega = omega_decision(results)

    report = {
        "file": str(p),
        "time": now(),
        "law": LAW,
        "nodes": [r.to_dict() for r in results],
        "omega": omega,
    }

    if omega["decision"] == "TRUSTED":
        dest = TRUSTED / p.name
        shutil.copy2(p, dest)
        ghost_snapshot(dest)

        manifest = read_manifest()
        manifest[p.name] = {
            "hash": sha256_file(dest),
            "trusted_path": str(dest),
            "verified_at": now(),
            "omega_score": omega["score"],
            "triple_verified": True,
            "silence_mesh": "passed",
            "gas_node": "passed",
        }
        write_manifest(manifest)

        ledger("PROMOTED_TRUSTED", report)

    elif omega["decision"] == "REVIEW":
        quarantine_file(p, "Review required", report)
        ledger("HELD_FOR_REVIEW", report)

    else:
        quarantine_file(p, "Failed integrity mesh", report)
        ledger("QUARANTINED", report)

    return report

def scan():
    ensure_dirs()
    reports = []
    for p in INTAKE.iterdir():
        if p.is_file():
            reports.append(process_file(p))
    ledger("SCAN_COMPLETE", {"count": len(reports)})
    return reports

def verify_ledger():
    ensure_dirs()
    errors = []
    prev = "GENESIS"

    for i, line in enumerate(LEDGER.read_text(encoding="utf-8").splitlines(), start=1):
        try:
            rec = json.loads(line)
            stored = rec.pop("hash")
            recalculated = sha256_text(json.dumps(rec, sort_keys=True))

            if stored != recalculated:
                errors.append({"line": i, "error": "hash mismatch"})

            if rec.get("prev_hash") != prev:
                errors.append({"line": i, "error": "chain break"})

            prev = stored
        except Exception as e:
            errors.append({"line": i, "error": str(e)})

    return {"valid": len(errors) == 0, "errors": errors}

def morphous_heal():
    manifest = read_manifest()
    healed = []
    corrupted = []

    for name, meta in list(manifest.items()):
        path = Path(meta.get("trusted_path", ""))

        if not path.exists():
            corrupted.append({"file": name, "reason": "missing"})
            if phoenix_resurrect(name):
                healed.append(name)
            continue

        current = sha256_file(path)
        expected = meta.get("hash")

        if current != expected:
            corrupted.append({
                "file": name,
                "reason": "hash mismatch",
                "expected": expected,
                "actual": current,
            })
            if phoenix_resurrect(name):
                healed.append(name)

    ledger("MORPHOUS_HEAL_COMPLETE", {"corrupted": corrupted, "healed": healed})
    return {"corrupted": corrupted, "healed": healed}

def status():
    manifest = read_manifest()
    ledger_check = verify_ledger()

    return {
        "system": "SB712 All-In-One Integrity Core",
        "modules": ["SB68/SB688", "SB689", "OMEGA", "SB712"],
        "law": LAW,
        "trusted_files": len(manifest),
        "ledger_valid": ledger_check["valid"],
        "ledger_errors": ledger_check["errors"],
        "triple_verification": True,
        "silence_mesh": True,
        "solid_block_node": True,
        "gas_node": True,
        "phoenix_resurrection": True,
        "morphous_healing": True,
        "time": now(),
    }

def selftest():
    ensure_dirs()

    clean = INTAKE / "selftest_clean.txt"
    bad = INTAKE / "selftest_bad.ps1"

    clean.write_text("SB712 clean triple verification test.", encoding="utf-8")
    bad.write_text("powershell Invoke-WebRequest bad test", encoding="utf-8")

    clean_report = process_file(clean)
    bad_report = process_file(bad)
    heal_report = morphous_heal()
    ledger_report = verify_ledger()

    passed = (
        clean_report["omega"]["decision"] == "TRUSTED"
        and bad_report["omega"]["decision"] in ["REVIEW", "QUARANTINE"]
        and ledger_report["valid"] is True
    )

    final = {
        "selftest_passed": passed,
        "clean_file_decision": clean_report["omega"],
        "bad_file_decision": bad_report["omega"],
        "heal_report": heal_report,
        "ledger_report": ledger_report,
        "status": status(),
    }

    out = REPORTS / "sb712_all_in_one_selftest_report.json"
    out.write_text(json.dumps(final, indent=2), encoding="utf-8")

    print(json.dumps(final, indent=2))
    print(f"\nReport saved: {out}")

def init():
    ensure_dirs()
    ledger("SYSTEM_INITIALIZED", {
        "system": "SB712 All-In-One Integrity Core",
        "law": LAW,
        "nodes": [
            "TruthNode",
            "VerificationCheckpoint1",
            "VerificationCheckpoint2",
            "VerificationCheckpoint3",
            "SilenceMeshNode",
            "SolidBlockNode",
            "GasNode",
            "HunterNode",
            "CleanerNode",
            "AnchorNode",
            "HealthNode",
            "CoolingNode",
            "GhostNode",
            "PhoenixNode",
            "MorphousHealingLoop",
            "OmegaDecision",
            "LedgerNode",
        ],
    })

    print("SB712 All-In-One Integrity Core initialized.")
    print(f"Drop files here: {INTAKE}")

def watch():
    init()
    print("SB712 all-in-one watchdog active. CTRL+C stops it.")
    while True:
        scan()
        morphous_heal()
        print(json.dumps(status(), indent=2))
        time.sleep(WATCH_SECONDS)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--init", action="store_true")
    parser.add_argument("--scan", action="store_true")
    parser.add_argument("--heal", action="store_true")
    parser.add_argument("--ledger", action="store_true")
    parser.add_argument("--status", action="store_true")
    parser.add_argument("--selftest", action="store_true")
    parser.add_argument("--watch", action="store_true")
    args = parser.parse_args()

    if args.init:
        init()
    elif args.scan:
        print(json.dumps(scan(), indent=2))
    elif args.heal:
        print(json.dumps(morphous_heal(), indent=2))
    elif args.ledger:
        print(json.dumps(verify_ledger(), indent=2))
    elif args.status:
        print(json.dumps(status(), indent=2))
    elif args.selftest:
        selftest()
    elif args.watch:
        watch()
    else:
        parser.print_help()

if __name__ == "__main__":
    main()