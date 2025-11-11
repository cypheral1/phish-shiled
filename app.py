#!/usr/bin/env python3
"""
Phishing Shield - Phishing Email Detector
Flask Web Application with Rule-Based Detection
"""

import re
import sys
import csv
from datetime import datetime
from bs4 import BeautifulSoup
from urllib.parse import urlparse
from flask import Flask, render_template, request, jsonify
from pathlib import Path

app = Flask(__name__, template_folder="templates", static_folder="static")

# --- Routes ---
@app.route("/hero", methods=["GET"])
def hero():
    """Render the hero/landing page."""
    return render_template("hero.html")

@app.route("/landing", methods=["GET"])
def landing():
    """Alias for hero page."""
    return render_template("hero.html")

# --- Patterns and constants ---
URGENCY = re.compile(r"(verify|urgent|suspend|reset|immediately|deadline|account locked|otp|invoice|payment|confirm|authenticate|action required|validate)", re.I)
SHORTENERS = ("bit.ly", "t.co", "tinyurl.com", "goo.gl", "is.gd", "rb.gy", "ow.ly", "buff.ly", "short.link")
COMMON_BRANDS = ["paypal.com", "google.com", "apple.com", "microsoft.com", "amazon.com", "facebook.com", "bank.com", "wellsfargo.com", "chase.com"]
RISKY_EXTS = r"\.(exe|scr|bat|js|vbs|cmd|lnk|zip|rar|7z)(?:\s|$)"

# --- Helper functions ---
def extract_urls(text):
    """Extract URLs from plain text or HTML."""
    soup = BeautifulSoup(text, "html.parser")
    urls = [a.get("href") for a in soup.find_all("a") if a.get("href")]
    urls += re.findall(r"https?://[^\s<>\"'{}|\\^`\[\]]+", text)
    return list(set(urls))

