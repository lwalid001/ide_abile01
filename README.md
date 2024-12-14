# Web-based IDE

A lightweight web-based IDE with real-time code editing, file management, and AI assistance capabilities.

## Features

- Real-time code editing with Monaco Editor
- File management system
- AI-powered code assistance
- Syntax highlighting for multiple languages
- Project saving and deployment
- Live preview functionality

## Requirements

- PHP 7.4 or higher
- Web server (Apache/Nginx)
- Modern web browser

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ide_ok.git
```

2. Place the files in your web server's directory (e.g., htdocs for XAMPP)

3. Ensure the `projects` directory has write permissions:
```bash
chmod 777 projects
```

4. Access the IDE through your web browser:
```
http://localhost/ide_ok
```

## Usage

1. Create or open files using the file manager
2. Edit code in the Monaco Editor
3. Use the AI assistant for code help
4. Save and deploy your projects
5. View live previews of your work

## Directory Structure

```
ide_ok/
├── index.php          # Main application file
├── script.js          # JavaScript functionality
├── styles.css         # CSS styles
├── save_project.php   # Project saving handler
└── projects/          # Saved projects directory
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
