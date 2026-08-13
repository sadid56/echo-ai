import { Mic, Plus, Sparkles, Mail, GitBranch, Bug, Code, Terminal, Square, ArrowUp, File } from "lucide-react";
import { type KeyboardEvent, type SyntheticEvent, useState, useRef } from "react";
import { Button } from "../../components/ui/button";
import { useChatStore } from "../../store/chatStore";
import { Dropdown } from "../../components/ui/dropdown";

interface CommandInputProps {
  onVoiceClick: () => void;
}

interface SelectedAttachment {
  name: string;
  mimeType: string;
  data: string; // base64 representation (empty for non-images)
  isImage: boolean;
  textPreview: string; // raw text contents for code/text files
}

export const CommandInput: React.FC<CommandInputProps> = ({ onVoiceClick }) => {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<SelectedAttachment[]>([]);
  const { sendMessage, loading, config, updateConfig, stopChat } = useChatStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e?: SyntheticEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    // 1. Separate images and text/code files
    const imageAttachments = attachments
      .filter((att) => att.isImage)
      .map((att) => ({
        name: att.name,
        mime_type: att.mimeType,
        data: att.data,
      }));

    const textAttachments = attachments.filter((att) => !att.isImage);

    // 2. Build final prompt with text files appended as markdown blocks
    let finalPrompt = input;
    if (textAttachments.length > 0) {
      finalPrompt += "\n\n--- Attached Files Context ---";
      for (const att of textAttachments) {
        finalPrompt += `\n\n[File: ${att.name}]\n\`\`\`\n${att.textPreview}\n\`\`\``;
      }
    }

    // 3. Send via store action
    sendMessage(finalPrompt, imageAttachments.length > 0 ? imageAttachments : undefined);

    // 4. Clear state
    setInput("");
    setAttachments([]);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleQuickCommand = (promptText: string) => {
    setInput(promptText);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  const handlePlusClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);

    for (const file of filesArray) {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          const base64Data = (reader.result as string).split(",")[1];
          setAttachments((prev) => [
            ...prev,
            {
              name: file.name,
              mimeType: file.type,
              data: base64Data,
              isImage: true,
              textPreview: "",
            },
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          const textContent = reader.result as string;
          setAttachments((prev) => [
            ...prev,
            {
              name: file.name,
              mimeType: file.type,
              data: "",
              isImage: false,
              textPreview: textContent,
            },
          ]);
        };
        reader.readAsText(file);
      }
    }
    // Clear input value so same file can be selected consecutively
    e.target.value = "";
  };

  const removeAttachment = (indexToRemove: number) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const activeModel = config?.text_model?.model_name || "google/gemini-2.5-flash";
  const configuredModels = config?.text_model?.models ?? [];
  const selectOptions = configuredModels.map(m => ({ label: m, value: m }));
  if (!configuredModels.includes(activeModel)) {
    selectOptions.push({ label: `${activeModel} (Current)`, value: activeModel });
  }

  const quickCommands = [
    {
      label: "Fetch unread emails",
      prompt: "Fetch my latest unread emails and summarize them.",
      icon: <Mail className="w-3.5 h-3.5 text-blue-400" />
    },
    {
      label: "Review git diff",
      prompt: "Review my recent git changes and summarize them.",
      icon: <GitBranch className="w-3.5 h-3.5 text-green-400" />
    },
    {
      label: "Explain code error",
      prompt: "Explain this code error and suggest a fix: ",
      icon: <Bug className="w-3.5 h-3.5 text-red-400" />
    },
    {
      label: "Refactor component",
      prompt: "Suggest clean code refactoring improvements for this component: ",
      icon: <Code className="w-3.5 h-3.5 text-amber-400" />
    },
    {
      label: "Write unit tests",
      prompt: "Generate comprehensive unit tests for this function: ",
      icon: <Terminal className="w-3.5 h-3.5 text-purple-400" />
    }
  ];

  return (
    <div className='w-full flex flex-col gap-4'>
      <form onSubmit={handleSubmit} className='w-full'>
        {/* Hidden File Input */}
        <input
          type='file'
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          className='hidden'
          accept='image/*,text/*,application/json,application/javascript,application/typescript'
        />

        {/* Main box container with a clean, simple border */}
        <div className='relative flex flex-col rounded-3xl border border-border-color bg-bg-tertiary px-5 py-4 focus-within:border-accent-cyan/60 transition-all duration-300 focus-within:shadow-[0_0_20px_rgba(0,240,255,0.06)]'>
          
          {/* Selected Attachments Row */}
          {attachments.length > 0 && (
            <div className='flex flex-wrap gap-2 mb-3 max-h-32 overflow-y-auto pb-2 border-b border-border-color/20'>
              {attachments.map((att, idx) => (
                <div 
                  key={idx} 
                  className='flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.04] border border-border-color/30 rounded-xl text-[12px] text-text-main group'
                >
                  {att.isImage ? (
                    <img 
                      src={`data:${att.mimeType};base64,${att.data}`} 
                      alt={att.name} 
                      className='w-5 h-5 rounded object-cover shadow-sm' 
                    />
                  ) : (
                    <File className='w-3.5 h-3.5 text-accent-cyan' />
                  )}
                  <span className='max-w-[120px] truncate'>{att.name}</span>
                  <button
                    type='button'
                    onClick={() => removeAttachment(idx)}
                    className='text-text-muted hover:text-red-400 transition-colors ml-1 font-bold'
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input Textarea */}
          <textarea
            ref={textareaRef}
            id='cmd-input'
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
            placeholder='Describe a task and let Echo do the rest...'
            disabled={loading}
            rows={3}
            className='w-full resize-none border-none bg-transparent py-1 pr-2 font-sans text-[15px] leading-7 text-text-main placeholder:text-text-muted outline-none scrollbar-thin scrollbar-thumb-white/10'
          />

          {/* Bottom Controls Bar */}
          <div className='flex items-center justify-between border-t border-border-color/20 pt-3 mt-2.5 shrink-0'>
            
            {/* Left Side: Plus, Voice, Model Dropdown */}
            <div className='flex items-center gap-2.5'>
              <Button
                className='rounded-full h-9 w-9 p-0 hover:bg-white/[0.06] border border-border-color/30 flex items-center justify-center'
                type='button'
                variant='secondary'
                size='sm'
                onClick={handlePlusClick}
                title='Add context or attachment'
              >
                <Plus className='h-4.5 w-4.5 text-text-muted hover:text-text-main transition-colors' />
              </Button>

              <Button
                className='rounded-full h-9 w-9 p-0 hover:bg-white/[0.06] border border-border-color/30 flex items-center justify-center'
                type='button'
                variant='secondary'
                size='sm'
                onClick={onVoiceClick}
                title='Start Live Voice Mode'
              >
                <Mic className='h-4 w-4 text-text-muted hover:text-text-main transition-colors' />
              </Button>

              <div className='hidden sm:block border-l border-border-color/30 h-5 mx-1' />

              <Dropdown
                value={activeModel}
                onChange={async (nextValue) => {
                  if (config) {
                    const updated = {
                      ...config,
                      text_model: {
                        ...config.text_model,
                        model_name: nextValue,
                      },
                    };
                    await updateConfig(updated);
                  }
                }}
                options={selectOptions}
                className="w-48"
                triggerClassName="h-9 py-1 px-3 bg-transparent hover:bg-white/[0.04] border-border-color/30 rounded-xl"
              />
            </div>

            {/* Right Side: Modern Material style Send / Stop Button */}
            {loading ? (
              <Button
                type='button'
                onClick={stopChat}
                variant='secondary'
                size='sm'
                className='rounded-full h-9 w-9 p-0 bg-amber-500 hover:bg-amber-600 text-[#08080a] border-none shadow-[0_2px_8px_rgba(245,158,11,0.3)] flex items-center justify-center transition-all duration-200 active:scale-95'
                title='Stop generation'
              >
                <Square className='h-4 w-4 fill-current text-[#08080a]' />
              </Button>
            ) : (
              <Button
                type='submit'
                variant='primary'
                size='sm'
                disabled={!input.trim() && attachments.length === 0}
                className='rounded-full h-9 w-9 p-0 bg-accent-cyan hover:bg-accent-cyan/90 text-[#08080a] border-none shadow-[0_2px_8px_rgba(0,240,255,0.25)] flex items-center justify-center transition-all duration-200 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed'
                title='Send message'
              >
                <ArrowUp className='h-4 w-4 text-[#08080a]' strokeWidth={2.5} />
              </Button>
            )}
          </div>
        </div>
      </form>

      {/* Suggested Quick Commands Row */}
      <div className='w-full flex items-center gap-2 overflow-x-auto py-1 scrollbar-none select-none'>
        {quickCommands.map((cmd, idx) => (
          <Button
            key={idx}
            type='button'
            variant='secondary'
            size='sm'
            onClick={() => handleQuickCommand(cmd.prompt)}
            className='rounded-full gap-2 px-4 py-2 whitespace-nowrap text-text-muted hover:text-text-main hover:border-accent-cyan/30 bg-bg-secondary/40 border-border-color/30 font-medium tracking-normal text-xs shadow-sm hover:shadow-[0_2px_8px_rgba(0,240,255,0.06)] shrink-0'
          >
            {cmd.icon}
            <span>{cmd.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};