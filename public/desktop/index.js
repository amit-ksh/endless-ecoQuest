import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

let socket;
let container;
let obstacles = [];
let score = 50;
let scoreInterval = null;
let id = 0;
let counter = 3;

let scene,
  camera,
  renderer,
  simplex,
  plane,
  geometry,
  xZoom,
  yZoom,
  noiseStrength;
let car,
  obstacle,
  bike,
  curVehicle = "bike",
  changeVehicleInterval = null,
  switchTimeout;
let explodeSound;

let bluetoothConnected = false;
let gameStarted = false;
let gameOver = false;
let zOrientation = 0;
let sound;
var loadingEl, connectMessage, audioBtn, gameOverModal, vechilesModal;
const modelLoaded = {
  bike: false,
  car: false,
  obstacle: false,
};

setup();
init();
draw();

let timeout = setInterval(() => {
  if (!modelLoaded.car && !modelLoaded.obstacle) return;
  if (!connectMessage && !loadingEl) return;

  connectMessage.style.display = "block";
  loadingEl.style.display = "none";
  clearInterval(timeout);
}, 100);

function setup() {
  setupNoise();
  setupCarModel();
  setupBikeModel();
  setupObstacleModel();
  setupScene();
  setupSound();
  setupPlane();
  setupLights();
}

function setupSound() {
  sound = new Audio("sound/heavy-racing.mp3");
  sound.loop = true;
  sound.volume = 0.7;
}

function setupNoise() {
  xZoom = 7;
  yZoom = 15;
  noiseStrength = 3;
  simplex = new SimplexNoise();
}

function setupScene() {
  scene = new THREE.Scene();

  let res = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera(75, res, 0.1, 1000);
  camera.position.set(0, -20, 1);
  camera.rotation.x = -300;

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.autoClear = false;
  renderer.setClearColor(0x000000, 0.0);
  renderer.setClearAlpha(1.0);

  document.body.appendChild(renderer.domElement);
}

// Load & spawn car model
function setupCarModel() {
  var loader = new GLTFLoader();
  loader.load(
    "assets/car.glb",
    function (gltf) {
      car = gltf.scene;
      car.position.set(0, -18.7, 0.2);
      car.rotation.set(1.5, -1.55, 0);
      car.scale.set(0.3, 0.3, 0.3);

      gltf.scene.traverse(function (child) {
        if (child.isMesh) {
          car.vertices = child.geometry.attributes.position.array;
        }
      });

      bike.name = "car";

      // scene.add(car);
      // renderer.render(scene, camera);
      modelLoaded.car = true;
    },
    // called while loading is progressing
    function (xhr) {
      if (!loadingEl) return;
      loadingEl.querySelector("#car").innerHTML = `Loading car model: <span>${(
        (xhr.loaded / xhr.total) *
        100
      ).toFixed(2)}%</span>`;
    },
    // called when loading has errors
    function (error) {
      alert("An error occured while loading Car model! Refresh!");
    },
  );
}
// Load & spawn bike model
function setupBikeModel() {
  var loader = new GLTFLoader();
  loader.load(
    "assets/bike.glb",
    function (gltf) {
      bike = gltf.scene;
      bike.position.set(0, -18.7, 0);
      bike.rotation.set(1.5, -3.1, 0);
      bike.scale.set(0.015, 0.015, 0.015);

      const bikeMaterial = new THREE.MeshStandardMaterial({
        color: 0xcdffd4,
        metalness: 0.4,
        roughness: 0.7,
      });
      gltf.scene.traverse(function (child) {
        if (child.isMesh) {
          bike.vertices = child.geometry.attributes.position.array;
          child.material = bikeMaterial;
        }
      });

      bike.name = "bike";

      scene.add(bike);
      renderer.render(scene, camera);
      modelLoaded.bike = true;
    },
    // called while loading is progressing
    function (xhr) {
      if (!loadingEl) return;
      loadingEl.querySelector("#bike").innerHTML =
        `Loading bike model: <span>${((xhr.loaded / xhr.total) * 100).toFixed(
          2,
        )}%</span>`;
    },
    // called when loading has errors
    function (error) {
      alert("An error occured while loading Bike model! Refresh!");
    },
  );
}

