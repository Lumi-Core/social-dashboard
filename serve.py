import http.server
import socketserver
import webbrowser
import os

PORT = 3000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-API-Key')
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

if __name__ == '__main__':
    print(f"""
╔══════════════════════════════════════════════════════════════════╗
║          Social Media Agent Dashboard Server                     ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  🚀 Server starting at: http://localhost:{PORT}                   ║
║                                                                  ║
║  📁 Serving files from: {DIRECTORY[:40]}...                       
║                                                                  ║
║  Press Ctrl+C to stop the server                                 ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
    """)
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        webbrowser.open(f'http://localhost:{PORT}')
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n👋 Server stopped. Goodbye!")
