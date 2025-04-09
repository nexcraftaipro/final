import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import AppHeader from '@/components/AppHeader';
const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  return <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AppHeader remainingCredits="0" apiKey="" onApiKeyChange={() => {}} />
      
      <div className="flex-1 py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold tracking-tight">Choose Your Plan</h1>
            <p className="text-muted-foreground mt-2">Simple, transparent pricing to meet your needs</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 mt-8">
            {/* Free Plan */}
            <Card className="bg-gray-900 border-gray-800 shadow-xl">
              <CardHeader className="pb-0">
                <h2 className="text-2xl font-bold text-white">Free</h2>
                <div className="flex items-baseline mt-2">
                  <span className="text-5xl font-extrabold tracking-tight">0</span>
                  <span className="ml-1 text-gray-400">Tk</span>
                </div>
                <p className="text-sm text-gray-400 mt-3">Get started with basic features</p>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3">
                  <PricingItem included text="Limited Metadata Generation" />
                  <PricingItem included text="Basic Image to Prompt Features" />
                  <PricingItem included text="Limited Access to Metadata Customization" />
                  <PricingItem included text="Fast Processing" />
                  <PricingItem included={false} text="Priority Custom Support" />
                  <PricingItem included={false} text="Future Feature Updates" />
                  <PricingItem included={false} text="Commercial License" />
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="lg" className="w-full border-gray-700 text-gray-300 hover:bg-gray-800" onClick={() => navigate('/')}>
                  Your Current Plan
                </Button>
              </CardFooter>
            </Card>
            
            {/* Premium Plan */}
            <Card className="bg-gray-900 border-gray-800 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-amber-500 text-black px-3 py-1 text-xs font-medium">
                POPULAR
              </div>
              <CardHeader className="pb-0">
                <h2 className="text-2xl font-bold text-white">Premium</h2>
                <div className="flex items-baseline mt-2">
                  <span className="text-5xl font-extrabold tracking-tight">750</span>
                  <span className="ml-1 mx-[10px] text-5xl text-[#ff0000]">Tk/LIFETIME</span>
                </div>
                <div className="flex items-center mt-1">
                  <span className="text-sm text-amber-500 line-through">850 Tk</span>
                  <span className="ml-2 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-500">Save 100 Tk</span>
                </div>
                <p className="text-sm text-gray-400 mt-3">All features, unlimited access</p>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3">
                  <PricingItem included text="Unlimited Metadata Generation" />
                  <PricingItem included text="Full Image to Prompt Features" />
                  <PricingItem included text="Full Access to Metadata Customization" />
                  <PricingItem included text="More Fast Processing" />
                  <PricingItem included text="Fully Custom Support" />
                  <PricingItem included text="All Future Features" />
                  <PricingItem included text="Commercial License" />
                </ul>
              </CardContent>
              <CardFooter>
                <Button size="lg" className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white" onClick={() => window.open('https://secure-pay.nagorikpay.com/api/execute/b9a3a7e2ec6c21fbacfc4eb328bf647c', '_blank')}>
                  Upgrade to Premium
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div className="text-center mt-12 text-sm text-gray-400">
            <p>* All prices are one-time payments</p>
            <p className="mt-1">* Premium features are available immediately after payment</p>
          </div>
        </div>
      </div>
    </div>;
};

// Helper component for pricing items
const PricingItem = ({
  included,
  text
}: {
  included: boolean;
  text: string;
}) => <li className="flex items-start">
    {included ? <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" /> : <X className="h-5 w-5 text-gray-500 mr-2 flex-shrink-0" />}
    <span className={included ? "text-gray-200" : "text-gray-500"}>{text}</span>
  </li>;
export default PricingPage;