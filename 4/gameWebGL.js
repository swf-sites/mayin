var currentScriptPath = function () {

    var currentScript = document.currentScript.src;
    var currentScriptChunks = currentScript.split( '/' );
    var currentScriptFile = currentScriptChunks[ currentScriptChunks.length - 1 ];

    return currentScript.replace( currentScriptFile, '' );
}

function waitForElement(selector) {
  return new Promise(function(resolve, reject) {
    var element = document.querySelector(selector);

    if(element) {
      resolve(element);
      return;
    }

    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        var nodes = Array.from(mutation.addedNodes);
        for(var node of nodes) {
          if(node.matches && node.matches(selector)) {
            observer.disconnect();
            resolve(node);
            return;
          }
        };
      });
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });
  });
}

//var container = document.querySelector("#unity-container");
var canvas = document.querySelector("#unity-canvas");
var loadingBar = document.querySelector("#unity-loading-bar");
var progressBarFull = document.querySelector("#unity-progress-bar-full");
//var fullscreenButton = document.querySelector("#unity-fullscreen-button");
var warningBanner = document.querySelector("#unity-warning");

// Shows a temporary message banner/ribbon for a few seconds, or
// a permanent error message on top of the canvas if type=='error'.
// If type=='warning', a yellow highlight color is used.
// Modify or remove this function to customize the visually presented
// way that non-critical warnings and error messages are presented to the
// user.
function unityShowBanner(msg, type) {
    function updateBannerVisibility() {
      warningBanner.style.display = warningBanner.children.length ? 'block' : 'none';
    }
    var div = document.createElement('div');
    div.innerHTML = msg;
    warningBanner.appendChild(div);
    if (type == 'error') div.style = 'background: red; padding: 10px;';
    else {
      if (type == 'warning') div.style = 'background: yellow; padding: 10px;';
      setTimeout(function() {
        warningBanner.removeChild(div);
        updateBannerVisibility();
      }, 5000);
    }
    updateBannerVisibility();
}

var buildUrl = currentScriptPath();
var loaderUrl = buildUrl + "CrowdCity.loader.js";
var config = {
    dataUrl: buildUrl + "91a270136f302c211879b6089f19e5a7.data.unityweb",
    frameworkUrl: buildUrl + "23d46f564641864cbc91aa73d3dd0269.js.unityweb",
    codeUrl: buildUrl + "c09d8b21a0b4e0db839e5619050151aa.wasm.unityweb",
    streamingAssetsUrl: buildUrl + "StreamingAssets",
    companyName: "Dra.ru",
    productName: "CrowdCity",
    productVersion: "2.0",
    showBanner: unityShowBanner,
};


// By default Unity keeps WebGL canvas render target size matched with
// the DOM size of the canvas element (scaled by window.devicePixelRatio)
// Set this to false if you want to decouple this synchronization from
// happening inside the engine, and you would instead like to size up
// the canvas DOM size and WebGL render target sizes yourself.
// config.matchWebGLToCanvasSize = false;

if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
    // Mobile device style: fill the whole browser client area with the game canvas:

    var meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, height=device-height, initial-scale=1.0, user-scalable=no, shrink-to-fit=yes';
    document.getElementsByTagName('head')[0].appendChild(meta);
    
    //container.className = "unity-mobile";

    // To lower canvas resolution on mobile devices to gain some
    // performance, uncomment the following line:
    // config.devicePixelRatio = 1;

    // canvas.style.width = window.innerWidth + 'px';
    // canvas.style.height = window.innerHeight + 'px';

    //unityShowBanner('WebGL builds are not supported on mobile devices.');
} else {
// Desktop style: Render the game canvas in a window that can be maximized to fullscreen:
    //container.className = "unity-desktop";

    // canvas.style.width = "960px";
    // canvas.style.height = "600px";
}

loadingBar.style.display = "block";

var script = document.createElement("script");
script.src = loaderUrl;
var gameInstance = {};

//var canvas = document.querySelector("#gameContainer");
waitForElement("#unity-canvas").then(
	function(gameContainerCanvas) {
		script.onload = () => {
			createUnityInstance(gameContainerCanvas, config, (progress) => {
			  progressBarFull.style.width = 100 * progress + "%";
			}).then((unityInstance) => {
                loadingBar.style.display = "none";
				console.log("Unity Instance created");
			    gameInstance = unityInstance;
			    CallParameterless = gameInstance.Module.cwrap('call_cb_v', null, []);
				SendMessageInt = gameInstance.Module.cwrap('call_cb_vi', null, ['number']);
				SendMessageFloat = gameInstance.Module.cwrap('call_cb_vf', null, ['number']);
				SendMessageString = gameInstance.Module.cwrap('call_cb_vs', null, ['string']);
				SendMessageByteArray = gameInstance.Module.cwrap('call_cb_vb', null, ['number', 'number']);
				SendMessageVector3 = gameInstance.Module.cwrap('call_cb_vv3', null, ['number']);
				c_vv3json = gameInstance.Module.cwrap('call_cb_vv3json', null, ['string']);
				c_vx = gameInstance.Module.cwrap('call_cb_vx', null, ['number', 'number', 'number', 'number']);
				c_vxjson = gameInstance.Module.cwrap('call_cb_vxjson', null, ['string']);
				c_i = gameInstance.Module.cwrap('call_cb_i', 'number', []);
				c_f = gameInstance.Module.cwrap('call_cb_f', 'number', []);
				c_s = gameInstance.Module.cwrap('call_cb_s', 'string', []);

				gameInstance.SendMessage = function (param) {
					//console.log("gameInstance.SendMessage: " + param);
					if (param === undefined) {
						if (typeof this.SendMessage_vss != 'function')
							this.SendMessage_vss = CallParameterless;
						this.SendMessage_vss();
					} else if (typeof param === "string") {
						//console.log("SendMessage string ");
					
						if (typeof this.SendMessage_vsss != 'function')
							this.SendMessage_vsss = SendMessageString;
						this.SendMessage_vsss(param);
					} else if (typeof param === "number") {
						if (typeof this.SendMessage_vssn != 'function')
							this.SendMessage_vssn = SendMessageFloat;
						this.SendMessage_vssn(param);
					} else if (param instanceof Uint8Array) {
						if (typeof this.SendMessage_vb != 'function')
							this.SendMessage_vb = SendMessageByteArray;
						var ptr = gameInstance.Module._malloc(param.byteLength);
						var dataHeap = new Uint8Array(gameInstance.Module.HEAPU8.buffer, ptr, param.byteLength);
						dataHeap.set(param);

						this.SendMessage_vb(ptr, param.length);
					} else
						throw "" + param + " is does not have a type which is supported by SendMessage.";
				};
				//gameInstance.SendMessage("{\"eventName\": \"getPlayerId\",\"data\": {\"playerId\": \"" + window.player_id + "\"}}");
			}).catch((message) => {
			  alert(message);
			});
		};

	}
);

document.body.appendChild(script);

window.sendMessageToUnity = function (data) {

    if (!(data instanceof Uint8Array)) {
        //data = msgpack.encode(data)
    }

    if (window.gameInstance.SendMessage === undefined) {
        console.log("Undefined SendMessage function");
    } else {
		//console.log("gameInstance 2 == " + gameInstance.SendMessage);
        gameInstance.SendMessage(data);
    }
};

// this function is called by Unity when game is over and score is sent to server
function gameOver() {
	window.gameOverParent();
// hide webGL unity div and show web div
}
