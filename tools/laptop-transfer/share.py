#!/usr/bin/env python3
"""
One-link laptop-to-laptop transfer (WeTransfer style, no upload, no account).

Run this on the OLD laptop. It prints a link. Open that link in a browser on
the NEW laptop and click "Download" -- you get everything as one .zip file,
streamed directly from the old laptop (nothing is stored in the cloud).

Usage:
    python3 share.py <folder-or-file> [more folders/files ...] [options]

Examples:
    python3 share.py ~/Documents ~/Pictures ~/Desktop
    python3 share.py "C:\\Users\\Me\\Documents" --port 9000
    python3 share.py ~/Documents --internet      # link works from any network

Options:
    --port N       Port to listen on (default 8765)
    --compress     Compress files (smaller, but slower; photos/videos won't shrink)
    --internet     Also create a public https link via Cloudflare Tunnel
                   (needs the free `cloudflared` program installed)

Only standard Python 3.8+ is required. Press Ctrl+C to stop sharing.
"""

import argparse
import html
import os
import re
import secrets
import shutil
import socket
import subprocess
import sys
import threading
import time
import zipfile
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import quote


def lan_ip():
    """Best guess of this laptop's address on the local Wi-Fi/Ethernet."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("10.255.255.255", 1))  # no packet is actually sent
        return s.getsockname()[0]
    except OSError:
        return "127.0.0.1"
    finally:
        s.close()


def iter_files(roots):
    """Yield (absolute_path, name_inside_zip) for every file to send."""
    for root in roots:
        root = os.path.abspath(os.path.expanduser(root))
        base = os.path.basename(root.rstrip("\\/")) or "root"
        if os.path.isfile(root):
            yield root, base
            continue
        for dirpath, dirnames, filenames in os.walk(root):
            dirnames[:] = [d for d in dirnames if not os.path.islink(os.path.join(dirpath, d))]
            for name in filenames:
                full = os.path.join(dirpath, name)
                if os.path.islink(full):
                    continue
                rel = os.path.relpath(full, root)
                yield full, os.path.join(base, rel).replace(os.sep, "/")


def scan(roots):
    count, total = 0, 0
    for full, _ in iter_files(roots):
        try:
            total += os.path.getsize(full)
            count += 1
        except OSError:
            pass
    return count, total


def human(n):
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if n < 1024 or unit == "TB":
            return f"{n:.1f} {unit}" if unit != "B" else f"{n} B"
        n /= 1024


class _CountingWriter:
    """File-like wrapper so we can report progress while streaming the zip."""

    def __init__(self, raw, total):
        self.raw, self.total, self.sent, self._last = raw, total, 0, 0.0

    def write(self, data):
        self.raw.write(data)
        self.sent += len(data)
        now = time.time()
        if now - self._last > 1:
            self._last = now
            pct = (self.sent / self.total * 100) if self.total else 100
            print(f"\r  Sent {human(self.sent)} of ~{human(self.total)} ({min(pct, 100):.0f}%)   ",
                  end="", flush=True)
        return len(data)

    def flush(self):
        self.raw.flush()


def make_handler(roots, token, zip_name, compress, count, total):
    page = f"""<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Laptop transfer</title>
