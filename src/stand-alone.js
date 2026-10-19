var svgPanZoom = require("./svg-pan-zoom.js");
var Utils = require("./utilities");

// UMD module definition
(function (_this) {
  // AMD
  if (typeof define === "function" && define.amd) {
    define("svg-pan-zoom", function () {
      return svgPanZoom;
    });
    // CMD
  } else if (typeof module !== "undefined" && module.exports) {
    module.exports = svgPanZoom;

    // Browser
    // Keep exporting globally: the bundle in dist/ always provides module, so this is also its browser path
    _this.svgPanZoom = svgPanZoom;
  }
})(Utils.getGlobalThis());
