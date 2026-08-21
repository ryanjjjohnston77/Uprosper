import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import LandingPage from "@/pages/landing";
import EngageLanding from "@/pages/engage-landing";
import BrokersPage from "@/pages/brokers";
import ClientDashboard from "@/pages/client-dashboard";
import ClientUpdates from "@/pages/client-updates";
import ClientHomeDashboard from "@/pages/client-home-dashboard";
import BrokerDashboard from "@/pages/broker-dashboard";
import BrokerMessages from "@/pages/broker-messages";
import BrokerClients from "@/pages/broker-clients";
import MortgageJourney from "@/pages/mortgage-journey";
import RewardsHistory from "@/pages/rewards-history";
import Marketplace from "@/pages/marketplace";
import LoginPage from "@/pages/login";
import SignupPage from "@/pages/signup";
import BrokerSignupPage from "@/pages/broker-signup";
import BrokerAppointments from "@/pages/broker-appointments";
import BrokerNotificationsPage from "@/pages/broker-notifications";
import AdminPanel from "@/pages/admin-panel";
import CompanySignupPage from "@/pages/company-signup";
import CompanyDashboard from "@/pages/company-dashboard";
import ProfilePage from "@/pages/profile";
import PitchPage from "@/pages/pitch/pitch-page";
import InvestorPage from "@/pages/investor";
import PlanPage1 from "@/pages/plan/page-01-cover";
import PlanPage2 from "@/pages/plan/page-02-problem";
import PlanPage3 from "@/pages/plan/page-03-lifecycle";
import PlanPage4 from "@/pages/plan/page-04-opportunity";
import PlanPage5 from "@/pages/plan/page-05-solution";
import PlanPage6 from "@/pages/plan/page-06-user-journey";
import PlanPage7 from "@/pages/plan/page-07-product";
import PlanPage8 from "@/pages/plan/page-08-homeownership";
import PlanPage9 from "@/pages/plan/page-09-rewards";
import PlanPage10 from "@/pages/plan/page-10-revenue";
import PlanPage11 from "@/pages/plan/page-11-unit-economics";
import PlanPage12 from "@/pages/plan/page-12-market-size";
import PlanPage13 from "@/pages/plan/page-13-traction";
import PlanPage14 from "@/pages/plan/page-14-go-to-market";
import PlanPage15 from "@/pages/plan/page-15-competitive";
import PlanPage16 from "@/pages/plan/page-16-moats";
import PlanPage17 from "@/pages/plan/page-17-compliance";
import PlanPage18 from "@/pages/plan/page-18-roadmap";
import PlanPage19 from "@/pages/plan/page-19-vision";
import PlanPage20 from "@/pages/plan/page-20-exit";
import PlanPage21 from "@/pages/plan/page-21-ask";
import NotFound from "@/pages/not-found";

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/home" component={EngageLanding} />
      <Route path="/brokers" component={BrokersPage} />
      <Route path="/client" component={ClientDashboard} />
      <Route path="/client/updates" component={ClientUpdates} />
      <Route path="/client/home" component={ClientHomeDashboard} />
      <Route path="/broker" component={BrokerDashboard} />
      <Route path="/broker/messages" component={BrokerMessages} />
      <Route path="/broker/clients" component={BrokerClients} />
      <Route path="/broker/appointments" component={BrokerAppointments} />
      <Route path="/broker/notifications" component={BrokerNotificationsPage} />
      <Route path="/mortgage" component={MortgageJourney} />
      <Route path="/rewards" component={RewardsHistory} />
      <Route path="/marketplace" component={Marketplace} />
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/broker-signup" component={BrokerSignupPage} />
      <Route path="/company-signup" component={CompanySignupPage} />
      <Route path="/company" component={CompanyDashboard} />
      <Route path="/admin" component={AdminPanel} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/investor" component={InvestorPage} />
      <Route path="/pitch/:slideNum" component={PitchPage} />
      <Route path="/plan/1" component={PlanPage1} />
      <Route path="/plan/2" component={PlanPage2} />
      <Route path="/plan/3" component={PlanPage3} />
      <Route path="/plan/4" component={PlanPage4} />
      <Route path="/plan/5" component={PlanPage5} />
      <Route path="/plan/6" component={PlanPage6} />
      <Route path="/plan/7" component={PlanPage7} />
      <Route path="/plan/8" component={PlanPage8} />
      <Route path="/plan/9" component={PlanPage9} />
      <Route path="/plan/10" component={PlanPage10} />
      <Route path="/plan/11" component={PlanPage11} />
      <Route path="/plan/12" component={PlanPage12} />
      <Route path="/plan/13" component={PlanPage13} />
      <Route path="/plan/14" component={PlanPage14} />
      <Route path="/plan/15" component={PlanPage15} />
      <Route path="/plan/16" component={PlanPage16} />
      <Route path="/plan/17" component={PlanPage17} />
      <Route path="/plan/18" component={PlanPage18} />
      <Route path="/plan/19" component={PlanPage19} />
      <Route path="/plan/20" component={PlanPage20} />
      <Route path="/plan/21" component={PlanPage21} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <SonnerToaster position="top-center" richColors />
          <ScrollToTop />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
