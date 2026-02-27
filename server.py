import http.server
import socketserver
import json
import threading
import sys

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/submit':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            with open('coords.json', 'wb') as f:
                f.write(post_data)
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"OK")
            # 停止服务器
            threading.Thread(target=self.server.shutdown).start()
        else:
            self.send_response(404)
            self.end_headers()

httpd = socketserver.TCPServer(("", 8889), Handler)
print("Listening on 8889...")
httpd.serve_forever()
