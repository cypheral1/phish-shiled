// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const tabName = e.target.dataset.tab;
        
        // Remove active class from all buttons and content
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        // Add active class to clicked button and corresponding content
        e.target.classList.add('active');
        document.getElementById(tabName).classList.add('active');
    });
});

// Analyze button
document.getElementById('analyze-btn').addEventListener('click', () => {
    const emailText = document.getElementById('email-text').value.trim();
    if (!emailText) {
        alert('Please paste an email');
        return;
    }
    analyzeEmail(emailText);
});

// File upload
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const fileName = document.getElementById('file-name');

uploadArea.addEventListener('click', () => fileInput.click());

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) {
        fileInput.files = e.dataTransfer.files;
        fileName.textContent = `Selected: ${file.name}`;
        fileName.classList.add('show');
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files[0]) {
        fileName.textContent = `Selected: ${e.target.files[0].name}`;
        fileName.classList.add('show');
    }
});

document.getElementById('upload-btn').addEventListener('click', async () => {
    const file = fileInput.files[0];
    if (!file) {
        alert('Please select a file');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    showLoading();
    try {
        const response = await fetch('/api/analyze-file', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        if (data.success) {
            displayResults(data);
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        alert('Error uploading file: ' + error.message);
    }
    hideLoading();
});

// Load sample
document.getElementById('load-sample-btn').addEventListener('click', async () => {
    showLoading();
    try {
        const response = await fetch('/api/sample');
        const data = await response.json();
        if (data.success) {
            document.getElementById('email-text').value = data.email_text;
            displayResults(data.analysis);
        } else {
            alert('Error loading sample');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
    hideLoading();
});

async function analyzeEmail(emailText) {
    showLoading();
    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email_text: emailText })
        });
        const data = await response.json();
        if (data.success) {
            displayResults(data);
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        alert('Error analyzing email: ' + error.message);
    }
    hideLoading();
}

function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('results').classList.add('hidden');
}

function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
}

function displayResults(data) {
    const results = document.getElementById('results');
    const score = data.score;
    const risk_level = data.risk_level;
    const reasons = data.reasons;
    const details = data.details;

    // Set risk level
    const riskCircle = document.getElementById('risk-circle');
    const riskLevel = document.getElementById('risk-level');
    const riskValue = document.getElementById('risk-value');
    
    riskValue.textContent = score;
    riskLevel.textContent = risk_level;
    riskCircle.classList.remove('critical', 'high', 'medium', 'low');
    
    if (risk_level === 'CRITICAL') {
        riskCircle.classList.add('critical');
        riskLevel.parentElement.classList.remove('critical', 'high', 'medium', 'low');
        riskLevel.parentElement.classList.add('critical');
        document.getElementById('risk-description').textContent = 'This email shows strong signs of being a phishing attempt. Do NOT click any links or download attachments.';
    } else if (risk_level === 'HIGH') {
        riskCircle.classList.add('high');
        riskLevel.parentElement.classList.remove('critical', 'high', 'medium', 'low');
        riskLevel.parentElement.classList.add('high');
        document.getElementById('risk-description').textContent = 'This email has significant phishing indicators. Exercise caution.';
    } else if (risk_level === 'MEDIUM') {
        riskCircle.classList.add('medium');
        riskLevel.parentElement.classList.remove('critical', 'high', 'medium', 'low');
        riskLevel.parentElement.classList.add('medium');
        document.getElementById('risk-description').textContent = 'This email has some suspicious elements. Be careful.';
    } else {
        riskCircle.classList.add('low');
        riskLevel.parentElement.classList.remove('critical', 'high', 'medium', 'low');
        riskLevel.parentElement.classList.add('low');
        document.getElementById('risk-description').textContent = 'This email appears to be legitimate.';
    }

    // Headers
    const headersInfo = document.getElementById('headers-info');
    headersInfo.innerHTML = `
        <div class="info-line"><span class="info-label">From:</span> ${escapeHtml(details.headers.from)}</div>
        <div class="info-line"><span class="info-label">Subject:</span> ${escapeHtml(details.headers.subject)}</div>
        <div class="info-line"><span class="info-label">To:</span> ${escapeHtml(details.headers.to)}</div>
    `;

    // Reasons
    const reasonsList = document.getElementById('reasons-list');
    reasonsList.innerHTML = reasons.map(r => `<li>${escapeHtml(r)}</li>`).join('');

    // URLs
    const urlsBox = document.getElementById('urls-box');
    if (details.urls && details.urls.length > 0) {
        urlsBox.style.display = 'block';
        const urlsList = document.getElementById('urls-list');
        urlsList.innerHTML = details.urls.map(u => `
            <div class="url-item">
                <div class="url-text">🔗 ${escapeHtml(u.url)}</div>
                <div class="url-risk">Risk Score: ${u.score}/100</div>
                ${u.reasons.length > 0 ? `<div class="url-reasons">${u.reasons.map(r => `<div class="url-reason-item">• ${escapeHtml(r)}</div>`).join('')}</div>` : ''}
            </div>
        `).join('');
    } else {
        urlsBox.style.display = 'none';
    }

    // Attachments
    const attachmentsBox = document.getElementById('attachments-box');
    if (details.attachments && details.attachments.length > 0) {
        attachmentsBox.style.display = 'block';
        const attachmentsList = document.getElementById('attachments-list');
        attachmentsList.innerHTML = details.attachments.map(a => `<li>${escapeHtml(a)}</li>`).join('');
    } else {
        attachmentsBox.style.display = 'none';
    }

    // Analysis stats
    const stats = details.content_analysis;
    document.getElementById('analysis-stats').innerHTML = `
        <div class="stat-item">
            <div class="stat-value">${stats.urgency_keywords}</div>
            <div class="stat-label">Urgency Keywords</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${stats.link_count}</div>
            <div class="stat-label">Links Found</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${stats.attachment_count}</div>
            <div class="stat-label">Attachments</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${stats.risky_attachments}</div>
            <div class="stat-label">Risky Attachments</div>
        </div>
    `;

    // Show results
    hideLoading();
    results.classList.remove('hidden');
}

// Close results
document.getElementById('close-results').addEventListener('click', () => {
    document.getElementById('results').classList.add('hidden');
});

// Reset
document.getElementById('reset-btn').addEventListener('click', () => {
    document.getElementById('email-text').value = '';
    document.getElementById('file-input').value = '';
    document.getElementById('file-name').classList.remove('show');
    document.getElementById('results').classList.add('hidden');
    document.getElementById('text-input').classList.add('active');
    document.getElementById('email-text').focus();
});

// Export
document.getElementById('export-btn').addEventListener('click', () => {
    const score = document.getElementById('risk-value').textContent;
    const riskLevel = document.getElementById('risk-level').textContent;
    const reasons = Array.from(document.querySelectorAll('.reasons-list li')).map(li => li.textContent.trim());
    
    const report = `
Phishing Email Analysis Report
===============================
Generated: ${new Date().toLocaleString()}

RISK ASSESSMENT:
- Risk Level: ${riskLevel}
- Risk Score: ${score}/100

RISK INDICATORS:
${reasons.map(r => `- ${r}`).join('\n')}

This report was generated by Phishing Shield
No data is stored or sent to external servers.
All analysis is done locally on your device.
    `;

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(report));
    element.setAttribute('download', 'phishing-report.txt');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
});

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Focus on email input on load
window.addEventListener('load', () => {
    document.getElementById('email-text').focus();
});
