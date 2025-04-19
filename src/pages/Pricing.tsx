import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import AppHeader from '@/components/AppHeader';

const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <AppHeader remainingCredits="0" apiKey="" onApiKeyChange={() => {}} />
      
      <div className="flex-1 py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold tracking-tight">Choose Your Plan</h1>
            <p className="text-gray-400 mt-2">Simple, transparent pricing to meet your needs</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <Card className="bg-[#111111] border-[#333333] rounded-xl overflow-hidden">
              <CardHeader className="pb-4">
                <h2 className="text-xl font-medium mb-2">Free</h2>
                <div className="flex items-baseline">
                  <span className="text-5xl font-bold">0</span>
                  <span className="ml-2 text-lg text-gray-400">Tk</span>
                </div>
                <p className="text-sm text-gray-400 mt-3">Limited features to get started</p>
              </CardHeader>
              <CardContent>
                <div className="mt-4 mb-8">
                  <ul className="space-y-3">
                    <PricingItem included text="Limited Metadata Generation" />
                    <PricingItem included text="Basic Image to Prompt Features" />
                    <PricingItem included text="Limited Access to Metadata Customization" />
                    <PricingItem included={false} text="More Fast Processing" showRedCross />
                    <PricingItem included={false} text="Fully Custom Support" showRedCross />
                    <PricingItem included={false} text="All Future Features" showRedCross />
                    <PricingItem included={false} text="Commercial License" showRedCross />
                  </ul>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/')} 
                  className="w-full bg-transparent border-white/20 hover:bg-white/10"
                >
                  Current Plan
                </Button>
              </CardFooter>
            </Card>

            {/* Basic Plan */}
            <Card className="bg-gradient-to-br from-[#2C0B3F] via-[#451C5C] to-[#2C0B3F] border-[#333333] rounded-xl overflow-hidden backdrop-blur-3xl relative">
              <div className="absolute -top-3 right-4 bg-amber-500 px-3 py-1 rounded-full">
                <span className="text-xs font-semibold text-[#111111]">POPULAR</span>
              </div>
              <CardHeader className="pb-4">
                <h2 className="text-xl font-medium mb-2">Basic</h2>
                <div className="flex items-baseline">
                  <span className="text-5xl font-bold">150</span>
                  <span className="ml-2 text-lg text-gray-400">Tk/Month</span>
                </div>
                <p className="text-sm text-gray-400 mt-3">All features, unlimited access</p>
              </CardHeader>
              <CardContent>
                <div className="mt-4 mb-8">
                  <ul className="space-y-3">
                    <PricingItem included text="Unlimited Metadata Generation" />
                    <PricingItem included text="Full Image to Prompt Features" />
                    <PricingItem included text="Full Access to Metadata Customization" />
                    <PricingItem included text="More Fast Processing" />
                    <PricingItem included text="Fully Custom Support" />
                    <PricingItem included text="All Future Features" />
                    <PricingItem included text="Commercial License" />
                  </ul>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  size="lg"
                  className="w-full bg-white text-black hover:bg-white/90"
                  onClick={() => window.open('https://csvpikshine.paymently.io/default/paymentlink/pay/oj1MGLV0cgkc5yHv034GDR2WzhcT8JT2ojM71s18', '_blank')}
                >
                  Upgrade to Basic
                </Button>
              </CardFooter>
            </Card>

            {/* Premium Plan */}
            <Card className="bg-[#111111] border-[#333333] rounded-xl overflow-hidden">
              <CardHeader className="pb-4">
                <h2 className="text-xl font-medium mb-2">Premium</h2>
                <div className="flex items-baseline">
                  <span className="text-5xl font-bold">7990</span>
                  <span className="ml-2 text-lg text-gray-400">Tk/Lifetime</span>
                </div>
                <div className="mt-1">
                  <span className="text-sm text-gray-400 line-through">9990 Tk</span>
                  <span className="text-sm text-green-500 ml-2">Save 2000 Tk</span>
                </div>
                <p className="text-sm text-gray-400 mt-3">All features, unlimited access</p>
              </CardHeader>
              <CardContent>
                <div className="mt-4 mb-8">
                  <ul className="space-y-3">
                    <PricingItem included text="Unlimited Metadata Generation" />
                    <PricingItem included text="Full Image to Prompt Features" />
                    <PricingItem included text="Full Access to Metadata Customization" />
                    <PricingItem included text="More Fast Processing" />
                    <PricingItem included text="Fully Custom Support" />
                    <PricingItem included text="All Future Features" />
                    <PricingItem included text="Commercial License" />
                  </ul>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  size="lg"
                  className="w-full bg-white text-black hover:bg-white/90"
                  onClick={() => window.open('https://csvpikshine.paymently.io/default/paymentlink/pay/SIBUfRkJxIDgK7GhkrL4WdAJofkOdkL8hnidHQdF', '_blank')}
                >
                  Upgrade to Premium
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div className="text-center mt-12 text-sm text-gray-400">
            <p>* All prices are one-time payments for Premium plan</p>
            <p className="mt-1">* Premium and Basic features are available immediately after payment</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper component for pricing items
const PricingItem = ({
  included,
  text,
  showRedCross = false
}: {
  included: boolean;
  text: string;
  showRedCross?: boolean;
}) => (
  <li className="flex items-start">
    {included ? (
      <Check className="h-5 w-5 mr-2 flex-shrink-0 text-green-500" />
    ) : (
      showRedCross ? (
        <X className="h-5 w-5 mr-2 flex-shrink-0 text-red-500" />
      ) : (
        <Check className="h-5 w-5 mr-2 flex-shrink-0 text-gray-600" />
      )
    )}
    <span className={included ? 'text-gray-300' : 'text-gray-600'}>{text}</span>
  </li>
);

export default PricingPage;