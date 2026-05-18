import React from 'react';
import { motion } from 'motion/react';

interface InstitutionalWholesaleProps {
  setIsQuoteModalOpen: (open: boolean) => void;
}

export function InstitutionalWholesale({ setIsQuoteModalOpen }: InstitutionalWholesaleProps) {
  return (
    <section className="bg-[#0A1628] overflow-hidden relative group shadow-2xl w-full border-t border-white/5">
      <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#C8961A] via-transparent to-transparent"></div>
      </div>
      
      <div className="flex flex-col lg:flex-row items-center w-full">
        <div className="lg:w-1/2 p-6 lg:p-12 relative z-10 w-full">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 text-[#C8961A] text-[9px] font-black tracking-[3px] uppercase mb-3">
              <div className="w-6 h-[1.5px] bg-[#C8961A]"></div> Specialized Wholesale
            </div>
            <h2 className="font-display text-4xl lg:text-5xl text-white leading-[0.9] mb-4">
              Institutional <br/> <span className="text-[#C8961A]">Wholesale Deals</span>
            </h2>
            <p className="text-white/60 text-xs lg:text-sm leading-relaxed mb-6 max-w-lg font-medium">
              High-volume production for schools and corporate institutions. The most competitive rates in Kenya with guaranteed turnaround.
            </p>
            
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => setIsQuoteModalOpen(true)}
                className="px-6 lg:px-8 py-3.5 bg-[#C8102E] text-white text-[10px] font-black uppercase tracking-[2px] rounded-xl hover:bg-white hover:text-[#C8102E] transition-all shadow-xl active:scale-95"
              >
                Bulk Pricing
              </button>
              <button 
                onClick={() => {
                    const el = document.getElementById('wholesale-deals');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="px-6 lg:px-8 py-3.5 bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-[2px] rounded-xl hover:bg-white/10 transition-all active:scale-95"
              >
                View Deals
              </button>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4 lg:gap-8 border-t border-white/5 pt-6">
              <div>
                <div className="text-[#C8961A] font-display text-xl lg:text-2xl leading-none mb-1">500k+</div>
                <div className="text-[8px] text-white/40 uppercase font-black tracking-widest leading-none">Capacity</div>
              </div>
              <div>
                <div className="text-[#C8961A] font-display text-xl lg:text-2xl leading-none mb-1">100+</div>
                <div className="text-[8px] text-white/40 uppercase font-black tracking-widest leading-none">Partners</div>
              </div>
              <div>
                <div className="text-[#C8961A] font-display text-xl lg:text-2xl leading-none mb-1">48H</div>
                <div className="text-[8px] text-white/40 uppercase font-black tracking-widest leading-none">Response</div>
              </div>
            </div>
          </motion.div>
        </div>
        
        <div className="lg:w-1/2 w-full h-[250px] lg:h-auto self-stretch relative overflow-hidden">
          <motion.img 
            initial={{ scale: 1.1, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=1200&auto=format&fit=crop" 
            className="w-full h-full object-cover grayscale opacity-30 group-hover:grayscale-0 group-hover:opacity-60 transition-all duration-1000"
            alt="Wholesale Textiles"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A1628] via-transparent to-transparent"></div>
        </div>
      </div>
    </section>
  );
}
