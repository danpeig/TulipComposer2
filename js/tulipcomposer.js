/* =============================================================
/   *
    * Tulip Composer Version 2.0 (30/08/2019)
	* Developed by Daniel BP (daniel@danbp.org)
	*
	* https://www.danbp.org
	*
	*	This program is free software: you can redistribute it and/or modify
	*	it under the terms of the GNU General Public License as published by
	*	the Free Software Foundation, either version 3 of the License, or
	*	(at your option) any later version.
	*
	*	This program is distributed in the hope that it will be useful,
	*	but WITHOUT ANY WARRANTY; without even the implied warranty of
	*	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
	*	GNU General Public License for more details.
	*
	*	You should have received a copy of the GNU General Public License
	*	along with this program.  If not, see <http://www.gnu.org/licenses/>.
	*
/* =============================================================*/

"use strict"; //Prevents the use of undeclared variables

let svgNamespace = "http://www.w3.org/2000/svg";

//Bind to the HTML elements
let layerSelect = document.getElementById("layers");
let SVGCanvas = document.getElementById("SVGCanvas");
let canvasSize = document.getElementById("canvasSize");

//Some settings
let canvasHeight = 300;
let canvasWidth = canvasHeight;
let resizeLock = false;
let exportCount = 1; //Exports numbered svg files... 001, 002, etc...
let idCount = 1; //Creates a unique ID for imported/new objects

//let SVGLayers; //Select all the layers in the SVG Canvas
let layerMap; //Stores coordinates for all workable layers
let layerCount; //Number of active layers
let activeLayerIndex = 0; //Index of the active layer in the layer map
let activeLayer; //Active layer element
let activeLayerTransformList; //List of transformations

//Initialization functions (after the HTML page loaded)
window.onload = function () {
    setSize(canvasHeight);
    canvasSize.value = canvasHeight;
    resetCanvas();
    importDB("Decoration");
    importDB("From");
    importDB("To");
    importDB("Tracks");
    importDB("Objects");
    importDB("Obstacles");
    importDB("IcoMoon");
};

//Add action to the buttons
let buttons = document.getElementsByTagName("button");
for (const key in buttons) {
    if (buttons.hasOwnProperty(key)) {
        const element = buttons[key];
        element.onclick = window[element.id];
    }
}

//Add the actions to the interface controls
layerSelect.onchange = function () {
    setActiveLayer(layerSelect.selectedIndex);
}

//Set canvas size
function setSize(newSize) {
    let oldSize = canvasHeight;
    canvasHeight = canvasWidth = newSize
    SVGCanvas.setAttribute("width", canvasWidth + "px");
    SVGCanvas.setAttribute("height", canvasHeight + "px");
    let textFields = SVGCanvas.getElementsByTagName("text");
}

function resetCanvas() {
    while (SVGCanvas.lastChild) {
        SVGCanvas.removeChild(SVGCanvas.lastChild);
    }
    updateLayerMap();
    setActiveLayer(0);
    updateLayerSelect();
    setSize(canvasSize.value);
}

//Color picker for the layers
const pickr = Pickr.create({
    el: '.color-picker',
    theme: 'classic',
    default: '#000000',
    swatches: [
        'rgba(244, 67, 54, 1)',
        'rgba(233, 30, 99, 1)',
        'rgba(156, 39, 176, 1)',
        'rgba(103, 58, 183, 1)',
        'rgba(63, 81, 181, 1)',
        'rgba(33, 150, 243, 1)',
        'rgba(3, 169, 244, 1)',
        'rgba(0, 188, 212, 1)',
        'rgba(0, 150, 136, 1)',
        'rgba(76, 175, 80, 1)',
        'rgba(139, 195, 74, 1)',
        'rgba(205, 220, 57, 1)',
        'rgba(255, 235, 59, 1)',
        'rgba(255, 193, 7, 1)',
        'rgba(255, 255, 255, 1)',
        'rgba(0, 0, 0, 1)',
    ],
    components: {
        // Main components
        preview: true,
        opacity: true,
        hue: true,

        // Input / output Options
        interaction: {
            hex: true,
            rgba: true,
            hsla: true,
            hsva: true,
            cmyk: true,
            input: true,
            clear: true,
            save: true
        }
    }
});
pickr.on('save', (color, instance) => {
    setColor(color.toHEXA().toString());
});

