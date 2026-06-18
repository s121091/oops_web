// Update the digital clock on the page
function updateClock() {
    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth() + 1;
    var day = now.getDate();
    var hours = now.getHours();
    var minutes = now.getMinutes();
    var seconds = now.getSeconds();

    // Add leading zero if needed (so 1 -> "01")
    if (month < 10){month = "0" + month;}
    if(day < 10){day = "0" + day;}
    if(hours < 10){hours = "0" + hours;}
    if(minutes < 10){minutes = "0" + minutes;}
    if(seconds < 10){seconds = "0" + seconds;}

    // Show date and time in the HTML
    document.getElementById("day").innerText = day + "-" + month + "-" + year;
    document.getElementById("time").innerText = hours + ":" + minutes + ":" + seconds;
}

// Start the digital clock
function Clock(){
    setInterval(updateClock, 1000);
}

var pictureSwitchCounter = 0;   // Tracks which picture we are showing

// Change the product picture every time
function switch_picture(){
    var path = document.getElementById("products_card");
    var picture_location_array = [
        '../image/americano.png', '../image/mixedFruitTea.png',
        '../image/cappuccino.png', '../image/chamomileTea.png',
        '../image/earltGreyTea.png', '../image/espresso.png',
        '../image/jasmineGreenTea.png', '../image/latte.png',
        '../image/mocha.png', '../image/roastedOolongTea.png',
    ];

    // Insert new image
    $(path).html('<img src="' + picture_location_array[pictureSwitchCounter] + '" alt="Product Image" style="width: 100%; height: auto; display:none;">');

    // Fade it in slowly
    $(path).find("img").fadeIn(800);

    pictureSwitchCounter++;

    // Go back to first picture after the last one
    if (pictureSwitchCounter === picture_location_array.length){
        pictureSwitchCounter = 0;
    }
}

// Start the picture slideshow (change every 2 seconds)
function switch_clock(){
    switch_picture();   // Show the first picture
    setInterval(switch_picture, 2000);
}

// Check password using a popup (used for navigation)
function checkPassword_nav() {
    let password = prompt("Please type in the passcode：", "");

    if (password === "JavaScript") {
        alert("Passcode correct! Welcome~");
        window.location.href = "../Founder/founder.html";
    } else if (password === null) {
    } else {
        alert("Incorrect passcode, please try again!");
    }
}

// Check password from an input field on the page
function checkPassword() {
    let password = document.getElementById('passcode_input').value;
    if (password === "JavaScript") {
        alert("Passcode correct!🙂 Welcome~");
        window.location.href = "../Founder/founder.html";
    } else if (password === null) {
    } else {
        alert("Incorrect passcode😡, please try again!");
    }
}

var submenu = document.getElementById("submenu");
var timer;

// Show submenu
function showSubMenu() {
  clearTimeout(timer);
  submenu.style.opacity = "1";
  submenu.style.visibility = "visible";
}

// Hide submenu after 200ms
function hideSubMenu() {
  timer = setTimeout(function() {
    submenu.style.opacity = "0";
    submenu.style.visibility = "hidden";
  }, 200);
}

// Setup for the analog clock drawn on canvas
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let radius = canvas.height / 2;
ctx.translate(radius, radius);
radius = radius * 0.90;

// Draw the full analog clock
function drawClock() {
  drawFace(ctx, radius);
  drawMarks(ctx, radius);
  drawTime(ctx, radius);
}

// Draw the white clock face
function drawFace(ctx, radius) {
  const grad = ctx.createRadialGradient(0, 0 ,radius * 0.95, 0, 0, radius * 1.05);

  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, 2 * Math.PI);
  ctx.fillStyle = 'white';
  ctx.fill();

  ctx.strokeStyle = grad;
  ctx.lineWidth = radius*0.1;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.08, 0, 2 * Math.PI);
  ctx.fillStyle = '#b5b5b5';
  ctx.fill();
}

// Draw the 60 tick marks
function drawMarks(ctx, radius) {
  ctx.lineCap = 'round';

  for(let num = 0; num < 60; num++){
    let ang = num * Math.PI / 30;
    ctx.rotate(ang);
    
    if(num % 5 === 0){
      ctx.strokeStyle = '#333';
      ctx.lineWidth = radius * 0.03;
      ctx.beginPath();
      ctx.moveTo(0, -radius * 0.75);
      ctx.lineTo(0, -radius * 0.95);
      ctx.stroke();
    }
    else {
      ctx.strokeStyle = '#666';
      ctx.lineWidth = radius * 0.01;
      ctx.beginPath();
      ctx.moveTo(0, -radius * 0.85);
      ctx.lineTo(0, -radius * 0.95);
      ctx.stroke();
    }
    
    ctx.rotate(-ang);
  }
}

// Draw hour, minute, and second hands based on current time
function drawTime(ctx, radius) {
  const now = new Date();
  let hour = now.getHours();
  let minute = now.getMinutes();
  let second = now.getSeconds();
  
  hour = hour%12;
  hour = (hour*Math.PI/6)+(minute*Math.PI/(6*60))+(second*Math.PI/(360*60));
  drawHand(ctx, hour, radius*0.5, radius*0.06, 'black');
  minute = (minute*Math.PI/30)+(second*Math.PI/(30*60));
  drawHand(ctx, minute, radius*0.8, radius*0.06, 'black');
  second = (second*Math.PI/30);
  drawHand(ctx, second, radius*0.9, radius*0.03, 'orange');
}

// Draw clock hand
function drawHand(ctx, pos, length, width, color) {
  ctx.beginPath();
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.strokeStyle = color;
  ctx.moveTo(0,0);
  ctx.rotate(pos);
  ctx.lineTo(0, -length);
  ctx.stroke();
  ctx.rotate(-pos);
}

setInterval(drawClock, 1000);   // Update the analog clock every second

// Go to main page
var button_click = document.getElementById("home_button");
button_click.onclick = function() {
  window.location.href = "../main_page/index.html"
}