#!/usr/bin/env python3
"""Local dev server: like `python3 -m http.server`, but sends Cache-Control: no-cache so browsers
always revalidate files. Without it, browsers cache ES modules heuristically and can mix stale and new modules.
Usage: python3 scripts/serve.py [port]   (serves the project root)"""
import http.server
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map, '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json'}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    print(f'Serving {ROOT} at http://localhost:{port}/ (no-cache)')
    http.server.ThreadingHTTPServer(('', port), NoCacheHandler).serve_forever()
