"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, TrendingUp, AlertCircle, ShoppingBag, ArrowRight, BarChart2, Magnet, Calculator, DollarSign, PackageSearch, PenTool, Sparkles, Filter, Crown, Check, Zap, LogOut, User, Lock, CreditCard, Save, Brain, Factory } from "lucide-react";
import { supabase } from "@/lib/supabase";
import PipelineProgress, { AgentStatus } from "./PipelineProgress";
import { v4 as uuidv4 } from "uuid";

export default function GapsDashboard() {
  const [user, setUser] = useState<any>(null);
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("gaps");
  const [trendsData, setTrendsData] = useState<{ month: string, volume: number, sentiment: number }[]>([]);
  const [isScraping, setIsScraping] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isPendingPlan, setIsPendingPlan] = useState<string | null>(null);
  
  // Auth & Payment Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [authType, setAuthType] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [savedProducts, setSavedProducts] = useState<any[]>([]);
  const [sourcingLeads, setSourcingLeads] = useState<any[]>([]);
  const [isFetchingSaved, setIsFetchingSaved] = useState(false);

  // Pipeline State
  const [clientId] = useState(() => typeof window !== 'undefined' ? uuidv4() : '');
  const [pipelineSteps, setPipelineSteps] = useState<any[]>([]);
  const [showPipeline, setShowPipeline] = useState(false);
  const [discoveryResult, setDiscoveryResult] = useState<any>(null);
  const [selectedGap, setSelectedGap] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Profitability Calculator State
  const [price, setPrice] = useState(39.99);
  const [unitCost, setUnitCost] = useState(8.50);
  const [shippingCost, setShippingCost] = useState(2.00);
  const [marketplaceFee, setMarketplaceFee] = useState(6.50);

  // Listing Builder State
  const [isGenerating, setIsGenerating] = useState(false);
  const [listingTitle, setListingTitle] = useState("");
  const [listingBullets, setListingBullets] = useState("");
  const keywordsBank = ["ergonomic", "home office", "gaming chair", "lumbar support", "mesh back", "desk chair", "heavy duty", "posture", "swivel", "adjustable height", "wholesale"];

  // WebSocket for Agent Updates
  useEffect(() => {
    if (!clientId) return;
    
    const ws = new WebSocket(`ws://localhost:8000/ws/${clientId}`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "agent_status") {
        setPipelineSteps(prev => {
          const existing = prev.find(s => s.agent === data.agent);
          if (existing) {
            return prev.map(s => s.agent === data.agent ? { ...s, status: data.status, details: data.details } : s);
          }
          return [...prev, { agent: data.agent, label: data.agent, status: data.status, details: data.details }];
        });

        if (data.agent === "Manager" && data.status === "complete") {
          setIsSearching(false);
          // Store the final discovery results
          if (data.details && typeof data.details === 'object') {
            setDiscoveryResult(data.details);
            // Populate the main gaps results if they exist
            if (data.details.analysis?.gaps) {
              setResults(data.details.analysis.gaps);
            }
          }
          setTimeout(() => {
            setShowPipeline(false);
            setActiveTab("gaps");
          }, 3000);
        }
      }
    };

    return () => ws.close();
  }, [clientId]);

  // Fetch real data and manage auth session
  useEffect(() => {
    const checkUser = async () => {
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    checkUser();

    let authListener: any = null;
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user || null);
        if (session?.user && isPendingPlan) {
          if (isPendingPlan === 'starter') {
            setSelectedPlan('starter');
            setIsPendingPlan(null);
          } else {
            setShowPaymentModal(true);
          }
        }
      });
      authListener = data;
    }

    const fetchRealGaps = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/v1/market-data/gaps");
        const data = await response.json();
        if (data.status === "success" && data.gaps.length > 0) {
          setResults(data.gaps);
        }
      } catch (err) {
        console.error("Failed to fetch initial gaps (Backend may be offline). Using mock data:", err);
        setResults([
          { "id": "1", "product_name": "Ergonomic Office Chair", "defect": "Lumbar support breaks after 2 months", "opportunity": "Use reinforced steel joints", "urgency": "High", "sentiment": 22, "search_volume": 45000 },
          { "id": "2", "product_name": "Standing Desk Anti-Fatigue Mat", "defect": "Edges curl up and cause tripping", "opportunity": "Add weighted/beveled edges", "urgency": "High", "sentiment": 31, "search_volume": 12400 },
          { "id": "3", "product_name": "Wireless Gaming Mouse", "defect": "Double-clicking issue on main buttons", "opportunity": "Upgrade to optical switches", "urgency": "Medium", "sentiment": 45, "search_volume": 89000 },
          { "id": "4", "product_name": "Stainless Steel Water Bottle", "defect": "Lid leaks when stored horizontally", "opportunity": "Redesign silicone O-ring seal", "urgency": "Low", "sentiment": 65, "search_volume": 115000 },
          { "id": "5", "product_name": "Yoga Mat", "defect": "Slippery when sweating", "opportunity": "Add micro-fiber textured top layer", "urgency": "Medium", "sentiment": 40, "search_volume": 67000 }
        ]);
      }
    };
    fetchRealGaps();

    const fetchSavedData = async () => {
      if (!supabase || !user) return;
      setIsFetchingSaved(true);
      try {
        const { data: prods } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (prods) setSavedProducts(prods);
        
        const { data: leads } = await supabase.from('sourcing_leads').select('*').order('created_at', { ascending: false });
        if (leads) setSourcingLeads(leads);
      } catch (err) {
        console.error("Failed to fetch saved data:", err);
      } finally {
        setIsFetchingSaved(false);
      }
    };

    if (user) {
      fetchSavedData();
    }

    return () => {
      if (authListener) authListener.subscription.unsubscribe();
    };
  }, [isPendingPlan, user]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    if (!supabase) {
      alert("Supabase is not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file.");
      setIsAuthLoading(false);
      return;
    }
    try {
      if (authType === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setShowAuthModal(false);
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("Check your email for the confirmation link!");
        setShowAuthModal(false);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setSelectedPlan(null);
    setUser(null);
  };

  const handlePlanSelection = (plan: string) => {
    if (plan === 'starter') {
      setSelectedPlan('starter');
      return;
    }
    
    if (!user) {
      setIsPendingPlan(plan);
      setAuthType('signup');
      setShowAuthModal(true);
    } else {
      setIsPendingPlan(plan);
      setShowPaymentModal(true);
    }
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate payment processing
    setTimeout(() => {
      setSelectedPlan(isPendingPlan);
      setShowPaymentModal(false);
      setIsPendingPlan(null);
      alert(`Success! You are now subscribed to the ${isPendingPlan} plan.`);
    }, 2000);
  };

  const handleSaveGap = async (gap: any) => {
    if (!user) {
      alert("Please sign in to save data.");
      setShowAuthModal(true);
      return;
    }

    setIsSaving(gap.id);
    if (!supabase) {
      alert("Supabase is not configured. Data cannot be saved.");
      setIsSaving(null);
      return;
    }
    try {
      const { error } = await supabase
        .from('products')
        .insert([{
          name: gap.product || gap.product_name,
          description: gap.defect || gap.opportunity,
          trending_score: (gap.sentiment || 50) / 100,
          status: 'discovered'
        }]);
      
      if (error) throw error;
      alert("Gap saved to your Supabase products table!");
      // Refresh saved products
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (data) setSavedProducts(data);
    } catch (err: any) {
      console.error("Save failed:", err);
      alert("Failed to save: " + err.message);
    } finally {
      setIsSaving(null);
    }
  };

  const handleSaveSourcingLead = async (lead: any) => {
    if (!supabase || !user) {
      alert("Please sign in to save sourcing leads.");
      setShowAuthModal(true);
      return;
    }

    try {
      const { error } = await supabase.from('sourcing_leads').insert([lead]);
      if (error) throw error;
      alert("Sourcing lead saved successfully!");
      // Refresh leads
      const { data } = await supabase.from('sourcing_leads').select('*').order('created_at', { ascending: false });
      if (data) setSourcingLeads(data);
    } catch (err: any) {
      alert("Failed to save lead: " + err.message);
    }
  };

  const handleScrape = async () => {
    if (!query.trim()) return;
    setIsScraping(true);
    try {
      const response = await fetch("http://localhost:8000/api/v1/market-data/scrape-social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_query: query, platforms: ["Reddit", "TikTok", "Instagram"] })
      });
      const data = await response.json();
      if (data.status === "success") {
        alert(`Successfully scraped ${data.count} live organic posts about "${query}"! Data is queued for gap analysis.`);
      } else {
        alert("Scraping failed: " + (data.detail || "Unknown error"));
      }
    } catch (e) {
      console.error("Backend offline. Simulating scrape:", e);
      // Simulate fake scrape delay and alert so the UI functions as a demo
      setTimeout(() => {
        alert(`[Mock Mode] Successfully scraped ${Math.floor(Math.random() * 50) + 10} live organic posts about "${query}" from TikTok and Reddit! Data is queued for AI gap analysis.`);
        setIsScraping(false);
      }, 1500);
      return; // Return early so finally block doesn't immediately set isScraping to false
    } finally {
      setIsScraping(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setShowPipeline(true);
    setPipelineSteps([
      { agent: "Manager", label: "Catalyst Manager", status: "running", details: "Initiating multi-agent discovery..." },
      { agent: "ResearchAgent", label: "Market Research", status: "pending" },
      { agent: "AnalysisAgent", label: "Market Analysis", status: "pending" },
      { agent: "CreativeAgent", label: "Listing Optimization", status: "pending" },
      { agent: "LogisticsAgent", label: "Logistics & Sourcing", status: "pending" }
    ]);

    try {
      // Trigger the background discovery pipeline
      const response = await fetch("http://localhost:8000/api/v1/analysis/market-discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: query, client_id: clientId }),
      });
      
      const data = await response.json();
      console.log("Discovery dispatched:", data.task_id);
      
      // The results will come through either the task status or we can poll
      // For this Grade 5 implementation, we'll wait for the pipeline to finish 
      // via WebSocket and then show the results.
      
    } catch (error) {
      console.error("Discovery failed:", error);
      setIsSearching(false);
      setShowPipeline(false);
    }
  };

  // Helper to dynamically render SVG chart
  const renderChart = () => {
    if (trendsData.length === 0) {
      return (
        <>
          <path d="M0,80 Q10,70 20,80 T40,50 T60,60 T80,30 T100,10" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M0,80 Q10,70 20,80 T40,50 T60,60 T80,30 T100,10 L100,100 L0,100 Z" fill="url(#gradient)" stroke="none" />
          <circle cx="20" cy="80" r="2" fill="#6366f1" />
          <circle cx="40" cy="50" r="2" fill="#6366f1" />
          <circle cx="60" cy="60" r="2" fill="#6366f1" />
          <circle cx="80" cy="30" r="2" fill="#6366f1" />
          <circle cx="100" cy="10" r="3" fill="#fff" stroke="#6366f1" strokeWidth="2" />
        </>
      );
    }

    const step = 100 / (trendsData.length - 1);
    const points = trendsData.map((d, i) => {
      return { x: i * step, y: 100 - d.volume };
    });

    const pathLine = points.reduce((acc, pt, i) => {
      return i === 0 ? `M${pt.x},${pt.y}` : `${acc} L${pt.x},${pt.y}`;
    }, "");

    const pathFill = `${pathLine} L100,100 L0,100 Z`;

    return (
      <>
        <path d={pathLine} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d={pathFill} fill="url(#gradient)" stroke="none" />
        {points.map((pt, i) => (
          <circle key={i} cx={pt.x} cy={pt.y} r={i === points.length - 1 ? 3 : 2} fill={i === points.length - 1 ? "#fff" : "#6366f1"} stroke={i === points.length - 1 ? "#6366f1" : "none"} strokeWidth={i === points.length - 1 ? 2 : 0} />
        ))}
      </>
    );
  };

  const handleGenerateListing = async () => {
    if (!query) {
      alert("Please search for a product (e.g. ergonomic chair) to establish context first.");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("http://localhost:8000/api/v1/market-data/generate-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_name: query,
          keywords: keywordsBank.slice(0, 8)
        })
      });
      const data = await response.json();
      if (data.status === "success" && data.data) {
        setListingTitle(data.data.title || "");
        setListingBullets(data.data.bullets || "");
      } else {
        alert("Failed to generate listing. Details: " + (data.detail || "Unknown"));
      }
    } catch (err) {
      console.error("Backend offline. Using mock AI generated listing.", err);
      // Fallback mock generation so the user can test the UI without the backend running
      setTimeout(() => {
        setListingTitle(`Premium ${query} - Ergonomic Design, Adjustable Support for Home Office, Gaming, and Work (AI Optimized)`);
        setListingBullets(`✅ ALL-DAY COMFORT: Designed with high-density foam and breathable mesh back for ultimate temperature control.\n✅ 4D ADJUSTABLE ARMRESTS: Prevent wrist fatigue during long working or gaming sessions.\n✅ LUMBAR SUPPORT: Advanced posture correction system built-in to relieve lower back pain.\n✅ HEAVY DUTY SWIVEL: 300lbs capacity with a reinforced metal base and smooth-rolling castors.`);
        setIsGenerating(false);
      }, 1500);
      return; // Return early so we don't hit the finally block immediately during the fake timeout
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveListing = async () => {
    if (!supabase || !user) {
      alert("Please sign in to save listings.");
      setShowAuthModal(true);
      return;
    }

    if (!listingTitle) {
      alert("Please generate a listing first.");
      return;
    }

    setIsSaving("listing");
    try {
      const { error } = await supabase
        .from('products')
        .insert([{
          name: query || "New Product",
          description: `TITLE: ${listingTitle}\n\nBULLETS:\n${listingBullets}`,
          status: 'listing_built'
        }]);
      
      if (error) throw error;
      alert("Listing saved to your Catalyst products table!");
      // Refresh saved products
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (data) setSavedProducts(data);
    } catch (err: any) {
      alert("Failed to save: " + err.message);
    } finally {
      setIsSaving(null);
    }
  };


  // If no plan selected yet, show pricing page first
  if (!selectedPlan) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 font-sans p-8 selection:bg-indigo-500/30">
        <header className="max-w-6xl mx-auto flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 ring-1 ring-white/10">
              <TrendingUp className="text-white w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Catalyst</h1>
          </div>
          <div className="flex items-center gap-4">
            {!supabase && (
              <div className="hidden md:flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] uppercase font-bold px-3 py-1 rounded-full">
                <AlertCircle className="w-3 h-3" /> Supabase Keys Missing
              </div>
            )}
            <div className="text-sm text-slate-400 font-medium tracking-wide">E-Commerce Intelligence Engine</div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto">
          <div className="text-center mt-16 mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium px-4 py-1.5 rounded-full mb-6"
            >
              <Sparkles className="w-4 h-4" /> Choose Your Plan
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-4xl md:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-violet-400 mb-4"
            >
              Scale Your E-Commerce Business
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-slate-400 max-w-xl mx-auto"
            >
              Start free, upgrade when you&apos;re ready. Cancel anytime.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter (Free) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="relative bg-slate-900/60 backdrop-blur-sm border border-slate-800/60 rounded-3xl p-8 flex flex-col hover:border-slate-700 transition-all group"
            >
              <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-white/5">
                <Zap className="w-7 h-7 text-slate-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">Starter</h3>
              <p className="text-slate-500 text-sm mb-6">Perfect for exploring the platform</p>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-5xl font-extrabold text-white">$0</span>
                <span className="text-slate-500 text-sm">/month</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                {["5 market gap searches / day", "Google Trends visualization", "Basic Keyword Magnet (10 results)", "Profitability Calculator", "Community support"].map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                    <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => handlePlanSelection('starter')} className="w-full py-3.5 rounded-xl font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all ring-1 ring-white/5 hover:ring-indigo-500/30">
                Get Started Free
              </button>
            </motion.div>

            {/* Pro - Featured */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="relative bg-slate-900/80 backdrop-blur-sm border-2 border-indigo-500/40 rounded-3xl p-8 flex flex-col shadow-xl shadow-indigo-500/10 group"
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold px-5 py-1.5 rounded-full shadow-lg shadow-indigo-500/30 uppercase tracking-wider">Most Popular</span>
              </div>
              <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-indigo-500/20">
                <Crown className="w-7 h-7 text-indigo-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">Pro</h3>
              <p className="text-slate-500 text-sm mb-6">For serious e-commerce sellers</p>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-5xl font-extrabold text-white">$79</span>
                <span className="text-slate-500 text-sm">/month</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                {["Unlimited market gap searches", "AI Listing Builder with OpenAI", "Full Keyword Magnet (unlimited)", "Black Box product discovery", "Live Scrape (Reddit, TikTok)", "Advanced trend analytics", "Priority email support"].map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                    <Check className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => handlePlanSelection('pro')} className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:shadow-lg hover:shadow-indigo-500/25 transition-all">
                Start 14-Day Free Trial
              </button>
            </motion.div>

            {/* Enterprise */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="relative bg-slate-900/60 backdrop-blur-sm border border-slate-800/60 rounded-3xl p-8 flex flex-col hover:border-slate-700 transition-all group"
            >
              <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-amber-500/20">
                <PackageSearch className="w-7 h-7 text-amber-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">Enterprise</h3>
              <p className="text-slate-500 text-sm mb-6">For agencies &amp; large brands</p>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-5xl font-extrabold text-white">$249</span>
                <span className="text-slate-500 text-sm">/month</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                {["Everything in Pro", "Multi-user team workspace", "Custom AI prompt tuning", "White-label reporting", "Supplier matching API", "Dedicated account manager", "99.9% uptime SLA"].map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                    <Check className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => handlePlanSelection('enterprise')} className="w-full py-3.5 rounded-xl font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all ring-1 ring-white/5 hover:ring-amber-500/30">
                Contact Sales
              </button>
            </motion.div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans p-8 selection:bg-indigo-500/30">
      {/* Header */}
      <header className="max-w-6xl mx-auto flex items-center justify-between mb-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 ring-1 ring-white/10">
            <TrendingUp className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Catalyst</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 capitalize">{selectedPlan} Plan</span>
          {user ? (
            <div className="flex items-center gap-3 bg-slate-900/50 rounded-full pl-3 pr-1 py-1 border border-slate-800">
              <span className="text-xs text-slate-300 font-medium">{user.email?.split('@')[0]}</span>
              <button onClick={handleLogout} className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button onClick={() => { setAuthType('login'); setShowAuthModal(true); }} className="text-sm font-medium text-slate-300 hover:text-white flex items-center gap-2">
              <User className="w-4 h-4" /> Sign In
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16 mt-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-violet-400"
          >
            Discover Emerging Market Gaps
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed"
          >
            Analyze unstructured review data and vector search trends to find high-opportunity products before they peak.
          </motion.p>
        </div>

        {/* Search Bar */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSearch}
          className="relative max-w-3xl mx-auto mb-16 group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-catalyst-blue via-purple-500 to-pink-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition duration-500"></div>
          {/* High-Intelligence Header / Status Bar */}
          <div className="fixed top-0 left-0 right-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-white/5 px-6 py-2 flex items-center justify-between text-[10px] font-mono tracking-wider text-slate-500 uppercase">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-growth-green animate-pulse"></div>
                SYSTEM STATUS: OPERATIONAL
              </div>
              <div className="flex items-center gap-2">
                LATENCY: 42MS
              </div>
              <div className="flex items-center gap-2">
                AGENTS ACTIVE: 5/5
              </div>
            </div>
            <div className="flex items-center gap-4">
              CATALYST ENGINE v2.4.0 // {new Date().toLocaleDateString()}
            </div>
          </div>
          <div className="relative flex items-center bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-2 shadow-2xl ring-1 ring-white/5">
            <Search className="w-6 h-6 text-indigo-400 ml-4" />
            <input
              type="text"
              placeholder="E.g., Home Office Accessories..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-white px-4 py-3 text-lg placeholder-slate-500"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleScrape}
                disabled={isScraping}
                className="bg-slate-800 text-slate-200 px-6 py-3 rounded-xl font-medium hover:bg-slate-700 transition-all flex items-center gap-2 whitespace-nowrap disabled:opacity-50 ring-1 ring-white/5"
              >
                {isScraping ? "Scraping..." : "Live Scrape"}
              </button>
              <button
                type="submit"
                className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-8 py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center gap-2"
              >
                {isSearching ? "Scanning..." : "Analyze"}
              </button>
            </div>
          </div>
        </motion.form>

        {/* Real-time Agent Pipeline */}
        {showPipeline && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-16"
          >
            <PipelineProgress steps={pipelineSteps} />
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap border-b border-slate-800/60 mb-8 max-w-6xl mx-auto mt-12 gap-2">
          <button
            className={`px-6 py-4 font-medium transition-all text-lg flex items-center gap-2 ${activeTab === 'gaps' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'} rounded-t-xl`}
            onClick={() => setActiveTab('gaps')}
          >
            <ShoppingBag className="w-5 h-5" />
            Market Gaps
          </button>
          <button
            className={`px-6 py-4 font-medium transition-all text-lg flex items-center gap-2 ${activeTab === 'trends' ? 'text-sky-400 border-b-2 border-sky-500 bg-sky-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'} rounded-t-xl`}
            onClick={() => setActiveTab('trends')}
          >
            <BarChart2 className="w-5 h-5" />
            Google Trends
          </button>
          <button
            className={`px-6 py-4 font-medium transition-all text-lg flex items-center gap-2 ${activeTab === 'keywords' ? 'text-fuchsia-400 border-b-2 border-fuchsia-500 bg-fuchsia-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'} rounded-t-xl`}
            onClick={() => setActiveTab('keywords')}
          >
            <Magnet className="w-5 h-5" />
            Keyword Magnet
          </button>
          <button
            className={`px-6 py-4 font-medium transition-all text-lg flex items-center gap-2 ${activeTab === 'profit' ? 'text-emerald-400 border-b-2 border-emerald-500 bg-emerald-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'} rounded-t-xl`}
            onClick={() => setActiveTab('profit')}
          >
            <Calculator className="w-5 h-5" />
            Profitability Calc
          </button>
          <button
            className={`px-6 py-4 font-medium transition-all text-lg flex items-center gap-2 ${activeTab === 'blackbox' ? 'text-amber-400 border-b-2 border-amber-500 bg-amber-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'} rounded-t-xl`}
            onClick={() => setActiveTab('blackbox')}
          >
            <PackageSearch className="w-5 h-5" />
            Black Box
          </button>
          <button
            className={`px-6 py-4 font-medium transition-all text-lg flex items-center gap-2 ${activeTab === 'listing' ? 'text-rose-400 border-b-2 border-rose-500 bg-rose-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'} rounded-t-xl`}
            onClick={() => setActiveTab('listing')}
          >
            <PenTool className="w-5 h-5" />
            Listing Builder
          </button>
          <button
            className={`px-6 py-4 font-medium transition-all text-lg flex items-center gap-2 ${activeTab === 'sourcing' ? 'text-amber-400 border-b-2 border-amber-500 bg-amber-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'} rounded-t-xl`}
            onClick={() => setActiveTab('sourcing')}
          >
            <PackageSearch className="w-5 h-5" />
            Sourcing Leads
          </button>
        </div>

        {/* Results Area */}
        <AnimatePresence mode="wait">
          {activeTab === 'gaps' ? (
            <motion.div
              key="gaps"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {results.map((gap, index) => (
                <motion.div
                  key={gap.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/60 rounded-3xl p-6 hover:border-indigo-500/30 hover:bg-slate-900/80 transition-all group relative overflow-hidden cursor-pointer"
                  onClick={() => { setSelectedGap(gap); setIsDrawerOpen(true); }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-colors"></div>

                  <div className="flex items-start justify-between mb-6 relative">
                    <div className="w-12 h-12 bg-gray-800/80 rounded-2xl flex items-center justify-center ring-1 ring-white/5">
                      <ShoppingBag className="w-6 h-6 text-gray-300" />
                    </div>
                    <span className="flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      <TrendingUp className="w-3 h-3" />
                      {gap.score ? `${(gap.score * 100).toFixed(0)}%` : gap.sentiment ? `${gap.sentiment}%` : '—'} Match
                    </span>
                    <button 
                      onClick={() => handleSaveGap(gap)}
                      disabled={isSaving === gap.id}
                      className="p-2 rounded-xl bg-slate-800/50 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-400 border border-slate-700 transition-all disabled:opacity-50"
                    >
                      <Save className={`w-4 h-4 ${isSaving === gap.id ? 'animate-pulse' : ''}`} />
                    </button>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2 relative">{gap.product || gap.product_name}</h3>

                  <div className="space-y-4 mt-6 relative">
                    <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10">
                      <div className="flex items-center gap-2 text-red-400 text-sm font-semibold mb-1">
                        <AlertCircle className="w-4 h-4" /> Top Complaint
                      </div>
                      <p className="text-slate-300 text-sm leading-relaxed">"{gap.complaint || gap.defect}"</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                      <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold mb-1">
                        <TrendingUp className="w-4 h-4" /> Opportunity
                      </div>
                      <p className="text-slate-300 text-sm leading-relaxed">"{gap.feature || gap.opportunity}"</p>
                    </div>

                    {gap.emotional_triggers && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {gap.emotional_triggers.map((trigger: string, i: number) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
                            {trigger}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-800 flex justify-between items-center relative">
                    <span className="text-sm text-slate-500">Sent to Sourcing Agent</span>
                    <a
                      href={`https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(gap.search_term || (gap.product || gap.product_name) + " " + (gap.feature || gap.opportunity))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-white flex items-center gap-1 group-hover:text-indigo-400 transition-colors"
                    >
                      View on Alibaba <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : activeTab === 'trends' ? (
            <motion.div
              key="trends"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/60 rounded-3xl p-12 text-center shadow-xl"
            >
              <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-blue-500/20">
                <BarChart2 className="w-10 h-10 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Trending Queries for "{query || "E-Commerce"}"</h3>
              <p className="text-gray-400 max-w-lg mx-auto mb-6">
                {trendsData.length > 0 ? "Live data fetched from the API based on your query." : "Connect your Google Trends API here to visualize search volume history, breakout topics, and geographic interest."}
              </p>

              {query && (
                <a
                  href={`https://trends.google.com/trends/explore?q=${encodeURIComponent(query)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-gray-700 hover:border-blue-500/50 text-white px-6 py-2.5 rounded-full font-medium transition-all mb-10 text-sm"
                >
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  View "{query}" on Google Trends
                </a>
              )}

              {/* Dynamic Chart Area */}
              <div className="h-72 w-full max-w-4xl mx-auto bg-gradient-to-t from-indigo-900/10 to-transparent border-b border-l border-slate-700 relative rounded-bl-lg flex items-end">
                {/* Y Axis Labels */}
                <div className="absolute -left-8 bottom-0 top-0 flex flex-col justify-between text-xs text-gray-500 py-2">
                  <span>100</span>
                  <span>75</span>
                  <span>50</span>
                  <span>25</span>
                  <span>0</span>
                </div>

                {/* X Axis Labels */}
                <div className="absolute -bottom-8 left-0 right-0 flex justify-between text-xs text-gray-500 px-4">
                  {trendsData.length > 0 ? (
                    trendsData.map((d, i) => <span key={i}>{d.month}</span>)
                  ) : (
                    <>
                      <span>Jan</span>
                      <span>Feb</span>
                      <span>Mar</span>
                      <span>Apr</span>
                      <span>May</span>
                      <span>Jun</span>
                    </>
                  )}
                </div>

                {/* SVG Line Chart */}
                <svg className="w-full h-full absolute inset-0 overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {renderChart()}
                </svg>
              </div>
            </motion.div>
          ) : activeTab === 'keywords' ? (
            <motion.div
              key="keywords"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/60 rounded-3xl p-8 shadow-xl"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center ring-1 ring-purple-500/20">
                  <Magnet className="w-8 h-8 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Reverse ASIN & Keyword Magnet</h3>
                  <p className="text-gray-400">Discover high-volume, low-competition search terms to dominate page 1.</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-800 text-sm font-medium text-gray-500 uppercase tracking-wider">
                      <th className="p-4">Keyword Phrase</th>
                      <th className="p-4 text-right">Search Volume</th>
                      <th className="p-4 text-right">Competing Products</th>
                      <th className="p-4 text-right">CPR (8-Day Giveaways)</th>
                      <th className="p-4 text-right">Match Type</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-300 divide-y divide-gray-800/50">
                    {[
                      { word: query ? `${query} for home` : "ergonomic chair", vol: "85,430", comp: "1,200", cpr: 45, type: "Organic" },
                      { word: query ? `best ${query}` : "best office chair 2026", vol: "42,100", comp: "850", cpr: 22, type: "Smart Complete" },
                      { word: query ? `cheap ${query}` : "cheap desk chair", vol: "38,000", comp: "4,000", cpr: 60, type: "Broad" },
                      { word: query ? `${query} wholesale` : "office chair wholesale", vol: "12,500", comp: "300", cpr: 8, type: "Organic" },
                      { word: query ? `custom ${query}` : "custom gaming chair", vol: "8,200", comp: "150", cpr: 5, type: "Smart Complete" },
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 font-medium text-white">{row.word}</td>
                        <td className="p-4 text-right font-mono text-purple-400">{row.vol}</td>
                        <td className="p-4 text-right">{row.comp}</td>
                        <td className="p-4 text-right">
                          <span className="bg-purple-500/10 text-purple-300 py-1 px-3 rounded-full text-xs border border-purple-500/20">{row.cpr} units</span>
                        </td>
                        <td className="p-4 text-right text-sm text-gray-400">{row.type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ) : activeTab === 'profit' ? (
            <motion.div
              key="profit"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/60 rounded-3xl p-8 shadow-xl max-w-4xl mx-auto"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center ring-1 ring-green-500/20">
                  <Calculator className="w-8 h-8 text-green-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Profitability Calculator</h3>
                  <p className="text-gray-400">Estimate net margins, ROI, and marketplace fees before sourcing.</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Target Selling Price ($)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full bg-[#0f1115] border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Estimated Unit Cost (Manufacturing) ($)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input type="number" value={unitCost} onChange={e => setUnitCost(Number(e.target.value))} className="w-full bg-[#0f1115] border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Estimated Shipping to Warehouse ($)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input type="number" value={shippingCost} onChange={e => setShippingCost(Number(e.target.value))} className="w-full bg-[#0f1115] border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Estimated Marketplace Fulfillment Fee ($)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input type="number" value={marketplaceFee} onChange={e => setMarketplaceFee(Number(e.target.value))} className="w-full bg-[#0f1115] border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all" />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 rounded-2xl p-8 border border-slate-800 flex flex-col justify-center">
                  <h4 className="text-gray-400 font-medium mb-6 text-center uppercase tracking-wider text-sm">Estimated Profitability</h4>

                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between text-lg">
                      <span className="text-gray-400">Revenue:</span>
                      <span className="text-white font-medium">${price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg text-red-400/80">
                      <span>Total Costs & Fees:</span>
                      <span>-${(unitCost + shippingCost + marketplaceFee).toFixed(2)}</span>
                    </div>
                    <div className="h-px w-full bg-gray-800 my-2"></div>
                    <div className="flex justify-between text-2xl font-bold">
                      <span className="text-white">Net Profit:</span>
                      <span className="text-green-400">${(price - unitCost - shippingCost - marketplaceFee).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
                      <div className="text-green-400 font-bold text-2xl mb-1">
                        {price > 0 ? (((price - unitCost - shippingCost - marketplaceFee) / price) * 100).toFixed(0) : 0}%
                      </div>
                      <div className="text-xs text-gray-400 uppercase tracking-wider">Net Margin</div>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
                      <div className="text-blue-400 font-bold text-2xl mb-1">
                        {(unitCost + shippingCost) > 0 ? (((price - unitCost - shippingCost - marketplaceFee) / (unitCost + shippingCost)) * 100).toFixed(0) : 0}%
                      </div>
                      <div className="text-xs text-gray-400 uppercase tracking-wider">ROI</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'blackbox' ? (
            <motion.div
              key="blackbox"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/60 rounded-3xl p-8 shadow-xl max-w-6xl mx-auto"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center ring-1 ring-orange-500/20">
                  <PackageSearch className="w-8 h-8 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Black Box Product Discovery</h3>
                  <p className="text-gray-400">Find hidden gems using advanced criteria like BSR, Monthly Revenue, and Review Count.</p>
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 bg-slate-950 p-6 rounded-2xl border border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Category</label>
                  <select className="w-full bg-[#1a1d24] border border-gray-700 rounded-lg py-2 px-3 text-white focus:border-orange-500 outline-none">
                    <option>All Categories</option>
                    <option>Home & Kitchen</option>
                    <option>Electronics</option>
                    <option>Sports & Outdoors</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Min Revenue</label>
                  <input type="number" placeholder="$10,000" className="w-full bg-[#1a1d24] border border-gray-700 rounded-lg py-2 px-3 text-white focus:border-orange-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Max Price</label>
                  <input type="number" placeholder="$50" className="w-full bg-[#1a1d24] border border-gray-700 rounded-lg py-2 px-3 text-white focus:border-orange-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Max Reviews</label>
                  <input type="number" placeholder="150" className="w-full bg-[#1a1d24] border border-gray-700 rounded-lg py-2 px-3 text-white focus:border-orange-500 outline-none" />
                </div>
                <div className="flex items-end">
                  <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                    <Filter className="w-4 h-4" /> Search
                  </button>
                </div>
              </div>

              {/* Results Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { name: "Bamboo Drawer Organizer", rev: "$45,200", price: "$29.99", reviews: 84, bsr: 12050 },
                  { name: "Collapsible Dog Bowl Set", rev: "$12,800", price: "$14.50", reviews: 42, bsr: 45000 },
                  { name: "Silicone Baking Mats", rev: "$88,100", price: "$19.99", reviews: 112, bsr: 3200 },
                ].map((item, idx) => (
                  <div key={idx} className="bg-[#0f1115] border border-gray-800 rounded-2xl p-5 hover:border-orange-500/50 transition-colors">
                    <h4 className="font-bold text-white mb-4 line-clamp-1">{item.name}</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Monthly Revenue:</span>
                        <span className="text-green-400 font-medium">{item.rev}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Price:</span>
                        <span className="text-white">{item.price}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Reviews:</span>
                        <span className="text-orange-400">{item.reviews}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">BSR:</span>
                        <span className="text-white">#{item.bsr}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : activeTab === 'listing' ? (
            <motion.div
              key="listing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/60 rounded-3xl p-8 shadow-xl max-w-5xl mx-auto"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-pink-500/10 rounded-2xl flex items-center justify-center ring-1 ring-pink-500/20">
                  <PenTool className="w-8 h-8 text-pink-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">AI Listing Builder & Optimizer</h3>
                  <p className="text-gray-400">Write high-converting listings packed with top Magnet keywords.</p>
                </div>
              </div>

              {discoveryResult?.creative && (
                <div className="mb-8 p-6 bg-violet-500/5 border border-violet-500/10 rounded-3xl">
                  <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-violet-400" /> AI A/B Test Simulation
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                      <div className="text-xs font-bold text-slate-500 uppercase mb-2">Variation A (Benefit)</div>
                      <div className="text-sm text-white">"Premium Ergonomic Chair - 24/7 Comfort Support"</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 border-indigo-500/30">
                      <div className="text-xs font-bold text-indigo-400 uppercase mb-2">Variation B (FOMO) - Predicted Winner</div>
                      <div className="text-sm text-white">"Stop Back Pain Today: The Last Office Chair You'll Ever Need"</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-3 gap-8">
                {/* Editor */}
                <div className="md:col-span-2 space-y-6">
                  <div>
                    <label className="flex items-center justify-between text-sm font-medium text-gray-300 mb-2">
                      Optimized Title
                      <span className={`text-xs px-2 py-0.5 rounded ${listingTitle.length > 200 ? 'text-red-400 bg-red-500/10' : 'text-pink-400 bg-pink-500/10'}`}>
                        {listingTitle ? listingTitle.length : (query ? query.length + 80 : 80)} / 200 chars
                      </span>
                    </label>
                    <textarea
                      value={listingTitle || (query ? `Premium ${query} - Ergonomic Design, Adjustable Support for Home Office, Gaming, and Work` : "Premium Ergonomic Office Chair - Adjustable Lumbar Support for Home Office, Gaming, and Work")}
                      onChange={(e) => setListingTitle(e.target.value)}
                      className="w-full bg-[#0f1115] border border-gray-700 rounded-xl py-3 px-4 text-white focus:border-pink-500 outline-none h-20 resize-none"
                    />
                  </div>
                  <div>
                    <label className="flex items-center justify-between text-sm font-medium text-gray-300 mb-2">
                      Bullet Points
                      <button
                        onClick={handleGenerateListing}
                        disabled={isGenerating}
                        className={`text-xs flex items-center gap-1 ${isGenerating ? 'text-gray-500' : 'text-pink-400 hover:text-pink-300'}`}
                      >
                        <Sparkles className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
                        {isGenerating ? 'Generating...' : 'AI Generate'}
                      </button>
                    </label>
                    <textarea
                      value={listingBullets || "✅ ALL-DAY COMFORT: Designed with high-density foam...\n✅ 4D ADJUSTABLE ARMRESTS: Prevent wrist fatigue...\n✅ BREATHABLE MESH BACK: Stay cool during long sessions...\n✅ 300LBS CAPACITY: Heavy-duty metal base..."}
                      onChange={(e) => setListingBullets(e.target.value)}
                      className="w-full bg-[#0f1115] border border-gray-700 rounded-xl py-3 px-4 text-white focus:border-pink-500 outline-none h-48 resize-none"
                    />
                  </div>
                </div>

                {/* Keyword Bank */}
                <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 flex flex-col">
                  <h4 className="text-gray-300 font-medium mb-4 flex items-center gap-2">
                    <Magnet className="w-4 h-4 text-purple-400" /> Frankenstein Word Bank
                  </h4>
                  <p className="text-xs text-gray-500 mb-4">Keywords from Magnet that you MUST include in your listing for maximum indexing.</p>

                  <div className="flex flex-wrap gap-2 overflow-y-auto max-h-[300px] pr-2">
                    {["ergonomic", "home office", "gaming chair", "lumbar support", "mesh back", "desk chair", "heavy duty", "posture", "swivel", "adjustable height", "wholesale"].map((kw, i) => (
                      <span key={i} className={`text-xs px-3 py-1.5 rounded-full font-medium ${i < 4 ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
                        {kw}
                      </span>
                    ))}
                  </div>

                    <div className="mt-auto pt-6 flex flex-col gap-3">
                      <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold text-white mb-1">9.2<span className="text-lg text-gray-500">/10</span></div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider">Listing Quality Score</div>
                      </div>
                      <button 
                        onClick={handleSaveListing}
                        disabled={isSaving === "listing"}
                        className="w-full py-3 bg-pink-600 hover:bg-pink-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <Save className={`w-4 h-4 ${isSaving === "listing" ? 'animate-pulse' : ''}`} />
                        {isSaving === "listing" ? 'Saving...' : 'Save to Portfolio'}
                      </button>
                    </div>
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'sourcing' ? (
            <motion.div
              key="sourcing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/60 rounded-3xl p-8 shadow-xl max-w-6xl mx-auto"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center ring-1 ring-amber-500/20">
                  <PackageSearch className="w-8 h-8 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Sourcing Leads & Logistics</h3>
                  <p className="text-gray-400">Manage your verified suppliers and estimated manufacturing costs.</p>
                </div>
              </div>

                <div className="space-y-8">
                  {/* Logistics Agent Report */}
                  {discoveryResult?.logistics && (
                    <div className="bg-slate-950/50 rounded-3xl border border-slate-800 p-6">
                      <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Check className="w-5 h-5 text-emerald-400" /> Sourcing Viability Report
                      </h4>
                      <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                          <div className="text-sm text-slate-400 mb-1">Target Margin</div>
                          <div className="text-2xl font-bold text-white">
                            {discoveryResult.logistics.margin_analysis?.margin_percent.toFixed(1)}%
                          </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                          <div className="text-sm text-slate-400 mb-1">Recommended Action</div>
                          <div className="text-xl font-bold text-amber-400">Go / Low Risk</div>
                        </div>
                      </div>
                      <div className="prose prose-invert max-w-none text-slate-300 text-sm">
                        <pre className="whitespace-pre-wrap font-sans">{discoveryResult.logistics.viability_report}</pre>
                      </div>
                    </div>
                  )}

                  {sourcingLeads.length > 0 ? (
                    <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/40">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 text-xs uppercase font-semibold">
                            <th className="px-6 py-4">Supplier Name</th>
                            <th className="px-6 py-4">URL / Contact</th>
                            <th className="px-6 py-4 text-right">Est. Unit Cost</th>
                            <th className="px-6 py-4 text-right">MOQ</th>
                            <th className="px-6 py-4 text-right">Lead Time</th>
                            <th className="px-6 py-4 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-300 text-sm">
                          {sourcingLeads.map((lead) => (
                            <tr key={lead.id} className="hover:bg-white/5 transition-colors">
                              <td className="px-6 py-4 font-semibold text-white">
                                {lead.supplier_name}
                              </td>
                              <td className="px-6 py-4 max-w-xs truncate">
                                {lead.supplier_url ? (
                                  <a
                                    href={lead.supplier_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-amber-400 hover:underline flex items-center gap-1.5"
                                  >
                                    <ShoppingBag className="w-4 h-4" />
                                    Visit Supplier
                                  </a>
                                ) : (
                                  <span className="text-slate-500">{lead.supplier_contact || 'No contact info'}</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right font-medium text-emerald-400">
                                {lead.estimated_cost ? `$${parseFloat(lead.estimated_cost).toFixed(2)}` : '—'}
                              </td>
                              <td className="px-6 py-4 text-right">
                                {lead.moq ? `${lead.moq.toLocaleString()} units` : '—'}
                              </td>
                              <td className="px-6 py-4 text-right">
                                {lead.lead_time_days ? `${lead.lead_time_days} days` : '—'}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider ${
                                  lead.status === 'contracted'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : lead.status === 'negotiating'
                                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                }`}>
                                  {lead.status || 'contacted'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-20 bg-slate-950/50 rounded-3xl border border-dashed border-slate-800">
                      <PackageSearch className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                      <p className="text-slate-500">No sourcing leads saved yet. Start by identifying market gaps.</p>
                    </div>
                  )}
                </div>
              {/* Side Drawer for Progressive Disclosure */}
              <AnimatePresence>
                {isDrawerOpen && selectedGap && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsDrawerOpen(false)}
                      className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                      initial={{ x: "100%" }}
                      animate={{ x: 0 }}
                      exit={{ x: "100%" }}
                      transition={{ type: "spring", damping: 25, stiffness: 200 }}
                      className="fixed top-0 right-0 h-full w-full max-w-xl bg-slate-950 border-l border-white/10 z-50 overflow-y-auto p-8 shadow-2xl"
                    >
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-2xl font-bold text-white">{selectedGap.product_name}</h3>
                        <button onClick={() => setIsDrawerOpen(false)} className="p-2 rounded-full hover:bg-white/10 text-slate-400">
                          <LogOut className="w-6 h-6 rotate-180" />
                        </button>
                      </div>

                      {/* AI Intelligence Hub Content */}
                      <div className="space-y-8">
                        {/* KPI Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                          {[
                            { label: "Predictive Opportunity", value: "88.4%", icon: Sparkles, trend: "+4.2%", color: "text-catalyst-blue" },
                            { label: "Market Sentiment", value: "Neutral", icon: Brain, trend: "-0.5%", color: "text-slate-400" },
                            { label: "Sourcing Viability", value: "High", icon: Factory, trend: "+12.0%", color: "text-growth-green" }
                          ].map((stat, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 * i }}
                              className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 glass hover:border-white/10 transition-all"
                            >
                              <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-white/5 rounded-2xl">
                                  <stat.icon className="w-5 h-5 text-slate-400" />
                                </div>
                                <span className={`text-xs font-bold ${stat.color} bg-white/5 px-2 py-1 rounded-full`}>
                                  {stat.trend}
                                </span>
                              </div>
                              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</div>
                            </motion.div>
                          ))}
                        </div>

                        {/* Sentiment Heatmap Placeholder */}
                        <div className="p-6 rounded-3xl bg-slate-900 border border-white/5">
                          <h4 className="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-violet-400" /> Sentiment Heatmap
                          </h4>
                          <div className="h-48 relative flex items-center justify-center">
                            {/* Visual representation of bubbles */}
                            <div className="absolute top-1/4 left-1/4 w-12 h-12 bg-red-500/20 border border-red-500/40 rounded-full flex items-center justify-center text-[10px] text-red-300">Flaw</div>
                            <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-catalyst-blue/20 border border-catalyst-blue/40 rounded-full flex items-center justify-center text-xs text-blue-300 font-bold">Demand</div>
                            <div className="absolute bottom-1/4 right-1/4 w-16 h-16 bg-growth-green/20 border border-growth-green/40 rounded-full flex items-center justify-center text-[10px] text-green-300">Feature</div>
                          </div>
                          <p className="text-xs text-slate-500 mt-4 text-center">Bubble size represents frequency in unstructured review data.</p>
                        </div>

                        {/* AI Live Stream Box */}
                        <div className="p-6 rounded-3xl bg-black border border-violet-500/20 font-mono-ai">
                          <h4 className="text-xs font-bold text-violet-400 uppercase mb-3 flex items-center gap-2">
                            <Zap className="w-3 h-3" /> Creative Agent Log
                          </h4>
                          <div className="text-sm text-slate-300 leading-relaxed overflow-hidden">
                            <div className="animate-pulse-soft border-l-2 border-violet-500 pl-3">
                              {">"} SIMULATING A/B TEST...<br/>
                              {">"} ANALYZING TOP COMPLAINT: "{selectedGap.defect}"...<br/>
                              {">"} GENERATING OPTIMIZED TITLE...<br/>
                              {">"} PREDICTED CTR INCREASE: +14.2%
                            </div>
                          </div>
                        </div>

                        {/* Detailed Market Gap Chart Description */}
                        <div className="p-6 rounded-3xl bg-slate-900 border border-white/5">
                          <h4 className="text-sm font-bold text-slate-400 uppercase mb-4">Strategic Recommendation</h4>
                          <p className="text-slate-300 text-sm leading-relaxed mb-4">
                            This product sits in the **"Catalyst Zone"**—high volume with a specific physical failure point that you can exploit. 
                            The manufacturing lead time for the {selectedGap.product_name} category is currently trending down by 12 days.
                          </p>
                          <button
                            onClick={() => {
                              handleSaveSourcingLead({
                                supplier_name: `${selectedGap.product_name} Factory Specialists`,
                                supplier_contact: "sales@shenzhensourcinghub.com",
                                supplier_url: "https://www.alibaba.com/trade/search?SearchText=" + encodeURIComponent(selectedGap.product_name),
                                estimated_cost: (price * 0.25),
                                moq: 1000,
                                lead_time_days: 18,
                                status: "contacted"
                              });
                              setIsDrawerOpen(false);
                              setActiveTab("sourcing");
                            }}
                            className="w-full py-4 bg-catalyst-blue text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-600 transition-all"
                          >
                            Initiate Sourcing Pipeline <ArrowRight className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowAuthModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl"
            >
              <div className="text-center mb-8">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-2xl font-bold text-white">{authType === 'login' ? 'Welcome Back' : 'Create Account'}</h3>
                <p className="text-slate-400 text-sm mt-2">{authType === 'login' ? 'Access your intelligence dashboard' : 'Join the Catalyst ecosystem'}</p>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                  <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com" 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Password</label>
                  <input 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <button 
                  disabled={isAuthLoading}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                >
                  {isAuthLoading ? 'Processing...' : (authType === 'login' ? 'Sign In' : 'Create Account')}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button 
                  onClick={() => setAuthType(authType === 'login' ? 'signup' : 'login')}
                  className="text-sm text-slate-400 hover:text-white transition-colors"
                >
                  {authType === 'login' ? "Don't have an account? Sign up" : "Already have an account? Log in"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Upgrade to {isPendingPlan}</h3>
                  <p className="text-slate-400 text-sm">Secure checkout powered by Catalyst</p>
                </div>
              </div>

              <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 mb-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-400">{isPendingPlan} Plan</span>
                  <span className="text-white font-bold">{isPendingPlan === 'pro' ? '$79.00' : '$249.00'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Billed monthly</span>
                  <span className="text-slate-500">VAT included</span>
                </div>
              </div>

              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Card Information</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="4242 4242 4242 4242" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:border-indigo-500 outline-none transition-all pl-12"
                    />
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="text" 
                    placeholder="MM / YY" 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:border-indigo-500 outline-none transition-all"
                  />
                  <input 
                    type="text" 
                    placeholder="CVC" 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <button className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:shadow-lg hover:shadow-emerald-500/20 text-white rounded-xl font-bold transition-all mt-4">
                  Pay Now & Activate
                </button>
              </form>
              <button 
                onClick={() => { setShowPaymentModal(false); setIsPendingPlan(null); }}
                className="w-full mt-4 text-sm text-slate-500 hover:text-slate-300 transition-colors"
              >
                Cancel and return
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
