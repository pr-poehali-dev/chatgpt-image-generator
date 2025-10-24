import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';

interface Message {
  id: string;
  text?: string;
  imageUrl?: string;
  sender: 'user' | 'ai';
  type: 'text' | 'image';
  timestamp: Date;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Привет! Я AI-ассистент на базе ChatGPT-5. Могу помочь с текстом или сгенерировать изображение через DALL-E 3. Просто напиши что нужно!',
      sender: 'ai',
      type: 'text',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getChatHistory = () => {
    return messages
      .filter((m) => m.type === 'text')
      .map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text || '',
      }));
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      type: 'text',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsLoading(true);

    const chatHistory = [...getChatHistory(), { role: 'user', content: currentInput }];

    const response = await fetch('https://functions.poehali.dev/acbac339-1cf6-4f3b-943d-a5029e037c49', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: chatHistory }),
    });

    if (response.ok) {
      const data = await response.json();
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: data.message,
        sender: 'ai',
        type: 'text',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    } else {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Ошибка при обращении к API. Проверьте что OPENAI_API_KEY добавлен в секреты.',
        sender: 'ai',
        type: 'text',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    }

    setIsLoading(false);
  };

  const handleGenerateImage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      type: 'text',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsLoading(true);

    const response = await fetch('https://functions.poehali.dev/80e14a51-3a0a-42b0-9b91-8a63d1633491', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: currentInput }),
    });

    if (response.ok) {
      const data = await response.json();
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        imageUrl: data.image_url,
        sender: 'ai',
        type: 'image',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    } else {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Ошибка при генерации изображения. Проверьте что OPENAI_API_KEY добавлен в секреты.',
        sender: 'ai',
        type: 'text',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 backdrop-blur-3xl relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48ZmlsdGVyIGlkPSJibHVyIj48ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPSI4Ii8+PC9maWx0ZXI+PC9kZWZzPjxjaXJjbGUgY3g9IjUwIiBjeT0iNTAiIHI9IjQwIiBmaWxsPSIjM0I4MkY2IiBvcGFjaXR5PSIwLjEiIGZpbHRlcj0idXJsKCNibHVyKSIvPjxjaXJjbGUgY3g9IjE1MCIgY3k9IjE1MCIgcj0iNjAiIGZpbGw9IiM2QjcyODAiIG9wYWNpdHk9IjAuMSIgZmlsdGVyPSJ1cmwoI2JsdXIpIi8+PC9zdmc+')] opacity-40"></div>

      <div className="relative z-10 container mx-auto max-w-5xl h-screen flex flex-col p-4 md:p-8">
        <header className="mb-6 pt-4">
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Icon name="Sparkles" size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">AI Chat</h1>
              <p className="text-sm text-gray-600">Powered by ChatGPT-5 & DALL-E 3</p>
            </div>
          </div>
        </header>

        <Card className="flex-1 overflow-hidden shadow-2xl border-0 bg-white/80 backdrop-blur-lg flex flex-col animate-scale-in">
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex gap-3 animate-fade-in ${
                  message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <Avatar className="w-10 h-10 flex-shrink-0">
                  <AvatarFallback
                    className={
                      message.sender === 'user'
                        ? 'bg-gray-700 text-white'
                        : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                    }
                  >
                    {message.sender === 'user' ? (
                      <Icon name="User" size={20} />
                    ) : (
                      <Icon name="Bot" size={20} />
                    )}
                  </AvatarFallback>
                </Avatar>

                <div
                  className={`flex flex-col gap-1 max-w-[75%] ${
                    message.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`rounded-2xl px-4 py-3 shadow-md transition-all hover:shadow-lg ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-br from-gray-700 to-gray-800 text-white rounded-tr-sm'
                        : 'bg-white text-gray-800 rounded-tl-sm border border-gray-200'
                    }`}
                  >
                    {message.type === 'text' && (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.text}
                      </p>
                    )}
                    {message.type === 'image' && message.imageUrl && (
                      <img
                        src={message.imageUrl}
                        alt="Generated"
                        className="rounded-lg max-w-full h-auto"
                      />
                    )}
                  </div>
                  <span className="text-xs text-gray-500 px-2">
                    {message.timestamp.toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 animate-fade-in">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <Icon name="Bot" size={20} />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-md border border-gray-200">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                    <span
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    ></span>
                    <span
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.4s' }}
                    ></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-gray-200 bg-gray-50/50 backdrop-blur-sm p-4">
            <div className="flex gap-2 mb-3">
              <Button
                variant="outline"
                size="sm"
                className="text-xs hover:bg-gray-100"
                onClick={() => setInputValue('Расскажи интересный факт про космос')}
              >
                <Icon name="Lightbulb" size={14} className="mr-1" />
                Факт
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs hover:bg-gray-100"
                onClick={() => setInputValue('Создай изображение космического корабля')}
              >
                <Icon name="Sparkles" size={14} className="mr-1" />
                Космос
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs hover:bg-gray-100"
                onClick={() => setInputValue('Помоги написать функцию сортировки')}
              >
                <Icon name="Code" size={14} className="mr-1" />
                Код
              </Button>
            </div>

            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Напиши сообщение..."
                className="flex-1 border-gray-300 focus:border-blue-500 bg-white"
                disabled={isLoading}
              />
              <Button
                onClick={handleGenerateImage}
                size="icon"
                variant="outline"
                className="flex-shrink-0 hover:bg-gray-100"
                disabled={isLoading || !inputValue.trim()}
                title="Сгенерировать изображение"
              >
                <Icon name="Image" size={20} />
              </Button>
              <Button
                onClick={handleSendMessage}
                size="icon"
                className="flex-shrink-0 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                disabled={isLoading || !inputValue.trim()}
                title="Отправить сообщение"
              >
                <Icon name="Send" size={20} />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Index;