//Load obstacle model
function setupObstacleModel() {
  var loader = new GLTFLoader();
  loader.load(
    "assets/tree.glb",
    function (gltf) {
      obstacle = gltf.scene;
      obstacle.position.set(0, -16, 0);
      obstacle.rotation.set(1.6, 0, 0);
      bike.scale.set(0.03, 0.03, 0.03);

      gltf.scene.traverse(function (child) {
        if (child.isMesh) {
          obstacle.vertices = child.geometry.attributes.position.array;
        }
      });

      modelLoaded.obstacle = true;
    },
    // called while loading is progressing
    function (xhr) {
      if (!loadingEl) return;
      loadingEl.querySelector("#obstacle").innerHTML =
        `Loading obstacle model: <span>${(
          (xhr.loaded / xhr.total) *
          100
        ).toFixed(2)}%</span>`;
    },
    // called when loading has errors
    function (error) {
      alert("An error occured while loading obstacle model! Refresh!");
    },
  );
}

function setupPlane() {
  let side = 120;
  geometry = new THREE.PlaneGeometry(40, 40, side, side);
  geometry.vertices = geometry.attributes.position.array;

  let material = new THREE.MeshStandardMaterial({
    color: new THREE.Color("rgb(0, 0, 0)"),
    metalness: 0.7,
    roughness: 0.55,
  });

  plane = new THREE.Mesh(geometry, material);
  plane.castShadow = true;
  plane.receiveShadow = true;
  scene.add(plane);

  const wireframeGeometry = new THREE.WireframeGeometry(geometry);
  const wireframeMaterial = new THREE.LineBasicMaterial({
    color: "rgb(200, 255, 0)",
  });
  const wireframe = new THREE.LineSegments(
    wireframeGeometry,
    wireframeMaterial,
  );

  plane.add(wireframe);
}

function setupLights() {
  let directionalLight = new THREE.DirectionalLight(0xffffff, 2);
  directionalLight.position.set(10, 10, 10);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  let ambientLight = new THREE.AmbientLight(new THREE.Color(0xffffff), 1);
  ambientLight.position.set(10, 0, 10);
  scene.add(ambientLight);
}