function updateLayerMap() {
    let SVGLayers = SVGCanvas.getElementsByTagName("g"); //Select all the groups in the SVG Canvas
    layerCount = 0;
    layerMap = new Array();
    for (let i = 0; i < SVGLayers.length; i++) //Filter only the first child groups
        if (SVGLayers[i].parentNode == SVGCanvas) {
            layerMap[layerCount] = SVGLayers[i];
            layerCount++;
        }
}

function setActiveLayer(layerIndex) {
    if (layerCount > 0) {
        activeLayerIndex = layerIndex;
        activeLayer = layerMap[activeLayerIndex];
        activeLayerTransformList = activeLayer.transform.baseVal;
        console.log("Active layer changed to: " + layerMap[activeLayerIndex].label);
    }
}

//Udate the layer select box
function updateLayerSelect() {

    layerSelect.length = 0;
    for (var i = 0; i < layerCount; i++) {
        var opt = layerMap[i].label;
        var el = document.createElement("option");
        el.textContent = (i+1)+". "+opt;
        el.value = opt;
        layerSelect.appendChild(el);
    }
    layerSelect.selectedIndex = activeLayerIndex;
}

//Define the active layer from the select box
function setActiveLayerFromList(layerIndex) {
    if (layerSelect.selectedIndex > -1) setActiveLayer(layerSelect.selectedIndex);
}

//Clear all transformations from the active layer
function resetLayer() {
    if (layerCount > 0) {
        activeLayerTransformList.clear();
    }
}

//Delete the active layer
function deleteLayer() {
    if (layerCount > 0) {
        console.log("Active layer deleted: " + layerMap[activeLayerIndex].label);
        layerSelect.removeChild(layerSelect.childNodes[activeLayerIndex]);
        SVGCanvas.removeChild(activeLayer);
        updateLayerMap();
        setActiveLayer(0);
        updateLayerSelect();
    }
}

//Set the color of the active layer
function setColor(newColor) {
    if (layerCount > 0) {
        let svgElements = activeLayer.getElementsByTagName("*")
        for (const key in svgElements) {
            if (svgElements.hasOwnProperty(key)) {
                let svgTag = svgElements[key];
                if (svgTag.style.stroke != "none") svgTag.style.stroke = newColor;
                if (svgTag.style.fill != "none") svgTag.style.fill = newColor;
            }
        }
        console.log("Set color of " + layerMap[activeLayerIndex].label + " to " + newColor);
    }
}

function moveUp() {
    if (layerCount > 0) {
        let move = activeLayer.parentNode.createSVGTransform(); //Create a transformation
        move.setTranslate(0, -canvasHeight / 20); //Set the transformation type
        //activeLayerTransformList.appendItem(move);
        activeLayerTransformList.insertItemBefore(move,0); //Put the transformation in the list
        console.log("Move up: " + layerMap[activeLayerIndex].label);
    }
}

function moveDown() {
    if (layerCount > 0) {
        let move = activeLayer.parentNode.createSVGTransform();
        move.setTranslate(0, canvasHeight / 20);
        //activeLayerTransformList.appendItem(move);
        activeLayerTransformList.insertItemBefore(move,0);
        console.log("Move down: " + layerMap[activeLayerIndex].label);
    }
}

function moveLeft() {
    if (layerCount > 0) {
        let move = activeLayer.parentNode.createSVGTransform();
        move.setTranslate(-canvasWidth / 20, 0);
        //activeLayerTransformList.appendItem(move);
        activeLayerTransformList.insertItemBefore(move,0);
        console.log("Move left: " + layerMap[activeLayerIndex].label);
    }
}

function moveRight() {
    if (layerCount > 0) {
        let move = activeLayer.parentNode.createSVGTransform();
        move.setTranslate(canvasWidth / 20, 0);
        //activeLayerTransformList.appendItem(move);
        activeLayerTransformList.insertItemBefore(move,0);
        console.log("Move right: " + layerMap[activeLayerIndex].label);
    }
}

function rotateLeft() {
    if (layerCount > 0) {
        let rotate = activeLayer.parentNode.createSVGTransform();
        rotate.setRotate(-90, canvasWidth / 2, canvasHeight / 2);
        activeLayerTransformList.appendItem(rotate);
        console.log("Rotate left: " + layerMap[activeLayerIndex].label);
    }
}

function rotateRight() {
    if (layerCount > 0) {
        let rotate = activeLayer.parentNode.createSVGTransform();
        rotate.setRotate(90, canvasWidth / 2, canvasHeight / 2);
        activeLayerTransformList.appendItem(rotate);
        console.log("Rotate right: " + layerMap[activeLayerIndex].label);
    }
}

