import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import { mountFixture } from "./fixture.js";

let svg, instance;

beforeEach(() => {
  svg = mountFixture();
});

afterEach(() => {
  instance?.destroy();
  instance = null;
});

// The point of the drawing shown at (x, y) of the SVG element.
function drawingPointAt(x, y) {
  const { x: panX, y: panY } = instance.getPan();
  const zoom = instance.getZoom();
  return { x: (x - panX) / zoom, y: (y - panY) / zoom };
}

function expectPointCloseTo(actual, expected) {
  expect(actual.x).toBeCloseTo(expected.x, 4);
  expect(actual.y).toBeCloseTo(expected.y, 4);
}

// Playwright has no multi-touch input, so touches are dispatched as events.
// Each point is [x, y] on the SVG element, and the index is the touch identifier.
function touch(type, points) {
  const rect = svg.getBoundingClientRect();
  const touches = points.map(
    ([x, y], identifier) =>
      new Touch({
        identifier,
        target: svg,
        clientX: rect.left + x,
        clientY: rect.top + y,
      })
  );
  svg.dispatchEvent(
    new TouchEvent(type, {
      touches: type === "touchend" ? [] : touches,
      changedTouches: touches,
      bubbles: true,
      cancelable: true,
    })
  );
}

describe("mouse", () => {
  test("dragging pans by the distance moved", async () => {
    instance = svgPanZoom(svg);
    const initialPan = instance.getPan();

    await userEvent.dragAndDrop(svg, svg, {
      sourcePosition: { x: 100, y: 100 },
      targetPosition: { x: 150, y: 130 },
    });

    expectPointCloseTo(instance.getPan(), {
      x: initialPan.x + 50,
      y: initialPan.y + 30,
    });
  });

  test("dragging does not pan when pan is disabled", async () => {
    instance = svgPanZoom(svg, { panEnabled: false });
    const initialPan = instance.getPan();

    await userEvent.dragAndDrop(svg, svg, {
      sourcePosition: { x: 100, y: 100 },
      targetPosition: { x: 150, y: 130 },
    });

    expect(instance.getPan()).toEqual(initialPan);
  });

  // userEvent.wheel points at the center of the element.
  test("wheeling up zooms in around the pointer", async () => {
    instance = svgPanZoom(svg);
    const initialZoom = instance.getZoom();
    const pointed = drawingPointAt(350, 150);

    await userEvent.wheel(svg, { delta: { y: -100 } });

    expect(instance.getZoom()).toBeGreaterThan(initialZoom);
    expectPointCloseTo(drawingPointAt(350, 150), pointed);
  });

  test("wheeling down zooms out around the pointer", async () => {
    instance = svgPanZoom(svg);
    const initialZoom = instance.getZoom();
    const pointed = drawingPointAt(350, 150);

    await userEvent.wheel(svg, { delta: { y: 100 } });

    expect(instance.getZoom()).toBeLessThan(initialZoom);
    expectPointCloseTo(drawingPointAt(350, 150), pointed);
  });

  test("wheeling does not zoom when mouse wheel zoom is disabled", async () => {
    instance = svgPanZoom(svg, { mouseWheelZoomEnabled: false });
    const initialZoom = instance.getZoom();

    await userEvent.wheel(svg, { delta: { y: -100 } });

    expect(instance.getZoom()).toBe(initialZoom);
  });

  test("wheeling does not zoom when zoom is disabled", async () => {
    instance = svgPanZoom(svg, { zoomEnabled: false });
    const initialZoom = instance.getZoom();

    await userEvent.wheel(svg, { delta: { y: -100 } });

    expect(instance.getZoom()).toBe(initialZoom);
  });

  // The factor is (1 + zoomScaleSensitivity) * 2.
  test("double clicking zooms in by 2.2 around the pointer", async () => {
    instance = svgPanZoom(svg);
    const initialZoom = instance.getZoom();
    const pointed = drawingPointAt(200, 100);

    await userEvent.dblClick(svg, { position: { x: 200, y: 100 } });

    expect(instance.getZoom()).toBeCloseTo(initialZoom * 2.2, 4);
    expectPointCloseTo(drawingPointAt(200, 100), pointed);
  });

  test("double clicking with Shift zooms out by 2.2 around the pointer", async () => {
    // 1 / 2.2 is below the default minZoom of 0.5.
    instance = svgPanZoom(svg, { minZoom: 0.1 });
    const initialZoom = instance.getZoom();
    const pointed = drawingPointAt(200, 100);

    await userEvent.dblClick(svg, {
      position: { x: 200, y: 100 },
      modifiers: ["Shift"],
    });

    expect(instance.getZoom()).toBeCloseTo(initialZoom / 2.2, 4);
    expectPointCloseTo(drawingPointAt(200, 100), pointed);
  });

  test("double clicking does not zoom when double click zoom is disabled", async () => {
    instance = svgPanZoom(svg, { dblClickZoomEnabled: false });
    const initialZoom = instance.getZoom();

    await userEvent.dblClick(svg, { position: { x: 200, y: 100 } });

    expect(instance.getZoom()).toBe(initialZoom);
  });
});

describe("touch", () => {
  test("dragging one finger pans by the distance moved", () => {
    instance = svgPanZoom(svg);
    const initialPan = instance.getPan();

    touch("touchstart", [[100, 100]]);
    touch("touchmove", [[150, 130]]);
    touch("touchend", [[150, 130]]);

    expectPointCloseTo(instance.getPan(), {
      x: initialPan.x + 50,
      y: initialPan.y + 30,
    });
  });

  test("pinching out zooms in by the ratio of the finger distances around their midpoint", () => {
    instance = svgPanZoom(svg);
    const initialZoom = instance.getZoom();
    const pointed = drawingPointAt(350, 150);

    touch("touchstart", [
      [300, 150],
      [400, 150],
    ]);
    touch("touchmove", [
      [250, 150],
      [450, 150],
    ]);
    touch("touchend", [
      [250, 150],
      [450, 150],
    ]);

    expect(instance.getZoom()).toBeCloseTo(initialZoom * 2, 4);
    expectPointCloseTo(drawingPointAt(350, 150), pointed);
  });

  test("pinching does not zoom when zoom is disabled", () => {
    instance = svgPanZoom(svg, { zoomEnabled: false });
    const initialZoom = instance.getZoom();

    touch("touchstart", [
      [300, 150],
      [400, 150],
    ]);
    touch("touchmove", [
      [250, 150],
      [450, 150],
    ]);
    touch("touchend", [
      [250, 150],
      [450, 150],
    ]);

    expect(instance.getZoom()).toBe(initialZoom);
  });

  test("double tapping zooms in by 2.2 around the finger", () => {
    instance = svgPanZoom(svg);
    const initialZoom = instance.getZoom();
    const pointed = drawingPointAt(200, 100);

    touch("touchstart", [[200, 100]]);
    touch("touchend", [[200, 100]]);
    touch("touchstart", [[200, 100]]);
    touch("touchend", [[200, 100]]);

    expect(instance.getZoom()).toBeCloseTo(initialZoom * 2.2, 4);
    expectPointCloseTo(drawingPointAt(200, 100), pointed);
  });
});
