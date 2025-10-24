import { useEffect, useRef, useId, useState } from "react";
import { useOrderStream } from "./useOrderStream";
import Konva from "konva";
import { Button } from "./Button";
import "./Canvas.css";

const { Stage, Layer, Rect, Text, Circle } = Konva;

const blue = "#61dafb";
const green = "#24C1B0";
const red = "#FF5F7F";

const animationDuration = 1000;

export const Canvas = () => {
  const id = useId();
  const orders = useRef([]);
  const [isStreamingEnabled, setIsStreamingEnabled] = useState(true);

  const { stream, isStreaming, pauseStream, resumeStream } = useOrderStream({
    onOrderReceived: orders.current.push,
    enabled: isStreamingEnabled,
  });

  useEffect(() => {
    const stage = new Stage({
      container: id,
      width: 600,
      height: 300,
    });

    const layer = new Layer();

    const ordersStart = new Rect({
      x: 0,
      y: 100,
      width: 30,
      height: 100,
      fill: blue,
      cornerRadius: 4,
    });

    const buyOrdersEnd = new Rect({
      x: 600 - 30,
      y: 0,
      width: 30,
      height: 100,
      fill: green,
      cornerRadius: 4,
    });

    const sellOrdersEnd = new Rect({
      x: 600 - 30,
      y: 200,
      width: 30,
      height: 100,
      fill: red,
      cornerRadius: 4,
    });

    layer.add(ordersStart);
    layer.add(buyOrdersEnd);
    layer.add(sellOrdersEnd);
    stage.add(layer);
  }, [id]);

  return (
    <div>
      <div className="Canvas-container">
        <Button onClick={() => setIsStreamingEnabled(!isStreamingEnabled)}>
          {isStreamingEnabled ? "Pause Streaming" : "Start Streaming"}
        </Button>
      </div>
      <div id={id} />
    </div>
  );
};
