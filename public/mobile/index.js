let ready = false;
let code;
let connected = false;
const socket = io();

window.onload = function () {
  const button = document.querySelector("button#start");
  const codeInput = document.querySelector("input");

  if (navigator.userAgentData.mobile) {
    const mobileView = document.getElementById("mobile");
    mobileView.style.display = "block";
  } else {
    const desktopView = document.getElementById("desktop");
    desktopView.style.display = "block";
  }

  if (navigator.userAgentData.mobile) {
    function handleOrientation(e) {
      if (ready) {
        socket.emit("orientation", { code, value: e.gamma });
      }
    }

    window.addEventListener("deviceorientation", handleOrientation, true);
    button.addEventListener("click", () => {
      code = codeInput.value.toUpperCase();
      if (!code) {
        alert("Please enter the code first!");
        return;
      }

      socket.emit("connect mobile", { code, connected });
    });
  }

  // start the game
  socket.on("connected", () => {
    socket.emit("start");
    ready = true;
    button.innerHTML = "Playing!";
    codeInput.style.display = "none";
    connected = true;
  });

  socket.on("wrong code", (msg) => {
    alert(msg);
  });

  // On gameover, reset
  socket.on("mobile gameover", () => {
    button.innerHTML = "Restart";
    ready = false;
  });
};

window.addEventListener("beforeunload", () => {
  socket.emit("destroy", code);
});