function scaleDown() {
    if (layerCount > 0) {
        let scale = activeLayer.parentNode.createSVGTransform();
        scale.setScale(0.9, 0.9);
        activeLayerTransformList.appendItem(scale);
        console.log("Scale down: " + layerMap[activeLayerIndex].label);
    }
}

function scaleUp() {
    if (layerCount > 0) {
        let scale = activeLayer.parentNode.createSVGTransform();
        scale.setScale(1.1, 1.1);
        activeLayerTransformList.appendItem(scale);
        console.log("Scale up: " + layerMap[activeLayerIndex].label);
    }
}


function flipHorizontal() {
    if (layerCount > 0) {
        let scale = activeLayer.parentNode.createSVGTransform();
        scale.setScale(-1, 1); //Horizontal flip is a negative X axis resize
        activeLayerTransformList.appendItem(scale);

        let translate = activeLayer.parentNode.createSVGTransform();
        translate.setTranslate(-canvasWidth, 0);
        activeLayerTransformList.appendItem(translate);

        console.log("Horizontal flip: " + layerMap[activeLayerIndex].label);
    }
}

function flipVertical() {
    if (layerCount > 0) {
        let scale = activeLayer.parentNode.createSVGTransform();
        scale.setScale(1, -1); //Vertical flip is a negative Y axis resize
        activeLayerTransformList.appendItem(scale);
        let translate = activeLayer.parentNode.createSVGTransform();
        translate.setTranslate(0, -canvasHeight);
        activeLayerTransformList.appendItem(translate);
        console.log("Vertical flip: " + layerMap[activeLayerIndex].label);
    }
}

function bringFront() {
    if (layerCount > 0) {
        SVGCanvas.appendChild(activeLayer);
        console.log("Bring to front: " + layerMap[activeLayerIndex].label);
        updateLayerMap();
        activeLayerIndex = layerMap.indexOf(activeLayer);
        updateLayerSelect();
    }
}

function sendBack() {
    if (layerCount > 0) {
        if (layerCount > 0) SVGCanvas.insertBefore(activeLayer, layerMap[0]);
        console.log("Send to back: " + layerMap[activeLayerIndex].label);
        updateLayerMap();
        activeLayerIndex = layerMap.indexOf(activeLayer);
        updateLayerSelect();
    }
}

function bringForward() {
    if (layerCount > 0) {
        if (activeLayerIndex + 2 <= layerCount) SVGCanvas.insertBefore(activeLayer, layerMap[activeLayerIndex + 2]);
        else SVGCanvas.appendChild(activeLayer);
        console.log("Bring forward: " + layerMap[activeLayerIndex].label);
        updateLayerMap();
        activeLayerIndex = layerMap.indexOf(activeLayer);
        updateLayerSelect();
    }
}

function sendBackward() {
    if (layerCount > 0) {
        if (activeLayerIndex > 0) SVGCanvas.insertBefore(activeLayer, layerMap[activeLayerIndex - 1]);
        console.log("Send backward: " + layerMap[activeLayerIndex].label);
        updateLayerMap();
        activeLayerIndex = layerMap.indexOf(activeLayer);
        updateLayerSelect();
    }
}

function addLayer(layerID) {
    let svgImage = document.getElementById(layerID); //Load the external object
    if (svgImage !== null) {
        let svgCopy = svgImage.cloneNode(true); //Copy the SVG drawing so the original source remains the same
        let svgGroup = document.createElementNS(svgNamespace, "g"); //Create a group in the canvas for the new layer
        svgGroup.label = svgImage.getAttribute("label"); //Add a label to the group	
        svgGroup.id = svgImage.id + (layerCount + 1); //Add an ID to the group
        svgGroup.appendChild(svgCopy); //Append SVG drawing to the group
        SVGCanvas.appendChild(svgGroup); //Append the group to the canvas
        updateLayerMap(); //Update the layer list
        console.log("Added layer: " + svgGroup.label);
        setActiveLayer(layerCount - 1); //Set the new layer as active
        updateLayerSelect(); //Update the layer display box
    }
}

