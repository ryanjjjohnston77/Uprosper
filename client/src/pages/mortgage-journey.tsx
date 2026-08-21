import { useEffect, useRef, useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Home, TrendingDown, Calculator, Calendar, PoundSterling, Clock, Sparkles } from "lucide-react";
import { useLocation } from "wouter";

export default function MortgageJourney() {
  const [, setLocation] = useLocation();
  const [overpayment, setOverpayment] = useState(200);
  const calcEventFiredRef = useRef(false);

  useEffect(() => {
    if (sessionStorage.getItem("uprosper:mortgage_journey_viewed") === "1") return;
    sessionStorage.setItem("uprosper:mortgage_journey_viewed", "1");
    // The mortgage journey page is the core financial education surface — log both
    // a mortgage option view (user is exploring their mortgage) and a lesson view
    // (the page teaches overpayment, rate comparison, and term-reduction concepts).
    fetch("/api/client/event", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType: "mortgage_option_viewed", metadata: { source: "mortgage_journey" } }),
    }).catch(() => {});
    fetch("/api/client/event", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType: "lesson_viewed", metadata: { lesson: "mortgage_journey" } }),
    }).catch(() => {});
  }, []);

  const handleOverpaymentChange = (value: number) => {
    setOverpayment(value);
    if (calcEventFiredRef.current) return;
    if (value <= 0) return;
    if (sessionStorage.getItem("uprosper:overpayment_calc_fired") === "1") {
      calcEventFiredRef.current = true;
      return;
    }
    calcEventFiredRef.current = true;
    sessionStorage.setItem("uprosper:overpayment_calc_fired", "1");
    fetch("/api/client/event", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType: "calculator_run", metadata: { source: "overpayment" } }),
    }).catch(() => {});
  };

  const mortgageData = {
    originalAmount: 250000,
    amountPaid: 187500,
    remaining: 62500,
    interestRate: 4.5,
    monthlyPayment: 1267,
    yearsRemaining: 12,
    totalInterestPaid: 28500,
    interestSaved: 4200,
  };

  const percentPaid = (mortgageData.amountPaid / mortgageData.originalAmount) * 100;

  const calculateOverpaymentImpact = (monthlyExtra: number) => {
    const monthlyRate = mortgageData.interestRate / 100 / 12;
    const currentMonths = mortgageData.yearsRemaining * 12;
    
    const newMonthlyPayment = mortgageData.monthlyPayment + monthlyExtra;
    let balance = mortgageData.remaining;
    let months = 0;
    let totalInterest = 0;
    
    while (balance > 0 && months < currentMonths * 2) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = newMonthlyPayment - interestPayment;
      
      if (principalPayment <= 0) break;
      
      balance -= principalPayment;
      totalInterest += interestPayment;
      months++;
    }
    
    const originalInterest = mortgageData.remaining * monthlyRate * currentMonths * 0.5;
    const interestSaved = Math.max(0, originalInterest - totalInterest);
    const yearsSaved = Math.max(0, (currentMonths - months) / 12);
    
    return {
      newTermMonths: months,
      yearsSaved: yearsSaved.toFixed(1),
      interestSaved: Math.round(interestSaved),
    };
  };

  const overpaymentImpact = calculateOverpaymentImpact(overpayment);

  const paymentHistory = [
    { date: "Dec 2024", amount: 1267, status: "Paid" },
    { date: "Nov 2024", amount: 1267, status: "Paid" },
    { date: "Oct 2024", amount: 1267, status: "Paid" },
    { date: "Sep 2024", amount: 1467, status: "Overpaid" },
    { date: "Aug 2024", amount: 1267, status: "Paid" },
  ];

  return (
    <Shell>
      <div className="space-y-6 pb-12">
        <Button
          variant="ghost"
          className="text-muted-foreground hover:text-gray-900 -ml-2"
          onClick={() => setLocation("/client")}
          data-testid="button-back-dashboard"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>

        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Home className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-gray-900">
              Your Mortgage Journey
            </h1>
            <p className="text-muted-foreground">Track your progress to becoming mortgage-free</p>
          </div>
        </div>

        <Card className="p-6 bg-gradient-to-br from-primary/5 to-green-50 border-none shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Mortgage Progress</h2>
            <span className="text-2xl font-bold text-primary">{percentPaid.toFixed(0)}%</span>
          </div>
          
          <Progress value={percentPaid} className="h-4 mb-4" />
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-white/70 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Original Amount</p>
              <p className="text-lg font-bold text-gray-900">£{mortgageData.originalAmount.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-white/70 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Amount Paid</p>
              <p className="text-lg font-bold text-green-600">£{mortgageData.amountPaid.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-white/70 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Remaining</p>
              <p className="text-lg font-bold text-amber-600">£{mortgageData.remaining.toLocaleString()}</p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{mortgageData.yearsRemaining} years remaining</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{mortgageData.interestRate}% interest rate</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-none shadow-md">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calculator className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">Overpayment Calculator</h3>
              <p className="text-sm text-muted-foreground">See how extra payments can help you save</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium text-gray-700">Monthly Overpayment</Label>
                <span className="text-lg font-bold text-primary">£{overpayment}</span>
              </div>
              <Slider
                value={[overpayment]}
                onValueChange={(value) => handleOverpaymentChange(value[0])}
                min={0}
                max={1000}
                step={50}
                className="py-4"
                data-testid="slider-overpayment"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>£0</span>
                <span>£500</span>
                <span>£1,000</span>
              </div>
            </div>

            {overpayment > 0 && (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-medium text-green-700">Years Saved</span>
                  </div>
                  <p className="text-2xl font-bold text-green-700">{overpaymentImpact.yearsSaved}</p>
                  <p className="text-xs text-green-600">faster mortgage-free</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <PoundSterling className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-medium text-blue-700">Interest Saved</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">£{overpaymentImpact.interestSaved.toLocaleString()}</p>
                  <p className="text-xs text-blue-600">over mortgage term</p>
                </div>
              </div>
            )}

            <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
              <p className="text-sm text-amber-800">
                <strong>Tip:</strong> Most lenders allow you to overpay up to 10% of your mortgage balance each year without penalties. Contact your broker to check your terms.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-none shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="w-5 h-5 text-purple-700" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">Payment History</h3>
              <p className="text-sm text-muted-foreground">Your recent mortgage payments</p>
            </div>
          </div>

          <div className="space-y-3">
            {paymentHistory.map((payment, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                data-testid={`payment-history-${index}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${payment.status === "Overpaid" ? "bg-green-500" : "bg-blue-500"}`} />
                  <span className="text-sm font-medium text-gray-700">{payment.date}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-900">£{payment.amount.toLocaleString()}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    payment.status === "Overpaid" 
                      ? "bg-green-100 text-green-700" 
                      : "bg-blue-100 text-blue-700"
                  }`}>
                    {payment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-r from-primary to-green-700 text-white border-none shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-6 h-6" />
            <h3 className="font-bold text-lg">Interest Saved So Far</h3>
          </div>
          <p className="text-3xl font-bold mb-2">£{mortgageData.interestSaved.toLocaleString()}</p>
          <p className="text-sm opacity-90">
            By staying on track with your payments, you've already saved £{mortgageData.interestSaved.toLocaleString()} in interest. Keep it up!
          </p>
        </Card>
      </div>
    </Shell>
  );
}
