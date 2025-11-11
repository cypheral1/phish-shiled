# 🛡️ Phishing Email Detector

An advanced, fully functional phishing email detection system with a modern web interface and powerful backend analysis engine.

## Features

✨ **Complete Solution:**
- 🎨 Modern, responsive web frontend (HTML/CSS/JavaScript)
- 🔧 Powerful backend detection engine (Python/Flask)
- 📊 Real-time analysis and risk assessment
- 🚀 No external API calls needed (all local processing)
- 📁 Support for multiple input methods (text, file upload)
- 📋 Sample email for testing
- 📥 Export analysis reports

## Detection Capabilities

The detector analyzes emails for:

1. **Urgency Keywords**: Urgent language patterns common in phishing
2. **Domain Analysis**: Typosquatting detection, lookalike domains
3. **URL Analysis**: 
   - URL shortener detection
   - IP-based URLs
   - Non-HTTPS links
   - Suspicious ports
   - Domain spoofing
4. **Attachment Analysis**: Risky file types (.exe, .bat, etc.)
5. **Content Analysis**:
   - Generic greetings
   - HTML spoofing
   - Suspicious scripts/iframes
   - Spelling/grammar errors
   - Phishing keywords and call-to-action phrases
6. **Sender Analysis**: Suspicious email patterns

## Risk Levels

- 🟢 **LOW** (0-24): Legitimate email
- 🟡 **MEDIUM** (25-49): Some suspicious elements
- 🔴 **HIGH** (50-74): Significant phishing indicators
- 🔴 **CRITICAL** (75-100): Strong phishing signs - DO NOT interact

## Installation

### Prerequisites
- Python 3.8+
- pip (Python package manager)

### Setup

1. **Clone/Enter the project directory:**
```bash
cd phish-shiled
```

2. **Create and activate virtual environment (if not already done):**
```bash
python3 -m venv myvenv
source myvenv/bin/activate  # On Windows: myvenv\Scripts\activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

## Usage

### Web Interface (Recommended)

1. **Start the web server:**
```bash
python app.py
```

2. **Open your browser:**
Navigate to `http://localhost:5000`

3. **Analyze emails:**
   - **Paste Email**: Copy and paste email content directly
   - **Upload File**: Upload .txt or .eml email files
   - **Sample**: Try a pre-built phishing example

### Command Line Interface

Analyze a single email file:
```bash
python app.py sample_email.txt
```

Example output:
```
======================================================================
From: "PayPal Support" <support@paypa1.com>
Subject: URGENT! Verify your account NOW!
Risk Level: CRITICAL
Phishing Risk Score: 92/100
----------------------------------------------------------------------
Risk Indicators:
 ⚠ Urgent language detected (6 keywords)
 ⚠ Domain mimics known brand
 ⚠ URL uses shortener: bit.ly
 ⚠ Risky attachment: verify-account.exe
 ⚠ Phishing-related keywords in subject
----------------------------------------------------------------------
Detected URLs:
 🔗 http://bit.ly/paypal-verify-now (Risk: 82/100)
----------------------------------------------------------------------
Attachments:
 📎 verify-account.exe
======================================================================
```

## API Endpoints

### POST /api/analyze
Analyze email text directly

**Request:**
```json
{
  "email_text": "From: sender@example.com\nSubject: Test\n\nEmail body..."
}
```

**Response:**
```json
{
  "success": true,
  "score": 85,
  "risk_level": "HIGH",
  "reasons": ["Urgent language detected...", "URL uses shortener..."],
  "details": {
    "headers": { "from": "...", "subject": "...", "to": "..." },
    "urls": [{ "url": "...", "score": 75, "reasons": [...] }],
    "attachments": [...],
    "content_analysis": {...}
  }
}
```

### POST /api/analyze-file
Upload and analyze an email file

**Request:**
- Form data with `file` parameter

**Response:**
- Same as `/api/analyze`

### GET /api/sample
Get a sample phishing email for testing

## Project Structure

```
phish-shiled/
├── app.py                 # Flask backend with detection engine
├── requirements.txt       # Python dependencies
├── templates/
│   └── index.html        # Web interface
├── static/
│   ├── style.css         # Styling
│   └── script.js         # Frontend logic
├── myvenv/               # Virtual environment
└── README.md             # This file
```

## How It Works

### Detection Algorithm

1. **Header Analysis**: Examines From, Subject, To fields
2. **Pattern Matching**: Looks for urgency keywords and phishing phrases
3. **URL Parsing**: Extracts and analyzes all links
4. **Domain Scoring**: Checks for typosquatting and spoofing
5. **Content Inspection**: Analyzes body for common phishing tactics
6. **Risk Aggregation**: Combines all scores into final risk assessment

### Scoring System

- Each phishing indicator adds points to a risk score (0-100)
- Score components:
  - Urgency keywords: +5 each (max 15)
  - Suspicious domains: +15-20
  - URL shorteners: +25
  - Risky attachments: +30
  - Generic greetings: +5
  - HTML spoofing: +10
  - Malicious scripts: +25
  - And more...

## Security Notes

⚠️ **Important:**
- This is a local analysis tool - no data is sent to external servers
- Use in combination with other security measures
- When in doubt, DON'T click links or download attachments
- Report suspicious emails to your IT department
- Always verify sender identity through a separate channel

## Testing

### Sample Phishing Email

Click the "Try Sample" tab to load a pre-configured phishing email:

```
From: "PayPal Support" <support@paypa1.com>
Subject: URGENT! Verify your account NOW!

Dear User,

Your PayPal account has been flagged due to unusual activity. 
Your account will be SUSPENDED if you don't verify immediately!

CLICK HERE to verify: http://bit.ly/paypal-verify-now

We also detected a login attempt from an unknown device.
Update your security information NOW!

Best regards,
PayPal Security Team

Attachment: verify-account.exe
```

**Expected Result:** Risk Score: 92/100 (CRITICAL)

## Troubleshooting

### Port Already in Use
If port 5000 is already in use, modify `app.py`:
```python
app.run(debug=False, host='0.0.0.0', port=8000)  # Change port number
```

### Dependencies Issues
```bash
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall
```

### Virtual Environment Issues
```bash
python3 -m venv myvenv --clear
source myvenv/bin/activate
pip install -r requirements.txt
```

## Future Enhancements

- 🤖 Machine Learning model integration
- 📧 IMAP integration for direct email checking
- ☁️ Cloud deployment options
- 📱 Mobile app
- 🔌 Browser extension
- 📊 Detailed analytics and statistics
- 🌐 Multi-language support

## License

MIT License - Feel free to use and modify

## Disclaimer

This tool is for educational and security awareness purposes. While it provides comprehensive phishing detection, it should not be relied upon as the sole security measure. Always use in conjunction with:
- Enterprise email filtering solutions
- User security awareness training
- Regular security updates
- Multi-factor authentication
- Email authentication protocols (SPF, DKIM, DMARC)

## Support

For issues or questions, refer to the inline code documentation or reach out to your security team.

---

**Stay Safe! 🛡️**

Phishing Shield - Advanced Email Security Detection