def detect_phishing(email_text):
    """Run rule-based phishing detection."""
    score = 0
    reasons = []

    # Extract headers
    from_match = re.search(r"From:\s*(.*?)(?:\n|$)", email_text, re.I)
    subject_match = re.search(r"Subject:\s*(.*?)(?:\n|$)", email_text, re.I)
    from_addr = from_match.group(1).strip() if from_match else ""
    subject = subject_match.group(1).strip() if subject_match else ""

    # --- Urgency Detection ---
    if URGENCY.search(subject):
        reasons.append("🔴 Urgent subject line detected")
        score += 10
    if URGENCY.search(email_text):
        reasons.append("🔴 Urgent language in body text")
        score += 8

    # --- Lookalike Domain Check ---
    if "@" in from_addr:
        domain = from_addr.split("@")[-1].replace(">", "").lower()
        for legit in COMMON_BRANDS:
            diff = sum(a != b for a, b in zip(domain, legit)) + abs(len(domain) - len(legit))
            if diff <= 2 and domain != legit:
                reasons.append(f"🔴 Lookalike domain detected: {domain}")
                score += 20
                break

    # --- URL Analysis ---
    urls = extract_urls(email_text)
    link_count = len(urls)
    if urls:
        max_url_score = 0
        for url in urls:
            url_score, url_reasons = analyze_url(url)
            max_url_score = max(max_url_score, url_score)
            details["urls"].append({"url": url, "score": url_score, "reasons": url_reasons})
            for reason in url_reasons[:2]:
                if reason not in reasons:
                    reasons.append(reason)
        score += min(max_url_score * 0.8, 30)
        if link_count > 5:
            reasons.append(f"Excessive links ({link_count})")
            score += 8
    
    attachments = extract_attachments(email_text)
    details["attachments"] = attachments
    risky_count = 0
    for attachment in attachments:
        if any(attachment.lower().endswith(ext) for ext in RISKY_EXTENSIONS):
            reasons.append(f"Risky attachment: {attachment}")
            score += 30
            risky_count += 1
        elif re.search(r"\.(doc|xls|pdf|ppt)[mx]?$", attachment, re.I):
            if risky_count == 0:
                reasons.append(f"Office document attachment: {attachment}")
                score += 5
    
    if re.search(r"^(Dear User|Hello User|Dear Customer|Dear Sir|Dear Madam)", email_text, re.I | re.M):
        reasons.append("Generic greeting (not personalized)")
        score += 5
    
    if re.search(r"<a\s+href=[\"'].*?[\"'].*?>.*?</a>", email_text, re.I):
        displayed = re.findall(r">([^<]+)<\/a>", email_text)
        if displayed:
            reasons.append("HTML link (potential mismatch between display and target)")
            score += 10
    
    if re.search(r"<(script|iframe|object|embed)", email_text, re.I):
        reasons.append("Suspicious HTML tags detected (script/iframe)")
        score += 25
    
    common_errors = ["recieve", "occured", "seperate", "adress", "buisness"]
    error_count = sum(1 for error in common_errors if re.search(rf"\b{error}\b", email_text, re.I))
    if error_count > 0:
        reasons.append(f"Spelling/grammar errors detected ({error_count})")
        score += min(error_count * 2, 10)
    
    if re.search(r"verify.*account|confirm.*identity|update.*information|click.*immediately|act.*now", email_text, re.I):
        if "Phishing-related keywords in subject" not in reasons:
            reasons.append("Call-to-action phrases common in phishing")
            score += 10
    
    final_score = min(score, 100)
    if final_score >= 75:
        details["risk_level"] = "CRITICAL"
    elif final_score >= 50:
        details["risk_level"] = "HIGH"
    elif final_score >= 25:
        details["risk_level"] = "MEDIUM"
    else:
        details["risk_level"] = "LOW"
    
    details["content_analysis"] = {"urgency_keywords": urgent_count, "link_count": link_count, "attachment_count": len(attachments), "risky_attachments": risky_count}
    return final_score, reasons[:15], details

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/analyze', methods=['POST'])
def analyze():
    try:
        data = request.json
        email_text = data.get('email', '')
        if not email_text.strip():
            return jsonify({'error': 'Please provide email content', 'success': False}), 400
        score, reasons, details = detect_phishing(email_text)
        return jsonify({'success': True, 'score': score, 'risk_level': details['risk_level'], 'reasons': reasons, 'details': details, 'timestamp': datetime.now().isoformat()})
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

@app.route('/api/analyze-file', methods=['POST'])
def analyze_file():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided', 'success': False}), 400
        file = request.files['file']
        email_text = file.read().decode('utf-8', errors='ignore')
        if not email_text.strip():
            return jsonify({'error': 'File is empty', 'success': False}), 400
        score, reasons, details = detect_phishing(email_text)
        return jsonify({'success': True, 'score': score, 'risk_level': details['risk_level'], 'reasons': reasons, 'details': details, 'filename': file.filename, 'timestamp': datetime.now().isoformat()})
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

