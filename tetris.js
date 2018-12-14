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
  score: 0,
  currentPosition: [0, 0],
  currentShape: null, // 0,1,2,3,4,
  currentShapeOrientation: 0, // 0,1,2,3
  baseShape: [] // [[0, 79], [1, 79], [2, 79], [3, 79]]
};

let state = JSON.parse(JSON.stringify(initialState));
let speed = 300;
let pixelSize = 10;
let timer = null;
let skip = false;

if (module.hot) {
  module.hot.dispose(function() {
    clearInterval(timer);
  });
}

start();

function start() {
  timer = setInterval(() => {
    if (skip) {
      skip = false;
      return;
    }
    state = next(state);
    render(state);
  }, speed);

  bindKeyboardEvent();
}

function next(state) {
  const nextState = { ...state };
  nextState.currentPosition = [...nextState.currentPosition];

  if (!nextState.currentShape) {
    nextState.currentPosition[0] = getRandomInt(0, 15);
    nextState.currentShape = getRandomInt(0, 4);
    nextState.currentShapeOrientation = getRandomInt(0, 3);
  } else {
    nextState.currentPosition[1] = state.currentPosition[1] + 1;
    if (collapse(nextState)) {
      nextState.baseShape = [
        ...nextState.baseShape,
        ...shiftPixel(
          getShapePixel(state.currentShape, state.currentShapeOrientation),
          state.currentPosition
        )
      ];

      removeFilledLines(nextState);

      nextState.currentPosition = [getRandomInt(0, 15), 0];
      nextState.currentShape = getRandomInt(0, 4);
      nextState.currentShapeOrientation = getRandomInt(0, 3);
    }
  }

  return nextState;
}

function render(state) {
  const pixelMap = layout(state);
  document.querySelector('.score').textContent = state.score;
  paintHTML(pixelMap);
  // paintConsole(pixelMap);
}

function layout({
  width,
  height,
  baseShape,
  currentPosition,
  currentShape,
  currentShapeOrientation
}) {
  const currentShapePixel = shiftPixel(
    getShapePixel(currentShape, currentShapeOrientation),
    currentPosition
  );

  if (!currentShapePixel) {
    return [];
  }

  return arr(height).map((_, row) => {
    return arr(width).map((_, column) => {
      const isInBaseShape = !!baseShape.find(
        ([x, y]) => x === column && y === row
      );
      const isInCurrentShap = !!currentShapePixel.find(
        ([x, y]) => x === column && y === row
      );
      const isFilled = isInBaseShape || isInCurrentShap;

      return isFilled;
    });
  });
}

function paintHTML(pixelMap) {
  document.querySelector('.canvas').innerHTML = pixelMap
    .map((row, y) => {
      return row
        .map((column, x) => {
          return `<span
            class="pixel ${column ? 'filled' : ''}"
            data-x="${x}"
            data-y="${y}"
            style="transform: translate(${pixelSize * x}px, ${pixelSize *
            y}px);"
          ></span>`;
        })
        .join('');
    })
    .join('');
}

function paintConsole(pixelMap) {
  console.clear();
  console.log(
    pixelMap.map(row => row.map(r => (r ? '■' : '□')).join(' ')).join('\n')
  );
}

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

function shiftPixel(pixels, shiftPixel) {
  return (
    pixels && pixels.map(p => [p[0] + shiftPixel[0], p[1] + shiftPixel[1]])
  );
}

function arr(len) {
  return [...new Array(len)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function collapse({
  currentPosition,
  currentShape,
  currentShapeOrientation,
  baseShape,
  width,
  height
}) {
  const currentShapePixel = shiftPixel(
    getShapePixel(currentShape, currentShapeOrientation),
    currentPosition
  );

  if (!currentShapePixel) {
    return false;
  }

  const isTouchBottom =
    Math.max.apply(null, currentShapePixel.map(p => p[1])) > height - 1;

  const collapseWithBaseShape = !!baseShape.find(bs => {
    return !!currentShapePixel.find(cs => cs[0] === bs[0] && cs[1] === bs[1]);
  });

  if (isTouchBottom || collapseWithBaseShape) {
    return true;
  } else {
    return false;
  }
}

/**
 * TODO:
 * // - handle collapse in more cases (with baseShap)
 * // - add keyboard input
 * - erase filled row
 */

function bindKeyboardEvent() {
  document.addEventListener('keyup', e => {
    handleKeyBoardInput(e);
  });
}

function handleKeyBoardInput(e) {
  const nextState = { ...state };
  nextState.currentPosition = [...nextState.currentPosition];

  if (e.keyCode === 38) {
    // up
    nextState.currentShapeOrientation = nextState.currentShapeOrientation + 1;
    if (nextState.currentShapeOrientation === 4) {
      nextState.currentShapeOrientation = 0;
    }
  } else if (e.keyCode === 37) {
    // left
    if (nextState.currentPosition[0] - 1 >= 0) {
      nextState.currentPosition[0] = nextState.currentPosition[0] - 1;
    }
  } else if (e.keyCode === 39) {
    // right
    if (
      nextState.currentPosition[0] +
        1 +
        getWidthByShape(
          nextState.currentShape,
          nextState.currentShapeOrientation
        ) <=
      nextState.width
    ) {
      nextState.currentPosition[0] = nextState.currentPosition[0] + 1;
    }
  } else if (e.keyCode === 40) {
    // down
    nextState.currentPosition[1] = nextState.currentPosition[1] + 1;
  }

  if (collapse(nextState)) {
    nextState.baseShape = [
      ...nextState.baseShape,
      ...shiftPixel(
        getShapePixel(state.currentShape, state.currentShapeOrientation),
        state.currentPosition
      )
    ];

    removeFilledLines(nextState);

    nextState.currentPosition = [getRandomInt(0, 15), 0];
    nextState.currentShape = getRandomInt(0, 4);
    nextState.currentShapeOrientation = getRandomInt(0, 3);
  }

  skip = true;
  state = nextState;
  render(nextState);
}

function getWidthByShape(shape, orientation) {
  if (shape === 0) {
    return 2;
  } else if (shape === 1) {
    if (orientation === 0 || orientation === 2) {
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

function getFilledLines(width, baseShape) {
  const mostBottom = Math.max.apply(null, baseShape.map(p => p[1]));
  const mostTop = Math.min.apply(null, baseShape.map(p => p[1]));
  const filledLines = [];

  for (let i = mostTop; i <= mostBottom; i++) {
    const pointsOfCurrentLine = baseShape
      .filter(s => s[1] === i)
      .map(s => s[0]);
    const uniquePointsOfCurrentLine = uniqeArr(pointsOfCurrentLine);
    if (uniquePointsOfCurrentLine.length === width) {
      filledLines.push(i);
    }
  }

  return filledLines;
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

function removeFilledLines(state) {
  const filledLines = getFilledLines(state.width, state.baseShape);
  filledLines.forEach(lineIndex => {
    state.baseShape = state.baseShape.filter(s => s[1] !== lineIndex);
  });

  state.score = state.score + filledLines.length;
}
