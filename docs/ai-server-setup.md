# AI server setup (GLM-OCR on the RTX 5090)

The AI that reads invoice photos runs on the headless Ubuntu server with
the RTX 5090. The app reaches it through **Tailscale**, a private network
between your own machines. Nothing on the internet can reach the AI, and
invoice photos never leave your hardware.

Run everything below **on the Ubuntu server** (over SSH), except where it
says "on the laptop".

## 1. Check the GPU

```
nvidia-smi
```

You should see `NVIDIA GeForce RTX 5090`. RTX 50-series cards need driver
570 or newer. If the command is missing, install the driver and reboot:

```
sudo ubuntu-drivers install
sudo reboot
```

## 2. Tailscale (the private network)

```
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

Open the link it prints and log in. Then note the server's private
address — it starts with `100.`:

```
tailscale ip -4
```

**On the laptop:** install Tailscale from https://tailscale.com/download
and log in with the same account.

## 3. Ollama and the model

```
curl -fsSL https://ollama.com/install.sh | sh
ollama pull glm-ocr
```

The installer sets Ollama up as a service that starts with the machine.
Pull the model **before** step 4: afterwards the `ollama` command on the
server needs the address too (see "Useful commands").

## 4. Make Ollama answer on the Tailscale address only

By default Ollama only answers the server itself. Make it listen on the
Tailscale address — and only there, so no other network can reach it
(no firewall changes needed):

```
sudo systemctl edit ollama
```

In the editor that opens, add these lines in the empty area near the top
(use your own `100.` address), then save and close:

```
[Unit]
After=tailscaled.service
Wants=tailscaled.service

[Service]
Environment="OLLAMA_HOST=100.x.y.z:11434"
```

Then:

```
sudo systemctl restart ollama
```

## 5. Test from the laptop (PowerShell)

```
curl.exe http://100.x.y.z:11434/v1/models
```

The answer should list `glm-ocr`.

## 6. Point the app at it

In the repo's `.env` (on the laptop):

```
LLM_BASE_URL=http://100.x.y.z:11434/v1
OCR_MODEL=glm-ocr
```

## Useful commands (on the server)

- Ollama's recent log: `journalctl -u ollama -n 50`
- List models: `OLLAMA_HOST=100.x.y.z:11434 ollama list`
- Restart: `sudo systemctl restart ollama`

If `ollama pull glm-ocr` says the model doesn't exist, check the exact
name at https://ollama.com/library and put that name in `OCR_MODEL`.
