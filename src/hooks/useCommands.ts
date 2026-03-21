import { useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase.ts";

interface UseCommandsOptions {
  onRefresh?: () => void;
  onUpdateContent?: () => void;
}

export function useCommands(
  screenId: string | null,
  options: UseCommandsOptions = {}
) {
  useEffect(() => {
    if (!screenId) return;

    const commandsRef = collection(db, "screens", screenId, "commands");
    const pendingQuery = query(commandsRef, where("status", "==", "pending"));

    const unsubscribe = onSnapshot(pendingQuery, async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        if (change.type === "added") {
          const command = change.doc.data();
          const commandRef = doc(
            db,
            "screens",
            screenId,
            "commands",
            change.doc.id
          );

          // Acknowledge the command
          await updateDoc(commandRef, {
            status: "acknowledged",
            acknowledgedAt: serverTimestamp(),
          });

          try {
            switch (command.type) {
              case "restart":
                await updateDoc(commandRef, {
                  status: "completed",
                  completedAt: serverTimestamp(),
                });
                window.location.reload();
                break;

              case "refresh":
                options.onRefresh?.();
                await updateDoc(commandRef, {
                  status: "completed",
                  completedAt: serverTimestamp(),
                });
                break;

              case "update-content":
                options.onUpdateContent?.();
                await updateDoc(commandRef, {
                  status: "completed",
                  completedAt: serverTimestamp(),
                });
                break;

              default:
                console.warn(`Unknown command type: ${command.type}`);
                await updateDoc(commandRef, {
                  status: "completed",
                  completedAt: serverTimestamp(),
                  error: `Unknown command type: ${command.type}`,
                });
            }
          } catch (err) {
            console.error(`Failed to execute command ${command.type}:`, err);
            await updateDoc(commandRef, {
              status: "completed",
              completedAt: serverTimestamp(),
              error: String(err),
            });
          }
        }
      }
    });

    return () => unsubscribe();
  }, [screenId, options.onRefresh, options.onUpdateContent]);
}
