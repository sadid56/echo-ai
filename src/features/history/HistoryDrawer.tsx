import { useState, useMemo } from "react";
import { Drawer } from "../../components/ui/drawer";
import { useChatStore, ChatSession } from "../../store/chatStore";
import { Button } from "../../components/ui/button";
import { AlertDialog } from "../../components/ui/dialog";
import { MessageSquare, Plus, Trash2, Search, Clock, Layers } from "lucide-react";

export function HistoryDrawer() {
  const { sessions, activeSessionId, showHistory, setShowHistory, newChat, selectSession, deleteSession, clearAllHistory } = useChatStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [sessionToDelete, setSessionToDelete] = useState<ChatSession | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const query = searchQuery.toLowerCase();
    return sessions.filter((s) => {
      const matchTitle = s.title.toLowerCase().includes(query);
      const matchMessage = s.messages.some((m) => m.content.toLowerCase().includes(query));
      return matchTitle || matchMessage;
    });
  }, [sessions, searchQuery]);

  const handleStartNewChat = () => {
    newChat();
    setShowHistory(false);
  };

  const handleSelectSession = (id: string) => {
    selectSession(id);
    setShowHistory(false);
  };

  const formatSessionDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return `Today, ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    }

    return date.toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <>
      <Drawer title='Chat History' description='Browse previous conversation contexts' open={showHistory} onOpenChange={setShowHistory} side='left'>
        <div className='flex flex-col h-full gap-3 pt-1'>
          {/* Top Actions: New Chat & Search */}
          <div className='flex flex-col gap-2.5'>
            <div className='flex items-center gap-2'>
              <Button
                variant='primary'
                size='sm'
                onClick={handleStartNewChat}
                className='flex-1 flex items-center justify-center gap-2 rounded-full py-2.5 bg-m3-primary hover:brightness-105 text-m3-on-primary font-semibold transition-all active:scale-95'
                title='Start a fresh conversation'
              >
                <Plus className='w-4 h-4' strokeWidth={2.5} />
                <span className='text-xs font-semibold'>New Chat</span>
              </Button>

              {sessions.length > 0 && (
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => setConfirmClearAll(true)}
                  className='w-9 h-9 rounded-full text-m3-on-surface-variant hover:text-rose-400 hover:bg-rose-500/10 transition-colors'
                  title='Clear All History'
                >
                  <Trash2 className='w-4 h-4' />
                </Button>
              )}
            </div>

            {/* M3 Pill Search Box */}
            <div className='relative'>
              <Search className='w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-m3-on-surface-variant pointer-events-none' />
              <input
                type='text'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='Search conversations...'
                className='w-full pl-9 pr-3.5 py-2 text-xs bg-m3-surface-container border border-m3-outline-variant rounded-full text-m3-on-surface placeholder:text-m3-on-surface-variant/60 focus:outline-none focus:border-m3-primary focus:ring-1 focus:ring-m3-primary/30 transition-all'
              />
            </div>
          </div>

          {/* Session List */}
          <div className='flex-1 overflow-y-auto min-h-0 custom-scrollbar pr-0.5 space-y-1.5 pt-1'>
            {filteredSessions.length === 0 ? (
              <div className='flex flex-col items-center justify-center h-48 text-center p-4'>
                <div className='w-11 h-11 rounded-full bg-m3-surface-container border border-m3-outline-variant flex items-center justify-center mb-2.5 text-m3-on-surface-variant'>
                  <MessageSquare className='w-5 h-5 opacity-50' />
                </div>
                <p className='text-xs font-medium text-m3-on-surface'>
                  {searchQuery ? "No matching chats found" : "No conversation history yet"}
                </p>
                <p className='text-[11px] text-m3-on-surface-variant mt-1 max-w-[200px]'>
                  {searchQuery ? "Try a different search term." : "Start a chat and your sessions will appear here automatically."}
                </p>
              </div>
            ) : (
              filteredSessions.map((session) => {
                const isActive = session.id === activeSessionId;
                return (
                  <div
                    key={session.id}
                    onClick={() => handleSelectSession(session.id)}
                    className={`group relative flex flex-col p-3 rounded-[18px] border transition-all duration-150 cursor-pointer ${
                      isActive
                        ? "bg-m3-secondary-container text-m3-on-secondary-container border-m3-outline shadow-xs"
                        : "bg-m3-surface-container border-m3-outline-variant/60 hover:bg-m3-surface-container-high hover:border-m3-outline-variant"
                    }`}
                  >
                    <div className='flex items-start justify-between gap-2'>
                      <div className='flex items-center gap-2 min-w-0 flex-1'>
                        <MessageSquare
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isActive ? "text-m3-primary" : "text-m3-on-surface-variant"
                          }`}
                        />
                        <h4 className={`text-xs font-medium truncate ${isActive ? "text-m3-on-surface font-semibold" : "text-m3-on-surface/90"}`}>
                          {session.title || "Untitled Chat"}
                        </h4>
                      </div>

                      {/* Delete Session Button */}
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={(e) => {
                          e.stopPropagation();
                          setSessionToDelete(session);
                        }}
                        className='opacity-0 group-hover:opacity-100 w-6 h-6 p-0 text-m3-on-surface-variant hover:text-rose-400 hover:bg-rose-500/10 transition-all'
                        title='Delete Session'
                      >
                        <Trash2 className='w-3.5 h-3.5' />
                      </Button>
                    </div>

                    {/* Metadata: Date & Message Count */}
                    <div className='flex items-center justify-between text-[10px] text-m3-on-surface-variant mt-2 pl-5.5'>
                      <div className='flex items-center gap-1'>
                        <Clock className='w-2.5 h-2.5' />
                        <span>{formatSessionDate(session.updatedAt || session.createdAt)}</span>
                      </div>

                      <div className='flex items-center gap-1 bg-m3-surface-container-highest/60 px-2 py-0.5 rounded-full border border-m3-outline-variant/40'>
                        <Layers className='w-2.5 h-2.5' />
                        <span>
                          {session.messages.length} msg{session.messages.length === 1 ? "" : "s"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Drawer>

      {/* Delete Single Session Dialog */}
      <AlertDialog
        open={Boolean(sessionToDelete)}
        onClose={() => setSessionToDelete(null)}
        title='Delete Conversation?'
        description={`Are you sure you want to delete "${sessionToDelete?.title || "this conversation"}"? This action cannot be undone.`}
        confirmLabel='Delete Chat'
        cancelLabel='Cancel'
        onConfirm={() => {
          if (sessionToDelete) {
            deleteSession(sessionToDelete.id);
            setSessionToDelete(null);
          }
        }}
        variant='destructive'
      />

      {/* Clear All History Dialog */}
      <AlertDialog
        open={confirmClearAll}
        onClose={() => setConfirmClearAll(false)}
        title='Clear All Chat History?'
        description='This will permanently delete all conversation sessions and reset your chat memory. This action cannot be undone.'
        confirmLabel='Clear Everything'
        cancelLabel='Cancel'
        onConfirm={() => {
          clearAllHistory();
          setConfirmClearAll(false);
          setShowHistory(false);
        }}
        variant='destructive'
      />
    </>
  );
}
