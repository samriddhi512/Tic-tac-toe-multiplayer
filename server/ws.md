WebSocket {
// Connection state
readyState: 1, // 0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED
protocol: '',

// Event handlers
on: [Function], // Method to add event listeners
send: [Function], // Method to send data
close: [Function], // Method to close connection

// Network info
url: '/',
protocolVersion: 13,

// Binary extensions
binaryType: 'nodebuffer',

// Your custom property (we add this)
playerId: 'abc123' // ← We added this with ws.playerId = playerId

// Other internal properties...
}

Question Answer
What's in ws? WebSocket instance (connection object) with built-in + custom properties
Different ws per tab? Yes, each connection creates a unique ws object
How does close handler know playerId? Closure; the inner callback keeps a reference to the outer variable
Why ws.playerId? To access the ID on the object when you have the ws instance
