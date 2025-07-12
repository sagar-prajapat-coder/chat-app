import { SyncLoader } from "react-spinners";

export const TypingIndicator = ({ isTyping }) => {
  return (
    <div className="flex items-end justify-start">
      {isTyping && (
        <SyncLoader
          size={10}
          aria-label="Loading Spinner"
          data-testid="loader"
        />
      )}
    </div>
  );
};

