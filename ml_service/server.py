from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import sys
import os

# Ensure we can import from the current directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from inference import get_model

# Initialize model on startup
print("Initializing model...")
model = get_model()

class Text2SQLHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/predict':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                question = data.get('question', '')
                
                if not question:
                    self.send_response(400)
                    self.end_headers()
                    self.wfile.write(b'Missing "question" field')
                    return
                
                print(f"Received question: {question}")
                sql = model.predict(question)
                print(f"Predicted SQL: {sql}")
                
                response = {'sql': sql}
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(response).encode('utf-8'))
                
            except Exception as e:
                print(f"Error processing request: {e}")
                self.send_response(500)
                self.end_headers()
                self.wfile.write(str(e).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

def run(server_class=HTTPServer, handler_class=Text2SQLHandler, port=5000):
    # Explicitly bind to all interfaces
    server_address = ('0.0.0.0', port)
    httpd = server_class(server_address, handler_class)
    print(f"Starting httpd on port {port} (Bound to 0.0.0.0)...")
    print("Ensure Windows Firewall allows incoming connections to Python on this port.")
    httpd.serve_forever()

if __name__ == "__main__":
    run()
