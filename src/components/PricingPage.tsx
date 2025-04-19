import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import AppHeader from '@/components/AppHeader';

const plans = [
  {
    name: 'Free',
    price: '0 Tk',
    description: 'Perfect for getting started',
    features: [
      { text: 'Generate 5 metadata per day', included: true },
      { text: 'Basic AI model access', included: true },
      { text: 'Standard support', included: true },
      { text: 'Access to community features', included: true },
      { text: 'Priority support', included: false },
      { text: 'Advanced AI model access', included: false },
      { text: 'Unlimited metadata generation', included: false },
    ],
    buttonText: 'Get Started',
    buttonVariant: 'outline' as const,
  },
  {
    name: 'Basic',
    popular: true,
    price: '150 Tk/Month',
    description: 'Best for regular contributors',
    features: [
      { text: 'Generate 50 metadata per day', included: true },
      { text: 'Advanced AI model access', included: true },
      { text: 'Priority support', included: true },
      { text: 'Access to community features', included: true },
      { text: 'Custom prompt templates', included: true },
      { text: 'Bulk processing', included: false },
      { text: 'Unlimited metadata generation', included: false },
    ],
    buttonText: 'Subscribe Now',
    buttonVariant: 'default' as const,
  },
  {
    name: 'Premium',
    price: '7990 Tk/Lifetime',
    originalPrice: '9990 Tk',
    savings: '2000 Tk',
    description: 'For serious contributors',
    features: [
      { text: 'Unlimited metadata generation', included: true },
      { text: 'Advanced AI model access', included: true },
      { text: 'Priority support', included: true },
      { text: 'Access to community features', included: true },
      { text: 'Custom prompt templates', included: true },
      { text: 'Bulk processing', included: true },
      { text: 'Early access to new features', included: true },
    ],
    buttonText: 'Get Premium',
    buttonVariant: 'outline' as const,
  },
];

const Pricing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AppHeader remainingCredits="0" apiKey="" onApiKeyChange={() => {}} />
      
      <div className="flex-1 py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold tracking-tight">Choose Your Plan</h1>
            <p className="text-muted-foreground mt-2">Simple, transparent pricing to meet your needs</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <Card key={plan.name} className={`relative flex flex-col ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center">
                    <span className="bg-primary text-primary-foreground text-sm font-semibold px-3 py-1 rounded-full">
                      POPULAR
                    </span>
                  </div>
                )}
                
                <CardHeader>
                  <h3 className="text-2xl font-bold">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.originalPrice && (
                      <div className="mt-1">
                        <span className="text-muted-foreground line-through">{plan.originalPrice}</span>
                        <span className="ml-2 text-green-500">Save {plan.savings}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-2">{plan.description}</p>
                </CardHeader>
                
                <CardContent className="flex-1">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <Check className={`h-4 w-4 mr-2 ${feature.included ? 'text-green-500' : 'text-muted-foreground'}`} />
                        <span className={feature.included ? '' : 'text-muted-foreground line-through'}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                
                <CardFooter>
                  <Button 
                    variant={plan.buttonVariant}
                    className="w-full"
                    onClick={() => navigate('/auth')}
                  >
                    {plan.buttonText}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing; 