<style>body{{font-family:system-ui,sans-serif;max-width:560px;margin:60px auto;padding:0 16px;color:#222}}
a.btn{{display:inline-block;background:#4f46e5;color:#fff;padding:14px 28px;border-radius:10px;
text-decoration:none;font-size:18px}}li{{word-break:break-all}}</style></head><body>
<h1>Files ready to download</h1>
<p>{count} files, about {html.escape(human(total))} in total.</p>
<ul>{"".join(f"<li>{html.escape(os.path.abspath(os.path.expanduser(r)))}</li>" for r in roots)}</ul>
<p><a class="btn" href="/{token}/{quote(zip_name)}">Download {html.escape(zip_name)}</a></p>
<p><small>Keep the other laptop awake and on the same network until the download finishes.</small></p>
</body></html>""".encode()

    method = zipfile.ZIP_DEFLATED if compress else zipfile.ZIP_STORED

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *args):
            pass

        def do_GET(self):
            path = self.path.split("?", 1)[0]
            if path in (f"/{token}", f"/{token}/"):
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(page)))
                self.end_headers()
                self.wfile.write(page)
            elif path == f"/{token}/{quote(zip_name)}":
                self.send_zip()
            else:
                self.send_error(404)

        def send_zip(self):
            print(f"\n>> Download started by {self.client_address[0]}")
            self.send_response(200)
            self.send_header("Content-Type", "application/zip")
            self.send_header("Content-Disposition", f'attachment; filename="{zip_name}"')
            self.send_header("Connection", "close")
            self.end_headers()
            out = _CountingWriter(self.wfile, total)
            skipped = []
            try:
                # Writing to a non-seekable stream is supported: the zip is
                # built on the fly, so no temporary copy is needed on disk.
                with zipfile.ZipFile(out, "w", compression=method, allowZip64=True) as zf:
                    for full, arc in iter_files(roots):
                        try:
                            zf.write(full, arc)
                        except (PermissionError, FileNotFoundError, OSError) as e:
                            if isinstance(e, (BrokenPipeError, ConnectionError)):
                                raise
                            skipped.append(f"{full}: {e}")
                print(f"\n>> Download finished ({human(out.sent)}).")
                if skipped:
                    print(f"   Skipped {len(skipped)} unreadable file(s):")
                    for s in skipped[:20]:
                        print("    -", s)
            except (BrokenPipeError, ConnectionError):
                print("\n>> Download was cancelled / connection lost. The link still works; try again.")
            self.close_connection = True

    return Handler


def start_tunnel(port):
    exe = shutil.which("cloudflared")
    if not exe:
        print("\n[--internet] 'cloudflared' is not installed. Install it from:")
        print("  https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/")
        print("  (Windows: winget install Cloudflare.cloudflared | macOS: brew install cloudflared)")
        print("Continuing with the local-network link only.\n")
        return None, None
    proc = subprocess.Popen([exe, "tunnel", "--url", f"http://127.0.0.1:{port}", "--no-autoupdate"],
                            stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    found = {}
    ready = threading.Event()

    def reader():
        for line in proc.stdout:
            m = re.search(r"https://[a-z0-9-]+\.trycloudflare\.com", line)
            if m and not ready.is_set():
                found["url"] = m.group(0)
                ready.set()
        ready.set()

    threading.Thread(target=reader, daemon=True).start()
    ready.wait(30)
    return proc, found.get("url")


def main():
    ap = argparse.ArgumentParser(description="Share folders from this laptop as one download link.")
    ap.add_argument("paths", nargs="+", help="Folders or files to send")
    ap.add_argument("--port", type=int, default=8765)
    ap.add_argument("--compress", action="store_true", help="Compress (slower)")
    ap.add_argument("--internet", action="store_true", help="Also create a public link via cloudflared")
    args = ap.parse_args()

    missing = [p for p in args.paths if not os.path.exists(os.path.expanduser(p))]
    if missing:
        sys.exit("Not found: " + ", ".join(missing))

    print("Scanning files...")
    count, total = scan(args.paths)
    print(f"Found {count} files, {human(total)}.")

    token = secrets.token_urlsafe(12)  # secret part of the link
    zip_name = f"laptop-transfer-{time.strftime('%Y%m%d-%H%M')}.zip"
    handler = make_handler(args.paths, token, zip_name, args.compress, count, total)
    server = ThreadingHTTPServer(("0.0.0.0", args.port), handler)

    tunnel, public = (None, None)
    if args.internet:
        print("Creating internet link (this can take ~10 seconds)...")
        tunnel, public = start_tunnel(args.port)

    line = "=" * 64
    print(f"\n{line}\n  OPEN THIS LINK ON THE NEW LAPTOP:\n")
    print(f"  Same Wi-Fi / network:  http://{lan_ip()}:{args.port}/{token}/")
    if public:
        print(f"  From anywhere:         {public}/{token}/")
    elif args.internet:
        print("  (internet link could not be created; use the same-network link)")
    print(f"\n  Anyone with the link can download these files. Press Ctrl+C to stop.\n{line}\n")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped sharing.")
    finally:
        server.server_close()
        if tunnel:
            tunnel.terminate()


if __name__ == "__main__":
    main()
