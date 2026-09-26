# Laptop-to-laptop transfer (one link)

`share.py` turns your old laptop into a temporary download link. Open the link on
the new laptop and it downloads everything as a single `.zip`, straight from the
old laptop. Nothing is uploaded to the cloud and there is no size limit.

## Steps

1. **Old laptop**: install Python 3 if needed (https://www.python.org/downloads/ —
   on Windows tick "Add Python to PATH"). macOS/Linux already have `python3`.
2. Copy `share.py` to the old laptop (e.g. to Desktop).
3. Open a terminal (Windows: PowerShell; macOS: Terminal) in that folder and run:

   ```bash
   # macOS / Linux
   python3 share.py ~/Documents ~/Pictures ~/Desktop

   # Windows
   python share.py "$HOME\Documents" "$HOME\Pictures" "$HOME\Desktop"
   ```

   If Windows asks about the firewall, click **Allow** (Private networks).
4. It prints a link like `http://192.168.1.23:8765/Abc123.../`.
5. **New laptop** (on the same Wi-Fi): open that link in a browser, click
   **Download**, then unzip the file.
6. Press `Ctrl+C` on the old laptop when the download has finished.

## Laptops on different networks

Install the free `cloudflared` on the old laptop
(Windows: `winget install Cloudflare.cloudflared`, macOS: `brew install cloudflared`)
and add `--internet`:

```bash
python3 share.py ~/Documents --internet
```

You'll also get an `https://....trycloudflare.com/...` link that works from anywhere.

## Tips

- Keep the old laptop plugged in and awake during the transfer.
- Same-network is fastest; an Ethernet cable on both is faster still.
- `--compress` makes the zip smaller for documents (not for photos/videos) but is slower.
- The link contains a random secret; anyone who has it can download, so don't post it publicly.