function onWindowResize() {
  1;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function init() {
  scene.fog = new THREE.FogExp2(new THREE.Color("#5a008a"), 0.0003);

  container = document.getElementById("ThreeJS");
  container.appendChild(renderer.domElement);
  renderer.render(scene, camera);

  window.addEventListener("resize", onWindowResize);

  window.addEventListener("keyup", (e) => {
    const canChangeVehicle = !vechilesModal.classList.contains("fade-out");
    if (e.code === "ArrowLeft" && !gameOver && canChangeVehicle) {
      switchToCar();
    }
    if (e.code === "ArrowRight" && !gameOver && canChangeVehicle) {
      switchToBike();
    }
  });
}

function draw() {
  if (gameOver) {
    try {
      gameOverModal;
      sound.pause();
      clearInterval(changeVehicleInterval);
      clearInterval(scoreInterval);
    } catch (e) {
      console.error("Error: Playing the sound" + e);
    }

    gameOverModal.querySelector(
      score <= 0 ? "#success" : "#fail",
    ).style.display = "block";
    gameOverModal.classList.remove("fade-out");

    socket.emit("gameover");
    return;
  }

  adjustVertices(new Date() * 0.0003);

  if (gameStarted) {
    requestAnimationFrame(draw);
    update();
  }

  renderer.render(scene, camera);
}

// Create terrains
function adjustVertices(offset) {
  for (let i = 0; i < geometry.vertices.length; i += 3) {
    let x = geometry.vertices[i] / xZoom;
    let y = geometry.vertices[i + 1] / yZoom;

    // terrain
    if (geometry.vertices[i] < -2.5 || geometry.vertices[i] > 2.5) {
      let noise = simplex.noise2D(x, y + offset) * noiseStrength;
      geometry.vertices[i + 2] = noise;
    }
  }
  geometry.attributes.position.needsUpdate = true;
  geometry.computeVertexNormals();
}

// Game Update Function
function update() {
  // LEFT
  let crash = false;
  if (zOrientation > 0) {
    bike.position.x = Math.max(-2, bike.position.x - Math.abs(zOrientation));
    car.position.x = Math.max(-2, car.position.x - Math.abs(zOrientation));
  }
  // RIGHT
  if (zOrientation < 0) {
    bike.position.x = Math.min(2, bike.position.x + Math.abs(zOrientation));
    car.position.x = Math.min(2, car.position.x + Math.abs(zOrientation));
  }

  for (let i = 0; i < obstacles.length; i++) {
    let collision = false;

    if (curVehicle === "bike") {
      collision = bike.position.distanceTo(obstacles[i].position) < 0.4;
    } else {
      collision = car.position.distanceTo(obstacles[i].position) < 0.4;
    }

    if (collision && !obstacles[i].hit) {
      crash = true;
      score += 5;
      obstacles[i].hit = true;
      scene.remove(obstacles[i]);
      explodeSound.play();
    } else {
      crash = false;
    }
  }

  score = Math.max(Math.min(100, Math.floor(score)), 0);

  if (score <= 0 || score >= 100) {
    gameOver = true;
  }

  if (Math.random() < 0.03 && obstacles.length < 6 && !gameOver) {
    makeRandomCube();
  }

  for (let i = 0; i < obstacles.length; i++) {
    if (obstacles[i].position.y < -20) {
      scene.remove(obstacles[i]);
      obstacles.splice(i, 1);
    } else {
      obstacles[i].position.y -= 0.05;
    }
  }

  document.documentElement.style.setProperty("--progress", `${score}`);
}

function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

// Spawn obstacles
function makeRandomCube() {
  const newobstacle = obstacle.clone();
  newobstacle.position.set(
    getRandomArbitrary(-2, 2),
    getRandomArbitrary(50, 0),
    0,
  );

  obstacles.push(newobstacle);
  newobstacle.name = "box_" + id;
  id++;

  scene.add(newobstacle);
}

function displayCounter() {
  const counterDiv = document.querySelector(".counter");
  if (counterDiv.classList.contains("fade-out")) {
    counterDiv.classList.remove("fade-out");
  }
  counterDiv.innerHTML = counter;
  if (counter > 0) {
    counter--;
  } else if (counter === 0) {
    clearInterval(interval);
    counterDiv.classList.add("fade-out");
    gameStarted = true;
    draw();

    changeVehicleInterval = setInterval(() => {
      vechilesModal.classList.remove("fade-out");

      switchTimeout = setTimeout(() => {
        vechilesModal.classList.add("fade-out");
        clearTimeout(switchTimeout);
      }, 5 * 1000);
    }, 10 * 1000);

    scoreInterval = setInterval(() => {
      if (curVehicle === "car") {
        score += 1;
      } else {
        score -= 0.5;
      }
    }, 1000);
  }
}

let interval;

const switchToCar = () => {
  clearTimeout(switchTimeout);
  vechilesModal.classList.add("fade-out");
  if (curVehicle == "car") return;

  curVehicle = "car";
  car.position.x = bike.position.x;

  scene.remove(bike);
  scene.add(car);
};

const switchToBike = () => {
  clearTimeout(switchTimeout);
  vechilesModal.classList.add("fade-out");
  if (curVehicle == "bike") return;

  curVehicle = "bike";
  bike.position.x = car.position.x;

  scene.remove(car);
  scene.add(bike);
};

function reset() {
  crash = false;
  id = 0;
  counter = 3;
  score = 50;

  gameStarted = false;
  gameOver = false;
  zOrientation = 0;

  for (let i = 0; i < obstacles.length; i++) {
    scene.remove(obstacles[i]);
    obstacles.pop();
  }
  obstacles.length = 0;

  for (let i = 0; i < scene.children.length; i++) {
    const obj = scene.children[i];
    if (/box_/i.test(obj?.name)) {
      scene.remove(obj);
    }
  }
  obstacles = [];

  renderer.render(scene, camera);
  bike.position.set(0, -18.7, 0);
  car.position.set(0, -18.7, 0);

  gameOverModal.querySelector(".pollution").innerHTML = score;
  gameOverModal.classList.add("fade-out");

  bluetoothConnected = false;
}

window.onload = () => {
  if (!navigator.userAgentData.mobile) {
    let previousValue;
    connectMessage = document.getElementById("connect");
    connectMessage.querySelector("p strong").innerHTML =
      `${window.origin}/mobile`;

    explodeSound = document.getElementById("explode_sound");
    loadingEl = document.querySelector(".loader");
    audioBtn = document.querySelector("button.audio");
    gameOverModal = document.querySelector(".game-over-container");
    vechilesModal = document.querySelector(".vehicles");

    audioBtn.addEventListener("click", () => {
      if (sound.paused) {
        sound.play();
        audioBtn.classList.add("playing");
      } else {
        sound.pause();
        audioBtn.classList.remove("playing");
      }
    });

    socket = io();

    socket.on("start game", () => {
      if (!gameOver) return;
      reset();
    });

    socket.on("mobile orientation", (e) => {
      if (!bluetoothConnected) {
        score = 50;
        bluetoothConnected = true;
        connectMessage.classList.add("fade-out");

        const title = document.getElementsByClassName("title")[0];
        title.classList.add("fade-out");

        interval = setInterval(function () {
          displayCounter();
        }, 1000);
      }

      if (previousValue !== e) {
        zOrientation = -e / 300;
      }
      previousValue = e;
    });
  }
};
