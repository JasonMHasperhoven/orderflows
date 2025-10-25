import { useEffect, useRef, useId, useState, useCallback } from "react";
import { useOrderStream } from "./useOrderStream";
import { Button } from "./Button";
import "./Canvas.css";
import { OrderFlowDiagram } from "./OrderFlowDiagram";

export const Canvas = () => {
  const id = useId();
  const orderFlowDiagram = useRef(new OrderFlowDiagram(id));
  const [isInitialized, setIsInitialized] = useState(false);

  const { isStreaming, pauseStream, resumeStream } = useOrderStream({
    onOrderReceived: orderFlowDiagram.current.addOrder,
  });

  useEffect(() => {
    orderFlowDiagram.current.init();
    setIsInitialized(true);
  }, [id]);

  useEffect(() => {
    if (isInitialized) {
      if (isStreaming) {
        orderFlowDiagram.current.run();
      } else {
        orderFlowDiagram.current.pause();
      }
    }
  }, [isInitialized, isStreaming]);

  return (
    <div>
      <div className="Canvas-container">
        <Button onClick={() => (isStreaming ? pauseStream() : resumeStream())}>
          {isStreaming ? "Pause Streaming" : "Start Streaming"}
        </Button>
      </div>
      <div id={id} />
    </div>
  );
};
