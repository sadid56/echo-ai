use crate::ai::providers::{Message, Role};

#[derive(Debug, Clone)]
pub struct ChatMemory {
    messages: Vec<Message>,
    max_history: usize,
}

impl ChatMemory {
    pub fn new(max_history: usize) -> Self {
        Self {
            messages: Vec::new(),
            max_history,
        }
    }

    pub fn get_messages(&self) -> &[Message] {
        &self.messages
    }

    pub fn set_system_prompt(&mut self, system_prompt: String) {
        // Remove existing system prompt if any
        self.messages.retain(|m| m.role != Role::System);
        // Insert new system prompt at the beginning
        self.messages.insert(0, Message {
            role: Role::System,
            content: system_prompt,
            name: None,
            tool_calls: None,
        });
    }

    pub fn add_message(&mut self, message: Message) {
        self.messages.push(message);
        self.truncate_history();
    }

    pub fn clear(&mut self) {
        // Keep the system prompt if present, remove everything else
        let system_prompt = self.messages.iter().find(|m| m.role == Role::System).cloned();
        self.messages.clear();
        if let Some(sys) = system_prompt {
            self.messages.push(sys);
        }
    }

    fn truncate_history(&mut self) {
        // If message count is larger than max_history + 1 (for system prompt), truncate
        let system_exists = self.messages.first().map(|m| m.role == Role::System).unwrap_or(false);
        let offset = if system_exists { 1 } else { 0 };
        
        if self.messages.len() > self.max_history + offset {
            let remove_count = self.messages.len() - (self.max_history + offset);
            // Drain elements starting after system prompt
            self.messages.drain(offset..(offset + remove_count));
        }
    }
}
