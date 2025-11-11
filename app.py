#!/usr/bin/env python3
import re, sys, os
from flask import Flask, render_template, request, jsonify
from bs4 import BeautifulSoup
from urllib.parse import urlparse
import tldextract
from datetime import datetime

app = Flask(__name__, template_folder='templates', static_folder='static')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

URGENCY_KEYWORDS = re.compile(r"(verify|urgent|suspend|reset|immediately|deadline|account\s+locked|otp|invoice|payment|confirm|validation|action\s+required|alert|warning|threat|fraud|unauthorized|click here)", re.I)
SUSPICIOUS_DOMAINS = re.compile(r"(paypa|amaz0n|goog1e|micros0ft|appl3|faceb00k|bankk|secure-login|verify-account)", re.I)
SHORTENERS = ("bit.ly", "t.co", "tinyurl.com", "goo.gl", "is.gd", "rb.gy", "ow.ly", "short.link")
RISKY_EXTENSIONS = ('.exe', '.zip', '.rar', '.bat', '.cmd', '.com', '.scr', '.vbs', '.js', '.jar', '.msi')
PHISHING_KEYWORDS = re.compile(r"(click here|confirm identity|update payment|verify account|unusual activity|suspicious activity|disabled account|limited time|act now|authenticate now)", re.I)

def extract_urls(text):
    try:
        soup = BeautifulSoup(text, "html.parser")
        urls = [a.get("href") for a in soup.find_all("a") if a.get("href")]
        urls += re.findall(r"https?://[^\s<>\"'{}|\\^`\[\]]*", text)
        return list(set(filter(None, urls)))
    except:
        return []

def extract_attachments(text):
    pattern = r"(?:attachment|attached|file|filename)[:\s]+([^\n]+)"
    matches = re.findall(pattern, text, re.IGNORECASE)
    return [m.strip() for m in matches]

def analyze_domain(domain):
    score, reasons = 0, []
    try:
        extracted = tldextract.extract(domain)
        domain_name = extracted.domain
        if re.search(r"[0-1][oO]", domain_name):
            reasons.append("Possible typosquatting (0/1/O confusion)")
            score += 15
        if SUSPICIOUS_DOMAINS.search(domain_name):
            reasons.append("Domain mimics known brand")
            score += 20
        if domain_name.count("-") > 2:
            reasons.append("Multiple hyphens in domain")
            score += 10
    except:
        pass
    return score, reasons

def analyze_url(url):
    score, reasons = 0, []
    try:
        for shortener in SHORTENERS:
            if shortener in url.lower():
                reasons.append(f"URL uses shortener: {shortener}")
                score += 25
                break
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        if not domain:
            reasons.append("Invalid URL format")
            return 30, reasons
        domain_score, domain_reasons = analyze_domain(domain)
        score += domain_score
        reasons.extend(domain_reasons)
        if parsed.port and parsed.port not in (80, 443):
            reasons.append(f"Non-standard port: {parsed.port}")
            score += 10
        if re.match(r"\d+\.\d+\.\d+\.\d+", domain):
            reasons.append("URL uses IP address instead of domain")
            score += 30
        if parsed.scheme == "http":
            reasons.append("Non-HTTPS URL (no encryption)")
            score += 15
        if domain.count(".") > 3:
            reasons.append("Too many subdomains")
            score += 10
    except Exception as e:
        score += 10
        reasons.append("URL parsing error")
    return min(score, 100), reasons

def detect_phishing(email_text):
    score = 0
    reasons = []
    details = {"headers": {}, "urls": [], "attachments": [], "content_analysis": {}, "risk_level": "LOW"}

    from_match = re.search(r"From:\s*([^\n]+)", email_text, re.I)
    subject_match = re.search(r"Subject:\s*([^\n]+)", email_text, re.I)
    to_match = re.search(r"To:\s*([^\n]+)", email_text, re.I)
    
    from_addr = from_match.group(1).strip() if from_match else ""
    subject = subject_match.group(1).strip() if subject_match else ""
    to_addr = to_match.group(1).strip() if to_match else ""
    
    details["headers"] = {"from": from_addr, "subject": subject, "to": to_addr}

    urgent_count = len(re.findall(URGENCY_KEYWORDS, email_text))
    if urgent_count > 0:
        reasons.append(f"Urgent language detected ({urgent_count} keywords)")
        score += min(urgent_count * 5, 15)
    
    if subject:
        if len(subject) < 5:
            reasons.append("Suspiciously short subject")
            score += 5
        if re.search(r"[!]{3,}", subject):
            reasons.append("Excessive exclamation marks in subject")
            score += 8
        if PHISHING_KEYWORDS.search(subject):
            reasons.append("Phishing-related keywords in subject")
            score += 12

    if from_addr and "@" in from_addr:
        from_domain = from_addr.split("@")[-1].strip(">").lower()
        domain_score, domain_reasons = analyze_domain(from_domain)
        score += min(domain_score, 25)
        reasons.extend(domain_reasons)
        if re.search(r"noreply|no-reply|auto|notification", from_addr, re.I):
            reasons.append("Auto-generated or system address")
            score += 5
    
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
        email_text = data.get('email_text', '')
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
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()
        except FileNotFoundError:
            print(f"File not found: {path}")
            sys.exit(1)
        score, reasons, details = detect_phishing(text)
        print("=" * 70)
        print(f"From: {details['headers']['from']}")
        print(f"Subject: {details['headers']['subject']}")
        print(f"Risk Level: {details['risk_level']}")
        print(f"Phishing Risk Score: {score}/100")
        print("-" * 70)
        print("Risk Indicators:")
        for r in reasons:
            print(f" ⚠ {r}")
        if details["urls"]:
            print("-" * 70)
            print("Detected URLs:")
            for url_obj in details["urls"]:
                print(f" 🔗 {url_obj['url']} (Risk: {url_obj['score']}/100)")
        if details["attachments"]:
            print("-" * 70)
            print("Attachments:")
            for att in details["attachments"]:
                print(f" 📎 {att}")
        print("=" * 70)
    else:
        print("Starting Phishing Detector Web Server...")
        print("Open your browser to: http://localhost:5000")
        app.run(debug=False, host='0.0.0.0', port=5000)
