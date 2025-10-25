import Konva from "konva";
import { scaleLinear } from "d3-scale";
const { Stage, Layer, Rect, Text, Tween, Easings, Path } = Konva;

function OrderFlowDiagram(id, { width = 600, height = 300 } = {}) {
  // #region config
  const blue = "#61dafb";
  const green = "#24C1B0";
  const red = "#FF5F7F";
  const animationTicks = 1000;
  const textsPadding = 20;
  const xStart = textsPadding;
  const xEnd = width - textsPadding;
  const xCurvePercentageStart = 20;
  const xCurvePercentageEnd = 80;
  const performanceAttrs = {
    perfectDrawEnabled: false,
    listening: false,
    preventDefault: false,
  };
  const flowGap = 1;
  // const blockHeightPercentage = 33; // 33% of the height
  // #endregion

  // #region instance vars
  let layer;
  let ordersBlock;
  let buyOrdersBlock;
  let sellOrdersBlock;
  let buyFlow;
  let sellFlow;
  // scales so that we can render in percentages from 0 to 100
  const xScale = scaleLinear().domain([0, 100]).range([xStart, xEnd]);
  const yScale = scaleLinear().domain([0, 100]).range([0, height]);
  const sizeScale = scaleLinear().domain([1, 2500]).range([1, 50]);

  const orders = [];
  let isRunning = true;
  let buySellRatio = 0.5;
  // #endregion

  function init() {
    const stage = new Stage({
      container: id,
      width,
      height,
    });

    layer = new Layer();

    const ordersBlockText = new Text({
      x: 0,
      y: 0,
      text: "Orders",
      fontSize: 14,
      fill: "#fff",
      ...performanceAttrs,
    });

    ordersBlockText.rotate(-90);
    ordersBlockText.setPosition({
      y: yScale(50) + ordersBlockText.getTextWidth() / 2,
    });

    ordersBlock = new Rect({
      x: xScale(0),
      y: yScale(33),
      width: xScale(1),
      height: yScale(33),
      fill: blue,
      ...performanceAttrs,
    });

    const buyOrdersBlockText = new Text({
      x: 0,
      y: 0,
      text: "Buys",
      fontSize: 14,
      fill: "#fff",
      ...performanceAttrs,
    });

    buyOrdersBlockText.rotate(90);
    buyOrdersBlockText.setPosition({
      x: width,
      y: yScale(33) / 2 - buyOrdersBlockText.getTextWidth() / 2,
    });

    buyOrdersBlock = new Rect({
      x: xScale(95),
      y: 0,
      width: xScale(1),
      height: yScale(50) * buySellRatio,
      fill: green,
      ...performanceAttrs,
    });

    const sellOrdersBlockText = new Text({
      x: 0,
      y: 0,
      text: "Sells",
      fontSize: 14,
      fill: "#fff",
      ...performanceAttrs,
    });

    sellOrdersBlockText.rotate(90);
    sellOrdersBlockText.setPosition({
      x: width,
      y: yScale(67) + yScale(33) / 2 - sellOrdersBlockText.getTextWidth() / 2,
    });

    sellOrdersBlock = new Rect({
      x: xScale(95),
      y: yScale(67),
      width: xScale(1),
      height: yScale(50) * buySellRatio,
      fill: red,
      ...performanceAttrs,
    });

    function createFlowPath(side = "buy") {
      const startBlock = ordersBlock;
      const endBlock = side === "buy" ? buyOrdersBlock : sellOrdersBlock;

      const startBlockY =
        side === "buy"
          ? startBlock.y()
          : startBlock.y() + startBlock.height() * buySellRatio;

      const topMargin = side === "buy" ? 0 : 1;
      const bottomMargin = side === "buy" ? -1 : 0;

      function curvePath(x1, y1, x2, y2, curvature = 0.5) {
        const dx = x2 - x1;
        const controlX1 = x1 + dx * curvature;
        const controlX2 = x2 - dx * curvature;
        return `C${controlX1},${y1} ${controlX2},${y2} ${x2},${y2}`;
      }

      const data = [
        `M${startBlock.x() + startBlock.width()},${startBlockY + topMargin}`,
        `L${xScale(xCurvePercentageStart)},${startBlockY + topMargin}`,
        curvePath(
          xScale(xCurvePercentageStart),
          startBlockY + topMargin,
          xScale(xCurvePercentageEnd),
          endBlock.y()
        ),
        `L${endBlock.x()},${endBlock.y()}`,
        `L${endBlock.x()},${endBlock.y() + endBlock.height()}`,
        `L${xScale(xCurvePercentageEnd)},${endBlock.y() + endBlock.height()}`,
        curvePath(
          xScale(xCurvePercentageEnd),
          endBlock.y() + endBlock.height(),
          xScale(xCurvePercentageStart),
          startBlockY +
            startBlock.height() *
              (side === "buy" ? buySellRatio : 1 - buySellRatio) +
            bottomMargin
        ),
        `L${startBlock.x() + startBlock.width()},${
          startBlockY +
          startBlock.height() *
            (side === "buy" ? buySellRatio : 1 - buySellRatio) +
          bottomMargin
        }`,
      ].join(" ");

      return new Path({
        data: data,
        fill: "#fff",
        opacity: 0.2,
        ...performanceAttrs,
      });
    }

    buyFlow = createFlowPath("buy");
    layer.add(buyFlow);
    sellFlow = createFlowPath("sell");
    layer.add(sellFlow);

    layer.add(ordersBlockText);
    layer.add(ordersBlock);
    layer.add(buyOrdersBlockText);
    layer.add(buyOrdersBlock);
    layer.add(sellOrdersBlockText);
    layer.add(sellOrdersBlock);
    stage.add(layer);
  }

  // Define the path calculation function inside init to access block variables
  function getOrderCoordinatesByProgress(order) {
    const startBlock = ordersBlock;
    const endBlock = order.side === "buy" ? buyOrdersBlock : sellOrdersBlock;
    const progress = order.progress * 100;

    const startBlockY =
      order.side === "buy"
        ? startBlock.y()
        : startBlock.y() + startBlock.height() * buySellRatio;

    const startY = startBlockY + (startBlock.height() * order.yPosition) / 100;

    if (progress <= xCurvePercentageStart) {
      // First segment: straight line from start to curve start
      return {
        x: order.xScale(progress),
        y: startY,
      };
    } else if (progress >= xCurvePercentageEnd) {
      // last segment: straight line from curve end to end
      return {
        x: order.xScale(progress),
        y: endBlock.y() + (endBlock.height() * order.yPosition) / 100,
      };
    } else {
      // middle segment: cubic bezier curve from curve start to curve end
      const controlY1 = startY;
      const controlY2 =
        endBlock.y() + (endBlock.height() * order.yPosition) / 100;

      const t = order.progress;
      const oneMinusT = 1 - t;

      const x = order.xScale(order.progress * 100);

      const y =
        Math.pow(oneMinusT, 3) * startY +
        3 * Math.pow(oneMinusT, 2) * t * controlY1 +
        3 * oneMinusT * Math.pow(t, 2) * controlY2 +
        Math.pow(t, 3) * controlY2;

      return { x, y };
    }
  }

  function renderNextTick() {
    let buyVolume = 0;
    let sellVolume = 0;

    orders.forEach((order) => {
      if (order.animationState === "entering") {
        order.animationState = "animating";
        order.progress = 1 / animationTicks;
        order.yPosition = Math.floor(Math.random() * 100);

        order.node = new Rect({
          x: xScale(0),
          y:
            order.side === "buy"
              ? ordersBlock.y() +
                (ordersBlock.height() * buySellRatio * order.yPosition) / 100
              : ordersBlock.y() +
                ordersBlock.height() * buySellRatio +
                (ordersBlock.height() * (1 - buySellRatio) * order.yPosition) /
                  100,
          width: sizeScale(order.volume),
          height: 8,
          fill: order.side === "buy" ? green : red,
          ...performanceAttrs,
        });

        order.xScale = scaleLinear()
          .domain([0, 100])
          .range([xScale(0), xScale(100) - order.node.width()]);

        layer.add(order.node);

        // order.tween = new Tween({
        //   node: order.node,
        //   duration: 500,
        //   fill: order.side === "buy" ? green : red,
        //   easing: Easings.Linear,
        // });
      }

      if (order.animationState === "animating") {
        order.progress += 1 / animationTicks;
        if (order.progress >= 1) {
          order.progress = 1;
          order.animationState = "completing";
        }

        // Update position along the flow path
        const pos = getOrderCoordinatesByProgress(order);
        order.node.setPosition(pos);
        // layer.batchDraw();

        // Update color animation
        // order.tween.seek(order.progress);
      }

      if (order.animationState === "completing") {
        order.animationState = "completed";
        order.node.destroy();
        // order.tween.destroy();
        delete order.node;
        // delete order.tween;
      }

      if (order.side === "buy") {
        buyVolume += order.volume;
      } else {
        sellVolume += order.volume;
      }
    });

    buySellRatio =
      buyVolume + sellVolume > 0 ? buyVolume / (buyVolume + sellVolume) : 0.5;

    // buyOrdersBlock.setHeight(yScale(67) * buySellRatio);
    // sellOrdersBlock.setHeight(yScale(67) * (1 - buySellRatio));

    layer.draw();
  }

  function animate() {
    renderNextTick();

    if (isRunning) {
      requestAnimationFrame(animate);
    }
  }

  return {
    init,
    /**
     * add order to the diagram
     * @param {{
     *   id: String,
     *   side: "buy" | "sell",
     *   volume: number,
     *   timestamp: number,
     *   animationState: "entering" | "animating" | "completed",
     *   progress: number,
     * }} order
     */
    addOrder: (order) => {
      orders.push({ ...order });
    },
    run: () => {
      isRunning = true;
      animate();
    },
    pause: () => {
      isRunning = false;
    },
  };
}

export { OrderFlowDiagram };
