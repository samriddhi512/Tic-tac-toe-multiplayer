You call:    new WebSocket('ws://localhost:8080')
             ↓
Browser:     "Wait, ws:// protocol? I need to upgrade!"
             ↓
Browser:     Sends HTTP request with Upgrade: websocket headers
             ↓
Your Server: Receives the request
             ↓
`ws` library: "Oh! This has Upgrade: websocket headers!"
             ↓
`ws` library: Automatically responds with "101 Switching Protocols"
             ↓
Connection:  Now upgraded to WebSocket protocol
             ↓
Your code:   wss.on('connection', ...) fires!