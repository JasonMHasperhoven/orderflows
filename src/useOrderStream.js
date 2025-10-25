import { useEffect, useRef, useState } from "react";
import {
  BehaviorSubject,
  Subject,
  EMPTY,
  timer,
  startWith,
  switchMap,
  tap,
  mergeMap,
} from "rxjs";

const generateOrder = () => {
  // Realistic volume distribution - most orders small, few large
  const rand = Math.random();
  let volume;
  if (rand < 0.6) {
    volume = Math.floor(Math.random() * 100) + 10; // 10-110
  } else if (rand < 0.85) {
    volume = Math.floor(Math.random() * 500) + 100; // 100-600
  } else {
    volume = Math.floor(Math.random() * 2000) + 500; // 500-2500
  }

  return {
    id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    side: Math.random() > 0.5 ? "buy" : "sell",
    volume,
    timestamp: Date.now(),
    animationState: "entering",
    progress: 0,
  };
};

export const useOrderStream = ({ onOrderReceived, enabled = true }) => {
  const streamControl = useRef(new BehaviorSubject(enabled));
  const orderEvents = useRef(new Subject());
  const onOrderReceivedRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(enabled);

  useEffect(() => {
    if (!onOrderReceivedRef?.current) return;

    const subscription = streamControl.current
      .pipe(
        startWith(streamControl.current.getValue()),
        switchMap((streaming) => {
          if (!streaming) return EMPTY;

          const scheduleNext = () =>
            timer(50 + Math.pow(1 - Math.random(), 3) * 2000).pipe(
              // 50ms to 2050ms, heavily weighted toward shorter intervals
              tap(() => {
                const order = generateOrder();
                onOrderReceivedRef.current?.(order);
                orderEvents.current.next(order);
              }),
              mergeMap(scheduleNext)
            );

          return scheduleNext();
        })
      )
      .subscribe();

    // Subscribe to stream control changes to update isStreaming state
    const controlSubscription = streamControl.current.subscribe(setIsStreaming);

    return () => {
      subscription.unsubscribe();
      controlSubscription.unsubscribe();
    };
  }, []);

  // Keep the latest callback in ref to avoid closure issues
  useEffect(() => {
    if (onOrderReceived) {
      onOrderReceivedRef.current = onOrderReceived;
    }
  }, [onOrderReceived]);

  return {
    stream: orderEvents.current.asObservable(),
    isStreaming,
    pauseStream: () => streamControl.current.next(false),
    resumeStream: () => streamControl.current.next(true),
  };
};
