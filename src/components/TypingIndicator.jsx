import { SyncLoader } from "react-spinners";

export const TypingIndicator = ({ isTyping }) => {
  return (
    <div className="flex items-end justify-start w-full ml-8">
      {isTyping && (
        <SyncLoader
          color="#16a34a"
          size={10}
          aria-label="Loading Spinner"
          data-testid="loader"
        />
      )}
    </div>
  );
};

