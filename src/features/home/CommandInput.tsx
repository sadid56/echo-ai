import { Mic, Send, Trash2 } from "lucide-react";
import { type KeyboardEvent, type SyntheticEvent, useState } from "react";
import { Button } from "../../components/ui/button";
import { useChatStore } from "../../store/chatStore";

interface CommandInputProps {
  onVoiceClick: () => void;
}

export const CommandInput: React.FC<CommandInputProps> = ({ onVoiceClick }) => {
  const [input, setInput] = useState("");
  const { sendMessage, loading, clearChat } = useChatStore();

  const handleSubmit = (e?: SyntheticEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;
    sendMessage(input);
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className='w-full'>
      <div className='group relative overflow-hidden rounded-[22px] border border-border-color bg-bg-tertiary p-[1px] shadow-[0_0_0_1px_rgba(255,255,255,0.02)] transition-all duration-300 focus-within:border-accent-cyan/70 focus-within:shadow-[0_0_24px_rgba(0,240,255,0.2)]'>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(0,240,255,0.12),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(124,58,237,0.16),_transparent_38%)] opacity-100 transition-opacity duration-300 group-focus-within:opacity-100' />
        <div className='absolute inset-[-30%] opacity-0 transition-opacity duration-300 group-focus-within:opacity-100 group-focus-within:animate-[spin_7s_linear_infinite] bg-[conic-gradient(from_0deg,transparent,rgba(0,240,255,0.35),transparent,rgba(168,85,247,0.3),transparent)]' />

        <div className='relative flex items-end gap-4 rounded-[18px] bg-bg-tertiary px-4 py-3'>
          <textarea
            id='cmd-input'
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
            placeholder='Type a prompt or task...'
            disabled={loading}
            rows={4}
            className='flex-1 min-h-[110px] max-h-[200px] resize-none border-none bg-transparent py-2 pr-2 font-sans text-sm leading-7 text-text-main placeholder:text-text-muted outline-none scrollbar-thin scrollbar-thumb-white/10'
          />

          <div className='flex shrink-0 items-center gap-2.5 pb-1'>
            <Button
              type='button'
              variant='secondary'
              size='sm'
              onClick={clearChat}
              className='gap-2 px-3 py-2.5'
              title='Clear chat context'
            >
              <Trash2 className='h-3.5 w-3.5' />
              <span>Clear</span>
            </Button>

            <Button type='button' variant='secondary' size='sm' onClick={onVoiceClick} title='Start Live Voice Talking Mode'>
              <Mic className='h-4 w-4' />
            </Button>

            <Button
              type='submit'
              variant='primary'
              size='sm'
              disabled={!input.trim() || loading}
              className='gap-2 px-4 py-2.5 shadow-[0_0_12px_rgba(0,240,255,0.25)] disabled:opacity-40'
            >
              <Send className='h-3.5 w-3.5' />
              <span>{loading ? "Running..." : "Send"}</span>
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};
