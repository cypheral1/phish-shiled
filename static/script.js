/**
 * PhishShield - Professional Email Analysis System
 */

class PhishAnalyzer {
    constructor() {
        this.setupElements();
        this.setupEventListeners();
        this.initializeUI();
    }

    setupElements() {
        // Tab toggles
        this.tabToggles = document.querySelectorAll('.tab-toggle');
        this.textModeBtn = document.querySelector('[data-tab="text-mode"]');
        this.fileModeBtn = document.querySelector('[data-tab="file-mode"]');
        this.sampleModeBtn = document.querySelector('[data-tab="sample-mode"]');

        // Input elements
        this.emailTextarea = document.getElementById('email-text');
        this.fileInput = document.getElementById('file-input');
        this.uploadArea = document.getElementById('upload-area');
        this.fileName = document.getElementById('file-name');

        // Buttons
        this.analyzeBtn = document.getElementById('analyze-btn');
        this.uploadBtn = document.getElementById('upload-btn');
        this.loadSampleBtn = document.getElementById('load-sample-btn');
        this.exportBtn = document.getElementById('export-btn');
        this.analyzeAgainBtn = document.getElementById('analyze-again-btn');

        // Output states
        this.emptyState = document.getElementById('empty-state');
        this.loadingState = document.getElementById('loading');
        this.resultsState = document.getElementById('results');

        this.currentFile = null;
        this.lastAnalysis = null;
    }