@app.route('/api/sample', methods=['GET'])
def get_sample():
    sample = """From: "PayPal Support" <support@paypa1.com>
Subject: URGENT! Verify your account NOW!

Dear User,

Your PayPal account has been flagged due to unusual activity. 
Your account will be SUSPENDED if you don't verify immediately!

CLICK HERE to verify: http://bit.ly/paypal-verify-now

We also detected a login attempt from an unknown device.
Update your security information NOW!

Best regards,
PayPal Security Team

Attachment: verify-account.exe"""
    score, reasons, details = detect_phishing(sample)
    return jsonify({'success': True, 'email_text': sample, 'analysis': {'score': score, 'risk_level': details['risk_level'], 'reasons': reasons, 'details': details}})

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] in ['--web', '-w']:
        app.run(debug=False, host='0.0.0.0', port=5000)
    elif len(sys.argv) > 1:
        path = sys.argv[1]
        try:
            parsed = urlparse(u)
            host = parsed.netloc.lower()
        except:
            continue
        
        url_risk = 0
        url_issues = []
        
        if any(s in host for s in SHORTENERS):
            url_issues.append("shortened")
            url_risk += 12
        if re.match(r"^\d{1,3}(\.\d{1,3}){3}$", host):
            url_issues.append("IP-based")
            url_risk += 12
        if u.startswith("http://"):
            url_issues.append("non-HTTPS")
            url_risk += 8
        
        if url_risk > 0:
            suspicious_urls.append({"url": u, "issues": url_issues, "risk": url_risk})
            reasons.append(f"⚠️ Suspicious link: {host} ({', '.join(url_issues)})")
            score += url_risk

    # --- Risky Attachments ---
    if re.search(r"Attachment:\s*.*" + RISKY_EXTS, email_text, re.I):
        reasons.append("🔴 Risky attachment detected")
        score += 25

    # --- Generic greetings (phishing indicator) ---
    if re.search(r"(dear user|dear customer|hello|dear valued)", email_text, re.I) and not re.search(r"dear\s+[a-z]+@", email_text, re.I):
        reasons.append("⚠️ Generic greeting (no personalization)")
        score += 5

    # --- Spelling/grammar issues ---
    misspellings = re.findall(r"\b(asap|pls|ur|u\b|b4|teh|recieve|occured)\b", email_text, re.I)
    if misspellings:
        reasons.append(f"⚠️ Possible misspellings detected")
        score += 3

    # --- Finalize ---
    risk_level = "SAFE"
    if score >= 70:
        risk_level = "CRITICAL"
    elif score >= 50:
        risk_level = "HIGH"
    elif score >= 30:
        risk_level = "MEDIUM"
    elif score >= 10:
        risk_level = "LOW"
    
    score = min(100, score)
    return {
        "score": score,
        "risk_level": risk_level,
        "reasons": reasons,
        "urls": urls,
        "suspicious_urls": suspicious_urls,
        "from": from_addr,
        "subject": subject,
        "timestamp": datetime.now().isoformat()
    }

# --- CSV logging ---
def log_analysis(result):
    """Log analysis to CSV."""
    csv_file = Path("flagged.csv")
    file_exists = csv_file.exists()
    
    with open(csv_file, "a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        if not file_exists:
            writer.writerow(["Timestamp", "From", "Subject", "Risk Score", "Risk Level", "Reasons"])
        writer.writerow([
            result["timestamp"],
            result["from"],
            result["subject"],
            result["score"],
            result["risk_level"],
            "; ".join(result["reasons"])
        ])

# --- Flask Routes ---
@app.route("/")
def index():
    """Serve the main page."""
    return render_template("index.html")

@app.route("/api/analyze", methods=["POST"])
def analyze():
    """Analyze email text and return phishing detection results."""
    data = request.get_json()
    email_text = data.get("email", "").strip()
    
    if not email_text:
        return jsonify({"error": "No email provided"}), 400
    
    result = detect_phishing(email_text)
    log_analysis(result)
    
    return jsonify(result)

@app.route("/api/analyze-file", methods=["POST"])
def analyze_file():
    """Analyze uploaded email file."""
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400
    
    try:
        email_text = file.read().decode("utf-8", errors="ignore")
        result = detect_phishing(email_text)
        log_analysis(result)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- CLI Support ---
if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--cli":
        # CLI mode for file analysis
        if len(sys.argv) < 3:
            print("Usage: python app.py --cli <email_file>")
            sys.exit(1)
        
        try:
            with open(sys.argv[2], "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()
            result = detect_phishing(text)
            print(f"Risk Score: {result['score']}/100")
            print(f"Risk Level: {result['risk_level']}")
            print(f"\nFrom: {result['from']}")
            print(f"Subject: {result['subject']}")
            print(f"\nReasons:")
            for reason in result['reasons']:
                print(f"  {reason}")
            if result['suspicious_urls']:
                print(f"\nSuspicious URLs:")
                for url_obj in result['suspicious_urls']:
                    print(f"  - {url_obj['url']}")
        except FileNotFoundError:
            print(f"File not found: {sys.argv[2]}")
            sys.exit(1)
    else:
        # Web server mode
        app.run(debug=True, host="0.0.0.0", port=5000)
