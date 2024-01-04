var express = require("express");
var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);

const port = process.env.PORT || 3000;

app.use("/", express.static(__dirname + "/public/desktop"));
app.use("/mobile", express.static(__dirname + "/public/mobile"));

// key -> code, value: connected
const rooms = new Map();

io.on("connection", function (socket) {
  socket.on("create room", (code) => {
    code = code.toUpperCase();
    rooms.set(code, {
      desktop: socket.id,
      mobile: null,
    });
  });

  socket.on("destroy", (code) => {
    code = code?.toUpperCase();

    if (rooms.has(code)) {
      const room = rooms.get(code);
      if (room.desktop == socket.conn.id) {
        rooms.delete(code);
      } else {
        room.mobile = null;
      }
    }
  });

  socket.on("connect mobile", (data) => {
    code = data.code?.toUpperCase();

    if (data.connected) {
      socket.emit("connected");
      return;
    }

    const room = rooms.get(code);
    if (room && room.mobile) {
      socket.emit("wrong code", "Another user already connected!");
    }
    if (!room) {
      socket.emit("wrong code", "Please enter the code correctly!");
      return;
    }

    room.mobile = socket.id;
    socket.emit("connected");
  });

  socket.on("start", function () {
    io.emit("start game");
  });

  socket.on("orientation", function (e) {
    const room = rooms.get(e.code);
    if (!room?.desktop) return;

    socket.to(room.desktop).emit("mobile orientation", e.value);
  });

  socket.on("gameover", function () {
    io.emit("mobile gameover");
  });
});

http.listen(port, async () => {
  console.log(`Game running at http://localhost:${port}`);
});
