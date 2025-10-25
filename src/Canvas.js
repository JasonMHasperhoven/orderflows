import { useEffect, useRef, useId, useState } from "react";
import { useOrderStream } from "./useOrderStream";
import { Button } from "./Button";
import { OrderFlowDiagram } from "./OrderFlowDiagram";
import { Slider } from "./Slider";
import "./Canvas.css";

export const Canvas = () => {
  const id = useId();
  const orderFlowDiagram = useRef(new OrderFlowDiagram(id));
  const [isInitialized, setIsInitialized] = useState(false);
  const [historyPercentage, setHistoryPercentage] = useState(100);

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

  useEffect(() => {
    orderFlowDiagram.current.setHistoryPercentage(historyPercentage);
  }, [historyPercentage]);

  return (
    <div>
      <div className="Canvas-container">
        <Button onClick={() => (isStreaming ? pauseStream() : resumeStream())}>
          {isStreaming ? "Pause Streaming" : "Start Streaming"}
        </Button>
      </div>
      <div id={id} className="Canvas" />
      <Slider value={historyPercentage} onInput={setHistoryPercentage} />
    </div>
  );
};
