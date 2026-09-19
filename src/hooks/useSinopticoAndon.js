import { useEffect, useState } from "react";
import {
  subscribeSinopticoAndon,
  onSinopticoAndonUpdate,
  offSinopticoAndonUpdate,
  unsubscribeSinopticoAndon,
} from "../services/sinopticoAndon";

export function useSinopticoAndon(line, view) {
  const [data, setData] = useState(null);

  useEffect(() => {
    subscribeSinopticoAndon({ view, line });

    const handleMessage = (message) => {
      if (!message || !message.type) return;
      if (message.line !== line || message.view !== view) return;

      if (message.type === "SNAPSHOT") {
        setData(message.payload.data ?? message.payload);
        return;
      }

      if (message.type === "UPDATE") {
        if (view !== "station") {
          setData(message.payload.data ?? message.payload);
          return;
        }
        setData((current) => {
          if (!current) return current;
          const updates = message.payload.data;
          return current.map((item) => {
            const update = updates.find((candidate) => candidate.st === item.st);
            return update ? { ...item, ...update } : item;
          });
        });
      }
    };

    onSinopticoAndonUpdate(handleMessage);
    return () => {
      offSinopticoAndonUpdate(handleMessage);
      unsubscribeSinopticoAndon({ view, line });
    };
  }, [line, view]);

  return data;
}
