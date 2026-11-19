import http.server, socketserver, urllib.request, ssl, os, time, threading, sys
CACHE = "/home/claude/mvn-mirror/cache"
UPSTREAMS = ["https://dl.google.com/dl/android/maven2", "https://repo1.maven.org/maven2",
             "https://maven-central.storage-download.googleapis.com/maven2", "https://repo.maven.apache.org/maven2",
             "https://plugins.gradle.org/m2"]
ctx = ssl.create_default_context(cafile="/root/.ccr/ca-bundle.crt")
opener = urllib.request.build_opener(urllib.request.ProxyHandler({"https": os.environ["HTTPS_PROXY"]}), urllib.request.HTTPSHandler(context=ctx))
locks = {}
def fetch(path):
    dest = os.path.join(CACHE, path.lstrip("/"))
    if os.path.exists(dest): return dest
    for attempt in range(4):
        for up in UPSTREAMS:
            try:
                with opener.open(up + path, timeout=60) as r:
                    data = r.read()
                    if r.status == 200 and len(data) > 1:
                        os.makedirs(os.path.dirname(dest), exist_ok=True)
                        tmp = dest + ".tmp%d" % threading.get_ident(); open(tmp, "wb").write(data); os.replace(tmp, dest)
                        return dest
            except Exception as e:
                pass
        # if no upstream had it on a POM/jar that clearly should exist, retry after a pause
        if path.endswith((".sha1",".md5",".sha256",".sha512",".asc")): return None
        time.sleep(1.5 * (attempt + 1))
    return None
class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def _serve(self, body):
        p = self.path.split("?")[0]
        dest = fetch(p)
        if not dest:
            self.send_response(404); self.end_headers(); return
        self.send_response(200); self.send_header("Content-Length", str(os.path.getsize(dest))); self.end_headers()
        if body:
            with open(dest, "rb") as f: self.wfile.write(f.read())
    def do_GET(self): self._serve(True)
    def do_HEAD(self): self._serve(False)
class S(socketserver.ThreadingMixIn, http.server.HTTPServer): daemon_threads = True
S(("127.0.0.1", 8765), H).serve_forever()
