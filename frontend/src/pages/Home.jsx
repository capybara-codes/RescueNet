import React, { useLayoutEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Heart, Globe, Users, ShieldCheck, Leaf, Brain, TrendingDown, Clock, MoveRight } from 'lucide-react';
import ThreeScene from '../components/ThreeScene';

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const navigate = useNavigate();
  const mainRef = useRef();

  // Smooth scroll to anchor
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      // Animate general text elements
      const sections = gsap.utils.toArray('.scroll-section');
      
      sections.forEach((section) => {
        const textElements = section.querySelectorAll('.animate-text');
        const cards = section.querySelectorAll('.animate-card');
        
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            end: 'bottom 20%',
            toggleActions: 'play reverse play reverse',
          }
        });

        if (textElements.length > 0) {
          tl.fromTo(textElements, 
            { y: 40, opacity: 0 }, 
            { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: 'power3.out' }
          );
        }

        if (cards.length > 0) {
          tl.fromTo(cards,
            { y: 50, opacity: 0, scale: 0.95 },
            { y: 0, opacity: 1, scale: 1, duration: 0.6, stagger: 0.2, ease: 'back.out(1.5)' },
            "<0.3"
          );
        }
      });

      // Animate impact counters explicitly
      const counters = gsap.utils.toArray('.animate-counter');
      counters.forEach((counter) => {
        const targetValue = parseInt(counter.getAttribute('data-value'), 10);
        const prefix = counter.getAttribute('data-prefix') || '';
        const suffix = counter.getAttribute('data-suffix') || '';
        
        gsap.fromTo(counter, 
          { innerHTML: 0 },
          {
            innerHTML: targetValue,
            duration: 2,
            ease: "power2.out",
            snap: { innerHTML: 1 },
            scrollTrigger: {
              trigger: counter,
              start: "top 85%",
              toggleActions: 'play none none none' // Only play once for counters
            },
            onUpdate: function() {
              // Add formatting back
              counter.innerHTML = prefix + Math.round(Number(this.targets()[0].innerHTML)).toLocaleString() + suffix;
            }
          }
        );
      });
      
    }, mainRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={mainRef} className="relative w-full text-white bg-transparent font-serif overflow-x-hidden selection:bg-brand-500/30">
      
      {/* 3D Background */}
      <div className="fixed inset-0 -z-10 bg-[#0a0a0c]"> {/* Pitch dark black/grey matching reference */}
        <Canvas camera={{ position: [0, 0, 10], fov: 40 }}>
          <ThreeScene />
        </Canvas>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0c]/60 via-transparent to-[#0a0a0c]/90 pointer-events-none" />
      </div>

      {/* Network UI Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 px-8 py-5 flex items-center justify-between backdrop-blur-md bg-black/40 border-b border-amber-500/10 transition-all">
        <div className="flex items-center gap-3 text-white font-serif text-xl tracking-widest cursor-pointer font-black drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
          RescueNet
        </div>
        <div className="flex gap-4">
          <button onClick={() => navigate('/login')} className="hidden sm:block px-6 py-2 rounded-full text-sm font-semibold text-slate-300 hover:text-white transition-colors">
            Explore
          </button>
          <button onClick={() => navigate('/login')} className="px-6 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-sm font-bold transition-all shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            Donate
          </button>
          <button onClick={() => navigate('/signup')} className="px-6 py-2 rounded-full bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold transition-all shadow-[0_0_15px_rgba(234,88,12,0.3)]">
            Join
          </button>
        </div>
      </nav>

      {/* Content wrapper */}
      <div className="relative z-10 transition-all duration-1000">
        
        {/* Section 1: Hero */}
        <section className="scroll-section min-h-screen flex flex-col items-center justify-center px-4 relative">
          <div className="max-w-5xl mx-auto flex flex-col items-center z-10 mt-10 md:mt-20">
            <h1 className="animate-text font-serif text-6xl sm:text-7xl md:text-8xl lg:text-[10rem] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-amber-200 drop-shadow-[0_0_40px_rgba(251,191,36,0.2)] mb-2 text-center uppercase">
              RescueNet
            </h1>
            <p className="animate-text font-[Montserrat] text-xl md:text-3xl text-amber-100/90 font-medium tracking-wide text-center max-w-3xl mt-6 drop-shadow-md">
              A global coordination platform for intelligent food rescue.
            </p>
          </div>
        </section>

        {/* Section 2: Why RescueNet */}
        <section className="scroll-section min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-20 relative">
          <div className="max-w-4xl mx-auto">
            <Leaf className="animate-text w-12 h-12 text-brand-400 mx-auto mb-8 opacity-80" />
            <h2 className="animate-text font-serif text-4xl md:text-6xl font-medium leading-snug text-slate-100">
              Millions of meals are wasted while many people go hungry.
              <span className="text-brand-400 font-bold block mt-4">RescueNet bridges this gap through real-time smart redistribution.</span>
            </h2>
          </div>
        </section>

        {/* Section 3: How It Works */}
        <section id="how-it-works" className="scroll-section min-h-screen flex flex-col items-center justify-center px-4 py-20 relative z-20">
          <h2 className="animate-text font-serif text-5xl md:text-6xl font-bold text-white mb-16 text-center">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
            {/* Card 1 */}
            <div className="animate-card glass p-10 rounded-[2rem] flex flex-col items-center text-center bg-surface-card/40 hover:bg-surface-card/60 transition-colors border border-white/10 hover:border-brand-500/30">
              <div className="w-20 h-20 rounded-full bg-brand-500/20 flex items-center justify-center mb-6">
                <span className="font-serif text-3xl font-bold text-brand-400">1</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Donors Upload</h3>
              <p className="text-slate-400 leading-relaxed text-lg">Restaurants and grocers easily log their surplus food at the end of the day using our app.</p>
            </div>
            
            {/* Card 2 */}
            <div className="animate-card glass p-10 rounded-[2rem] flex flex-col items-center text-center bg-surface-card/40 hover:bg-surface-card/60 transition-colors border border-white/10 hover:border-brand-500/30">
              <div className="w-20 h-20 rounded-full bg-brand-500/20 flex items-center justify-center mb-6">
                <span className="font-serif text-3xl font-bold text-brand-400">2</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Smart Alerts</h3>
              <p className="text-slate-400 leading-relaxed text-lg">Our AI instantly matches and notifies the nearest registered NGOs about the available surplus.</p>
            </div>

            {/* Card 3 */}
            <div className="animate-card glass p-10 rounded-[2rem] flex flex-col items-center text-center bg-surface-card/40 hover:bg-surface-card/60 transition-colors border border-white/10 hover:border-brand-500/30">
              <div className="w-20 h-20 rounded-full bg-brand-500/20 flex items-center justify-center mb-6">
                <span className="font-serif text-3xl font-bold text-brand-400">3</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Rapid Delivery</h3>
              <p className="text-slate-400 leading-relaxed text-lg">Volunteers claim the mission and deliver the food while it's completely fresh and safe.</p>
            </div>
          </div>
        </section>

        {/* Section 4: Smart AI */}
        <section id="smart-ai" className="scroll-section min-h-screen flex flex-col items-center justify-center px-4 py-20 bg-surface/50 border-y border-white/5 backdrop-blur-sm">
          <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 text-center lg:text-left">
              <Brain className="animate-text w-16 h-16 text-teal-400 mb-6 mx-auto lg:mx-0" />
              <h2 className="animate-text font-serif text-5xl md:text-6xl font-bold mb-6 text-white">Smart AI Core</h2>
              <p className="animate-text text-xl text-slate-300 leading-relaxed font-light mb-8 max-w-xl mx-auto lg:mx-0">
                RescueNet doesn't just react to waste; it actively predicts and prevents it using advanced machine learning models trained on millions of data points.
              </p>
            </div>

            <div className="flex-1 w-full grid grid-cols-1 gap-6">
              <div className="animate-card glass p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6 bg-surface-card/20 border-white/5">
                <div className="p-4 bg-teal-500/20 rounded-2xl text-teal-400"><TrendingDown className="w-8 h-8" /></div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">Predicts Surplus Food</h4>
                  <p className="text-slate-400">Analyzes foot traffic and weather to forecast leftover inventory.</p>
                </div>
              </div>
              <div className="animate-card glass p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6 bg-surface-card/20 border-white/5">
                <div className="p-4 bg-purple-500/20 rounded-2xl text-purple-400"><Brain className="w-8 h-8" /></div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">Recommends Preparation Quants</h4>
                  <p className="text-slate-400">Advises kitchens exactly how much to cook to minimize end-of-day waste.</p>
                </div>
              </div>
              <div className="animate-card glass p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6 bg-surface-card/20 border-white/5">
                <div className="p-4 bg-rose-500/20 rounded-2xl text-rose-400"><Clock className="w-8 h-8" /></div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">Reduces Waste Proactively</h4>
                  <p className="text-slate-400">Stop waste before it happens, saving massive business costs and aiding sustainability.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Impact Stats */}
        <section id="impact" className="scroll-section min-h-[60vh] flex flex-col items-center justify-center px-4 py-20 relative">
          <h2 className="animate-text font-serif text-5xl font-bold mb-16 text-center text-white">Global Impact So Far</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-12 w-full max-w-6xl">
            <div className="text-center">
              <div className="animate-counter text-5xl md:text-7xl font-bold text-brand-400 font-serif mb-2" data-value="10000" data-suffix="K+">0</div>
              <div className="text-sm md:text-lg text-slate-400 uppercase tracking-widest font-semibold">Meals Rescued</div>
            </div>
            <div className="text-center">
              <div className="animate-counter text-5xl md:text-7xl font-bold text-brand-400 font-serif mb-2" data-value="2" data-suffix=".3">0</div>
              <div className="text-sm md:text-lg text-slate-400 uppercase tracking-widest font-semibold">Tons Food Saved</div>
            </div>
            <div className="text-center">
              <div className="animate-counter text-5xl md:text-7xl font-bold text-brand-400 font-serif mb-2" data-value="500" data-suffix="+">0</div>
              <div className="text-sm md:text-lg text-slate-400 uppercase tracking-widest font-semibold">Volunteers</div>
            </div>
            <div className="text-center">
              <div className="animate-counter text-5xl md:text-7xl font-bold text-brand-400 font-serif mb-2" data-value="150" data-suffix="+">0</div>
              <div className="text-sm md:text-lg text-slate-400 uppercase tracking-widest font-semibold">Donors</div>
            </div>
          </div>
        </section>

        {/* Section 6: Final CTA */}
        <section className="scroll-section min-h-screen flex flex-col items-center justify-center text-center px-4 pb-20 relative">
          <div className="glass-panel p-10 md:p-20 rounded-[3rem] bg-gradient-to-b from-[#0f172a]/80 to-[#1e293b]/90 backdrop-blur-3xl border border-white/10 w-full max-w-5xl relative overflow-hidden shadow-2xl shadow-brand-900/40">
            
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-brand opacity-10 mix-blend-overlay pointer-events-none" />
            <Globe className="animate-text w-20 h-20 text-brand-400/80 mx-auto mb-8" />
            
            <h2 className="animate-text font-serif text-5xl md:text-7xl font-bold mb-6 text-white leading-tight">
              Join the Zero Waste <br/> Movement
            </h2>
            
            <div className="animate-text flex flex-col md:flex-row items-center justify-center gap-4 mt-12 w-full">
              <button onClick={() => navigate('/signup')} className="w-full md:w-auto px-8 py-5 bg-white text-surface hover:bg-slate-200 font-bold text-lg rounded-2xl transition-all hover:-translate-y-1 shadow-glass flex items-center justify-center gap-3">
                Register as Donor <MoveRight className="w-5 h-5" />
              </button>
              <button onClick={() => navigate('/signup')} className="w-full md:w-auto px-8 py-5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-lg rounded-2xl transition-all hover:-translate-y-1 shadow-glow flex items-center justify-center gap-3">
                Become Volunteer <Heart className="w-5 h-5" />
              </button>
              <button onClick={() => navigate('/signup')} className="w-full md:w-auto px-8 py-5 bg-transparent border-2 border-white/20 hover:border-white/40 hover:bg-white/5 text-white font-bold text-lg rounded-2xl transition-all hover:-translate-y-1 flex items-center justify-center gap-3">
                Partner as NGO <ShieldCheck className="w-5 h-5" />
              </button>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