function addText() {
    let inputText = document.getElementById("textInput").value; //Get the input text
    let inputTextSize = document.getElementById("textSize").value; //Get the desired text size
    if (inputText == "") inputText = "text"; //If the text is empty give something
    let minitext = inputText.slice(0, 32); //Smaller version of the text for the layer menu
    let svgImage = document.createElementNS(svgNamespace, "svg"); //Create the SVG image
    let svgGroup = document.createElementNS(svgNamespace, "g"); //Create the SVG group inside the image
    let svgTitle = document.createElementNS(svgNamespace, "title"); //Create a title SVG tag
    let svgText = document.createElementNS(svgNamespace, "text"); //Create a text SVG tag
    svgText.setAttribute("x", "10%"); //Set the initial position
    svgText.setAttribute("y", "50%"); //Set the initial position
    svgText.style.fontSize = (canvasHeight * inputTextSize / 100) + "px"; //Set the font size
    svgText.style.stroke = "none"; //Set the stroke
    svgText.style.fill = "black"; //Set the fill color
    svgText.style.fontFamily = "Verdana, Geneva, sans-serif"; //Set the font
    svgGroup.label = minitext; //Set the layer menu label
    svgGroup.id = minitext.replace(/\ /g, "_")+idCount; //Create an exclusive ID
    idCount++; //Increase the counter
    svgText.innerHTML = inputText; //Insert the text in the SVG tag
    svgTitle.innerHTML = inputText; //Insert the title in the SVG tag
    svgImage.appendChild(svgText); //Append the text tag to the image tag
    svgGroup.appendChild(svgTitle); //Append the title tag to the group tag
    svgGroup.appendChild(svgImage); //Append the the image tag to the group
    SVGCanvas.appendChild(svgGroup); //Append the group to the canvas
    updateLayerMap(); //Update the layer list
    console.log("Added text layer: " + svgGroup.label);
    setActiveLayer(layerCount - 1); //Set the new layer as active
    updateLayerSelect(); //Update the layer display box
}

function importDB(dbName) {
    let source = document.getElementById(dbName); //Load the external object
    let destination = document.getElementById("collection" + dbName);
    if (source !== null) {
        let svgDoc = source.contentDocument ? source.contentDocument : source.contentWindow.document; //Load the document content from the external object
        if (svgDoc !== null) {
            let svgCollection = svgDoc.querySelectorAll("g"); //Load the SVG drawings from the document inkscape:groupmode='layer'
            let viewBox = svgDoc.getElementsByTagName("svg")[0].getAttribute("viewBox"); //Get the view box data
            for (const key in svgCollection) {
                if (svgCollection.hasOwnProperty(key))
                    if (svgCollection[key].attributes["inkscape:groupmode"] != undefined)
                        if (svgCollection[key].attributes["inkscape:groupmode"].nodeValue == "layer") {
                            const svgImage = svgCollection[key]; //Define the image object
                            let svgCopy = svgImage.cloneNode(true); //Copy the SVG drawing so the original source remains the same
                            let svgGroup = document.createElementNS(svgNamespace, "svg"); //Create the svg tag
                            let svgTitle = document.createElementNS(svgNamespace, "title"); //Create the title attribute
                            svgGroup.setAttribute("viewBox", viewBox); //Add the viewbox attribute
                            let newLabel = (svgImage.attributes["inkscape:label"] != undefined) ? svgImage.attributes["inkscape:label"].nodeValue : svgImage.attributes["id"].nodeValue; //Create a label
                            svgGroup.setAttribute("label", newLabel); //Set the label attribute
                            svgTitle.innerHTML = newLabel; //Set the title value
                            let newID = newLabel.replace(/\ /g, "_")+idCount; //Create a unique ID
                            idCount++;
                            svgGroup.setAttribute("id", newID); //Attach the id to the new image
                            //Add the action
                            svgGroup.addEventListener("click", function (e) {
                                addLayer(newID);
                            });
                            svgGroup.appendChild(svgTitle);
                            svgGroup.appendChild(svgCopy); //Append SVG drawing to the group
                            destination.appendChild(svgGroup); //Append the group to the canvas
                        }
            }
        }
    }
}


function exportSVG() {
    //get svg element.
    let svg = SVGCanvas;

    //get svg source.
    let serializer = new XMLSerializer();
    let source = serializer.serializeToString(svg); //Serialize the source file
    let fileName = ("tulip"+(exportCount/1000)+".svg").replace("0.","-");

    //add xml declaration
    source = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\r\n' + source;

    saveData(source, fileName, "data:image/svg+xml;charset=utf-8");

    exportCount++;
}

//Save data to a file
//use in the format saveData ('file contents', 'filename.xyz', 'data:image/svg+xml;charset=utf-8')
function saveData(data, fileName, type) {
    let a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    let json = data;
    let blob = new Blob([json], { type: type });
    let url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
}
