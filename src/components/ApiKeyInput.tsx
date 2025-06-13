import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { getCurrentApiProvider } from '@/utils/geminiApi';
import { useAuth } from '@/context/AuthContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ApiKeyInputProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  openaiApiKey?: string;
  onOpenaiApiKeyChange?: (key: string) => void;
  deepseekApiKey?: string;
  onDeepseekApiKeyChange?: (key: string) => void;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ 
  apiKey, 
  onApiKeyChange,
  openaiApiKey,
  onOpenaiApiKeyChange,
  deepseekApiKey,
  onDeepseekApiKeyChange
}) => {
  const [showApiKey, setShowApiKey] = useState(false);
  const [showOpenaiApiKey, setShowOpenaiApiKey] = useState(false);
  const [showDeepseekApiKey, setShowDeepseekApiKey] = useState(false);
  const [inputKey, setInputKey] = useState(apiKey);
  const [inputOpenaiKey, setInputOpenaiKey] = useState(openaiApiKey || '');
  const [inputDeepseekKey, setInputDeepseekKey] = useState(deepseekApiKey || '');
  const [activeTab, setActiveTab] = useState('openrouter');
  const { apiKey: authApiKey } = useAuth();
  const currentProvider = getCurrentApiProvider();

  // Initialize from localStorage or authContext when component mounts
  useEffect(() => {
    const savedKey = localStorage.getItem('gemini-api-key') || authApiKey;
    const savedOpenaiKey = localStorage.getItem('openai-api-key');
    const savedDeepseekKey = localStorage.getItem('openrouter-api-key');

    if (savedKey) {
      setInputKey(savedKey);
      onApiKeyChange(savedKey);
    }

    if (savedOpenaiKey && onOpenaiApiKeyChange) {
      setInputOpenaiKey(savedOpenaiKey);
      onOpenaiApiKeyChange(savedOpenaiKey);
    }

    if (savedDeepseekKey && onDeepseekApiKeyChange) {
      setInputDeepseekKey(savedDeepseekKey);
      onDeepseekApiKeyChange(savedDeepseekKey);
    }

    // Set active tab based on the current provider
    setActiveTab(currentProvider);
  }, [onApiKeyChange, onOpenaiApiKeyChange, onDeepseekApiKeyChange, authApiKey]);

  // Update when apiKey prop changes
  useEffect(() => {
    if (apiKey) {
      setInputKey(apiKey);
    }
  }, [apiKey]);

  // Update when openaiApiKey prop changes
  useEffect(() => {
    if (openaiApiKey) {
      setInputOpenaiKey(openaiApiKey);
    }
  }, [openaiApiKey]);

  // Update when deepseekApiKey prop changes
  useEffect(() => {
    if (deepseekApiKey) {
      setInputDeepseekKey(deepseekApiKey);
    }
  }, [deepseekApiKey]);

  const toggleShowApiKey = () => {
    setShowApiKey(!showApiKey);
  };

  const toggleShowOpenaiApiKey = () => {
    setShowOpenaiApiKey(!showOpenaiApiKey);
  };

  const toggleShowDeepseekApiKey = () => {
    setShowDeepseekApiKey(!showDeepseekApiKey);
  };

  const handleSaveGeminiKey = () => {
    if (inputKey) {
      localStorage.setItem('gemini-api-key', inputKey);
      onApiKeyChange(inputKey);
      toast.success('Gemini API key saved successfully');
    } else {
      toast.error('Please enter a Gemini API key');
    }
  };

  const handleSaveOpenaiKey = () => {
    if (inputOpenaiKey && onOpenaiApiKeyChange) {
      localStorage.setItem('openai-api-key', inputOpenaiKey);
      onOpenaiApiKeyChange(inputOpenaiKey);
      toast.success('OpenAI API key saved successfully');
    } else {
      toast.error('Please enter an OpenAI API key');
    }
  };

  const handleSaveDeepseekKey = () => {
    if (inputDeepseekKey && onDeepseekApiKeyChange) {
      localStorage.setItem('openrouter-api-key', inputDeepseekKey);
      onDeepseekApiKeyChange(inputDeepseekKey);
      toast.success('OpenRouter API key saved successfully');
    } else {
      toast.error('Please enter an OpenRouter API key');
    }
  };

  const handleClearGeminiKey = () => {
    localStorage.removeItem('gemini-api-key');
    setInputKey('');
    onApiKeyChange('');
    toast.success('Gemini API key cleared');
  };

  const handleClearOpenaiKey = () => {
    if (onOpenaiApiKeyChange) {
      localStorage.removeItem('openai-api-key');
      setInputOpenaiKey('');
      onOpenaiApiKeyChange('');
      toast.success('OpenAI API key cleared');
    }
  };

  const handleClearDeepseekKey = () => {
    if (onDeepseekApiKeyChange) {
      localStorage.removeItem('openrouter-api-key');
      setInputDeepseekKey('');
      onDeepseekApiKeyChange('');
      toast.success('OpenRouter API key cleared');
    }
  };

  return (
    <div className="w-full mb-4">
      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-2">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="openrouter" className="relative">
              OpenRouter API Key
              {currentProvider === 'openrouter' && (
                <Badge variant="success" className="absolute -top-2 -right-2 text-[10px] px-1 py-0">
                  Active
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="gemini" className="relative">
              Gemini API Key
              {currentProvider === 'gemini' && (
                <Badge variant="success" className="absolute -top-2 -right-2 text-[10px] px-1 py-0">
                  Active
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="openai" className="relative">
              OpenAI API Key
              {currentProvider === 'openai' && (
                <Badge variant="success" className="absolute -top-2 -right-2 text-[10px] px-1 py-0">
                  Active
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-white">
                    <Info className="h-4 w-4" />
                    <span className="sr-only">API Key Info</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm bg-gray-800 text-gray-200 border-gray-700">
                  <p>Your API key is stored only in your browser and never sent to our servers.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        <TabsContent value="openrouter" className="space-y-2">
          <div className="flex flex-col space-y-2">
            <Label htmlFor="deepseek-api-key">OpenRouter API Key (Gemini 1.5 Flash 8B)</Label>
            <div className="relative">
              <Input 
                id="deepseek-api-key"
                type={showDeepseekApiKey ? "text" : "password"} 
                placeholder="Enter your OpenRouter API key" 
                value={inputDeepseekKey} 
                onChange={e => setInputDeepseekKey(e.target.value)} 
                className="pr-10"
              />
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={toggleShowDeepseekApiKey}
              >
                {showDeepseekApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={handleSaveDeepseekKey}>
                Save
              </Button>
              <Button variant="outline" size="sm" onClick={handleClearDeepseekKey}>
                Clear
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.open("https://openrouter.ai/keys", "_blank")}>
                Get Key
              </Button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="gemini" className="space-y-2">
          <div className="flex flex-col space-y-2">
            <Label htmlFor="gemini-api-key">Google Gemini API Key</Label>
            <div className="relative">
              <Input 
                id="gemini-api-key"
                type={showApiKey ? "text" : "password"} 
                placeholder="Enter your Gemini API key" 
                value={inputKey} 
                onChange={e => setInputKey(e.target.value)} 
                className="pr-10"
              />
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={toggleShowApiKey}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={handleSaveGeminiKey}>
                Save
              </Button>
              <Button variant="outline" size="sm" onClick={handleClearGeminiKey}>
                Clear
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.open("https://aistudio.google.com/app/apikey", "_blank")}>
                Get Key
              </Button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="openai" className="space-y-2">
          <div className="flex flex-col space-y-2">
            <Label htmlFor="openai-api-key">OpenAI API Key</Label>
            <div className="relative">
              <Input 
                id="openai-api-key"
                type={showOpenaiApiKey ? "text" : "password"} 
                placeholder="Enter your OpenAI API key" 
                value={inputOpenaiKey} 
                onChange={e => setInputOpenaiKey(e.target.value)} 
                className="pr-10"
              />
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={toggleShowOpenaiApiKey}
              >
                {showOpenaiApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={handleSaveOpenaiKey}>
                Save
              </Button>
              <Button variant="outline" size="sm" onClick={handleClearOpenaiKey}>
                Clear
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.open("https://platform.openai.com/api-keys", "_blank")}>
                Get Key
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApiKeyInput;
