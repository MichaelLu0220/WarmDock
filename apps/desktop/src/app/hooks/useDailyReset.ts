import { useEffect } from "react";
import { checkDailyRefresh } from "../orchestrators/dailyRefresh";

/** 啟動時檢查是否需要每日結算(後端有同日防重複,多呼叫無害)。 */
export function useDailyReset() {
  useEffect(() => {
    checkDailyRefresh().catch((err) =>
      console.error("daily reset check failed:", err)
    );
  }, []);
}
