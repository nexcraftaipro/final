import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import AppHeader from '@/components/AppHeader';

const PricingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-[#0B0F19] text-white">
      <AppHeader remainingCredits="0" apiKey="" onApiKeyChange={() => {}} />
      
      <div className="flex-1 py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold tracking-tight">Choose Your Plan</h1>
            <p className="text-gray-400 mt-3 text-lg">Simple, transparent pricing to meet your needs</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mt-8">
            {/* Free Plan */}
            <Card className="bg-[#12151F] border-gray-800 shadow-xl relative overflow-hidden">
              <CardHeader className="pb-0">
                <h2 className="text-2xl font-bold text-white">Free</h2>
                <div className="flex items-baseline mt-2">
                  <span className="text-5xl font-extrabold tracking-tight">0</span>
                  <span className="ml-1 text-slate-50 text-4xl">Tk</span>
                </div>
                <p className="text-sm text-gray-400 mt-3">Limited features to get started</p>
                <p className="text-xs text-yellow-400 mt-1">Now with 3 credits for lifetime</p>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-4">
                  <PricingItem included text="Limited Metadata Generation (3 Credits)" />
                  <PricingItem included text="Basic Image to Prompt Features" />
                  <PricingItem included text="Limited Access to Metadata Customization" />
                  <PricingItem included={false} text="More Fast Processing" />
                  <PricingItem included={false} text="Fully Custom Support" />
                  <PricingItem included={false} text="All Future Features" />
                </ul>
              </CardContent>
              <CardFooter>
                <Button size="lg" onClick={() => navigate('/')} className="w-full bg-blue-600 hover:bg-blue-700">
                  Current Plan
                </Button>
              </CardFooter>
            </Card>
            
            {/* Premium Plan - Now in middle position */}
            <Card className="bg-[#12151F] border-gray-800 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-amber-500 text-black px-3 py-1 text-xs font-semibold">
                POPULAR
              </div>
              <CardHeader className="pb-0">
                <h2 className="text-2xl font-bold text-white">Premium</h2>
                <div className="flex items-baseline mt-2">
                  <span className="text-5xl font-extrabold tracking-tight">1000</span>
                  <span className="ml-1 text-slate-50 text-xl">Tk/Yearly</span>
                </div>
                <div className="mt-1">
                  <span className="text-sm bg-yellow-400 text-black px-2 py-0.5 rounded font-medium">Best Value!</span>
                </div>
                <p className="text-sm text-gray-400 mt-3">All features, unlimited access</p>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-4">
                  <PricingItem included text="Unlimited Metadata Generation" />
                  <PricingItem included text="Full Image to Prompt Features" />
                  <PricingItem included text="Full Access to Metadata Customization" />
                  <PricingItem included text="More Fast Processing" />
                  <PricingItem included text="Fully Custom Support" />
                  <PricingItem included text="All Future Features" />
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  size="lg"
                  className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                  onClick={() => window.open('https://pixcraftai.paymently.io/paymentlink/pay/E0PQXvAfeChDNE5Q5rohBGproO5NuPXHLYp4rbdz', '_blank')}
                >
                  Upgrade to Premium
                </Button>
              </CardFooter>
            </Card>
            
            {/* Basic Plan - Now in last position */}
            <Card className="bg-[#12151F] border-gray-800 shadow-xl relative overflow-hidden">
              <CardHeader className="pb-0">
                <h2 className="text-2xl font-bold text-white">Basic</h2>
                <div className="flex items-baseline mt-2">
                  <span className="text-5xl font-extrabold tracking-tight">200</span>
                  <span className="ml-1 text-slate-50 text-xl">Tk/Month</span>
                </div>
                <p className="text-sm text-gray-400 mt-3">All features, monthly access</p>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-4">
                  <PricingItem included text="Unlimited Metadata Generation" />
                  <PricingItem included text="Full Image to Prompt Features" />
                  <PricingItem included text="Full Access to Metadata Customization" />
                  <PricingItem included text="More Fast Processing" />
                  <PricingItem included text="Fully Custom Support" />
                  <PricingItem included text="All Future Features" />
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  size="lg" 
                  className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                  onClick={() => window.open('https://pixcraftai.paymently.io/paymentlink/pay/h7w3lr5WK9kO5cnYlIo9mYHTChODMOgABKxxRxRQ', '_blank')}
                >
                  Upgrade to Basic
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div className="text-center mt-12 text-sm text-gray-400">
            <p>* Premium plan is billed annually (2000 Tk per year)</p>
            <p className="mt-1">* Basic plan is billed monthly (200 Tk per month)</p>
            <p className="mt-1">* All features are available immediately after payment</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper component for pricing items
const PricingItem = ({
  included,
  text
}: {
  included: boolean;
  text: string;
}) => (
  <li className="flex items-center gap-3">
    {included ? (
      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
    ) : (
      <X className="h-5 w-5 text-red-500 flex-shrink-0" />
    )}
    <span className={included ? "text-gray-200" : "text-gray-500"}>{text}</span>
  </li>
);

export default PricingPage;
