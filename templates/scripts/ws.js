const host = location.host;
const socket = new WebSocket(`ws://${host}/`);
socket.addEventListener("message", (event) => {
  if (event.data == "connected") {
    console.log("Live reload connected.");
  }
  if (event.data == "reload") {
    socket.close();
    location.reload();
  }
  return false;
});
