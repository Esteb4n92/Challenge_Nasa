"""Servidor local para probar el juego: como `python -m http.server`, pero sin caché.

Así, al editar un archivo y recargar la página, el navegador siempre usa la versión nueva.
Uso: python tools/servidor.py [puerto]   (lo llama jugar.bat)
"""
import http.server
import os
import sys


class SinCache(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map,
                      '.js': 'text/javascript', '.json': 'application/json'}

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


if __name__ == '__main__':
    os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
    puerto = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    # 0.0.0.0: acepta conexiones de esta computadora y de la red local.
    with http.server.ThreadingHTTPServer(('0.0.0.0', puerto), SinCache) as srv:
        print(f'Sirviendo Beyond Survival en el puerto {puerto} (Ctrl+C para detener)')
        srv.serve_forever()
