# Tetris implemented in JavaScript

A naive implementation of Tetris with HTML/CSS/JavaScript, just for fun.

## Why write a Tetris game

Tetris is a well known and simple game, while it's still very complicated comparing to most regular web UI development works. Writing a game like Tetris with regular HTML/CSS/JavaScript make me think about how to managing complex code in a better way. Also the idea behind React (one direction data flow) heavily influence the way I think about how to build UI, even without React. So I want to see if writing this game in a React way make sense. Last, I have no experience about writing game and I have no idea how to build a game like Tetris, and it's a fun exercise to think about it blindly and see how others do it.

## How to get started

To start, I would like to first think about what's all the possible states needed for drawing the game on the screen. In the normal Tetris game, there usually are a board, a block in a certain shape that is moving down with a certain speed, and some blocks that stack up at the bottom.

With all the states that are necessary for drawing the game in a single frame, the rest will just be figuring out how to change the state and redraw the frame, either by a timer or user's keyboard input.

Let's define all the states.

For the board, it's usually won't change, so it just need a width and height to represent how many pixels in each row and column.

```js
{
  width: 20,
  height: 40
}
```

For the moving block, we need to know what's the shape of it. There are 5 different shapes. And each shape has different orientation. We can just use number (0,1,2,3,4) to represent the type of shape and (0,1,2,3) for different orientation. We also need to know the location of the block, and at what speed it's moving.

```js
/**
 * shapes:
 *
 * 0.   1.    2.    3.     4.
 * ##   ####  ##    ###     ##
 * ##          ##    #     ##
 *
 *
 */
```

```js
{
  // ...
  movingShape: 0,
  movingShapeOrientation: 0,
  currentPosition: [0, 0], // [x, y]
  speed: 300
}
```

For the blocks that are stacked at the bottom, we can just represent them with a bunch of points. We call the array as `bottomBlocks`

```js
{
  // ...
  bottomBlocks: [
    [0, 39], [1, 39], [2, 39], [3, 39]
  ],
}
```

Last we need score to keep track of current score.

```js
{
  // ...
  score: 0,
}
```

With these states, we should be able to draw something on the screen. Let's do it.

## Draw something

Initially I was thinking about draw a div simply with `state.width` and `state.height` as width and height as the board, then draw the moving block as divs on top of the board with absolute position. Then I realized that an easier way is to treat the board as a grid with `state.width * state.height` pixels in it. We draw each pixel individually with a `<span>` tag.

When we draw each pixel in the grid, if we found the position of the pixel is also in the `bottomBlocks` (the bottom stacked blocks) or is covered by the moving block, we give the pixel a CSS class `filled`, so that we can show that pixel in dark color.

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
// configuration
let pixelSize = 10; // how big we want one pixel to be
let arr = len => [...new Array(len)]; // turn a number into an array of that number of items

// the state
let state = {
  width: 20,
  height: 40,
  movingShape: 0,
  movingShapeOrientation: 0,
  currentPosition: [0, 0],
  speed: 300,
  bottomBlocks: [[0, 39], [1, 39], [2, 39], [3, 39]]
};

