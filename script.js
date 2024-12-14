// Monaco Editor Configuration
require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.36.1/min/vs' }});

class CodeBlock {
    constructor(language, filename, content, lineStart, lineEnd) {
        this.language = language;
        this.filename = filename;
        this.content = content;
        this.lineStart = lineStart;
        this.lineEnd = lineEnd;
        this.id = `code-${Math.random().toString(36).substr(2, 9)}`;
    }
}

class IDE {
    constructor() {
        this.editor = null;
        this.files = new Map();
        this.openTabs = new Set();  // Track which files have open tabs
        this.currentFile = null;
        this.currentLanguage = 'text';
        this.projectDir = null; // Add project directory tracking
        this.deepseekKey = 'sk-a6612db4e945423bbcc793ef356f534a';
        this.chatHistory = [];
        this.progressBar = null;
        this.statusText = null;
        this.estimatedTime = null;
        this.logContent = null;
        this.averageResponseTime = 5000; // Initial estimate: 5 seconds
        this.jsZipInitialized = false;
        
        // Initialize UI elements first
        this.initializeUI();
        
        // Check JSZip availability after UI is initialized
        if (typeof JSZip !== 'undefined') {
            this.jsZipInitialized = true;
            this.log('JSZip initialized successfully');
        } else {
            this.log('Waiting for JSZip to initialize...', true);
            // Wait for JSZip to be available
            this.waitForJSZip();
        }
        
        this.initializeEditor();
        this.initializeResizers();
        this.initializeEventListeners();
        this.initializeStatusBar();
        this.initializeLogSection();
    }

    initializeUI() {
        // Initialize log content
        this.logContent = document.getElementById('logContent');
        if (!this.logContent) {
            console.warn('Log content element not found');
            return;
        }

        // Initialize status elements
        const statusBar = document.getElementById('statusBar');
        if (statusBar) {
            this.progressBar = statusBar.querySelector('.progress-bar');
            this.statusText = statusBar.querySelector('.status-text');
            this.estimatedTime = statusBar.querySelector('.estimated-time');
        } else {
            console.warn('Status bar element not found');
        }

        // Initialize other UI elements
        this.languageIcons = {
            'javascript': 'javascript',
            'js': 'javascript',
            'python': 'code',
            'html': 'html',
            'css': 'css',
            'php': 'code',
            'json': 'data_object',
            'typescript': 'code',
            'java': 'code',
            'c': 'code',
            'cpp': 'code',
            'csharp': 'code',
            'ruby': 'code',
            'go': 'code',
            'rust': 'code',
            'swift': 'code',
            'kotlin': 'code',
            'default': 'description'
        };

        this.languageExtensions = {
            'js': 'javascript',
            'ts': 'typescript',
            'py': 'python',
            'html': 'html',
            'css': 'css',
            'php': 'php',
            'json': 'json',
            'java': 'java',
            'cpp': 'cpp',
            'c': 'c',
            'cs': 'csharp',
            'rb': 'ruby',
            'go': 'go',
            'rs': 'rust',
            'swift': 'swift',
            'kt': 'kotlin',
            'md': 'markdown',
            'txt': 'plaintext'
        };
    }

    initializeStatusBar() {
        this.progressBar = document.querySelector('.progress-bar');
        this.statusText = document.querySelector('.status-text');
        this.estimatedTime = document.querySelector('.estimated-time');
    }

    initializeLogSection() {
        const clearLogBtn = document.getElementById('clearLogBtn');
        if (clearLogBtn) {
            clearLogBtn.addEventListener('click', () => {
                if (this.logContent) {
                    this.logContent.innerHTML = '';
                }
            });
        }
    }

    getLanguageFromFilename(filename) {
        if (!filename) return 'plaintext';
        
        const extension = filename.split('.').pop().toLowerCase();
        return this.languageExtensions[extension] || 'plaintext';
    }

    getLanguageIcon(language) {
        const normalizedLang = language.toLowerCase();
        return this.languageIcons[normalizedLang] || this.languageIcons.default;
    }

    async initializeEditor() {
        await new Promise((resolve) => {
            require(['vs/editor/editor.main'], () => {
                this.editor = monaco.editor.create(document.getElementById('monacoEditor'), {
                    theme: 'vs-dark',
                    automaticLayout: true,
                    minimap: { enabled: true },
                    fontSize: 14,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    wordWrap: 'on'
                });
                resolve();
            });
        });
    }

