const express = require("express");
const { WebSocketServer } = require("ws");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const wss = new WebSocketServer({ server });

let mcClient = null;

wss.on("connection", (ws, req) => {
    console.log("🔥 Connection opened:", req.headers['user-agent']);

    ws.on("message", (message) => {
        const data = message.toString();
        console.log("📩 Message:", data);

        try {
            const json = JSON.parse(data);

            // If it has a header, assume it's Minecraft
            if (json.header) {
                console.log("✅ Minecraft connected!");
                mcClient = ws;
            }

        } catch {
            // Not JSON = website command
            console.log("🌐 Website command:", data);

            if (mcClient) {
                const cmdPacket = {
                    header: {
                        version: 1,
                        requestId: Date.now().toString(),
                        messageType: "commandRequest",
                        messagePurpose: "commandRequest"
                    },
                    body: {
                        version: 1,
                        commandLine: data,
                        origin: {
                            type: "player"
                        }
                    }
                };

                mcClient.send(JSON.stringify(cmdPacket));
            } else {
                ws.send("❌ Minecraft not connected");
            }
        }
    });

    ws.on("close", () => {
        console.log("🔌 Connection closed");

        if (ws === mcClient) {
            mcClient = null;
            console.log("⚠️ Minecraft disconnected");
        }
    });
});
