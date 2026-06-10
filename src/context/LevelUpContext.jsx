import { createContext, useContext, useState, useCallback } from "react";

const LevelUpContext = createContext(null);

export function LevelUpProvider({ children }) {
  const [levelUpData, setLevelUpData] = useState(null);

  const triggerLevelUp = useCallback(({ oldLevel, newLevel, newTitle, bonusXP, bonusCoins }) => {
    setLevelUpData({ oldLevel, newLevel, newTitle, bonusXP, bonusCoins });
  }, []);

  const clearLevelUp = useCallback(() => {
    setLevelUpData(null);
  }, []);

  return (
    <LevelUpContext.Provider value={{ levelUpData, triggerLevelUp, clearLevelUp }}>
      {children}
    </LevelUpContext.Provider>
  );
}

export const useLevelUp = () => useContext(LevelUpContext);