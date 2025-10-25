import Konva from "konva";
import { scaleLinear } from "d3-scale";
const { Stage, Layer, Rect, Text, Tween, Easings, Path } = Konva;

function OrderFlowDiagram(id, { width = 600, height = 300 } = {}) {
  // #region config
  const blue = "#61dafb";
  const green = "#24C1B0";
  const red = "#FF5F7F";
  const animationTicks = 300;
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
  const blockWidth = 20;
  const buySellBlocksGapPercentage = 20;
  const orderYClamp = [20, 80];
  // #endregion

  // #region instance vars
  let layer;
  let ordersBlock;
  let buyOrdersBlock;
  let buyOrdersBlockText;
  let sellOrdersBlock;
  let sellOrdersBlockText;
  let buyFlow;
  let sellFlow;

  // scales so that we can render in percentages from 0 to 100
  const xScale = scaleLinear().domain([0, 100]).range([xStart, xEnd]);
  const yScale = scaleLinear().domain([0, 100]).range([0, height]);

  // scale the volume to the width of the order
  const sizeScale = scaleLinear().domain([1, 2500]).range([1, 50]);

  const orders = [];
  let isRunning = true;
  let sellBuyRatio = 0.5;
  let historyPercentage = 100;
  // #endregion

  function curvePath(x1, y1, x2, y2, curvature = 0.5) {
    const dx = x2 - x1;
    const controlX1 = x1 + dx * curvature;
    const controlX2 = x2 - dx * curvature;
    return `C${controlX1},${y1} ${controlX2},${y2} ${x2},${y2}`;
  }

  function createFlowPath(side = "buy") {
    const startBlock = ordersBlock;
    const endBlock = side === "buy" ? buyOrdersBlock : sellOrdersBlock;

    const startBlockY =
      side === "sell"
        ? startBlock.y()
        : startBlock.y() + startBlock.height() * sellBuyRatio;

    const topMargin = side === "sell" ? 0 : flowGap;
    const bottomMargin = side === "sell" ? -flowGap : 0;

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
            (side === "sell" ? sellBuyRatio : 1 - sellBuyRatio) +
          bottomMargin
      ),
      `L${startBlock.x() + startBlock.width()},${
        startBlockY +
        startBlock.height() *
          (side === "sell" ? sellBuyRatio : 1 - sellBuyRatio) +
        bottomMargin
      }`,
    ].join(" ");

    return data;
  }

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
      y: yScale(25),
      width: blockWidth,
      height: yScale(50),
      fill: blue,
      ...performanceAttrs,
    });

    sellOrdersBlock = new Rect({
      x: xScale(100) - blockWidth,
      y: 0,
      width: blockWidth,
      height: yScale(100 - buySellBlocksGapPercentage) * sellBuyRatio,
      fill: red,
      ...performanceAttrs,
    });

    sellOrdersBlockText = new Text({
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
      y: sellOrdersBlock.height() / 2 - sellOrdersBlockText.getTextWidth() / 2,
    });

    const buyBlockHeight =
      yScale(100 - buySellBlocksGapPercentage) * sellBuyRatio;
    buyOrdersBlock = new Rect({
      x: xScale(100) - blockWidth,
      y: yScale(100) - buyBlockHeight,
      width: blockWidth,
      height: buyBlockHeight,
      fill: green,
      ...performanceAttrs,
    });

    buyOrdersBlockText = new Text({
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
      y:
        buyOrdersBlock.y() +
        buyOrdersBlock.height() / 2 -
        buyOrdersBlockText.getTextWidth() / 2,
    });

    sellFlow = new Path({
      data: createFlowPath("sell"),
      fill: "#fff",
      opacity: 0.2,
      ...performanceAttrs,
    });

    buyFlow = new Path({
      data: createFlowPath("buy"),
      fill: "#fff",
      opacity: 0.2,
      ...performanceAttrs,
    });

    layer.add(ordersBlockText);
    layer.add(ordersBlock);
    layer.add(buyOrdersBlockText);
    layer.add(buyOrdersBlock);
    layer.add(sellOrdersBlockText);
    layer.add(sellOrdersBlock);
    layer.add(buyFlow);
    layer.add(sellFlow);
    stage.add(layer);
  }

  function getOrderCoordinatesByProgress(order) {
    const startBlock = ordersBlock;
    const endBlock = order.side === "buy" ? buyOrdersBlock : sellOrdersBlock;
    const progress = order.progress * 100;

    const startBlockY =
      order.side === "sell"
        ? startBlock.y()
        : startBlock.y() + startBlock.height() * sellBuyRatio;

    const startY =
      startBlockY +
      (startBlock.height() *
        (order.side === "sell" ? sellBuyRatio : 1 - sellBuyRatio) *
        order.yPosition) /
        100;

    const x = order.xScale(order.progress * 100);
    if (progress <= xCurvePercentageStart) {
      // First segment: straight line from start to curve start
      return {
        x,
        y: startY,
      };
    } else if (progress >= xCurvePercentageEnd) {
      // last segment: straight line from curve end to end
      return {
        x,
        y: endBlock.y() + (endBlock.height() * order.yPosition) / 100,
      };
    } else {
      // middle segment: cubic bezier from curve start to curve end
      const controlY1 = startY;
      const controlY2 =
        endBlock.y() + (endBlock.height() * order.yPosition) / 100;

      // Normalize progress to the curve segment (0 to 1 within the curve)
      const curveStart = xCurvePercentageStart / 100;
      const curveEnd = xCurvePercentageEnd / 100;
      const curveLength = curveEnd - curveStart;

      const t = (order.progress - curveStart) / curveLength;
      const oneMinusT = 1 - t;

      const y =
        Math.pow(oneMinusT, 3) * startY +
        3 * Math.pow(oneMinusT, 2) * t * controlY1 +
        3 * oneMinusT * Math.pow(t, 2) * controlY2 +
        Math.pow(t, 3) * controlY2;

      return { x, y };
    }
  }

  function initializeOrderNode(order) {
    order.animationState = "animating";
    order.progress = 1 / animationTicks;

    // create random y position within the flow
    order.yPosition = Math.min(
      Math.max(Math.floor(Math.random() * 100), orderYClamp[0]),
      orderYClamp[1]
    );
    console.log("TCL: initializeOrderNode -> order.yPosition", order.yPosition);

    order.node = new Rect({
      x: xScale(0),
      y:
        order.side === "buy"
          ? ordersBlock.y() +
            (ordersBlock.height() * sellBuyRatio * order.yPosition) / 100
          : ordersBlock.y() +
            ordersBlock.height() * sellBuyRatio +
            (ordersBlock.height() * (1 - sellBuyRatio) * order.yPosition) / 100,
      width: sizeScale(order.volume),
      height: 8,
      fill: order.side === "buy" ? green : red,
      ...performanceAttrs,
    });

    order.xScale = scaleLinear()
      .domain([0, 100])
      .range([xScale(0), xScale(100) - order.node.width()]);

    layer.add(order.node);
  }

  function animateOrderNode(order) {
    order.progress += 1 / animationTicks;
    if (order.progress >= 1) {
      order.progress = 1;
      order.animationState = "completing";
    }

    const pos = getOrderCoordinatesByProgress(order);
    order.node.setPosition(pos);
  }

  function completeOrderNode(order) {
    order.animationState = "completed";
    order.node.destroy();
    delete order.node;
  }

  function updateBlocksVolume(buyVolume, sellVolume) {
    sellOrdersBlock.height(
      yScale(100 - buySellBlocksGapPercentage) * sellBuyRatio
    );

    sellOrdersBlockText.text(`Sells: ${sellVolume}`);
    sellOrdersBlockText.y(
      Math.max(
        0,
        sellOrdersBlock.y() +
          sellOrdersBlock.height() / 2 -
          sellOrdersBlockText.getTextWidth() / 2
      )
    );

    const buyBlockHeight =
      yScale(100 - buySellBlocksGapPercentage) * (1 - sellBuyRatio);
    buyOrdersBlock.y(yScale(100) - buyBlockHeight);
    buyOrdersBlock.height(buyBlockHeight);
    buyOrdersBlockText.text(`Buys: ${buyVolume}`);
    buyOrdersBlockText.y(
      Math.min(
        height - buyOrdersBlockText.getTextWidth(),
        buyOrdersBlock.y() +
          buyOrdersBlock.height() / 2 -
          buyOrdersBlockText.getTextWidth() / 2
      )
    );

    buyFlow.data(createFlowPath("buy"));
    sellFlow.data(createFlowPath("sell"));
  }

  function renderNextTick() {
    let buyVolume = 0;
    let sellVolume = 0;

    let timestampFilter;
    if (orders.length > 0 && historyPercentage < 100) {
      const range = [
        Math.ceil(orders[orders.length - 1].timestamp),
        Math.floor(orders[0].timestamp),
      ];
      const timestampScale = scaleLinear().domain([0, 100]).range(range);

      timestampFilter = timestampScale(historyPercentage);
    }

    orders.forEach((order) => {
      if (timestampFilter && order.timestamp <= timestampFilter) {
        return;
      }

      if (order.animationState === "entering") {
        initializeOrderNode(order);
      }

      if (order.animationState === "animating") {
        animateOrderNode(order);
      }

      if (order.animationState === "completing") {
        completeOrderNode(order);
      }

      if (order.side === "buy") {
        buyVolume += order.volume;
      } else {
        sellVolume += order.volume;
      }
    });

    sellBuyRatio = Math.min(
      Math.max(
        buyVolume + sellVolume > 0
          ? sellVolume / (buyVolume + sellVolume)
          : 0.5,
        0.1
      ),
      0.9
    );

    updateBlocksVolume(buyVolume, sellVolume);

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
    addOrder: (order) => {
      orders.push({ ...order });
    },
    setHistoryPercentage: (value) => {
      historyPercentage = value;
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
