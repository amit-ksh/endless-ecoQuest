var express = require("express");
var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);

const port = process.env.PORT || 3000;

app.use("/", express.static(__dirname + "/public/desktop"));
app.use("/mobile", express.static(__dirname + "/public/mobile"));

io.on("connection", function (socket) {
  socket.on("start", function () {
    io.emit("start game");
  });

  socket.on("orientation", function (e) {
    io.emit("mobile orientation", e);
  });

  socket.on("gameover", function () {
    io.emit("mobile gameover");
  });
});

http.listen(port, async () => {
  console.log(`Game running at http://localhost:${port}`);
});
