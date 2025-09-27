import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MessageCircle, 
  Volume2, 
  VideoIcon, 
  ImageIcon,
  Music, 
  Download, 
  Scissors,
  Sparkles,
  Send,
  Upload,
  Play,
  Pause,
  RotateCcw,
  Eye,
  Mail,
  X,
  Edit
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MediaViewer from "@/components/MediaViewer";
import { useMediaProcessor } from "@/hooks/useMediaProcessor";
import ImageUpload from "@/components/ImageUpload";
import ChatInterface from "@/components/ChatInterface";
import { useAuth } from "@/context/AuthContext";
import { sendEmailVerification } from "firebase/auth";
import { auth } from "@/config/firebase";
import MobileSidebar, { AnimatedHamburger } from "@/components/MobileSidebar";
import DesktopSidebar, { AnimatedDesktopHamburger } from "@/components/DesktopSidebar";
import { DarkAIService, SocialDownloadResponse } from "@/services/darkAIService";
import { imageService } from '@/services/imageService';
import { toast } from 'sonner';

const DarkAI = () => {
  const [activeTab, setActiveTab] = useState("video-generation");
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(false);
  const { toast } = useToast();
  const { processedMedia, isProcessing, processApiResponse, clearMedia } = useMediaProcessor();
  const { currentUser, isEmailVerified } = useAuth();

  // Email verification check function
  const checkEmailVerification = () => {
    if (!isEmailVerified) {
      toast({
        title: "Email not verified",
        description: "Please verify your email before using this service.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const sendVerificationEmail = async () => {
    if (currentUser && !isEmailVerified) {
      try {
        await sendEmailVerification(currentUser);
        toast({
          title: "Verification email sent",
          description: "Please check your email for verification link.",
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  };

  // Environment variables for API
  const API_KEY = import.meta.env.VITE_DARK_AI_API_KEY;
  const BASE_URL = import.meta.env.VITE_DARK_AI_BASE_URL;

  // State for different tabs
  const [textData, setTextData] = useState({
    model: "",
    prompt: "",
    response: ""
  });

  const [ttsData, setTtsData] = useState({
    text: "",
    voice: "",
    style: "",
    audioUrl: ""
  });

  const [videoData, setVideoData] = useState({
    textToVideoPrompt: "",
    imageToVideoPrompt: "",
    imageToVideoImageUrl: "",
    uploadedImageUrl: ""
  });

  const [videoMode, setVideoMode] = useState<'text' | 'image'>('text');

  const [musicData, setMusicData] = useState({
    type: "",
    lyrics: "",
    tags: "",
    musicUrl: ""
  });

  const [socialData, setSocialData] = useState({
    url: "",
    result: null as SocialDownloadResponse | null
  });

  const [bgRemovalData, setBgRemovalData] = useState({
    imageUrl: "",
    result: null,
    uploadedImageUrl: ""
  });

  const [imgGenerationData, setImgGenerationData] = useState({
    prompt: "",
    model: "gemini",
    imageUrl: "",
    editImageUrl: "",
    multipleImageUrls: [] as string[]
  });

  const [nanoBananaMode, setNanoBananaMode] = useState<'generate' | 'edit'>('generate');

  // New Image Models states
  const [activeImageTab, setActiveImageTab] = useState<'generation' | 'editing' | 'enhance'>('generation');
  const [selectedGenModel, setSelectedGenModel] = useState<'img-bo' | 'gpt-imager' | 'seedream-4'>('img-bo');
  const [selectedEditModel, setSelectedEditModel] = useState<'gpt-imager' | 'seedream-4'>('gpt-imager');
  const [imageGenPrompt, setImageGenPrompt] = useState('');
  const [imageEditPrompt, setImageEditPrompt] = useState('');
  const [imageSize, setImageSize] = useState('1024x1024');
  const [uploadedEditImages, setUploadedEditImages] = useState<string[]>([]);
  const [uploadedEnhanceImage, setUploadedEnhanceImage] = useState<string>('');

  const tabs = [
    { id: "video-generation", label: "Video Generation", icon: VideoIcon },
    { id: "img-generation", label: "IMG Generation", icon: ImageIcon },
    { id: "text-chat", label: "Text Chat", icon: MessageCircle },
    { id: "tts", label: "TTS", icon: Volume2 },
    { id: "music-generation", label: "Music Generation", icon: Music },
    { id: "social-downloader", label: "Social Media Downloader", icon: Download },
    { id: "background-removal", label: "Background Removal", icon: Scissors },
  ];

  const aiModels = [
    { id: "online", name: "Online AI" },
    { id: "standard", name: "Standard AI" },
    { id: "super-genius", name: "Super Genius AI" },
    { id: "online-genius", name: "Online Genius AI" },
    { id: "gemini-pro", name: "Gemini 2.5 Pro" },
    { id: "gemini-deep", name: "Gemini 2.5 Deep Search" },
    { id: "gemini-flash", name: "Gemini 2.5 Flash" },
    { id: "gemma-4b", name: "Gemma 4B" },
    { id: "gemma-12b", name: "Gemma 12B" },
    { id: "gemma-27b", name: "Gemma 27B" },
    { id: "wormgpt", name: "WormGPT" },
  ];

  const voices = [
    { id: "nova", name: "Nova" },
    { id: "alloy", name: "Alloy" },
    { id: "verse", name: "Verse" },
    { id: "flow", name: "Flow" },
    { id: "aria", name: "Aria" },
    { id: "lumen", name: "Lumen" },
  ];

  // API Functions
  const handleTextGeneration = async () => {
    if (!checkEmailVerification()) return;
    
    if (!textData.model || !textData.prompt) {
      toast({
        title: "Error",
        description: "Please select a model and enter a prompt",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const endpoints = {
        "online": "/api/ai/online",
        "standard": "/api/ai/standard",
        "super-genius": "/api/ai/super-genius",
        "online-genius": "/api/ai/online-genius",
        "gemini-pro": "/api/gemini/pro",
        "gemini-deep": "/api/gemini/deep",
        "gemini-flash": "/api/gemini/flash",
        "gemma-4b": "/api/gemma/4b",
        "gemma-12b": "/api/gemma/12b",
        "gemma-27b": "/api/gemma/27b",
        "wormgpt": "/api/wormgpt"
      };

      const response = await fetch(`${BASE_URL}${endpoints[textData.model]}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: textData.prompt,
          api_key: API_KEY
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const responseText = result.response || JSON.stringify(result, null, 2);
      setTextData(prev => ({ ...prev, response: responseText }));
      
      toast({
        title: "Success",
        description: "Text generated successfully!"
      });
    } catch (error) {
      console.error("Text generation error:", error);
      toast({
        title: "Error",
        description: `Failed to generate text: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTTSGeneration = async () => {
    if (!checkEmailVerification()) return;
    
    if (!ttsData.text) {
      toast({
        title: "Error",
        description: "Please enter text to convert",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const isCustom = ttsData.voice || ttsData.style;
      const endpoint = isCustom ? "/api/voice/custom" : "/api/voice";
      
      let body: any = {
        text: ttsData.text,
        api_key: API_KEY
      };

      if (isCustom) {
        if (ttsData.voice) body.voice = ttsData.voice;
        if (ttsData.style) body.style = ttsData.style;
      }

      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const audioUrl = result.voice || result.url || result.audio_url || "Audio generated successfully";
      setTtsData(prev => ({ ...prev, audioUrl }));
      processApiResponse(result);
      
      toast({
        title: "Success",
        description: "Speech generated successfully!"
      });
    } catch (error) {
      console.error("TTS generation error:", error);
      toast({
        title: "Error",
        description: `Failed to generate speech: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextToVideo = async () => {
    if (!checkEmailVerification()) return;
    
    if (!videoData.textToVideoPrompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a description for your video",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await DarkAIService.generateTextToVideo(videoData.textToVideoPrompt);
      processApiResponse(result);
      
      toast({
        title: "Success",
        description: "Video generated successfully from text!"
      });
    } catch (error) {
      console.error("Text-to-video generation error:", error);
      toast({
        title: "Error",
        description: `Failed to generate video: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageToVideo = async () => {
    if (!checkEmailVerification()) return;
    
    if (!videoData.imageToVideoPrompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter instructions for your video",
        variant: "destructive"
      });
      return;
    }

    if (!videoData.imageToVideoImageUrl.trim()) {
      toast({
        title: "Error",
        description: "Please upload an image first",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await DarkAIService.generateImageToVideo(
        videoData.imageToVideoPrompt, 
        videoData.imageToVideoImageUrl
      );
      processApiResponse(result);
      
      toast({
        title: "Success",
        description: "Video generated successfully from image!"
      });
    } catch (error) {
      console.error("Image-to-video generation error:", error);
      toast({
        title: "Error",
        description: `Failed to generate video: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMusicGeneration = async () => {
    if (!checkEmailVerification()) return;
    
    if (!musicData.type || !musicData.lyrics) {
      toast({
        title: "Error",
        description: "Please select type and enter lyrics/description",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      let result;
      
      if (musicData.type === "15s-instrumental") {
        result = await DarkAIService.create15sMusic(musicData.lyrics);
      } else if (musicData.type === "full-song") {
        const tags = musicData.tags || "pop";
        result = await DarkAIService.createFullMusic(musicData.lyrics, tags);
      }

      const musicUrl = result?.response || "Music generated successfully";
      setMusicData(prev => ({ ...prev, musicUrl }));
      processApiResponse(result);
      
      toast({
        title: "Success",
        description: "Music generated successfully!"
      });
    } catch (error) {
      console.error("Music generation error:", error);
      toast({
        title: "Error",
        description: `Failed to generate music: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialDownload = async () => {
    if (!checkEmailVerification()) return;
    
    if (!socialData.url || !socialData.url.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive"
      });
      return;
    }

    if (!socialData.url.startsWith("http://") && !socialData.url.startsWith("https://")) {
      toast({
        title: "Error",
        description: "URL must start with http:// or https://",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await DarkAIService.downloadSocialMedia(socialData.url.trim());
      setSocialData(prev => ({ ...prev, result }));
      
      toast({
        title: "Success",
        description: `Found ${result.links?.length || 0} download options!`
      });
    } catch (error) {
      console.error("Social download error:", error);
      toast({
        title: "Error",
        description: `Failed to download content: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadLink = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast({
        title: "Download Started",
        description: `Downloading ${filename}...`
      });
    } catch (error) {
      console.error("Download error:", error);
      // Fallback: open in new tab
      window.open(url, '_blank');
      toast({
        title: "Download Link Opened",
        description: "The download link has been opened in a new tab."
      });
    }
  };

  // New Image Models handlers
  const handleImageGeneration = async () => {
    if (!checkEmailVerification()) return;
    if (!imageGenPrompt.trim()) return;

    setIsLoading(true);
    try {
      let result = '';
      
      switch (selectedGenModel) {
        case 'img-bo':
          result = await imageService.generateWithImgBo(imageGenPrompt, imageSize);
          break;
        case 'gpt-imager':
          result = await imageService.generateWithGptImager(imageGenPrompt);
          break;
        case 'seedream-4':
          result = await imageService.generateWithSeedream4(imageGenPrompt);
          break;
      }

      if (result) {
        processApiResponse(result);
        setImageGenPrompt('');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Error",
        description: "Failed to generate image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageEditUpload = (urls: string[]) => {
    if (selectedEditModel === 'gpt-imager' && urls.length > 1) {
      setUploadedEditImages([urls[0]]);
      toast({
        title: "Info",
        description: "GPT-Imager can only edit one image at a time. Using the first image.",
        variant: "default",
      });
    } else if (selectedEditModel === 'seedream-4' && urls.length > 4) {
      setUploadedEditImages(urls.slice(0, 4));
      toast({
        title: "Info",
        description: "SeedReam-4 can edit up to 4 images. Using the first 4 images.",
        variant: "default",
      });
    } else {
      setUploadedEditImages(urls);
    }
  };

  const removeEditImage = (index: number) => {
    setUploadedEditImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageEditing = async () => {
    if (!checkEmailVerification()) return;
    if (!imageEditPrompt.trim() || uploadedEditImages.length === 0) return;

    setIsLoading(true);
    try {
      let result = '';
      
      switch (selectedEditModel) {
        case 'gpt-imager':
          result = await imageService.editWithGptImager(imageEditPrompt, uploadedEditImages[0]);
          break;
        case 'seedream-4':
          result = await imageService.editWithSeedream4(imageEditPrompt, uploadedEditImages);
          break;
      }

      if (result) {
        processApiResponse(result);
        setImageEditPrompt('');
        setUploadedEditImages([]);
      }
    } catch (error) {
      console.error('Error editing image:', error);
      toast({
        title: "Error",
        description: "Failed to edit image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnhanceImageUpload = (urls: string[]) => {
    setUploadedEnhanceImage(urls[0]);
  };

  const handleImageEnhancement = async () => {
    if (!checkEmailVerification()) return;
    if (!uploadedEnhanceImage) return;

    setIsLoading(true);
    try {
      const result = await imageService.enhanceQuality(uploadedEnhanceImage);
      
      if (result) {
        processApiResponse(result);
        setUploadedEnhanceImage('');
      }
    } catch (error) {
      console.error('Error enhancing image:', error);
      toast({
        title: "Error",
        description: "Failed to enhance image quality. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackgroundRemoval = async () => {
    if (!checkEmailVerification()) return;
    
    const imageUrl = bgRemovalData.uploadedImageUrl || bgRemovalData.imageUrl;
    if (!imageUrl) {
      toast({
        title: "Error",
        description: "Please upload an image or enter an image URL",
        variant: "destructive"
      });
      return;
    }

    if (bgRemovalData.imageUrl && !bgRemovalData.imageUrl.startsWith("http://") && !bgRemovalData.imageUrl.startsWith("https://")) {
      toast({
        title: "Error",
        description: "Image URL must start with http:// or https://",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_DARK_AI_BASE_URL}/api/remove-bg`, {
        method: "POST",
        headers: {
          "accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          url: imageUrl,
          api_key: import.meta.env.VITE_DARK_AI_API_KEY
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("BG removal result:", result);
      
      const processedImageUrl = result.response;
      setBgRemovalData(prev => ({ ...prev, result: processedImageUrl }));
      
      toast({
        title: "Success",
        description: "Background removed successfully!"
      });
    } catch (error) {
      console.error("Background removal error:", error);
      toast({
        title: "Error",
        description: `Failed to remove background: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Header with Hamburger Menu - Mobile & Desktop */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3">
          <AnimatedHamburger 
            isOpen={isMobileSidebarOpen} 
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} 
          />
          <h2 className="text-lg font-semibold text-foreground">
            {tabs.find(tab => tab.id === activeTab)?.label || 'DarkAI'}
          </h2>
          <div className="w-10" /> {/* Spacer for balance */}
        </div>
      </div>

      {/* Header */}
      <div className="container mx-auto px-6 py-8 pt-20">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 text-primary">
            DarkAI Platform
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Transform your ideas into stunning content with advanced AI technology
          </p>
        </div>
      </div>

      {/* Main Content */}
        <div className="container mx-auto px-6 pb-12">
          {/* Email verification warning */}
          {currentUser && !isEmailVerified && (
            <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20 animate-fade-in">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">Email not verified</p>
                  <p className="text-sm opacity-90">Please verify your email to access all AI services.</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={sendVerificationEmail}
                  className="underline hover:bg-destructive/20 transition-smooth"
                >
                  Resend Email
                </Button>
              </div>
            </div>
          )}
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

            {/* Mobile Sidebar */}
            <MobileSidebar
              isOpen={isMobileSidebarOpen}
              onClose={() => setIsMobileSidebarOpen(false)}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              tabs={tabs}
            />

          {/* Text Chat Tab */}
          <TabsContent value="text-chat" className="space-y-6">
            <Card className="bg-card/50 border border-border/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-primary text-xl">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  AI Chat Interface
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Experience ChatGPT-style conversations with our advanced AI models
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Chat is now available as a dedicated page for better experience</p>
                  <Button 
                    onClick={() => (window.location.href = '/chat/')} 
                    className="bg-card text-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-200 border border-border"
                  >
                    Go to Chat Page
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TTS Tab */}
          <TabsContent value="tts" className="space-y-6">
            <Card className="bg-card border border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Volume2 className="w-6 h-6" />
                  Text to Speech
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Convert text to natural-sounding speech with AI voices
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="voice-select" className="text-foreground">Voice (Optional)</Label>
                    <Select value={ttsData.voice} onValueChange={(value) => setTtsData(prev => ({ ...prev, voice: value }))}>
                      <SelectTrigger className="bg-input border-border text-foreground">
                        <SelectValue placeholder="Default Voice" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {voices.map((voice) => (
                          <SelectItem key={voice.id} value={voice.id} className="text-popover-foreground">
                            {voice.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="style" className="text-foreground">Style (Optional)</Label>
                    <Input
                      value={ttsData.style}
                      onChange={(e) => setTtsData(prev => ({ ...prev, style: e.target.value }))}
                      placeholder="e.g., cheerful tone, soft whisper"
                      className="bg-input border-border text-foreground"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="tts-text" className="text-foreground">Text to Convert</Label>
                  <Textarea
                    value={ttsData.text}
                    onChange={(e) => setTtsData(prev => ({ ...prev, text: e.target.value }))}
                    placeholder="Enter the text you want to convert to speech..."
                    className="min-h-24 bg-input border-border text-foreground resize-none"
                  />
                </div>
                {ttsData.audioUrl && (
                  <div>
                    <Label className="text-foreground">Generated Audio</Label>
                    <div className="bg-gradient-to-br from-purple-500/5 to-pink-500/10 p-6 rounded-xl border border-border space-y-4">
                      <div className="text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-600 rounded-full border border-green-500/20">
                          <Volume2 className="w-4 h-4" />
                          <span className="text-sm font-medium">Audio Generated Successfully!</span>
                        </div>
                      </div>
                      
                      {ttsData.audioUrl.startsWith('http') ? (
                        <div className="text-center">
                          <audio controls className="mx-auto mb-4">
                            <source src={ttsData.audioUrl} type="audio/mpeg" />
                            <source src={ttsData.audioUrl} type="audio/wav" />
                            Your browser does not support the audio element.
                          </audio>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(ttsData.audioUrl, '_blank')}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download Audio
                          </Button>
                        </div>
                      ) : (
                        <div className="bg-muted/50 p-4 rounded-lg max-h-64 overflow-auto">
                          <pre className="text-sm text-foreground whitespace-pre-wrap text-left">
                            {ttsData.audioUrl}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <Button 
                  onClick={handleTTSGeneration}
                  disabled={isLoading}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isLoading ? (
                    <>
                      <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 mr-2" />
                      Generate Speech
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Video Generation Tab */}
          <TabsContent value="video-generation" className="space-y-6">
            <Card className="bg-card border border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <VideoIcon className="w-6 h-6" />
                  Professional Video Generation
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Create cinematic videos from text prompts or transform images into dynamic videos with FREE audio support
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Video Mode Selector */}
                <div className="flex bg-muted rounded-lg p-1">
                  <button
                    onClick={() => setVideoMode('text')}
                    className={`flex-1 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                      videoMode === 'text'
                        ? 'bg-card text-foreground shadow-sm border border-border'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    Text to Video
                  </button>
                  <button
                    onClick={() => setVideoMode('image')}
                    className={`flex-1 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                      videoMode === 'image'
                        ? 'bg-card text-foreground shadow-sm border border-border'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <ImageIcon className="w-4 h-4" />
                    Image to Video
                  </button>
                </div>

                {/* Video Generation Content */}
                <div className="bg-card/50 border border-border rounded-lg p-6 space-y-4">
                  {videoMode === 'text' ? (
                    // Text to Video Mode
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold text-foreground">Text to Video Generation</h3>
                        <div className="bg-primary/20 text-primary px-2 py-1 rounded-md text-xs font-medium border border-primary/30">
                          FREE AUDIO
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Generate high-quality videos with cinematic effects from text descriptions
                      </p>
                      
                      <div className="space-y-2">
                        <Label htmlFor="text-to-video-prompt" className="text-foreground font-medium">
                          Video Description
                        </Label>
                        <Textarea
                          id="text-to-video-prompt"
                          value={videoData.textToVideoPrompt}
                          onChange={(e) => setVideoData(prev => ({ ...prev, textToVideoPrompt: e.target.value }))}
                          placeholder="e.g., A majestic eagle soaring through mountain clouds at sunset, cinematic wide shot"
                          className="min-h-24 bg-input border-border text-foreground resize-none"
                        />
                      </div>
                      
                      <Button 
                        onClick={handleTextToVideo}
                        disabled={isLoading || !videoData.textToVideoPrompt.trim()}
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200"
                      >
                        {isLoading ? (
                          <>
                            <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                            Creating Video...
                          </>
                        ) : (
                          <>
                            <VideoIcon className="w-4 h-4 mr-2" />
                            Generate Video from Text
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    // Image to Video Mode
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <ImageIcon className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold text-foreground">Image to Video Conversion</h3>
                        <div className="bg-primary/20 text-primary px-2 py-1 rounded-md text-xs font-medium border border-primary/30">
                          FREE AUDIO
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Transform static images into dynamic videos with animations and effects
                      </p>
                      
                      <div className="space-y-2">
                        <Label htmlFor="image-to-video-prompt" className="text-foreground font-medium">
                          Animation Instructions
                        </Label>
                        <Textarea
                          id="image-to-video-prompt"
                          value={videoData.imageToVideoPrompt}
                          onChange={(e) => setVideoData(prev => ({ ...prev, imageToVideoPrompt: e.target.value }))}
                          placeholder="e.g., make the character walk forward, add flowing hair and clothes movement"
                          className="min-h-20 bg-input border-border text-foreground resize-none"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-foreground font-medium">Upload Image</Label>
                        <ImageUpload
                          label=""
                          placeholder="Select an image to animate into video"
                          onUploadComplete={(url) => setVideoData(prev => ({ ...prev, imageToVideoImageUrl: url }))}
                          currentUrl={videoData.imageToVideoImageUrl}
                          onUrlChange={(url) => setVideoData(prev => ({ ...prev, imageToVideoImageUrl: url }))}
                          showUrlInput={true}
                        />
                      </div>
                      
                      <Button 
                        onClick={handleImageToVideo}
                        disabled={isLoading || !videoData.imageToVideoPrompt.trim() || !videoData.imageToVideoImageUrl.trim()}
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200"
                      >
                        {isLoading ? (
                          <>
                            <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                            Animating Image...
                          </>
                        ) : (
                          <>
                            <VideoIcon className="w-4 h-4 mr-2" />
                            Convert Image to Video
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Generated Video Display */}
                {processedMedia && processedMedia.type === 'video' && (
                  <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-6 rounded-xl border border-green-500/20">
                    <div className="space-y-4">
                      <div className="flex items-center justify-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-600 rounded-full border border-green-500/30">
                          <VideoIcon className="w-5 h-5" />
                          <span className="font-medium">🎬 Professional MP4 Video Generated!</span>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <video 
                          controls 
                          className="max-w-full max-h-96 mx-auto rounded-xl shadow-2xl border border-border"
                          preload="metadata"
                          poster="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjM2MCIgdmlld0JveD0iMCAwIDY0MCAzNjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI2NDAiIGhlaWdodD0iMzYwIiBmaWxsPSIjMTExODI3IiBmaWxsLW9wYWNpdHk9IjAuOSIvPgo8Y2lyY2xlIGN4PSIzMjAiIGN5PSIxODAiIHI9IjQwIiBmaWxsPSJ3aGl0ZSIgZmlsbC1vcGFjaXR5PSIwLjgiLz4KPHN2ZyB4PSIzMDAiIHk9IjE2MCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9IiMxMTE4MjciPgo8cGF0aCBkPSJNOCA1djE0bDExLTdMOCA1WiIvPgo8L3N2Zz4KPC9zdmc+"
                        >
                          <source src={processedMedia.url} type="video/mp4" />
                          Your browser does not support the video element.
                        </video>
                        
                        <div className="mt-4 space-y-2">
                          {processedMedia.metadata?.title && (
                            <p className="text-sm font-medium text-foreground">{processedMedia.metadata.title}</p>
                          )}
                          {processedMedia.metadata?.date && (
                            <p className="text-xs text-muted-foreground">Generated: {processedMedia.metadata.date}</p>
                          )}
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-3 mt-6 justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(processedMedia.url, '_blank')}
                            className="border-green-500/30 text-green-600 hover:bg-green-500/10"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download MP4
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(processedMedia.url);
                              toast({ title: "Link copied!", description: "Video URL copied to clipboard" });
                            }}
                            className="border-blue-500/30 text-blue-600 hover:bg-blue-500/10"
                          >
                            <VideoIcon className="w-4 h-4 mr-2" />
                            Copy Link
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Music Generation Tab */}
          <TabsContent value="music-generation" className="space-y-4 sm:space-y-6">
            <Card className="glass-effect border border-border">
              <CardHeader className="pb-4 sm:pb-6">
                <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center gap-3 text-lg sm:text-xl font-bold text-foreground">
                  <div className="p-2 sm:p-3 bg-primary/20 rounded-xl border border-primary/30">
                    <Music className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <span>AI Music Generation</span>
                </CardTitle>
                <CardDescription className="text-sm sm:text-base text-muted-foreground mt-2">
                  Create professional AI-generated music with just a prompt - from 15-second clips to full 3:15 songs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <div className="space-y-2 sm:space-y-3">
                  <Label htmlFor="music-type" className="text-sm font-semibold text-foreground">Music Type</Label>
                  <Select value={musicData.type} onValueChange={(value) => setMusicData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger className="h-10 sm:h-12 bg-card border border-border hover:border-primary/50 focus:border-primary transition-smooth text-sm sm:text-base">
                      <SelectValue placeholder="Choose your music style" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border border-border">
                      <SelectItem value="15s-instrumental" className="py-2 sm:py-3 text-popover-foreground">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-primary rounded-full animate-pulse"></div>
                          <div>
                            <div className="font-medium text-sm sm:text-base">🎼 15s Instrumental</div>
                            <div className="text-xs text-muted-foreground">Quick instrumental track</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="full-song" className="py-2 sm:py-3 text-popover-foreground">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-accent rounded-full animate-pulse"></div>
                          <div>
                            <div className="font-medium text-sm sm:text-base">🎵 Full Song (3:15)</div>
                            <div className="text-xs text-muted-foreground">Complete song with lyrics</div>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2 sm:space-y-3">
                  <Label htmlFor="music-lyrics" className="text-sm font-semibold text-foreground">
                    {musicData.type === "full-song" ? "Song Lyrics" : "Music Description"}
                  </Label>
                  <Textarea
                    value={musicData.lyrics}
                    onChange={(e) => setMusicData(prev => ({ ...prev, lyrics: e.target.value }))}
                    placeholder={
                      musicData.type === "full-song" 
                        ? "Write your song lyrics here... (verse, chorus, bridge, etc.)"
                        : "Describe your instrumental... (e.g., 'upbeat electronic dance music with heavy bass')"
                    }
                    className="min-h-[100px] sm:min-h-[120px] bg-card border border-border hover:border-primary/50 focus:border-primary transition-smooth resize-none text-sm sm:text-base"
                  />
                </div>
                
                {musicData.type === "full-song" && (
                  <div className="space-y-2 sm:space-y-3">
                    <Label htmlFor="music-tags" className="text-sm font-semibold text-foreground">Music Genre (Optional)</Label>
                    <Input
                      value={musicData.tags}
                      onChange={(e) => setMusicData(prev => ({ ...prev, tags: e.target.value }))}
                      placeholder="e.g., pop, rock, jazz, electronic, hip-hop..."
                      className="h-10 sm:h-11 bg-card border border-border hover:border-primary/50 focus:border-primary transition-smooth text-sm sm:text-base"
                    />
                  </div>
                )}
                
                <Button 
                  onClick={handleMusicGeneration}
                  disabled={isLoading || !musicData.type || !musicData.lyrics}
                  className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold bg-primary hover:bg-primary-glow disabled:bg-muted text-primary-foreground transition-smooth shadow-control hover:shadow-glow disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                      <span className="hidden xs:inline">Creating Your Music...</span>
                      <span className="xs:hidden">Creating...</span>
                    </>
                  ) : (
                    <>
                      <Music className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      <span className="hidden xs:inline">Generate {musicData.type === "15s-instrumental" ? "15s Track" : "Full Song"}</span>
                      <span className="xs:hidden">Generate</span>
                    </>
                  )}
                </Button>
                
                {musicData.musicUrl && (
                  <div className="p-4 sm:p-6 glass-effect border border-primary/30 rounded-xl shadow-glow space-y-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-primary rounded-full animate-pulse"></div>
                      <Label className="text-base sm:text-lg font-semibold text-foreground">🎵 Music Generated Successfully!</Label>
                    </div>
                    
                    {musicData.musicUrl.startsWith('http') ? (
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 bg-card border border-border rounded-lg">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                              <Music className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-foreground text-sm sm:text-base truncate">
                                {musicData.type === "15s-instrumental" ? "15s Instrumental Track" : "Full Song (3:15)"}
                              </div>
                              <div className="text-xs sm:text-sm text-muted-foreground">MP3 • Ready to download</div>
                            </div>
                          </div>
                          <Button 
                            variant="default"
                            className="w-full sm:w-auto bg-primary hover:bg-primary-glow text-primary-foreground shadow-control hover:shadow-glow transition-smooth text-sm sm:text-base"
                            onClick={() => handleDownloadLink(
                              musicData.musicUrl, 
                              `generated_music_${musicData.type}_${Date.now()}.mp3`
                            )}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download MP3
                          </Button>
                        </div>
                        
                        {/* Audio Preview */}
                        <div className="bg-card p-3 sm:p-4 border border-border rounded-lg">
                          <Label className="text-xs sm:text-sm font-medium text-foreground mb-2 block">Audio Preview:</Label>
                          <audio 
                            controls 
                            className="w-full h-8 sm:h-10 rounded-lg"
                            style={{ 
                              filter: 'sepia(100%) saturate(0%) hue-rotate(0deg) brightness(1.2) contrast(0.8)',
                            }}
                          >
                            <source src={musicData.musicUrl} type="audio/mpeg" />
                            <source src={musicData.musicUrl} type="audio/wav" />
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-card p-3 sm:p-4 border border-border rounded-lg max-h-48 sm:max-h-64 overflow-auto">
                        <pre className="text-xs sm:text-sm text-foreground whitespace-pre-wrap">
                          {musicData.musicUrl}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social Downloader Tab */}
          <TabsContent value="social-downloader" className="space-y-4 sm:space-y-6">
            <Card className="glass-effect border border-border">
              <CardHeader className="pb-4 sm:pb-6">
                <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center gap-3 text-lg sm:text-xl font-bold text-foreground">
                  <div className="p-2 sm:p-3 bg-primary/20 rounded-xl border border-primary/30">
                    <Download className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <span>Social Media Downloader</span>
                </CardTitle>
                <CardDescription className="text-sm sm:text-base text-muted-foreground mt-2">
                  Download videos, audio, and images from any social platform with professional quality options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <div className="space-y-2 sm:space-y-3">
                  <Label htmlFor="social-url" className="text-sm font-semibold text-foreground">Social Media URL</Label>
                  <div className="relative">
                    <Input
                      value={socialData.url}
                      onChange={(e) => setSocialData(prev => ({ ...prev, url: e.target.value }))}
                      placeholder="🔗 Paste your TikTok, Instagram, YouTube, Twitter, or Facebook URL here..."
                      className="h-10 sm:h-12 pl-3 sm:pl-4 pr-10 sm:pr-12 bg-card border border-border hover:border-primary/50 focus:border-primary transition-smooth text-sm sm:text-base"
                    />
                    {socialData.url && (
                      <button
                        onClick={() => setSocialData(prev => ({ ...prev, url: "" }))}
                        className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 sm:gap-2 mt-2 sm:mt-3">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full border border-primary/20">TikTok</span>
                    <span className="text-xs bg-accent/10 text-accent-foreground px-2 py-1 rounded-full border border-accent/20">Instagram</span>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full border border-primary/20">YouTube</span>
                    <span className="text-xs bg-accent/10 text-accent-foreground px-2 py-1 rounded-full border border-accent/20">Twitter</span>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full border border-primary/20">Facebook</span>
                  </div>
                </div>
                
                <Button 
                  onClick={handleSocialDownload}
                  disabled={isLoading || !socialData.url.trim()}
                  className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold bg-primary hover:bg-primary-glow disabled:bg-muted text-primary-foreground transition-smooth shadow-control hover:shadow-glow disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                      <span className="hidden xs:inline">Analyzing Content...</span>
                      <span className="xs:hidden">Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      <span className="hidden xs:inline">Extract Download Links</span>
                      <span className="xs:hidden">Extract Links</span>
                    </>
                  )}
                </Button>
                
                {socialData.result && (
                  <div className="p-4 sm:p-6 glass-effect border border-primary/30 rounded-xl shadow-glow space-y-3 sm:space-y-4">
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-primary rounded-full animate-pulse"></div>
                        <Label className="text-base sm:text-lg font-semibold text-foreground">🎬 Content Found!</Label>
                      </div>
                      <div className="p-3 sm:p-4 bg-card border border-border rounded-lg">
                        <p className="text-xs sm:text-sm font-medium text-foreground break-words">
                          📝 {socialData.result.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          📅 {socialData.result.date} • {socialData.result.links?.length || 0} download options available
                        </p>
                      </div>
                    </div>
                    
                    {socialData.result.links && socialData.result.links.length > 0 && (
                      <div className="space-y-2 sm:space-y-3">
                        <Label className="text-sm sm:text-base font-semibold text-foreground">Available Downloads:</Label>
                        <div className="grid gap-2 sm:gap-3">
                          {socialData.result.links.map((link, index) => (
                            <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-smooth group">
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center ${
                                  link.type === 'video' 
                                    ? 'bg-primary/20 border border-primary/30' 
                                    : 'bg-accent/20 border border-accent/30'
                                }`}>
                                  {link.type === 'video' ? (
                                    <VideoIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                                  ) : (
                                    <Volume2 className="w-5 h-5 sm:w-6 sm:h-6 text-accent-foreground" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm sm:text-base truncate">
                                    {DarkAIService.formatQualityLabel(link)}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {link.type === 'video' ? 'Video File' : 'Audio File'} • Click to download
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="default"
                                className="w-full sm:w-auto bg-primary hover:bg-primary-glow text-primary-foreground shadow-control hover:shadow-glow transition-smooth text-sm sm:text-base"
                                onClick={() => handleDownloadLink(
                                  link.url,
                                  DarkAIService.getDownloadFilename(socialData.result?.title || 'download', link)
                                )}
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="p-3 bg-card border border-border rounded-lg">
                      <p className="text-xs text-muted-foreground">
                        💡 <strong>Tip:</strong> Files will download directly to your device. If direct download fails, the link will open in a new tab.
                      </p>
                    </div>
                    
                    {socialData.result.dev && (
                      <div className="text-center text-xs text-muted-foreground">
                        {socialData.result.dev}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Background Removal Tab */}
          <TabsContent value="background-removal" className="space-y-6">
            <Card className="bg-card border border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Scissors className="w-6 h-6" />
                  Background Removal
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Remove backgrounds from images automatically
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ImageUpload
                  label="Upload Image for Background Removal"
                  placeholder="Select an image to remove background"
                  onUploadComplete={(url) => setBgRemovalData(prev => ({ ...prev, uploadedImageUrl: url }))}
                  currentUrl={bgRemovalData.imageUrl}
                  onUrlChange={(url) => setBgRemovalData(prev => ({ ...prev, imageUrl: url }))}
                  showUrlInput={false}
                />
                {bgRemovalData.result && (
                  <div>
                    <Label className="text-foreground">Background Removal Result</Label>
                    <div className="bg-gradient-to-br from-pink-500/5 to-purple-500/10 p-6 rounded-xl border border-border space-y-4">
                      {(() => {
                        const result = bgRemovalData.result;
                        const isDirectUrl = typeof result === 'string' && result.startsWith('http');
                        
                        if (isDirectUrl) {
                          return (
                            <div className="space-y-4">
                              <div className="text-center">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-600 rounded-full border border-green-500/20">
                                  <Scissors className="w-4 h-4" />
                                  <span className="text-sm font-medium">Background Removed Successfully!</span>
                                </div>
                              </div>
                              
                              <div className="relative group max-w-md mx-auto">
                                <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-100 to-white rounded-xl opacity-50" />
                                <img 
                                  src={result} 
                                  alt="Background removed image"
                                  className="relative w-full h-auto object-contain rounded-xl shadow-2xl border-2 border-green-500/20 animate-fade-in"
                                />
                                
                                <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="h-8 w-8 p-0 bg-black/80 hover:bg-black/90 text-white shadow-lg backdrop-blur-sm"
                                    onClick={() => window.open(result, '_blank')}
                                    title="View full size"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="h-8 w-8 p-0 bg-black/80 hover:bg-black/90 text-white shadow-lg backdrop-blur-sm"
                                    onClick={() => {
                                      const link = document.createElement('a');
                                      link.href = result;
                                      link.download = 'background-removed.png';
                                      link.target = '_blank';
                                      link.click();
                                    }}
                                    title="Download image"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="text-center">
                                <p className="text-xs text-muted-foreground mb-3">Don't forget to support the channel @DarkAIx</p>
                                <div className="flex gap-2 justify-center">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(result, '_blank')}
                                    className="flex-1 max-w-32"
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    View
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const link = document.createElement('a');
                                      link.href = result;
                                      link.download = 'background-removed.png';
                                      link.target = '_blank';
                                      link.click();
                                    }}
                                    className="flex-1 max-w-32"
                                  >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div className="text-center py-8">
                              <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 text-yellow-600 rounded-full border border-yellow-500/20 mb-4">
                                <Scissors className="w-4 h-4" />
                                <span className="text-sm font-medium">Processing Result</span>
                              </div>
                              <div className="bg-muted/50 p-4 rounded-lg max-h-64 overflow-auto">
                                <pre className="text-sm text-foreground whitespace-pre-wrap text-left">
                                  {JSON.stringify(result, null, 2)}
                                </pre>
                              </div>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </div>
                )}
                <Button 
                  onClick={handleBackgroundRemoval}
                  disabled={isLoading}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isLoading ? (
                    <>
                      <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Scissors className="w-4 h-4 mr-2" />
                      Remove Background
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* IMG Generation Tab */}
          <TabsContent value="img-generation" className="space-y-6">
            <Card className="bg-card border border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <ImageIcon className="w-6 h-6" />
                  AI Image Models
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Generate, edit, and enhance images with advanced AI models
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Tab Navigation */}
                <div className="flex border-b border-border mb-6 overflow-x-auto">
                  <button
                    onClick={() => setActiveImageTab('generation')}
                    className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
                      activeImageTab === 'generation'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Generation
                  </button>
                  <button
                    onClick={() => setActiveImageTab('editing')}
                    className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
                      activeImageTab === 'editing'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Editing
                  </button>
                  <button
                    onClick={() => setActiveImageTab('enhance')}
                    className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
                      activeImageTab === 'enhance'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Quality Enhance
                  </button>
                </div>

                {/* Generation Tab */}
                {activeImageTab === 'generation' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button
                        onClick={() => setSelectedGenModel('img-bo')}
                        className={`p-4 border rounded-lg text-left transition-colors ${
                          selectedGenModel === 'img-bo'
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="font-medium text-foreground">IMG-BO</div>
                        <div className="text-sm text-muted-foreground">Ultra-realistic generation</div>
                      </button>
                      <button
                        onClick={() => setSelectedGenModel('gpt-imager')}
                        className={`p-4 border rounded-lg text-left transition-colors ${
                          selectedGenModel === 'gpt-imager'
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="font-medium text-foreground">GPT-Imager</div>
                        <div className="text-sm text-muted-foreground">Advanced text-to-image</div>
                      </button>
                      <button
                        onClick={() => setSelectedGenModel('seedream-4')}
                        className={`p-4 border rounded-lg text-left transition-colors ${
                          selectedGenModel === 'seedream-4'
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="font-medium text-foreground">SeedReam-4</div>
                        <div className="text-sm text-muted-foreground">High-quality detailed results</div>
                      </button>
                    </div>
                    
                    {selectedGenModel === 'img-bo' && (
                      <div className="space-y-4">
                        <div>
                          <Label className="block text-sm font-medium text-foreground mb-2">Image Size</Label>
                          <Select value={imageSize} onValueChange={setImageSize}>
                            <SelectTrigger className="w-full p-3 bg-background border border-border rounded-lg text-foreground">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1024x1024">1024x1024 (Square)</SelectItem>
                              <SelectItem value="1792x1024">1792x1024 (Landscape)</SelectItem>
                              <SelectItem value="1024x1792">1024x1792 (Portrait)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    <Textarea
                      value={imageGenPrompt}
                      onChange={(e) => setImageGenPrompt(e.target.value)}
                      placeholder="Describe the image you want to generate..."
                      className="w-full p-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground resize-none"
                      rows={3}
                    />
                    <Button
                      onClick={handleImageGeneration}
                      disabled={!imageGenPrompt.trim() || isLoading}
                      className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isLoading ? 'Generating...' : `Generate with ${selectedGenModel.toUpperCase()}`}
                    </Button>
                  </div>
                )}

                {/* Editing Tab */}
                {activeImageTab === 'editing' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        onClick={() => setSelectedEditModel('gpt-imager')}
                        className={`p-4 border rounded-lg text-left transition-colors ${
                          selectedEditModel === 'gpt-imager'
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="font-medium text-foreground">GPT-Imager Edit</div>
                        <div className="text-sm text-muted-foreground">Single image editing</div>
                      </button>
                      <button
                        onClick={() => setSelectedEditModel('seedream-4')}
                        className={`p-4 border rounded-lg text-left transition-colors ${
                          selectedEditModel === 'seedream-4'
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="font-medium text-foreground">SeedReam-4 Edit</div>
                        <div className="text-sm text-muted-foreground">Edit up to 4 images</div>
                      </button>
                    </div>

                    <Textarea
                      value={imageEditPrompt}
                      onChange={(e) => setImageEditPrompt(e.target.value)}
                      placeholder="Describe how you want to edit the image(s)..."
                      className="w-full p-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground resize-none"
                      rows={3}
                    />
                    <ImageUpload 
                      onUploadComplete={(url) => handleImageEditUpload([url])}
                      label={`Upload Image${selectedEditModel === 'seedream-4' ? 's (up to 4)' : ''}`}
                      placeholder="Select image(s) to edit"
                    />
                    {uploadedEditImages.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {uploadedEditImages.map((image, index) => (
                          <div key={index} className="relative">
                            <img 
                              src={image} 
                              alt={`Edit ${index + 1}`} 
                              className="w-full h-20 object-cover rounded-lg border border-border"
                            />
                            <button
                              onClick={() => removeEditImage(index)}
                              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-destructive/90"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <Button
                      onClick={handleImageEditing}
                      disabled={!imageEditPrompt.trim() || uploadedEditImages.length === 0 || isLoading}
                      className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isLoading ? 'Processing...' : `Edit with ${selectedEditModel.toUpperCase()}`}
                    </Button>
                  </div>
                )}

                {/* Enhancement Tab */}
                {activeImageTab === 'enhance' && (
                  <div className="space-y-4">
                    <div className="text-center p-6 border-2 border-dashed border-border rounded-lg">
                      <div className="text-4xl mb-2">✨</div>
                      <div className="text-lg font-medium text-foreground mb-2">AI Quality Enhancement</div>
                      <div className="text-sm text-muted-foreground mb-4">
                        Enhance image quality up to 8K resolution with AI
                      </div>
                      <ImageUpload 
                        onUploadComplete={(url) => handleEnhanceImageUpload([url])}
                        label="Upload Image to Enhance"
                        placeholder="Select image to enhance quality"
                      />
                    </div>
                    
                    {uploadedEnhanceImage && (
                      <div className="space-y-4">
                        <div className="flex justify-center">
                          <img 
                            src={uploadedEnhanceImage} 
                            alt="Image to enhance" 
                            className="max-w-full h-48 object-contain rounded-lg border border-border"
                          />
                        </div>
                        <Button
                          onClick={handleImageEnhancement}
                          disabled={isLoading}
                          className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {isLoading ? 'Enhancing...' : 'Enhance Quality'}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Conditional Media Viewer - Only for video, social downloader, tts, and img-generation */}
        {(processedMedia || isProcessing) && 
         (activeTab === "video-generation" || 
          activeTab === "social-downloader" || 
          activeTab === "tts" ||
          activeTab === "img-generation") && (
          <div className="mt-8">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Play className="w-6 h-6" />
                  Media Viewer
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                   {activeTab === "video-generation" || activeTab === "social-downloader" ? "Video player with advanced controls" :
                    activeTab === "tts" ? "Audio player with controls" :
                    "Real-time media display with advanced controls"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MediaViewer 
                  mediaData={processedMedia} 
                  isLoading={isProcessing} 
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default DarkAI;