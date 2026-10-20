// The bundle that the package's main entry and <script> users load. It sets the svgPanZoom global.
import "../dist/svg-pan-zoom.js";

// SVG size 700x300, viewport size 800x800
export function mountFixture() {
  document.body.innerHTML = `
    <div style="width: 700px; height: 300px; border: 1px solid black">
      <svg id="test-inline" xmlns="http://www.w3.org/2000/svg" style="display: inline; width: inherit; height: inherit" version="1.1">
        <g fill="none">
          <rect width="800" height="800" style="fill: rgb(0, 0, 255); stroke-width: 3; stroke: rgb(0, 0, 0)" />
        </g>
      </svg>
    </div>
  `;
  return document.getElementById("test-inline");
}
