/**
 * shapes:
 *
 * 0.   1.    2.    3.     4.
 * ##   ####  ##    ###     ##
 * ##          ##    #     ##
 *
 *
 */

const initialState = {
  width: 20, // px
  height: 40,
  speed: 300,
  score: 0,
  movingPosition: [0, 0],
  movingShape: null, // 0,1,2,3,4,
  movingShapeOrientation: 0, // 0,1,2,3
  bottomBlocks: [] // [[0, 39], [1, 39], [2, 39], [3, 39]]
};

let state = JSON.parse(JSON.stringify(initialState));
let pixelSize = 10;
let pixelDOMMap = [];
let possibleShapes = [0, 4];
let possibleShapesOrientation = [0, 3];
let renderTarget = 'HTML'; // 'console'
let skip = false;

start();

function start() {
  setInterval(() => {
    state = next(state);
    render(state);
  }, state.speed);

  bindKeyboardEvent();
}

function next(state) {
  const nextState = { ...state };
  nextState.movingPosition = [...nextState.movingPosition];

  if (nextState.movingShape === null) {
    nextState.movingPosition[0] = 8;
    nextState.movingShape = getRandomInt.apply(null, possibleShapes);
    nextState.movingShapeOrientation = getRandomInt.apply(null, possibleShapesOrientation);
  } else {
    nextState.movingPosition[1] = state.movingPosition[1] + 1;
    checkCollision(nextState, state);
  }

  return nextState;
}

function render(state) {
  const pixelMap = layout(state);
  document.querySelector('.score').textContent = state.score;

  if (renderTarget === 'HTML') {
    paintHTML(pixelMap);
  } else if (renderTarget === 'console') {
    paintConsole(pixelMap);
  }
}

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

function paintHTML(pixelMap) {
  if (!pixelDOMMap.length) {
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

function paintConsole(pixelMap) {
  console.clear();
  console.log(pixelMap.map(row => row.map(r => (r ? '■' : '□')).join(' ')).join('\n'));
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

function checkCollision(nextState, prevState) {
  if (collide(nextState)) {
    nextState.bottomBlocks = [
      ...nextState.bottomBlocks,
      ...shiftPixel(
        getShapePixel(prevState.movingShape, prevState.movingShapeOrientation),
        prevState.movingPosition
      )
    ];

    removeFilledLines(nextState);

    nextState.movingPosition = [8, 0];
    nextState.movingShape = getRandomInt.apply(null, possibleShapes);
    nextState.movingShapeOrientation = getRandomInt.apply(null, possibleShapesOrientation);
  }
}

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

function removeFilledLines(state) {
  const filledLines = getFilledLines(state.width, state.bottomBlocks);
  const toShiftMap = {};
  filledLines.forEach(lineIndex => {
    state.bottomBlocks = state.bottomBlocks.filter(s => s[1] !== lineIndex);
  });
  filledLines.forEach(lineIndex => {
    state.bottomBlocks.forEach(s => {
      if (s[1] < lineIndex) {
        toShiftMap[`${s[0]},${s[1]}`] = toShiftMap[`${s[0]},${s[1]}`] || 0;
        toShiftMap[`${s[0]},${s[1]}`]++;
      }
    });
  });

  state.bottomBlocks.forEach(s => {
    if (toShiftMap[`${s[0]},${s[1]}`]) {
      s[1] = s[1] + toShiftMap[`${s[0]},${s[1]}`];
    }
  });

  state.score = state.score + filledLines.length;
}

// shape data

function getShapePixel(shape, shapeOrientation) {
  if (shape === 0) {
    return [[0, 0], [1, 1], [1, 0], [0, 1]];
  }
  if (shape === 1) {
    if (shapeOrientation === 0 || shapeOrientation === 2) {
      return [[0, 0], [1, 0], [2, 0], [3, 0]];
    } else {
      return [[0, 0], [0, 1], [0, 2], [0, 3]];
    }
  }
  if (shape === 2) {
    if (shapeOrientation === 0 || shapeOrientation === 2) {
      return [[0, 0], [1, 0], [1, 1], [2, 1]];
    } else {
      return [[1, 0], [0, 1], [1, 1], [0, 2]];
    }
  }
  if (shape === 3) {
    if (shapeOrientation === 0) {
      return [[0, 0], [1, 0], [2, 0], [1, 1]];
    } else if (shapeOrientation === 1) {
      return [[0, 1], [1, 0], [1, 1], [1, 2]];
    } else if (shapeOrientation === 2) {
      return [[1, 0], [0, 1], [1, 1], [2, 1]];
    } else {
      return [[2, 1], [1, 0], [1, 1], [1, 2]];
    }
  }
  if (shape === 4) {
    if (shapeOrientation === 0 || shapeOrientation === 2) {
      return [[1, 0], [2, 0], [0, 1], [1, 1]];
    } else {
      return [[0, 0], [0, 1], [1, 1], [1, 2]];
    }
  }
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

// utils

function shiftPixel(pixels, shiftPixel) {
  return pixels && pixels.map(p => [p[0] + shiftPixel[0], p[1] + shiftPixel[1]]);
}

function arr(len) {
  return [...new Array(len)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
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
