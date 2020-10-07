var csi = new CSInterface();

var openButton = document.querySelector("#joinButton");
openButton.addEventListener("click", join);

//---------------------------------------------
function join() {
    csi.evalScript("", (log) => {
        console.log(log)
    })
}