// draw the board
function render(state) {
  const pixels = arr(state.height).map((_, row) => {
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

  document.querySelector('.canvas').innerHTML = pixels;
}
```

To check if the current pixel in `state.bottomBlocks` is easy, we just loop over `state.bottomBlocks` to check if there is a point match.

```js
// check if current pixel if in the bottom blocks
function isInBottomBlocks(state, [column, row]) {
  !!state.bottomBlocks.find(([x, y]) => x === column && y === row);
}
```

However, checking if the current pixel is covered by the moving block is a little complicated, because we are using shapes and orientation instead of direct pixel points to represent the moving block. So in order to do that, we have to convert shape, orientation and position into pixel points before we can check if the current pixel is covered by one of them.

To do the conversion, we need to know how to represent each shape and orientation in pixels. Then we can shift them into the correct position to get the pixel points of the moving block.

The code looks like this:

```js
// check if current pixel if covered by the moving block
function isInMovingBlock(state, [column, row]) {
  const movingBlockPoints = shiftPixel(
    getShapePixel(state.movingShape, state.movingShapeOrientation),
    state.currentPosition
  );

  return !!movingBlockPoints.find(([x, y]) => x === column && y === row);
}

// get pixel represent of each shape and orientation
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

// shift the pixels into the expected position
function shiftPixel(pixels, shiftPixel) {
  return pixels && pixels.map(p => [p[0] + shiftPixel[0], p[1] + shiftPixel[1]]);
}
```

## Make it move

Now we should be able to draw a frame on the screen with any kind of state. Next let's make move.

The idea is that, to make it move, we just need to change the state and redraw the board with new state, then change it the state again and redraw it again, and keep going. We can use a `setIntervel` function to keep the circle going. The delay of the `setIntervel` function is speed we defined in `state.speed`.

```js
function start() {
  setInterval(() => {
    state = nextState(state);
    render(state);
  }, state.speed);
}
```

Since we already know how to draw, the next thing is to determine how to change the state.

There are several possibilities on how to change state. Initially, when there is no moving block, we need to set a random shape and orientation for the moving block. Next when the moving block is in the middle of air, we need to move the `state.currentPosition` down one pixel. Finally, if the moving block reach the bottom of the grid or collide with the blocks stacked at the bottom, we should stop the moving and stack the current moving block at the bottom, then make a new moving block.

Obviously there are more cases to handle, like removing a filled-up line, and user inputs. We will deal with that later.

```js
function nextState(state) {
  const nextState = { ...state };
  nextState.movingPosition = [...nextState.movingPosition];

  if (nextState.movingShape === null) {
    // if no moving block, create a random one, and set the position to top
    nextState.movingPosition[0] = 8;
    nextState.movingShape = getRandomInt(0, 4);
    nextState.movingShapeOrientation = getRandomInt(0, 3);
  } else {
    // shift the position of moving block down, and check if it collide
    nextState.movingPosition[1] = state.movingPosition[1] + 1;
    checkCollision(nextState, state);
  }

  return nextState;
}

function checkCollision(nextState, prevState) {
  if (collide(nextState)) {
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

function collide({ movingPosition, movingShape, movingShapeOrientation, bottomBlocks, height }) {
  const movingShapePixel = shiftPixel(
    getShapePixel(movingShape, movingShapeOrientation),
    movingPosition
  );

  if (!movingShapePixel) {
    return false;
  }

  const isTouchBottom = Math.max.apply(null, movingShapePixel.map(p => p[1])) > height - 1;

  const collideWithbottomBlocks = !!bottomBlocks.find(bs => {
    return !!movingShapePixel.find(cs => cs[0] === bs[0] && cs[1] === bs[1]);
  });

  if (isTouchBottom || collideWithbottomBlocks) {
    return true;
  } else {
    return false;
  }
}
```

## Add keyboard inputs

Now our game can move a block down, but we also want to move the block left and right when user press left or right button. Also we want to be able to change the orientation of the block when user press up button. Last, if user press down button, it should shift the moving block down It's pretty straight forward to implement them, because we just need add an event handle for keyboard input, then update `state.movingPosition` to left/right, or change `state.movingShapeOrientation` accordingly.

The only thing we need to pay attention is the potential collision. When collision could happen, we shouldn't let user move left/right or change orientation. An ease way to do this is that, we try change the moving block's position as user input regardless the collision, then check if the new state is valid by check if it collide or over the boundary. If yes, then we simple revert the position change. If no, then we draw with the new position.

Let's implement it.

```js
function bindKeyboardEvent() {
  document.addEventListener('keydown', e => {
    handleKeyBoardInput(e);
  });
}

function handleKeyBoardInput(e) {
  const nextState = { ...state };
  nextState.movingPosition = [...nextState.movingPosition];

  if (e.keyCode === 38) {
    // up
    nextState.movingShapeOrientation = nextState.movingShapeOrientation + 1;
    if (nextState.movingShapeOrientation === 4) {
      nextState.movingShapeOrientation = 0;
    }
    if (invalidMove(nextState)) {
      nextState.movingShapeOrientation = state.movingShapeOrientation;
    }
  } else if (e.keyCode === 37) {
    // left
    nextState.movingPosition[0] = nextState.movingPosition[0] - 1;
    if (invalidMove(nextState)) {
      nextState.movingPosition[0] = state.movingPosition[0];
    }
  } else if (e.keyCode === 39) {
    // right
    nextState.movingPosition[0] = nextState.movingPosition[0] + 1;
    if (invalidMove(nextState)) {
      nextState.movingPosition[0] = state.movingPosition[0];
    }
  } else if (e.keyCode === 40) {
    // down
    nextState.movingPosition[1] = nextState.movingPosition[1] + 1;
    checkCollision(nextState, state);
  }

  state = nextState;
  render(nextState);
}

function invalidMove(state) {
  const overLeft = state.movingPosition[0] < 0;
  const overRight =
    state.movingPosition[0] + getWidthByShape(state.movingShape, state.movingShapeOrientation) >
    state.width;

  return collide(state) || overLeft || overRight;
}

function getWidthByShape(shape, orientation) {
  if (shape === 0) {
    return 2;
  } else if (shape === 1) {
    if (orientation === 1 || orientation === 3) {
      return 1;
    } else {
      return 4;
    }
  } else if (shape === 2) {
    if (orientation === 0 || orientation === 2) {
      return 3;
    } else {
      return 2;
    }
  } else if (shape === 3) {
    if (orientation === 0 || orientation === 2) {
      return 3;
    } else {
      return 2;
    }
  } else {
    if (orientation === 0 || orientation === 2) {
      return 3;
    } else {
      return 2;
    }
  }
}
```

## Score

Now we can almost play the Tetris game, except that it can't eliminate the filled line and score. The way to implement should be pretty straight forward, we just check `state.bottomBlocks` (the blocks that stacked at the bottom), and see if there are lines that are all filled with points. If there are ones, we can remove all the points at that line from `state.bottomBlocks` and increment our score.

```js
function getFilledLines(width, bottomBlocks) {
  const mostBottom = Math.max.apply(null, bottomBlocks.map(p => p[1]));
  const mostTop = Math.min.apply(null, bottomBlocks.map(p => p[1]));
  const filledLines = [];

  for (let i = mostTop; i <= mostBottom; i++) {
    const pointsOfCurrentLine = bottomBlocks.filter(s => s[1] === i).map(s => s[0]);
    const uniquePointsOfCurrentLine = uniqeArr(pointsOfCurrentLine);
    if (uniquePointsOfCurrentLine.length === width) {
      filledLines.push(i);
    }
  }

  return filledLines;
}
```

The only tricky part is that, after the filled line are removed, we have to shift all the points above that down down. If there are one line removed, we need to shift the the above point down one, if there are two line removed, we need to to shift down two. We need to count that.

```js
function removeFilledLines(state) {
  const filledLines = getFilledLines(state.width, state.bottomBlocks);
  const toShiftMap = {};

  // remove the points within the filed lines
  filledLines.forEach(lineIndex => {
    state.bottomBlocks = state.bottomBlocks.filter(s => s[1] !== lineIndex);
  });

  // mark the above point how many row need to shift down
  filledLines.forEach(lineIndex => {
    state.bottomBlocks.forEach(s => {
      if (s[1] < lineIndex) {
        toShiftMap[`${s[0]},${s[1]}`] = toShiftMap[`${s[0]},${s[1]}`] || 0;
        toShiftMap[`${s[0]},${s[1]}`]++;
      }
    });
  });

  // do the shift down
  state.bottomBlocks.forEach(s => {
    if (toShiftMap[`${s[0]},${s[1]}`]) {
      s[1] = s[1] + toShiftMap[`${s[0]},${s[1]}`];
    }
  });

  // increment the scroree
  state.score = state.score + filledLines.length;
}
function uniqeArr(arr) {
  const _arr = [];
  arr.forEach(i => {
    if (_arr.indexOf(i) === -1) {
      _arr.push(i);
    }
  });

  return _arr;
}
```

We need to do this when a collision happens.

```js
function checkCollision(nextState, prevState) {
  if (collide(nextState)) {
    // ...
    removeFilledLines(nextState);
  }
}
```

Don't forget to show the score

```html
<div class="score"></div>
```

```js
function render(state) {
  // ...
  document.querySelector('.score').textContent = state.score;
}
```

## Optimization

This is it. A playable Tetris game. Since this is a naive implementation, there are probably a lot of ways to improve. One of the most obvious thing you might notices is that, the performance is quite bad. The animation is not very smooth specially when the state changed quickly, and there is always a lag of user's input.

The reason is that every time we redrew, we remove all the existing `<span>` elements and create new ones to replace it. When we want to do it very quickly, it becomes expensive, thus the poor performance. In react, when we do `setState` with new state, it has this magic DOM diff that only change the DOM that is actually changed, and keep those are not changed. Maybe we can do some similar trick the improve the performance.

So instead of get ride of all the existing `<span>`, we can just keep then and only update the `filled` class of the existing ones.

Also a good abstraction we can make is to separate the concern of layout and rendering. Layout is to figure out how we should render each pixel, black or white. Rendering is to actually draw the pixel on the screen. The benefit of this is that we can now render the pixels on different target without repeating the logic to figure how each pixel is like. It can be render with HTML, SVG, canvas or even, console log.

Let's first sperate the layout from rendering. All we need to do a build a 2d array that store true/false to indicate it's black/white.

```js
function layout({
  width,
  height,
  bottomBlocks,
  movingPosition,
  movingShape,
  movingShapeOrientation
}) {
  const movingShapePixel = shiftPixel(
    getShapePixel(movingShape, movingShapeOrientation),
    movingPosition
  );

  if (!movingShapePixel) {
    return [];
  }

  return arr(height).map((_, row) => {
    return arr(width).map((_, column) => {
      const isInbottomBlocks = !!bottomBlocks.find(([x, y]) => x === column && y === row);
      const isInMovingShape = !!movingShapePixel.find(([x, y]) => x === column && y === row);
      const isFilled = isInbottomBlocks || isInMovingShape;

      return isFilled;
    });
  });
}
```

Let's do the rendering optimization of HTML by save the reference to DOM and reuse it.

```js
const renderTarget = 'HTML';
const pixelDOMMap = [];

function render(state) {
  const pixelMap = layout(state);
  document.querySelector('.score').textContent = state.score;

  if (renderTarget === 'HTML') {
    paintHTML(pixelMap);
  } else if (renderTarget === 'console') {
    paintConsole(pixelMap);
  }
}

function paintHTML(pixelMap) {
  if (!pixelDOMMap.length) {
    // we have to build the HTML initially, and save the reference
    document.querySelector('.canvas').innerHTML = pixelMap
      .map((row, y) => {
        return row
          .map((column, x) => {
            return `<span
                class="pixel ${column ? 'filled' : ''}"
                data-x="${x}"
                data-y="${y}"
                style="transform: translate(${pixelSize * x}px, ${pixelSize * y}px);"
              ></span>`;
          })
          .join('');
      })
      .join('');

    pixelDOMMap = pixelMap.map((row, y) => {
      return row.map((_, x) => {
        return document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
      });
    });
  } else {
    // if the reference exist, we just update it the css class.
    pixelMap.map((row, y) => {
      return row.map((column, x) => {
        const classList = pixelDOMMap[y][x].classList;
        if (column && !classList.contains('filled')) {
          classList.add('filled');
        } else if (!column && classList.contains('filled')) {
          classList.remove('filled');
        }
      });
    });
  }
}
```

Last, use console log as the rendering target. Super simple.

```js
function paintConsole(pixelMap) {
  console.clear();
  console.log(pixelMap.map(row => row.map(r => (r ? '■' : '□')).join(' ')).join('\n'));
}
```

## At the end

Building the Tetris game from scratch is fun. Especially the process of thinking about how to get the game mechanics to work in a web development way. And I kinda get a peek about how doing game development would feels like. The whole thing doesn't take too long to finished, most of the time is to get those edge cases covered.

As for using the idea of Read to build a game, it turns out to be great. After all state is defined to draw a single frame, the entire process is pretty much unstopped because anything after that is as simple as a re-render.

There is an aha moment when I realized that we can play the game in console with just two lines of code.

You can find the full implementation at https://github.com/GingerBear/tetris-js.
