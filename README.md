# Tetris implmented in JavaScript

A naive implmentation of Tetris with HTML/CSS/JavaScript, just for fun.

# Why to write a Tetris game

Tetris is a well known and simple game, while it's still much complicated comparing to most regular web UI development. Writing a game like Tetris with regular HTML/CSS/JavaScript make me to think how to management complex code in a better way. Also the idea behind React (one direction data flow) heavily influence the way I think about how to build UI, even without React. So I want to see if writing this game in a React way make sense. Last, I have no experience about writing game and I have no idea how to build a game like Tetris, and it's a fun exercise to think about it from blank page and see how others do it.

# How to get started

To start, I would like to first think about what's all the possible states needed for drawing the game on the screen. In the normal Tetris game, there usually are a board, a block in a certian shape that is moving down in a certian speed, and some blocks that stack up at the bottom.

After we have defined the state that are necessary for drawing the game statically, the rest will just be figuring out how to change the state and redraw it, either by a timer or user's keyboard input.

For the board, it's usually won't change, so it just need a width and height to represend how many pixels in each row and column.

```js
{
  width: 20,
  height: 40
}
```

For the moving block, we need to know what's the shape of it. There are 5 different shapes and for each shape it has different orientation. We can just use number (0,1,2,3,4)and (0,1,2,3) for the type of shape and the shape orientation. We also need to know where is the block, and at what speed it's moving.

```js
{
  currentPosition: [0, 0], // [x, y]
  movingShape: 0, // { 0,1,2,3,4 }
  movingShapeOrientation: 0, // { 0,1,2,3 }
  speed: 300
}
```

For the blocks that are stacked at the bottom, we can just represent them with a bunch of points. We call the array as `bottomBlocks`

```js
{
  bottomBlocks: [
    [0, 39], [1, 39], [2, 39], [3, 39]
  ], // [[0, 39], [1, 39], [2, 39], [3, 39]]
}
```

With these states, we should be able to draw something on the screen. Let's do it.

# Draw something

Initially I was thinking about draw a div with `state.width` and `state.height` as the board, then draw the moving block as divs on top of the board with absolute position. Then I realized that an easier way is to treat the board as `state.width * state.height` pixel grid. We draw each pixel with a little `<span>`.

When we draw each pixel, if we found the pixel is coverd by the `bottomBlocks` (the bottom stacked blocks) or covered by the moving block, we give the pixel a css class `filled`, so that this pixel can be shown as dark.

Here is how the code looks like:

```html
<div class="canvas"></div>

<style>
  .canvas {
    position: relative;
    width: 200px;
    height: 400px;
    margin: 0 auto;
  }

  .pixel {
    display: block;
    width: 10px;
    height: 10px;
    border: 1px solid #eee;
    position: absolute;
  }

  .pixel.filled {
    background: #999;
  }
</style>
```

```js
let state = {
  width: 20,
  height: 40,
  currentPosition: [0, 0], // [x, y]
  movingShape: 0, // { 0,1,2,3,4 }
  movingShapeOrientation: 0, // { 0,1,2,3 }
  speed: 300,
  bottomBlocks: [[0, 39], [1, 39], [2, 39], [3, 39]]
};
let pixelSize = 10;
let arr = len => [...new Array(len)]; // turn a number into an array of that number of items

function render(state) {
  document.querySelector('.canvas').innerHTML = arr(state.height).map((_, row) => {
    return arr(state.width).map((_, column) => {
      const isFilled =
        isInBottomBlocks(state, [column, row]) || isInMovingBlock(state, [column, row]);

      return `<span
              class="pixel ${column ? 'filled' : ''}"
              data-x="${column}"
              data-y="${row}"
              style="transform: translate(${pixelSize * column}px, ${pixelSize * row}px);"
            ></span>`;
    });
  });
}
```

To check if the current pixel in `bottomBlocks` is easy, we just need to loops over `bottomBlocks` to check if there is a point that match. Check if the current pixel is in the moving block is a little complicated because we are not represention the moving block with direct pixel points, instead we are using the shape type, orientation and position. So we need to convert shape type, orientation and position into pixel points first, then check if the current pixel match one of them.

To do the convert, we need to konw what each shape and each orientation looks like in pixel. Then shift them into the correct position.

The code looks like this:

```js
function isInBottomBlocks({ baseShape }, [column, row]) {
  !!baseShape.find(([x, y]) => x === column && y === row);
}

function isInMovingBlock(
  { currentShape, currentShapeOrientation, currentPosition },
  [column, row]
) {
  const movingShapePoints = shiftPixel(
    getShapePixel(currentShape, currentShapeOrientation),
    currentPosition
  );

  return !!movingShapePoints.find(([x, y]) => x === column && y === row);
}

function getShapePixel(shape, shapeOrientation) {
  if (shape === 0) {
    /**
     * ##
     * ##
     */
    return [[0, 0], [1, 1], [1, 0], [0, 1]];
  }
  if (shape === 1) {
    if (shapeOrientation === 0 || shapeOrientation === 2) {
      /**
       * #
       * #
       * #
       * #
       */
      return [[0, 0], [1, 0], [2, 0], [3, 0]];
    } else {
      /**
       * ####
       */
      return [[0, 0], [0, 1], [0, 2], [0, 3]];
    }
  }
  if (shape === 2) {
    if (shapeOrientation === 0 || shapeOrientation === 2) {
      /**
       * ##
       *  ##
       */
      return [[0, 0], [1, 0], [1, 1], [2, 1]];
    } else {
      /**
       *  #
       * ##
       * #
       */
      return [[1, 0], [0, 1], [1, 1], [0, 2]];
    }
  }
  if (shape === 3) {
    if (shapeOrientation === 0) {
      /**
       * ###
       *  #
       */
      return [[0, 0], [1, 0], [2, 0], [1, 1]];
    } else if (shapeOrientation === 1) {
      /**
       *  #
       * ##
       *  #
       */
      return [[0, 1], [1, 0], [1, 1], [1, 2]];
    } else if (shapeOrientation === 2) {
      /**
       *  #
       * ###
       */
      return [[1, 0], [0, 1], [1, 1], [2, 1]];
    } else {
      /**
       *  #
       *  ##
       *  #
       */
      return [[2, 1], [1, 0], [1, 1], [1, 2]];
    }
  }
  if (shape === 4) {
    if (shapeOrientation === 0 || shapeOrientation === 2) {
      /**
       *  ##
       * ##
       */
      return [[1, 0], [2, 0], [0, 1], [1, 1]];
    } else {
      /**
       * #
       * ##
       *  #
       */
      return [[0, 0], [0, 1], [1, 1], [1, 2]];
    }
  }
}

function shiftPixel(pixels, shiftPixel) {
  return pixels && pixels.map(p => [p[0] + shiftPixel[0], p[1] + shiftPixel[1]]);
}
```

# Get it to move

Now we should be able to draw a frame on the screen with any kind of state. Next let's make it to move.

To make it move, we just need to change the state and redraw the board with new state, then change it the state and redraw it again, and keep going. We can use a `setIntervel` function keep changing the state and redrawing. The delay of the `setInterview` function is speed we defined in `state.speed`. Since we already know how to draw, the next thing is to determine how to change the state.

There are several possibilities on how to change state. Initially, when there is no moving block, so that we need to set random shape and orientation to the moving block. Next when the moving block is in the middle of air, we need to move the moving block down one pixel. To do that, we just need to add 1 to `state.movingPosition[1]`. Finally, if the moving block touch the bottom or blocks that stacked at the bottom, we should keep the current moving block at the bottom, and make a new moving block. To do that, we can just set the moving block as null, because it will be the same as the initial case.

Apparently there are more cases to handle, like removing a filled-up line, and user inputs. We will deal with that later.

```js
function start() {
  setInterval(() => {
    state = next(state);
    render(state);
  }, state.speed);
}

function next(state) {
  const nextState = { ...state };
  nextState.movingPosition = [...nextState.movingPosition];

  if (nextState.movingShape === null) {
    nextState.movingPosition[0] = 8;
    nextState.movingShape = getRandomInt(0, 4);
    nextState.movingShapeOrientation = getRandomInt(0, 3);
  } else {
    nextState.movingPosition[1] = state.movingPosition[1] + 1;
    tryStackShapes(nextState, state);
  }

  return nextState;
}

function tryStackShapes(nextState, prevState) {
  if (collapse(nextState)) {
    nextState.bottomBlocks = [
      ...nextState.bottomBlocks,
      ...shiftPixel(
        getShapePixel(prevState.movingShape, prevState.movingShapeOrientation),
        prevState.movingPosition
      )
    ];

    nextState.movingPosition = [8, 0];
    nextState.movingShape = getRandomInt.apply(null, possibleShapes);
    nextState.movingShapeOrientation = getRandomInt.apply(null, possibleShapesOrientation);
  }
}

function collapse({ movingPosition, movingShape, movingShapeOrientation, bottomBlocks, height }) {
  const movingShapePixel = shiftPixel(
    getShapePixel(movingShape, movingShapeOrientation),
    movingPosition
  );

  if (!movingShapePixel) {
    return false;
  }

  const isTouchBottom = Math.max.apply(null, movingShapePixel.map(p => p[1])) > height - 1;

  const collapseWithbottomBlocks = !!bottomBlocks.find(bs => {
    return !!movingShapePixel.find(cs => cs[0] === bs[0] && cs[1] === bs[1]);
  });

  if (isTouchBottom || collapseWithbottomBlocks) {
    return true;
  } else {
    return false;
  }
}
```

# When to stop moving

# Add keyboard inputs

# Score

# Optimization