    initializeResizers() {
        const leftResizer = document.getElementById('leftResizer');
        const rightResizer = document.getElementById('rightResizer');
        const fileManager = document.getElementById('fileManagerPanel');
        const assistant = document.getElementById('assistantPanel');

        this.enableResize(leftResizer, fileManager, 'width', true);
        this.enableResize(rightResizer, assistant, 'width', false);
    }

    enableResize(resizer, panel, dimension, isLeft) {
        let startPos = 0;
        let startSize = 0;

        const startResize = (e) => {
            startPos = e.pageX;
            startSize = parseInt(getComputedStyle(panel)[dimension], 10);
            document.addEventListener('mousemove', resize);
            document.addEventListener('mouseup', stopResize);
        };

        const resize = (e) => {
            const diff = e.pageX - startPos;
            const newSize = isLeft ? startSize + diff : startSize - diff;
            panel.style[dimension] = `${newSize}px`;
            resizer.style.left = isLeft ? `${newSize}px` : 'auto';
            resizer.style.right = isLeft ? 'auto' : `${newSize}px`;
        };

        const stopResize = () => {
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', stopResize);
        };

        resizer.addEventListener('mousedown', startResize);
    }

    initializeEventListeners() {
        // Chat functionality
        const sendPromptBtn = document.getElementById('sendPrompt');
        const promptInput = document.getElementById('promptInput');
        
        if (sendPromptBtn && promptInput) {
            sendPromptBtn.addEventListener('click', () => this.handlePrompt());
            promptInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.handlePrompt();
                }
            });
        }

        // File upload functionality
        const uploadFolderBtn = document.getElementById('uploadFolderBtn');
        const folderUpload = document.getElementById('folderUpload');
        
        if (uploadFolderBtn && folderUpload) {
            uploadFolderBtn.addEventListener('click', () => {
                folderUpload.click();
            });
            
            folderUpload.addEventListener('change', (event) => {
                this.handleFolderUpload(event);
            });
        }

        // Download functionality
        const downloadBtn = document.getElementById('downloadBtn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                this.downloadProject();
            });
        }

        // Save and deploy functionality
        const saveAndDeployBtn = document.getElementById('saveAndDeployBtn');
        if (saveAndDeployBtn) {
            saveAndDeployBtn.addEventListener('click', () => {
                this.saveAndDeploy();
            });
        }
    }

    async handleFolderUpload(event) {
        const files = event.target.files;
        if (!files.length) return;

        this.log('Uploading folder...');
        this.updateStatus('Processing folder...', 20);

        const folderContent = [];

        // Read all files in the folder
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const content = await this.readFileContent(file);
            folderContent.push({
                filename: file.name,
                content: content
            });
        }

        this.log(`Folder uploaded with ${folderContent.length} files.`);
        this.updateStatus('Analyzing folder content...', 50);

        // Send folder content to AI assistant for analysis
        const analysisPrompt = `Analyze the following files and provide a synthesis of their content:\n\n${folderContent.map(file => `### ${file.filename}\n${file.content}\n`).join('\n')}`;

        try {
            const response = await this.callDeepseekAPI(analysisPrompt);
            const synthesis = response.choices[0].message.content;

            // Add synthesis to chat history
            this.addMessage('assistant', synthesis);
            this.chatHistory.push({
                role: 'assistant',
                content: synthesis
            });

            // Create a context for the uploaded files
            const contextTitle = `Context: ${files[0].webkitRelativePath.split('/')[0]}`;
            this.log(`Created context: ${contextTitle}`);

            // Add files to the file manager
            folderContent.forEach(file => {
                this.addFile(file.filename, file.content);
            });

            this.updateStatus('Ready', 100);
        } catch (error) {
            console.error('Error analyzing folder:', error);
            this.log('Error analyzing folder: ' + error.message, true);
            this.updateStatus('Error', 100);
        }
    }

    async readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
    }

    async handlePrompt() {
        const promptInput = document.getElementById('promptInput');
        const prompt = promptInput.value.trim();
        if (!prompt) return;

        this.addMessage('user', prompt);
        promptInput.value = '';

        try {
            const startTime = Date.now();
            this.updateStatus('Sending request to assistant...', 0);
            this.log('Sending request to assistant');

            // Start progress animation
            this.startProgressAnimation();

            const response = await this.callDeepseekAPI(prompt);
            
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            // Update average response time
            this.averageResponseTime = (this.averageResponseTime + responseTime) / 2;
            
            this.updateStatus('Processing response...', 90);
            this.log('Received response from assistant');
            
            await this.processAssistantResponse(response);
            
            this.updateStatus('Ready', 100);
            this.log('Finished processing response');
            
            // Reset progress bar after a short delay
            setTimeout(() => {
                this.resetStatus();
            }, 1000);
            
        } catch (error) {
            console.error('Error calling DeepSeek API:', error);
            this.addMessage('assistant', 'Sorry, there was an error processing your request.');
            this.log('Error: ' + error.message, true);
            this.resetStatus();
        }
    }

    startProgressAnimation() {
        let progress = 0;
        const updateInterval = this.averageResponseTime / 100;
        
        const animate = () => {
            if (progress < 85) {
                progress += 1;
                this.updateProgress(progress);
                setTimeout(animate, updateInterval);
            }
        };
        
        animate();
    }

    updateStatus(message, showProgress = false) {
        if (this.statusText) {
            this.statusText.textContent = message;
        }
        
        if (this.progressBar) {
            this.progressBar.style.width = showProgress ? '100%' : '0';
            this.progressBar.style.transition = showProgress ? 'width 2s linear' : 'none';
        }
    }

    updateProgress(progress) {
        this.progressBar.style.width = `${progress}%`;
    }

    resetStatus() {
        this.updateStatus('Ready', 0);
        this.estimatedTime.textContent = '';
    }

    log(message, isError = false) {
        if (!this.logContent) {
            console.log(message);
            return;
        }

        const logEntry = document.createElement('div');
        logEntry.className = `log-entry${isError ? ' error' : ''}`;
        
        const timestamp = new Date().toLocaleTimeString();
        logEntry.innerHTML = `<span class="log-time">[${timestamp}]</span> ${message}`;
        
        this.logContent.appendChild(logEntry);
        this.logContent.scrollTop = this.logContent.scrollHeight;
    }

    clearLog() {
        this.logContent.innerHTML = '';
        this.log('Log cleared');
    }

    async callDeepseekAPI(prompt) {
        // Simulate API call for now - replace with actual DeepSeek API implementation
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.deepseekKey}`
            },
            body: JSON.stringify({
                model: "deepseek-coder",
                messages: [
                    ...this.chatHistory,
                    { role: "user", content: prompt }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`API call failed: ${response.statusText}`);
        }

        return await response.json();
    }

    processAssistantResponse(response) {
        const content = this.sanitizeText(response.choices[0].message.content);
        const codeBlocks = this.parseCodeBlocks(content);
        
        // Process the content and create files
        let displayContent = this.formatAssistantResponse(content, codeBlocks);

        // Add to chat and update history
        this.addMessage('assistant', displayContent);
        this.chatHistory.push({
            role: 'assistant',
            content: content,
            codeBlocks: codeBlocks.map(({ id, filename, language }) => ({
                id, filename, language
            }))
        });

        // Create or update files
        codeBlocks.forEach(block => {
            this.createOrUpdateFile(block);
        });

        // Scroll to the latest message
        this.scrollToLatestMessage();
    }

    formatAssistantResponse(content, codeBlocks) {
        // Split content into sections
        const sections = content.split(/(?=###)/);
        
        // Format each section
        const formattedSections = sections.map(section => {
            if (section.trim().startsWith('###')) {
                // Handle step sections
                return this.formatStepSection(section);
            } else {
                // Handle regular text
                return this.formatTextSection(section);
            }
        });

        // Add generated files section
        if (codeBlocks.length > 0) {
            formattedSections.push(this.createGeneratedFilesSection(codeBlocks));
        }

        return formattedSections.join('\n');
    }

    formatStepSection(section) {
        const lines = section.trim().split('\n');
        const title = lines[0].replace(/^###\s*/, '').trim();
        const content = lines.slice(1).join('\n').trim();

        return `
            <div class="step-item">
                <div class="step-title">${title}</div>
                <div class="step-content">
                    ${this.formatTextWithFileReferences(content)}
                </div>
            </div>
        `;
    }

    formatTextSection(section) {
        return `
            <div class="message-section">
                ${this.formatTextWithFileReferences(section.trim())}
            </div>
        `;
    }

    formatTextWithFileReferences(text) {
        // Replace file references with styled spans
        text = text.replace(/`([^`]+\.[a-zA-Z0-9]+)`/g, '<span class="file-reference">$1</span>');
        
        // Format directory structure blocks
        text = text.replace(/```\n([\s\S]*?)\n```/g, (match, content) => {
            return `
                <div class="directory-structure">
                    <pre>${content.trim()}</pre>
                </div>
            `;
        });

        return text;
    }

    createGeneratedFilesSection(codeBlocks) {
        const filesList = codeBlocks.map(block => this.createCodeBlockReference(block)).join('');
        
        return `
            <div class="generated-files-section">
                <div class="generated-files-header">Generated Files</div>
                <div class="generated-files-list">
                    ${filesList}
                </div>
            </div>
        `;
    }

    createCodeBlockReference(block) {
        return `
            <div class="code-block-reference" data-block-id="${block.id}">
                <div class="code-block-header">
                    <i class="material-icons">${this.getLanguageIcon(block.language)}</i>
                    <span class="code-block-filename">${block.filename}</span>
                </div>
            </div>
        `;
    }

    sanitizeText(text) {
        return text
            .replace(/[""]/g, '"')
            .replace(/['']/g, "'")
            .replace(/[–—]/g, '-')
            .replace(/…/g, '...')
            .replace(/[^\x00-\x7F]/g, char => {
                // Replace any other non-ASCII characters with their closest ASCII equivalent
                return char === '•' ? '*' : '-';
            });
    }

    parseCodeBlocks(content) {
        const blocks = [];
        const lines = content.split('\n');
        let currentBlock = null;
        let blockContent = [];
        let inCodeBlock = false;

        // Enhanced regex patterns for better filename detection
        const codeBlockStartRegex = /^```(\w+)\s*(?:[\(`]?([^\n`\)]+)[\)`]?)?\s*$/i;
        const codeBlockEndRegex = /^```\s*$/;
        const filenamePatterns = [
            /(?:Create|Edit|Update|New)\s+(?:the\s+)?(?:file\s+)?[`']?([^`'\n]+?\.[\w]+)[`']?/i,
            /[`']([^`'\n]+?\.[\w]+)[`']/,
            /\(([^)\n]+?\.[\w]+)\)/,
            /file:\s*([^\s\n]+)/i
        ];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (!inCodeBlock) {
                const startMatch = line.match(codeBlockStartRegex);
                if (startMatch) {
                    inCodeBlock = true;
                    let language = startMatch[1].toLowerCase();
                    let filename = '';

                    // First try to get filename from the code block marker
                    if (startMatch[2]) {
                        filename = this.cleanFilename(startMatch[2]);
                    }

                    // If no filename found, look in previous lines
                    if (!filename) {
                        for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
                            const prevLine = lines[j].trim();
                            for (const pattern of filenamePatterns) {
                                const match = prevLine.match(pattern);
                                if (match && match[1]) {
                                    filename = this.cleanFilename(match[1]);
                                    break;
                                }
                            }
                            if (filename) break;
                        }
                    }

                    // If still no filename, use default based on language
                    if (!filename) {
                        const defaultNames = {
                            'php': 'index.php',
                            'css': 'styles.css',
                            'javascript': 'script.js',
                            'js': 'script.js',
                            'html': 'index.html',
                            'python': 'main.py'
                        };
                        filename = defaultNames[language] || `file.${language}`;
                    }

                    currentBlock = {
                        language,
                        filename,
                        content: []
                    };
                }
            } else {
                if (line.match(codeBlockEndRegex)) {
                    inCodeBlock = false;
                    if (currentBlock && currentBlock.content.length > 0) {
                        blocks.push({
                            ...currentBlock,
                            content: currentBlock.content.join('\n'),
                            id: `code-${Math.random().toString(36).substr(2, 9)}`
                        });
                    }
                    currentBlock = null;
                } else if (currentBlock) {
                    currentBlock.content.push(line);
                }
            }
        }

        return blocks;
    }

    cleanFilename(filename) {
        if (!filename) return '';
        
        // Remove common prefixes and quotes
        filename = filename.replace(/^['"`]|['"`]$/g, '')  // Remove quotes
                         .replace(/^(file:|path:)/i, '')   // Remove file: or path: prefix
                         .replace(/^\((.*)\)$/, '$1')      // Remove surrounding parentheses
                         .trim();

        // Extract filename from common patterns
        const patterns = [
            /(?:Create|Edit|Update|New)\s+(?:the\s+)?(?:file\s+)?[`']?([^`'\n]+?\.[\w]+)[`']?/i,
            /[`']([^`'\n]+?\.[\w]+)[`']/,
            /\(([^)\n]+?\.[\w]+)\)/,
            /file:\s*([^\s\n]+)/i
        ];

        for (const pattern of patterns) {
            const match = filename.match(pattern);
            if (match) {
                filename = match[1];
                break;
            }
        }

        // Add default extension if missing
        if (!filename.includes('.')) {
            const defaultExtensions = {
                'php': '.php',
                'css': '.css',
                'javascript': '.js',
                'js': '.js',
                'html': '.html',
                'python': '.py'
            };
            const ext = defaultExtensions[this.currentLanguage] || '.txt';
            filename += ext;
        }

        return filename;
    }

    addFile(filename, content = '') {
        if (!this.files.has(filename)) {
            const language = this.getLanguageFromFilename(filename);
            const model = monaco.editor.createModel(content, language);
            this.files.set(filename, { model, content });
            this.addFileToManager(filename);
            this.log(`Added new file: ${filename}`);
        }
        this.openFileTab(filename);
    }

    openFileTab(filename) {
        if (!this.files.has(filename)) return;
        
        this.openTabs.add(filename);
        this.currentFile = filename;
        this.editor.setModel(this.files.get(filename).model);
        this.updateEditorTabs();
        this.log(`Opened file: ${filename}`);
    }

    closeTab(filename) {
        if (!this.openTabs.has(filename)) return;

        // If closing current file, switch to another open tab
        if (filename === this.currentFile) {
            const openFiles = Array.from(this.openTabs);
            const currentIndex = openFiles.indexOf(filename);
            const nextFile = openFiles[currentIndex + 1] || openFiles[currentIndex - 1];
            
            if (nextFile) {
                this.currentFile = nextFile;
                this.editor.setModel(this.files.get(nextFile).model);
            } else {
                this.currentFile = null;
                this.editor.setModel(null);
            }
        }

        // Remove from open tabs but keep the file content
        this.openTabs.delete(filename);
        this.updateEditorTabs();
        this.log(`Closed tab: ${filename}`);
    }

    updateEditorTabs() {
        const tabsContainer = document.getElementById('editorTabs');
        tabsContainer.innerHTML = '';

        // Only show tabs for files that are in openTabs
        this.openTabs.forEach(filename => {
            const tab = document.createElement('button');
            tab.className = `editor-tab ${filename === this.currentFile ? 'active' : ''}`;
            
            const filenameSpan = document.createElement('span');
            filenameSpan.textContent = filename;
            tab.appendChild(filenameSpan);
            
            const closeBtn = document.createElement('span');
            closeBtn.className = 'material-icons';
            closeBtn.textContent = 'close';
            tab.appendChild(closeBtn);

            filenameSpan.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openFileTab(filename);
            });

            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeTab(filename);
            });

            tabsContainer.appendChild(tab);
        });
    }

    addFileToManager(filename) {
        const fileList = document.querySelector('.file-list');
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        const icon = document.createElement('i');
        icon.className = 'material-icons';
        icon.textContent = this.getLanguageIcon(this.getLanguageFromFilename(filename));
        
        const name = document.createElement('span');
        name.textContent = filename;
        
        fileItem.appendChild(icon);
        fileItem.appendChild(name);
        
        fileItem.addEventListener('click', () => this.openFileTab(filename));
        
        fileList.appendChild(fileItem);
    }

    async downloadProject() {
        try {
            // Check if JSZip is available
            if (!this.jsZipInitialized) {
                // Try to wait for JSZip one last time
                const success = await this.waitForJSZip();
                if (!success) {
                    throw new Error('JSZip library is not available. Please refresh the page and try again.');
                }
            }

            if (this.files.size === 0) {
                this.log('No files to download', true);
                return;
            }

            this.log('Preparing files for download...');
            const zip = new JSZip();
            
            // Add all files to the zip
            this.files.forEach((file, filename) => {
                const content = file.model.getValue();
                zip.file(filename, content);
                this.log(`Added ${filename} to zip`);
            });

            // Generate the zip file
            this.log('Generating zip file...');
            const content = await zip.generateAsync({ 
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: {
                    level: 9
                }
            });

            // Create download link
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'project.zip';
            document.body.appendChild(a);
            
            // Trigger download
            this.log('Starting download...');
            a.click();
            
            // Clean up
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            this.log('Download complete');
            
        } catch (error) {
            console.error('Download error:', error);
            this.log('Error downloading project: ' + error.message, true);
        }
    }

    async waitForJSZip(attempts = 0) {
        const maxAttempts = 5;
        const delay = 1000; // 1 second between attempts

        if (typeof JSZip !== 'undefined') {
            this.jsZipInitialized = true;
            this.log('JSZip initialized successfully');
            return true;
        }

        if (attempts >= maxAttempts) {
            this.log('Failed to initialize JSZip after multiple attempts', true);
            return false;
        }

        // Wait and try again
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.waitForJSZip(attempts + 1);
    }

    createOrUpdateFile(block) {
        // Format the code content before saving
        const formattedContent = this.formatCodeContent(block.content, block.language);
        
        const file = this.files.get(block.filename);
        if (file) {
            file.model.setValue(formattedContent);
            file.lastModified = Date.now();
        } else {
            const model = monaco.editor.createModel(
                formattedContent,
                block.language.toLowerCase()
            );
            this.files.set(block.filename, {
                model,
                language: block.language,
                lastModified: Date.now(),
                blockId: block.id
            });
            this.addFileToManager(block.filename);
        }

        // Update UI
        this.updateEditorTabs();
    }

    formatCodeContent(content, language) {
        // Remove extra blank lines at start and end
        content = content.trim();
        
        // Ensure consistent indentation (using spaces)
        const lines = content.split('\n');
        const indentSize = 4;
        let formattedLines = [];
        let currentIndent = 0;
        
        const increaseIndentChars = {
            '{': true,
            '(': true,
            '[': true
        };
        
        const decreaseIndentChars = {
            '}': true,
            ')': true,
            ']': true
        };

        lines.forEach(line => {
            const trimmedLine = line.trim();
            
            // Decrease indent for closing braces/brackets
            if (trimmedLine[0] in decreaseIndentChars) {
                currentIndent = Math.max(0, currentIndent - 1);
            }
            
            // Add the line with proper indentation
            if (trimmedLine.length > 0) {
                formattedLines.push(' '.repeat(currentIndent * indentSize) + trimmedLine);
            } else {
                formattedLines.push('');
            }
            
            // Increase indent for opening braces/brackets
            if (trimmedLine[trimmedLine.length - 1] in increaseIndentChars) {
                currentIndent++;
            }
        });
        
        return formattedLines.join('\n');
    }

    addMessage(role, content) {
        const chatMessages = document.querySelector('.chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;
        
        // Process content to format message sections and steps
        if (role === 'assistant') {
            messageDiv.innerHTML = this.formatAssistantMessage(content);
        } else {
            messageDiv.textContent = content;
        }
        
        chatMessages.appendChild(messageDiv);
        this.scrollToLatestMessage();
    }

    formatMessageSection(title, content) {
        return `
            <div class="message-section">
                ${title ? `<div class="section-title">${title}</div>` : ''}
                <div class="section-content">${content}</div>
            </div>`;
    }

    formatStep(number, title, content) {
        return `
            <div class="step-item">
                <div class="step-title">${title}</div>
                <div class="step-content">${content}</div>
            </div>`;
    }

    formatGeneratedFiles(files) {
        if (!files || files.length === 0) return '';
        
        const filesList = files.map(file => `
            <div class="code-block-reference" data-block-id="${file.id}">
                <div class="code-block-header">
                    <i class="material-icons">${this.getLanguageIcon(file.language)}</i>
                    <span class="code-block-filename">${file.filename}</span>
                </div>
            </div>`).join('');

        return `
            <div class="generated-files-section">
                <div class="generated-files-header">Generated Files</div>
                <div class="generated-files-list">${filesList}</div>
            </div>`;
    }

    formatDirectoryStructure(structure) {
        return `
            <div class="directory-structure">
                <pre>${structure}</pre>
            </div>`;
    }

    formatAssistantMessage(message) {
        // Split message into code blocks and text
        const parts = message.split(/(```[\s\S]*?```)/g);
        let formattedMessage = '';

        parts.forEach(part => {
            if (part.startsWith('```')) {
                // Extract language and code
                const lines = part.split('\n');
                const firstLine = lines[0].replace('```', '').trim();
                const language = firstLine || 'plaintext';
                const code = lines.slice(1, -1).join('\n');

                // Create code block container
                formattedMessage += `
                    <div class="code-block-container">
                        <div class="code-block-header">
                            <span class="material-icons">${this.getLanguageIcon(language)}</span>
                            ${language}
                        </div>
                        <pre><code class="language-${language}">${this.escapeHtml(code)}</code></pre>
                    </div>`;
            } else {
                // Format regular text with markdown
                formattedMessage += this.formatMarkdown(part);
            }
        });

        return formattedMessage;
    }

    formatMarkdown(text) {
        // Trim the text and handle empty strings
        text = text.trim();
        if (!text) return '';

        // Split text into paragraphs first
        const paragraphs = text.split(/\n\s*\n/);
        
        return paragraphs.map(paragraph => {
            // Format each paragraph
            let formatted = paragraph
                .trim()
                // Bold text
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                // Italic text
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                // Inline code
                .replace(/`([^`]+)`/g, '<code>$1</code>')
                // Lists (unordered)
                .replace(/^- (.+)$/gm, '<li>$1</li>')
                // Lists (ordered)
                .replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

            // Wrap lists in ul/ol tags
            if (formatted.includes('<li>')) {
                if (paragraph.match(/^\d+\./m)) {
                    formatted = '<ol>' + formatted + '</ol>';
                } else if (paragraph.match(/^-/m)) {
                    formatted = '<ul>' + formatted + '</ul>';
                }
            }

            // Wrap non-list paragraphs in p tags
            if (!formatted.startsWith('<ul>') && !formatted.startsWith('<ol>')) {
                formatted = '<p>' + formatted + '</p>';
            }

            return formatted;
        }).join('\n');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    openFile(filename) {
        const file = this.files.get(filename);
        if (!file) return;

        this.currentFile = filename;
        this.editor.setModel(file.model);
        this.updateEditorTabs();
    }

    updateEditorTabs() {
        const tabsContainer = document.getElementById('editorTabs');
        tabsContainer.innerHTML = '';

        this.openTabs.forEach(filename => {
            const tab = document.createElement('button');
            tab.className = `editor-tab ${filename === this.currentFile ? 'active' : ''}`;
            
            // Create filename span
            const filenameSpan = document.createElement('span');
            filenameSpan.textContent = filename;
            tab.appendChild(filenameSpan);
            
            // Create close button
            const closeBtn = document.createElement('span');
            closeBtn.className = 'material-icons';
            closeBtn.textContent = 'close';
            tab.appendChild(closeBtn);

            // Add click handlers
            filenameSpan.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openFileTab(filename);
            });

            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeTab(filename);
            });

            tabsContainer.appendChild(tab);
        });
    }

    closeFile(filename) {
        if (!this.files.has(filename)) return;

        // If closing current file, switch to another file first
        if (filename === this.currentFile) {
            const fileNames = Array.from(this.files.keys());
            const currentIndex = fileNames.indexOf(filename);
            const nextFile = fileNames[currentIndex + 1] || fileNames[currentIndex - 1];
            
            if (nextFile) {
                this.openFileTab(nextFile);
            } else {
                this.currentFile = null;
                this.editor.setModel(null);
            }
        }

        // Remove the file
        this.files.delete(filename);
        this.updateEditorTabs();
        
        // Log the action
        this.log(`Closed file: ${filename}`);
    }

    handleCodeUpdate(filename, updates) {
        if (!this.files.has(filename)) {
            this.log(`File ${filename} not found`, true);
            return;
        }

        const file = this.files.get(filename);
        const lines = file.content.split('\n');
        const timestamp = new Date().toISOString();

        // Log the update operation
        this.log(`[${timestamp}] Updating ${filename}`);

        // Process each update sequentially
        for (const update of updates) {
            const { start, end, newCode, description } = update;
            
            // Log the specific change
            this.log(`- Lines ${start}-${end}: ${description}`);

            // Highlight the changing section in the editor
            if (this.currentFile === filename && this.editor) {
                const model = this.editor.getModel();
                if (model) {
                    const decoration = this.editor.deltaDecorations([], [{
                        range: new monaco.Range(start, 1, end, 1),
                        options: { inlineClassName: 'code-update-highlight' }
                    }]);

                    // Show the update in real-time
                    const updateLines = newCode.split('\n');
                    lines.splice(start - 1, end - start + 1, ...updateLines);
                    
                    model.pushEditOperations([], [{
                        range: model.getFullModelRange(),
                        text: lines.join('\n')
                    }], () => null);

                    // Remove highlight after a short delay
                    setTimeout(() => {
                        this.editor.deltaDecorations(decoration, []);
                    }, 1000);
                }
            }
        }

        // Update file content
        file.content = lines.join('\n');
        this.log(`[${timestamp}] Update completed for ${filename}`);
    }

    processFileChanges(changes) {
        for (const [filename, fileChanges] of Object.entries(changes)) {
            this.log(`Processing changes for ${filename}`);
            this.handleCodeUpdate(filename, fileChanges);
        }
    }

    async saveAndDeploy() {
        try {
            this.log('Starting deployment process...');
            
            // Check if we have files to save
            if (this.files.size === 0) {
                throw new Error('No files to deploy. Please add some files first.');
            }

            // Use existing project directory or create new one
            const projectId = this.projectDir || new Date().getTime().toString(36);
            this.projectDir = projectId; // Store for future updates
            
            // Prepare files data
            const filesData = {};
            let hasFiles = false;
            
            for (const [filename, fileInfo] of this.files.entries()) {
                try {
                    let content = null;
                    
                    // Try to get content from the editor if it's the current file
                    if (this.currentFile === filename && this.editor) {
                        content = this.editor.getValue();
                        this.log(`Got content from current editor for ${filename}`);
                    } 
                    // Try to get content from the model
                    else if (fileInfo && fileInfo.model) {
                        content = fileInfo.model.getValue();
                        this.log(`Got content from model for ${filename}`);
                    }
                    // Try to get content from the file content property
                    else if (fileInfo && fileInfo.content) {
                        content = fileInfo.content;
                        this.log(`Got content from stored content for ${filename}`);
                    }

                    if (content && content.trim().length > 0) {
                        filesData[filename] = content;
                        hasFiles = true;
                        this.log(`Processed ${filename} (${content.length} bytes)`);
                    } else {
                        this.log(`Warning: No content found for ${filename}`, true);
                    }
                } catch (err) {
                    this.log(`Error processing ${filename}: ${err.message}`, true);
                }
            }

            if (!hasFiles) {
                throw new Error('No valid files with content to save');
            }

            this.log(`Saving ${Object.keys(filesData).length} files...`);
            this.updateStatus('Saving files...', true);

            const response = await fetch('save_project.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    projectDir: projectId,
                    files: filesData,
                    isUpdate: !!this.projectDir // Tell server if this is an update
                })
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success) {
                this.updateStatus('Project deployed successfully!');
                this.log(`Project saved to: ${result.url}`);
                
                // Find index file
                const indexFile = Object.keys(filesData).find(f => f.match(/^index\.(php|html)$/));
                const deployUrl = indexFile ? `${result.url}/${indexFile}` : result.url;
                
                this.log(`Opening project at: ${deployUrl}`);
                window.open(deployUrl, '_blank');
            } else {
                throw new Error(result.message || 'Failed to deploy project');
            }
        } catch (error) {
            console.error('Deployment error:', error);
            this.updateStatus('Deployment failed', true);
            this.log(`Error: ${error.message}`, true);
        }
    }

    getFileContent(filename) {
        const fileInfo = this.files.get(filename);
        if (!fileInfo) return null;

        if (this.currentFile === filename && this.editor) {
            return this.editor.getValue();
        }

        if (fileInfo.model) {
            return fileInfo.model.getValue();
        }

        return fileInfo.content || null;
    }

    scrollToLatestMessage() {
        const chatMessages = document.querySelector('.chat-messages');
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// Initialize the IDE when the page loads
window.addEventListener('load', () => {
    window.ide = new IDE();
});