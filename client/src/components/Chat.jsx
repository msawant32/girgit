import { useState, useEffect, useRef } from 'react';

export function Chat({ messages, onSendMessage, disabled = false }) {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-2 mb-4 max-h-96 min-h-[200px]">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            No messages yet. Start chatting!
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-lg p-3 break-words"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-sm text-blue-600">
                  {msg.playerName}
                </span>
                {msg.timestamp && (
                  <span className="text-xs text-gray-400">
                    {formatTime(msg.timestamp)}
                  </span>
                )}
              </div>
              <p className="text-gray-700 mt-1">{msg.message}</p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={disabled ? "Chat disabled" : "Type a message..."}
          className="input flex-1"
          disabled={disabled}
          maxLength={200}
        />
        <button
          type="submit"
          disabled={disabled || !message.trim()}
          className="btn btn-primary"
        >
          Send
        </button>
      </form>
    </div>
  );
}