    setupEventListeners() {
        // Tab switching
        this.tabToggles.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchMode(tabName);
            });
        });

        // Analyze buttons
        if (this.analyzeBtn) this.analyzeBtn.addEventListener('click', () => this.analyzeText());
        if (this.uploadBtn) this.uploadBtn.addEventListener('click', () => this.analyzeFile());
        if (this.loadSampleBtn) this.loadSampleBtn.addEventListener('click', () => this.loadSample());

        // File upload
        if (this.fileInput) this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        if (this.uploadArea) {
            this.uploadArea.addEventListener('click', () => this.fileInput?.click());
            this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
            this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        }

        // Results actions
        if (this.exportBtn) this.exportBtn.addEventListener('click', () => this.exportResults());
        if (this.analyzeAgainBtn) this.analyzeAgainBtn.addEventListener('click', () => this.resetUI());

        // Keyboard shortcut
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                this.analyzeText();
            }
        });
    }

    initializeUI() {
        this.showEmptyState();
    }

    switchMode(mode) {
        // Hide all modes
        document.querySelectorAll('.input-mode').forEach(m => m.classList.remove('active'));
        document.querySelectorAll('.tab-toggle').forEach(b => b.classList.remove('active'));

        // Show selected mode
        const modeEl = document.getElementById(mode);
        if (modeEl) modeEl.classList.add('active');
        
        const tabBtn = document.querySelector(`[data-tab="${mode}"]`);
        if (tabBtn) tabBtn.classList.add('active');
    }

    handleFileSelect(e) {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!this.validateFile(file)) {
            alert('Invalid file type. Please upload .txt, .eml, or .msg files.');
            return;
        }

        this.currentFile = file;
        if (this.fileName) {
            this.fileName.textContent = `✓ ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
            this.fileName.style.display = 'block';
        }
    }

    validateFile(file) {
        const validTypes = ['.txt', '.eml', '.msg'];
        const fileName = file.name.toLowerCase();
        return validTypes.some(type => fileName.endsWith(type));
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        if (this.uploadArea) this.uploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        if (this.uploadArea) this.uploadArea.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        if (this.uploadArea) this.uploadArea.classList.remove('dragover');

        const files = e.dataTransfer?.files;
        if (files?.length > 0 && this.fileInput) {
            this.fileInput.files = files;
            this.handleFileSelect({ target: { files } });
        }
    }

    async analyzeText() {
        if (!this.emailTextarea) {
            alert('Email textarea not found');
            return;
        }

        const email = this.emailTextarea.value.trim();
        if (!email) {
            alert('Please paste an email to analyze');
            return;
        }
        await this.sendAnalysis(email);
    }

    async analyzeFile() {
        if (!this.currentFile) {
            alert('Please select a file first');
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            const content = e.target?.result;
            await this.sendAnalysis(content);
        };
        reader.readAsText(this.currentFile);
    }

    async loadSample() {
        try {
            const response = await fetch('/sample_email.txt');
            const sample = await response.text();
            if (this.emailTextarea) {
                this.emailTextarea.value = sample;
                this.switchMode('text-mode');
                await this.analyzeText();
            }
        } catch (err) {
            alert('Failed to load sample email');
        }
    }

    async sendAnalysis(emailContent) {
        this.showLoading();

        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailContent })
            });

            if (!response.ok) throw new Error('Analysis failed');
            const result = await response.json();
            this.displayResults(result);
        } catch (err) {
            this.showEmptyState();
            alert('Analysis failed: ' + err.message);
            console.error(err);
        }
    }

    displayResults(analysis) {
        this.lastAnalysis = analysis;
        this.showResults();

        try {
            // Update threat score
            const score = analysis.score || 0;
            const scoreText = document.getElementById('score-text');
            const threatLevel = document.getElementById('threat-level');
            const threatMessage = document.getElementById('threat-message');

            // Animate score
            if (scoreText) {
                this.animateGauge(score);
                scoreText.textContent = Math.round(score);
            }

            // Set threat level
            if (threatLevel && threatMessage) {
                const level = this.getThreatLevel(score);
                threatLevel.textContent = level.text;
                threatLevel.style.color = level.color;
                threatMessage.textContent = level.message;
            }

            // Update metadata
            const headers = analysis.details?.headers || {};
            const metaFrom = document.getElementById('meta-from');
            const metaTo = document.getElementById('meta-to');
            const metaSubject = document.getElementById('meta-subject');

            if (metaFrom) metaFrom.textContent = headers.from || '—';
            if (metaTo) metaTo.textContent = headers.to || '—';
            if (metaSubject) metaSubject.textContent = headers.subject || '—';

            // Update threat indicators
            const reasons = analysis.reasons || [];
            const indicatorsList = document.getElementById('indicators-list');
            if (indicatorsList) {
                indicatorsList.innerHTML = '';
                
                if (reasons.length === 0) {
                    const li = document.createElement('li');
                    li.textContent = '✓ No threats detected';
                    li.className = 'safe';
                    indicatorsList.appendChild(li);
                } else {
                    reasons.forEach((reason) => {
                        const li = document.createElement('li');
                        li.textContent = reason;
                        indicatorsList.appendChild(li);
                    });
                }
            }

            // Update URLs if present
            const urls = analysis.details?.urls || [];
            const urlsSection = document.getElementById('urls-section');
            if (urls.length > 0 && urlsSection) {
                urlsSection.classList.remove('hidden');
                const urlsList = document.getElementById('urls-list');
                if (urlsList) {
                    urlsList.innerHTML = '';
                    urls.forEach(url => {
                        const li = document.createElement('li');
                        li.textContent = url;
                        li.title = url;
                        urlsList.appendChild(li);
                    });
                }
            } else if (urlsSection) {
                urlsSection.classList.add('hidden');
            }

            // Update attachments if present
            const attachments = analysis.details?.attachments || [];
            const attachmentsSection = document.getElementById('attachments-section');
            if (attachments.length > 0 && attachmentsSection) {
                attachmentsSection.classList.remove('hidden');
                const attachmentsList = document.getElementById('attachments-list');
                if (attachmentsList) {
                    attachmentsList.innerHTML = '';
                    attachments.forEach(att => {
                        const li = document.createElement('li');
                        li.textContent = att;
                        attachmentsList.appendChild(li);
                    });
                }
            } else if (attachmentsSection) {
                attachmentsSection.classList.add('hidden');
            }
        } catch (err) {
            console.error('Error displaying results:', err);
            alert('Error displaying results: ' + err.message);
        }
    }

    animateGauge(score) {
        const gaugeFill = document.getElementById('gauge-circle');
        if (!gaugeFill) return;

        const radius = 90;
        const circumference = 2 * Math.PI * radius;
        
        // Calculate offset based on score (0-100)
        const offset = circumference - (score / 100) * circumference;
        
        gaugeFill.style.strokeDashoffset = circumference;
        setTimeout(() => {
            gaugeFill.style.strokeDashoffset = offset;
        }, 100);

        // Change color based on score
        const color = score < 30 ? '#2da645' : score < 70 ? '#ffaa00' : '#ff4444';
        gaugeFill.style.stroke = color;
    }

    getThreatLevel(score) {
        if (score < 20) return { text: '🟢 LOW RISK', color: '#2da645', message: 'Email appears safe' };
        if (score < 40) return { text: '🟡 LOW-MEDIUM', color: '#a6a600', message: 'Minor suspicious indicators' };
        if (score < 60) return { text: '🟠 MEDIUM', color: '#ffaa00', message: 'Several warning signs detected' };
        if (score < 80) return { text: '🔴 HIGH', color: '#ff6644', message: 'Significant threat indicators' };
        return { text: '🔴 CRITICAL', color: '#ff4444', message: 'Likely malicious email' };
    }

    showEmptyState() {
        if (this.emptyState) this.emptyState.classList.remove('hidden');
        if (this.loadingState) this.loadingState.classList.add('hidden');
        if (this.resultsState) this.resultsState.classList.add('hidden');
    }

    showLoading() {
        if (this.emptyState) this.emptyState.classList.add('hidden');
        if (this.loadingState) this.loadingState.classList.remove('hidden');
        if (this.resultsState) this.resultsState.classList.add('hidden');
    }

    showResults() {
        if (this.emptyState) this.emptyState.classList.add('hidden');
        if (this.loadingState) this.loadingState.classList.add('hidden');
        if (this.resultsState) this.resultsState.classList.remove('hidden');
    }

    resetUI() {
        if (this.emailTextarea) this.emailTextarea.value = '';
        if (this.fileInput) this.fileInput.value = '';
        this.currentFile = null;
        if (this.fileName) {
            this.fileName.textContent = '';
            this.fileName.style.display = 'none';
        }
        this.showEmptyState();
        this.switchMode('text-mode');
    }

    exportResults() {
        if (!this.lastAnalysis) {
            alert('No analysis to export');
            return;
        }

        const exportData = {
            timestamp: new Date().toISOString(),
            analysis: this.lastAnalysis
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `phishing-analysis-${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new PhishAnalyzer();
});
