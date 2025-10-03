import math
import asyncio
from typing import Any, Tuple  # <-- add this

try:
    import js  # pyodide bridge
except Exception:  # pragma: no cover
    js = None  # helpful for local type-checking

class Engine:
    def __init__(self, canvas_or_id: Any):
        """
        Accepts either a DOM canvas element (JsProxy) or a string id.
        We avoid passing Python callbacks into JS (no setTimeout/RAF),
        so we won't create any borrowed proxies that Pyodide later destroys.
        """
        if isinstance(canvas_or_id, str):
            if js is None:
                raise RuntimeError("Engine requires js in Pyodide when given an element id")
            canvas = js.document.getElementById(canvas_or_id)
        else:
            canvas = canvas_or_id

        if canvas is None:
            raise ValueError("Engine: canvas not found")

        self.canvas = canvas
        self.ctx = canvas.getContext("2d")

        # World / robot state
        self.cell = 32
        self.rows = 12
        self.cols = 16
        self.w = int(self.cols * self.cell)
        self.h = int(self.rows * self.cell)

        # Resize canvas
        self.canvas.width = self.w
        self.canvas.height = self.h

        # Robot pose (grid coordinates + heading)
        self.x = 2
        self.y = 2
        # Heading: 0=right, 1=down, 2=left, 3=up
        self.dir = 0

        self._draw_world()

    # ---------------------------
    # Public API exposed to blocks
    # ---------------------------
    def api(self):
        engine = self

        class API:
            async def move(self):
                await engine._move()

            async def turn_left(self):
                engine.dir = (engine.dir + 3) % 4
                engine._draw_world()
                await asyncio.sleep(0)

            async def turn_right(self):
                engine.dir = (engine.dir + 1) % 4
                engine._draw_world()
                await asyncio.sleep(0)

            async def dig(self):
                # Placeholder: just flash the cell
                engine._flash_cell(engine.x, engine.y)
                await asyncio.sleep(0.1)
                engine._draw_world()

            async def wait(self, ms: int = 300):
                await asyncio.sleep(ms / 1000)

        return API()

    # ---------------------------
    # Internals
    # ---------------------------
    async def _move(self):
        # simple step forward with a tiny animation, no JS timers
        dx, dy = self._dir_vec(self.dir)
        steps = self.cell  # px to move
        for _ in range(steps):
            # subpixel animation at 1px per frame
            # we don’t store Python callbacks in JS; we just yield to asyncio
            self._draw_world(pixel_offset=(dx, dy))
            await asyncio.sleep(0)  # yield control
            # update exact pixel offset by accumulating in x/y once per loop
        # finalize grid move
        self.x += dx
        self.y += dy
        self._draw_world()

    def _dir_vec(self, d: int) -> Tuple[int, int]:
        if d == 0:   # right
            return (1, 0)
        if d == 1:   # down
            return (0, 1)
        if d == 2:   # left
            return (-1, 0)
        return (0, -1)  # up

    def _flash_cell(self, gx: int, gy: int):
        ctx = self.ctx
        size = self.cell
        px = gx * size
        py = gy * size
        ctx.save()
        ctx.fillStyle = "#ffe58a"
        ctx.fillRect(px, py, size, size)
        ctx.restore()

    def _draw_world(self, pixel_offset: Tuple[int, int] = (0, 0)):
        ctx = self.ctx
        cell = self.cell

        # clear
        ctx.clearRect(0, 0, self.w, self.h)

        # grid
        ctx.save()
        ctx.strokeStyle = "#ddd"
        for c in range(self.cols + 1):
            x = c * cell
            ctx.beginPath()
            ctx.moveTo(x, 0)
            ctx.lineTo(x, self.h)
            ctx.stroke()
        for r in range(self.rows + 1):
            y = r * cell
            ctx.beginPath()
            ctx.moveTo(0, y)
            ctx.lineTo(self.w, y)
            ctx.stroke()
        ctx.restore()

        # robot
        px = self.x * cell
        py = self.y * cell
        offx, offy = pixel_offset
        ctx.save()
        ctx.translate(px + cell / 2, py + cell / 2)
        ctx.rotate(self.dir * math.pi / 2)
        ctx.translate(offx, offy)
        ctx.fillStyle = "#5daabd"
        ctx.beginPath()
        ctx.moveTo(+cell * 0.3, 0)
        ctx.lineTo(-cell * 0.2, +cell * 0.2)
        ctx.lineTo(-cell * 0.2, -cell * 0.2)
        ctx.closePath()
        ctx.fill()
        ctx.restore()